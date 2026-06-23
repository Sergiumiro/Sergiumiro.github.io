// ============================================================
// RENDER.JS — tabs, stages, rollback, contacts, comms, metabar
// ============================================================

// ── Task status helper (shared by render and calendar) ──
function getTaskStatus(ev, nowMs) {
  if (ev.manualStatus === 'done') return 'done';
  if (ev.endMs <= nowMs)                               return 'done';
  if (ev.startMs <= nowMs && nowMs < ev.endMs)         return 'now';
  return 'soon';
}

// ── renderAll ──
function renderAll(skipUndo) {
  renderTabs();
  var p = plan();
  if (!p) {
    document.getElementById('emptyState').style.display   = '';
    document.getElementById('planView').style.display     = 'none';
    document.getElementById('planTabsBar').style.display  = 'none';
    updateCacheBadge();
    updateUndoUI();
    return;
  }
  document.getElementById('emptyState').style.display   = 'none';
  document.getElementById('planView').style.display     = 'block';
  document.getElementById('planTabsBar').style.display  = '';

  renderMetaBar(p);
  renderStages();
  renderRollback();
  renderContacts();
  renderComms();
  updateCacheBadge();
  if (!skipUndo) updateUndoUI();
  tickCurrentTask();
}

function renderMetaBar(p) {
  var metaBar = document.getElementById('metaBar');
  metaBar.innerHTML =
    metaItemRename('Проект',        esc(p.project||'—'),    false) +
    metaItem('CI проекта',          esc(p.ci_project||'—'), true)  +
    metaItem('CI стенда',           esc(p.ci_stand||'—'),   true)  +
    metaItem('Начало работ',        fmtDT(p.start),         false) +
    metaItem('Ответственный',       esc(p.responsible||'—'),false);
  var projVal = metaBar.querySelector('.meta-project-val');
  if (projVal) {
    projVal.title = 'Двойной клик — переименовать';
    projVal.style.cursor = 'pointer';
    projVal.addEventListener('dblclick', function() {
      var activeTab = document.querySelector('.plan-tab.active');
      if (!activeTab) return;
      var ns = activeTab.querySelector('.plan-tab-name');
      if (ns) startTabRename(activePlanId, ns);
    });
  }
}

function metaItem(label, value, mono) {
  return '<div class="meta-item"><div class="meta-label">' + label + '</div>' +
         '<div class="meta-value' + (mono?' mono':'') + '">' + value + '</div></div>';
}
function metaItemRename(label, value, mono) {
  return '<div class="meta-item"><div class="meta-label">' + label + '</div>' +
         '<div class="meta-value meta-project-val' + (mono?' mono':'') + '">' + value + '</div></div>';
}

// ── TABS ──
function renderTabs() {
  var bar = document.getElementById('planTabs');
  bar.innerHTML = '';
  plans.forEach(function(p) {
    var hue   = planHueFor(p);
    var color = planColorStr(hue);
    var colorActive = planColorStr(hue, 0.50, 0.19);
    var colorBg     = planColorStr(hue, 0.96, 0.025);
    var isActive = p.id === activePlanId;

    var tab = document.createElement('button');
    tab.className = 'plan-tab' + (isActive ? ' active' : '');
    tab.dataset.planId = p.id;
    if (isActive) {
      tab.style.color = colorActive;
      tab.style.borderBottomColor = colorActive;
      tab.style.background = colorBg;
    }

    var dot = document.createElement('span');
    dot.className = 'plan-tab-dot';
    dot.title = 'Изменить цвет';
    dot.style.background = color;
    dot.onclick = function(e) { e.stopPropagation(); openColorPicker(p.id, dot); };

    var name = document.createElement('span');
    name.className = 'plan-tab-name';
    name.textContent = p.project || 'Без названия';

    var clone = document.createElement('span');
    clone.className = 'plan-tab-clone';
    clone.title = 'Дублировать'; clone.textContent = '⧉';
    clone.onclick = function(e) { e.stopPropagation(); clonePlan(p.id); };

    var close = document.createElement('span');
    close.className = 'plan-tab-close';
    close.title = 'Удалить'; close.innerHTML = '&#x2715;';
    close.onclick = function(e) { e.stopPropagation(); deletePlanFromTab(p.id); };

    tab.append(dot, name, clone, close);

    tab.addEventListener('mouseenter', function(){ if (!tab.classList.contains('active')) tab.style.color = color; });
    tab.addEventListener('mouseleave', function(){ if (!tab.classList.contains('active')) tab.style.color = ''; });

    // 220ms delay to distinguish single vs double click
    (function(pid, ns) {
      var t = null;
      tab.addEventListener('click', function(e) {
        if (e.target.classList.contains('plan-tab-dot')) return;
        if (t) { clearTimeout(t); t = null; return; }
        t = setTimeout(function(){ t = null; switchPlan(pid); }, 220);
      });
      tab.addEventListener('dblclick', function(e) {
        if (e.target.classList.contains('plan-tab-dot')) return;
        e.stopPropagation();
        if (t) { clearTimeout(t); t = null; }
        startTabRename(pid, ns);
      });
    })(p.id, name);

    bar.appendChild(tab);
  });
}

// ── Color picker ──
var _colorPickerPlanId = null;
function openColorPicker(planId, dotEl) {
  _colorPickerPlanId = planId;
  var popup = document.getElementById('colorSwatchPopup');
  var grid  = document.getElementById('colorSwatchGrid');
  var p = plans.find(function(pl){ return pl.id === planId; });
  var cur = p ? planHueFor(p) : null;
  grid.innerHTML = '';
  PLAN_PALETTE.forEach(function(c) {
    var sw = document.createElement('div');
    sw.className = 'color-swatch' + (c.h === cur ? ' selected' : '');
    sw.title = c.label;
    sw.style.background = planColorStr(c.h);
    sw.onclick = function(e) { e.stopPropagation(); setPlanColor(planId, c.h); closeColorPicker(); };
    grid.appendChild(sw);
  });
  var r = dotEl.getBoundingClientRect();
  popup.style.left = Math.min(r.left, window.innerWidth - 200) + 'px';
  popup.style.top  = (r.bottom + 6) + 'px';
  popup.classList.add('open');
}
function closeColorPicker() {
  document.getElementById('colorSwatchPopup').classList.remove('open');
  _colorPickerPlanId = null;
}
function setPlanColor(planId, hue) {
  var p = plans.find(function(pl){ return pl.id === planId; });
  if (!p) return;
  mutate(function(){ p.color = hue; });
  renderTabs(); buildCalEvents(); renderCalendar();
  toast('Цвет плана изменён', '🎨');
}
document.addEventListener('click', function(e) {
  var popup = document.getElementById('colorSwatchPopup');
  if (popup && popup.classList.contains('open') && !popup.contains(e.target)) closeColorPicker();
});

// ── Tab rename ──
function startTabRename(id, nameSpan) {
  if (activePlanId !== id) switchPlan(id);
  var cur = nameSpan.textContent;
  var inp = document.createElement('input');
  inp.className = 'plan-tab-rename-input';
  inp.value = cur;
  inp.style.width = Math.max(60, cur.length * 8) + 'px';
  nameSpan.replaceWith(inp);
  inp.focus(); inp.select();
  function commit() {
    var nv = inp.value.trim() || cur;
    var p = plans.find(function(pl){ return pl.id === id; });
    if (p) { p.project = nv; pushUndo(); saveToStorage(); }
    renderTabs();
    var me = document.querySelector('#metaBar .meta-value');
    if (me) me.textContent = nv;
  }
  inp.onblur = commit;
  inp.onkeydown = function(e) {
    if (e.key==='Enter'){ e.preventDefault(); inp.blur(); }
    if (e.key==='Escape'){ inp.value=cur; inp.blur(); }
    e.stopPropagation();
  };
  inp.onclick = function(e){ e.stopPropagation(); };
}

// ── Plan CRUD ──
function createNewPlan() {
  var p = normalizePlan({ project: 'Новый план' });
  p.color = nextUnusedColor();
  p._isNew = true;
  plans.push(p);
  activePlanId = p.id;
  pushUndo(); renderAll(); saveToStorage();
  openSetupModal();
}
function switchPlan(id) { activePlanId = id; renderAll(); updateUndoUI(); }
function deletePlan(id, silent) {
  if (plans.length <= 1 && !silent) { toast('Нельзя удалить единственный план','⚠️'); return; }
  plans = plans.filter(function(p){ return p.id !== id; });
  delete _undoRegistry[id];
  if (activePlanId === id) activePlanId = plans.length ? plans[0].id : null;
  renderAll(); saveToStorage();
}
function confirmDeletePlan() {
  if (!plan()) return;
  if (plans.length === 1) { toast('Нельзя удалить единственный план','⚠️'); return; }
  if (confirm('Удалить план «'+(plan().project||'Без названия')+'»?')) {
    deletePlan(activePlanId); closeModal('setupModal'); toast('План удалён','🗑');
  }
}
function deletePlanFromTab(id) {
  if (plans.length === 1) { toast('Нельзя удалить единственный план','⚠️'); return; }
  var name = (plans.find(function(p){return p.id===id;})||{}).project||'Без названия';
  if (confirm('Удалить план «'+name+'»?')) { deletePlan(id); toast('План удалён','🗑'); }
}
function clonePlan(id) {
  var src = plans.find(function(p){ return p.id===id; });
  if (!src) return;
  var copy = JSON.parse(JSON.stringify(src));
  copy.id = 'plan_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
  copy.project = src.project + ' (копия)';
  delete copy._isNew;
  plans.push(copy);
  copy.color = nextUnusedColor();
  activePlanId = copy.id;
  pushUndo(); renderAll(); saveToStorage();
  toast('План продублирован','⧉');
}
function cloneCurrentPlan() { if (!plan()) return; clonePlan(activePlanId); closeModal('setupModal'); }

// ── STAGES ──
function renderStages() {
  var p = plan(); if (!p) return;
  var container = document.getElementById('stagesContainer');
  var needed = p.stages.map(function(_,si){ return 'stage-card-'+si; });
  Array.from(container.children).forEach(function(ch){
    if (needed.indexOf(ch.id) < 0) container.removeChild(ch);
  });
  p.stages.forEach(function(stage, si) {
    var cardId = 'stage-card-' + si;
    var card = document.getElementById(cardId);
    if (!card) {
      card = document.createElement('div');
      card.className = 'section-card'; card.id = cardId;
      card.innerHTML =
        '<div class="section-header">' +
          '<div class="section-icon icon-stage">'+(si+1)+'</div>' +
          '<span class="section-title-static">'+esc(stage.title)+'</span>' +
        '</div>' +
        '<div class="tasks-header">' +
          '<div class="th-cell col-drag"></div>' +
          '<div class="th-cell col-name">Работы</div>' +
          '<div class="th-cell col-dt">Начало (МСК)</div>' +
          '<div class="th-cell col-dur">Продолжит.</div>' +
          '<div class="th-cell col-dt">Окончание (МСК)</div>' +
          '<div class="th-cell col-resp">Исполнитель</div>' +
          '<div class="th-cell col-comment">Комментарий</div>' +
          '<div class="th-cell col-del"></div>' +
        '</div>' +
        '<div id="stage-rows-'+si+'"></div>' +
        '<div class="add-row"><button class="btn btn-ghost btn-sm" onclick="addTask('+si+')">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
          'Добавить задачу</button></div>';
      container.appendChild(card);
    }
    patchTaskRows('stage-rows-'+si, stage.tasks, si);
  });
}

function patchTaskRows(containerId, tasks, si) {
  var c = document.getElementById(containerId); if (!c) return;
  var existing = Array.from(c.querySelectorAll(':scope > .task-row'));
  if (existing.length !== tasks.length) {
    c.innerHTML = '';
    tasks.forEach(function(task, ti) {
      var row = document.createElement('div');
      row.className = 'task-row ' + (ti%2===0?'even':'odd');
      row.dataset.si = si; row.dataset.ti = ti;
      row.innerHTML = taskRowHTML(si, ti, task, tasks);
      c.appendChild(row);
      var dh = row.querySelector('.drag-handle');
      if (dh) dh.addEventListener('pointerdown', (function(s,t){ return function(e){ startDrag(e,s,t); }; })(si,ti));
      // insert divider
      var div = document.createElement('div');
      div.className = 'insert-divider';
      div.addEventListener('click', (function(s,t){ return function(){ insertTaskAt(s,t); }; })(si, ti));
      c.appendChild(div);
      setTimeout(function(){ row.querySelectorAll('textarea').forEach(autoResize); }, 0);
    });
  } else {
    existing.forEach(function(row, ti) {
      row.dataset.si = si; row.dataset.ti = ti;
      row.className = 'task-row ' + (ti%2===0?'even':'odd');
      updateTaskRow(row, si, ti, tasks[ti], tasks);
    });
  }
}

function updateTaskRow(row, si, ti, task, allTasks) {
  patchInput(row, '[data-key="name"]',    task.name     || '');
  patchInput(row, '[data-key="start"]',   task.start    || '');
  patchInput(row, '[data-key="end"]',     task.end      || '');
  patchInput(row, '[data-key="resp"]',    respVal(task) || '');
  patchInput(row, '[data-key="comment"]', task.comment  || '');
  var gz = row.querySelector('.gap-zone');
  if (gz) { var ng = gapAndDurHTML(si,ti,task,allTasks); if (gz.innerHTML!==ng) gz.innerHTML=ng; }
  var dh = row.querySelector('.drag-handle');
  if (dh) {
    var nh = dh.cloneNode(true);
    nh.addEventListener('pointerdown', function(e){ startDrag(e,si,ti); });
    dh.parentNode.replaceChild(nh, dh);
  }
  var del = row.querySelector('.row-del');
  if (del) del.setAttribute('onclick','removeTask('+si+','+ti+')');
}

function patchInput(row, sel, value) {
  var el = row.querySelector(sel); if (!el) return;
  if (document.activeElement === el) return;
  if (el.value !== value) { el.value = value; if (el.tagName==='TEXTAREA') autoResize(el); }
}

function resolveResp(raw) {
  if (!raw || raw==='%user') { var p=plan(); return p?(p.responsible||''):''; }
  return raw;
}
function respVal(task) { return resolveResp(task.responsible); }
function encodeResp(value) {
  var p = plan();
  if (!value||!value.trim()) return '%user';
  if (p && value.trim()===(p.responsible||'').trim()) return '%user';
  return value;
}

function taskRowHTML(si, ti, task, allTasks) {
  var durOpts = [5,10,15,20,25,30,35,40,45,50,55,60,75,90,105,120,150,180,210,240];
  var durSel = durOpts.map(function(m){
    var h=Math.floor(m/60),mn=m%60;
    return '<option value="'+m+'">'+(h>0?(mn>0?h+'ч '+mn+'м':h+'ч'):m+'м')+'</option>';
  }).join('');
  var nameErr = (!task.name||!task.name.trim()) ? '<div class="field-err-msg">⚠ Обязательное поле</div>' : '';
  var rv = respVal(task);
  return (
    '<div class="task-cell col-drag" style="align-items:center;justify-content:center">' +
      '<div class="drag-handle"><svg width="11" height="15" viewBox="0 0 12 16" fill="none">' +
        '<circle cx="4" cy="3" r="1.5" fill="currentColor"/><circle cx="8" cy="3" r="1.5" fill="currentColor"/>' +
        '<circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/>' +
        '<circle cx="4" cy="13" r="1.5" fill="currentColor"/><circle cx="8" cy="13" r="1.5" fill="currentColor"/></svg></div>' +
    '</div>' +
    '<div class="task-cell col-name" style="flex-direction:column;align-items:flex-start">' +
      '<textarea class="cell-input '+((!task.name||!task.name.trim())?'field-err':'')+'" rows="1"' +
        ' data-key="name" placeholder="Название работы *"' +
        ' oninput="autoResize(this);setField(\'stages\','+si+','+ti+',\'name\',this.value)"' +
        ' onchange="setField(\'stages\','+si+','+ti+',\'name\',this.value)">'+esc(task.name||'')+'</textarea>' +
      nameErr +
    '</div>' +
    '<div class="task-cell col-dt" style="align-items:center">' +
      '<input class="cell-input" type="datetime-local" data-key="start" value="'+esc(task.start||'')+'"' +
        ' onchange="onStartChange('+si+','+ti+',this.value)" style="font-size:11px;width:100%">' +
    '</div>' +
    '<div class="task-cell col-dur" style="flex-direction:column;align-items:flex-start;padding:6px 7px">' +
      '<select class="cell-input" style="cursor:pointer;font-size:12px;padding:2px 3px;border:1px solid var(--border2);border-radius:4px;background:var(--surface2);width:100%"' +
        ' onchange="onDurChange('+si+','+ti+',this.value)">' +
        '<option value="">—</option>'+durSel+
      '</select>' +
      '<div class="gap-zone">'+gapAndDurHTML(si,ti,task,allTasks)+'</div>' +
    '</div>' +
    '<div class="task-cell col-dt" style="align-items:center">' +
      '<input class="cell-input" type="datetime-local" data-key="end" value="'+esc(task.end||'')+'"' +
        ' onchange="onEndChange('+si+','+ti+',this.value)" style="font-size:11px;width:100%">' +
    '</div>' +
    '<div class="task-cell col-resp" style="align-items:flex-start">' +
      '<textarea class="cell-input" rows="1" data-key="resp" placeholder="Исполнитель"' +
        ' oninput="autoResize(this);setField(\'stages\','+si+','+ti+',\'responsible\',this.value)"' +
        ' onchange="setField(\'stages\','+si+','+ti+',\'responsible\',this.value)">'+esc(rv)+'</textarea>' +
    '</div>' +
    '<div class="task-cell col-comment" style="align-items:flex-start">' +
      '<div class="comment-wrap">' +
        '<textarea class="cell-input" rows="1" data-key="comment" placeholder="Комментарий"' +
          ' oninput="autoResize(this);setField(\'stages\','+si+','+ti+',\'comment\',this.value)"' +
          ' onchange="setField(\'stages\','+si+','+ti+',\'comment\',this.value)"' +
          ' onfocus="openCommentPopup(this,'+si+','+ti+')">'+esc(task.comment||'')+'</textarea>' +
      '</div>' +
    '</div>' +
    '<div class="task-cell col-del">' +
      '<button class="row-del" onclick="removeTask('+si+','+ti+')" title="Удалить">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
    '</div>'
  );
}

function gapAndDurHTML(si, ti, task, allTasks) {
  var html = '';
  if (task.start && task.end) {
    var diffMs = new Date(task.end) - new Date(task.start);
    if (diffMs > 0) {
      var tm=Math.round(diffMs/60000),hh=Math.floor(tm/60),mm=tm%60;
      html += '<div style="font-size:11px;color:var(--accent);font-weight:600;margin-top:2px">⏱ '+(hh>0?(mm>0?hh+'ч '+mm+'м':hh+'ч'):mm+'м')+'</div>';
    } else if (diffMs < 0) {
      var tm2=Math.round(Math.abs(diffMs)/60000),hh2=Math.floor(tm2/60),mm2=tm2%60;
      html += '<div style="font-size:11px;color:var(--red);font-weight:700;margin-top:2px">⚠ −'+(hh2>0?(mm2>0?hh2+'ч '+mm2+'м':hh2+'ч'):mm2+'м')+'</div>';
    }
  }
  if (ti > 0) {
    var prev = allTasks[ti-1];
    if (prev && prev.end && task.start && prev.end !== task.start) {
      var dm = Math.round((new Date(task.start)-new Date(prev.end))/60000);
      html +=
        '<div class="gap-warn">⚠ Разрыв '+(dm>0?'+':'')+dm+'м: '+fmtTime(prev.end)+'→'+fmtTime(task.start)+'</div>' +
        '<div class="gap-actions">' +
          '<button class="gap-btn" onclick="fixGapShrinkPrev('+si+','+(ti-1)+','+ti+')">↑ Конец пред.</button>' +
          '<button class="gap-btn" onclick="fixGapShiftNext('+si+','+ti+')">↓ Начало след.</button>' +
        '</div>';
    }
  }
  return html;
}

// ── Field setter (debounced typing) ──
function setField(section, si, ti, field, value) {
  var p = plan(); if (!p) return;
  var target = (section==='stages') && p.stages[si] && p.stages[si].tasks[ti];
  if (!target) return;
  var sv = (field==='responsible') ? encodeResp(value) : value;
  if (target[field] === sv) return;
  target[field] = sv;
  var rowEl = document.querySelector('[data-si="'+si+'"][data-ti="'+ti+'"]');
  if (rowEl) {
    var gz = rowEl.querySelector('.gap-zone');
    if (gz) { var nh = gapAndDurHTML(si,ti,target,p.stages[si].tasks); if (gz.innerHTML!==nh) gz.innerHTML=nh; }
    if (field==='name') { var ta=rowEl.querySelector('[data-key="name"]'); if (ta) validateTaskName(ta); }
  }
  clearTimeout(p._typingTimer);
  p._typingTimer = setTimeout(function(){ pushUndo(); saveToStorage(); }, 1000);
}

// ── ROLLBACK ──
function fmtRollbackTime(min) {
  if (min===undefined||min===null||min==='') return '—';
  var m=parseInt(min), h=Math.floor(m/60), mm=m%60;
  return 'Час X + ' + String(h).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
}
function renderRollback() {
  var p=plan(); if (!p) return;
  var c=document.getElementById('rollbackTasks'); c.innerHTML='';
  if (p.rollback && p.rollback.length > 0) p.rollback[0].startMin = 0;
  var durOpts=[5,10,15,20,25,30,40,45,60,75,90,105,120,150,180,210,240];
  (p.rollback||[]).forEach(function(row, ri) {
    var isFirst=ri===0;
    var sm=(row.startMin!==undefined&&row.startMin!==null)?parseInt(row.startMin):0;
    var em=(row.endMin!==undefined&&row.endMin!==null)?parseInt(row.endMin):'';
    var dm=(em!==''&&!isNaN(em))?(em-sm):'';
    var dSel=durOpts.map(function(m){ var h=Math.floor(m/60),mn=m%60,l=h>0?(mn>0?h+'ч '+mn+'м':h+'ч'):m+'м'; return '<option value="'+m+'"'+(dm===m?' selected':'')+'>'+l+'</option>'; }).join('');
    var dBadge=''; if(dm!==''&&!isNaN(dm)&&dm>0){ var dh=Math.floor(dm/60),dmm=dm%60; dBadge='<div style="font-size:11px;color:var(--accent);font-weight:600;margin-top:2px">⏱ '+(dh>0?(dmm>0?dh+'ч '+dmm+'м':dh+'ч'):dmm+'м')+'</div>'; }
    var el=document.createElement('div'); el.className='task-row '+(ri%2===0?'even':'odd'); el.dataset.ri=ri;
    el.innerHTML=
      '<div class="task-cell col-name" style="flex-direction:column;align-items:flex-start">' +
        '<textarea class="cell-input" rows="1" placeholder="Работа" oninput="autoResize(this);setRollbackField('+ri+',\'name\',this.value)">'+esc(row.name||'')+'</textarea>' +
      '</div>' +
      '<div class="task-cell col-dur" style="flex-direction:column;align-items:flex-start;padding:6px 8px">' +
        '<div style="font-size:12px;font-weight:600;color:'+(isFirst?'var(--accent)':'var(--text-muted)')+'">'+fmtRollbackTime(sm)+'</div>' +
        (isFirst?'<div style="font-size:10px;color:var(--text-light);margin-top:2px">Старт отката</div>':'') +
      '</div>' +
      '<div class="task-cell col-dur" style="flex-direction:column;align-items:flex-start;padding:6px 8px">' +
        '<select class="cell-input" style="cursor:pointer;font-size:12px;padding:2px 3px;border:1px solid var(--border2);border-radius:4px;background:var(--surface2);width:100%" onchange="onRollbackDurChange('+ri+',this.value)">' +
          '<option value="">— длит. —</option>'+dSel+'</select>'+dBadge+
      '</div>' +
      '<div class="task-cell col-dur" style="flex-direction:column;align-items:flex-start;padding:6px 8px">' +
        '<div style="font-size:12px;color:var(--text-muted)">'+(em!==''&&!isNaN(em)?fmtRollbackTime(em):'—')+'</div>' +
      '</div>' +
      '<div class="task-cell col-resp"><input class="cell-input" placeholder="Исполнитель" value="'+esc(resolveResp(row.responsible))+'" onchange="setRollbackField('+ri+',\'responsible\',encodeResp(this.value))"></div>' +
      '<div class="task-cell col-comment"><input class="cell-input" placeholder="Комментарий" value="'+esc(row.comment||'')+'" onchange="setRollbackField('+ri+',\'comment\',this.value)"></div>' +
      '<div class="task-cell col-del"><button class="row-del" onclick="removeRollback('+ri+')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>';
    setTimeout(function(){ var ta=el.querySelector('textarea'); if(ta) autoResize(ta); },0);
    c.appendChild(el);
  });
}

// ── CONTACTS ──
function renderContacts() {
  var p=plan(); if (!p) return;
  var c=document.getElementById('contactsTasks'); c.innerHTML='';
  (p.contacts||[]).forEach(function(row, ci) {
    var el=document.createElement('div'); el.className='task-row';
    el.innerHTML=
      '<div class="task-cell col-name"><input class="cell-input" placeholder="ФИО / название" value="'+esc(row.name||'')+'" onchange="setContactField('+ci+',\'name\',this.value)"></div>' +
      '<div class="task-cell col-comment"><input class="cell-input" placeholder="Роль" value="'+esc(row.role||'')+'" onchange="setContactField('+ci+',\'role\',this.value)"></div>' +
      '<div class="task-cell col-resp"><input class="cell-input" placeholder="8-xxx-xxx-xxxx" value="'+esc(row.phone||'')+'" onchange="setContactField('+ci+',\'phone\',this.value)"></div>' +
      '<div class="task-cell col-comment"><input class="cell-input" placeholder="Примечание" value="'+esc(row.note||'')+'" onchange="setContactField('+ci+',\'note\',this.value)"></div>' +
      '<div class="task-cell col-del"><button class="row-del" onclick="removeContact('+ci+')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>';
    c.appendChild(el);
  });
}

// ── COMMS ──
function renderComms() {
  var p=plan(); if (!p) return;
  var c=document.getElementById('commsTasks'); c.innerHTML='';
  (p.communications||[]).forEach(function(row, ci) {
    var partsVal=Array.isArray(row.participants)?row.participants.join(', '):(row.participants||'');
    var hasSms=!!(row.channels&&row.channels.sms);
    var hasOutlook=!!(row.channels&&row.channels.outlook);
    var hasSberchat=!!(row.channels&&row.channels.sberchat);
    var el=document.createElement('div'); el.className='task-row';
    el.innerHTML=
      '<div class="task-cell col-resp" style="align-items:flex-start"><textarea class="cell-input" rows="1" placeholder="Событие" oninput="autoResize(this);setCommField('+ci+',\'event\',this.value)" onchange="setCommField('+ci+',\'event\',this.value)">'+esc(row.event||'')+'</textarea></div>' +
      '<div class="task-cell col-channels" style="flex-direction:column;align-items:flex-start;gap:3px;padding-top:7px">' +
        '<div class="ch-tags">' +
          '<span class="ch-tag sms '+(hasSms?'active':'')+'" onclick="toggleChannel('+ci+',\'sms\')">📱 SMS</span>' +
          '<span class="ch-tag outlook '+(hasOutlook?'active':'')+'" onclick="toggleChannel('+ci+',\'outlook\')">📧 Outlook</span>' +
          '<span class="ch-tag sberchat '+(hasSberchat?'active':'')+'" onclick="toggleChannel('+ci+',\'sberchat\')">💚 СберЧат</span>' +
        '</div>' +
      '</div>' +
      '<div class="task-cell col-tool" style="align-items:flex-start"><div class="tool-display">'+esc(getToolText(row.channels))+'</div></div>' +
      '<div class="task-cell col-name" style="align-items:flex-start"><textarea class="cell-input" rows="1" placeholder="Участники" oninput="autoResize(this);setCommField('+ci+',\'participants\',this.value)" onchange="setCommField('+ci+',\'participants\',this.value)">'+esc(partsVal)+'</textarea></div>' +
      '<div class="task-cell col-resp" style="align-items:flex-start"><input class="cell-input" placeholder="Ответственный" value="'+esc(row.responsible||'')+'" onchange="setCommField('+ci+',\'responsible\',this.value)"></div>' +
      '<div class="task-cell col-del"><button class="row-del" onclick="removeComm('+ci+')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>';
    setTimeout(function(){ el.querySelectorAll('textarea').forEach(autoResize); },0);
    c.appendChild(el);
  });
}
function getToolText(ch) {
  if (!ch) return '—';
  var t=[];
  if (ch.sms)      t.push('Сервер SMS');
  if (ch.outlook)  t.push('Outlook');
  if (ch.sberchat) t.push('СберЧат');
  return t.length ? t.join(', ') : '—';
}

// ── Active task banner (header ticker) ──
function tickCurrentTask() {
  var banner = document.getElementById('currentTaskBanner');
  var nowMs  = getNowMs();
  var active = [];
  plans.forEach(function(p) {
    if (!p.start) return;
    for (var si=0; si<p.stages.length; si++) {
      var tasks = p.stages[si].tasks;
      for (var ti=0; ti<tasks.length; ti++) {
        var t = tasks[ti];
        if (!t.start||!t.end||t.manualStatus==='done') continue;
        var sMs = parseMskMs(t.start), eMs = parseMskMs(t.end);
        if (nowMs >= sMs && nowMs < eMs) {
          active.push({ task:t, planName:p.project||'Без названия', planId:p.id, endMs:eMs, minsLeft:Math.ceil((eMs-nowMs)/60000) });
          break;
        }
      }
    }
  });
  active.sort(function(a,b){ return a.minsLeft-b.minsLeft; });
  if (!active.length) {
    banner.classList.remove('visible'); banner.innerHTML = '';
  } else {
    banner.classList.add('visible');
    var multi = active.length > 1, html = '';
    active.forEach(function(item, idx) {
      if (idx>0) html += '<span class="current-task-sep">·</span>';
      var full=item.task.name||'Без названия', short=full.length>28?full.slice(0,26)+'…':full;
      var urgent=item.minsLeft<=15;
      var tip=full+' · '+item.minsLeft+' мин'+(multi?'\n'+item.planName:'');
      html += '<span class="current-task-item'+(urgent?' urgent':'')+'" data-tip="'+esc(tip)+'">'+
        '<span class="current-task-dot"></span>'+
        '<span class="current-task-text">'+esc(short+' · '+item.minsLeft+'м')+'</span>'+
        '</span>';
    });
    banner.innerHTML = html;
    var tip = document.getElementById('taskTooltip');
    banner.querySelectorAll('.current-task-item').forEach(function(chip) {
      chip.addEventListener('mouseenter', function() {
        var text=chip.getAttribute('data-tip'); if (!text||!tip) return;
        tip.innerHTML=text.replace(/\n/g,'<br>'); tip.style.opacity='1';
        var r=chip.getBoundingClientRect();
        tip.style.left=Math.min(r.left,window.innerWidth-tip.offsetWidth-12)+'px';
        tip.style.top=(r.bottom+7)+'px';
      });
      chip.addEventListener('mouseleave', function(){ if(tip) tip.style.opacity='0'; });
    });
  }
  if (typeof calLiveTick==='function') calLiveTick();
}
function startNowTicker() {
  clearInterval(_nowTimer);
  tickCurrentTask();
  _nowTimer = setInterval(tickCurrentTask, 10000);
}
