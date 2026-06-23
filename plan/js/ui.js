// ============================================================
// UI.JS — modals, setup, notify, word, comment popup,
//         drag&drop, keyboard, theme, templates, CRUD ops
// ============================================================

// ── Modals ──
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(function(o) {
  o.addEventListener('click', function(e) {
    if (e.target===o) { o.classList.remove('open'); if (typeof closeCalDetail==='function') closeCalDetail(); }
  });
});

// ── Setup ──
function openSetupModal() {
  var p = plan();
  if (p) {
    document.getElementById('f_project').value    = p.project    || '';
    document.getElementById('f_ci_stand').value   = p.ci_stand   || '';
    document.getElementById('f_ci_project').value = p.ci_project || '';
    document.getElementById('f_start').value      = p.start      || '';
    document.getElementById('f_responsible').value= p.responsible|| '';
  }
  document.getElementById('f_timezone').value = localStorage.getItem('user_tz') || 'auto';
  document.getElementById('setupModal').classList.add('open');
}

function applySetup() {
  var project = document.getElementById('f_project').value.trim();
  if (!project) { toast('Введите название проекта','⚠️'); return; }
  if (!plan()) {
    var np = normalizePlan({
      project:     project,
      ci_stand:    document.getElementById('f_ci_stand').value.trim(),
      ci_project:  document.getElementById('f_ci_project').value.trim(),
      start:       document.getElementById('f_start').value,
      responsible: document.getElementById('f_responsible').value.trim()
    });
    plans.push(np); activePlanId = np.id;
  } else {
    var newResp = document.getElementById('f_responsible').value.trim();
    mutate(function() {
      var p = plan(), oldStart = p.start;
      p.project     = project;
      p.ci_stand    = document.getElementById('f_ci_stand').value.trim();
      p.ci_project  = document.getElementById('f_ci_project').value.trim();
      p.start       = document.getElementById('f_start').value;
      p.responsible = newResp;
      delete p._isNew;
      if (p.start !== oldStart) reanchorStages(p, oldStart);
    });
    patchUserRespFields(newResp);
  }
  if (!getUndoState(activePlanId).stack.length) pushUndo();
  localStorage.setItem('user_tz', document.getElementById('f_timezone').value);
  renderAll(); saveToStorage(); closeModal('setupModal');
  toast('Настройки сохранены','✅');
}

function patchUserRespFields(newResp) {
  var p = plan(); if (!p) return;
  p.stages.forEach(function(stage, si) {
    stage.tasks.forEach(function(task, ti) {
      if (!task.responsible||task.responsible==='%user') {
        var row = document.querySelector('[data-si="'+si+'"][data-ti="'+ti+'"]');
        if (row) { var ta=row.querySelector('[data-key="resp"]'); if (ta&&document.activeElement!==ta){ ta.value=newResp; autoResize(ta); } }
      }
    });
  });
}

// ── CRUD ──
function stageAnchorStart(p, si) {
  if (si===1) return p.start||'';
  if (si===2) { var t=p.stages[1]&&p.stages[1].tasks; if(t&&t.length) return t[t.length-1].end||t[t.length-1].start||''; return ''; }
  return '';
}
function addTask(si) {
  mutate(function() {
    var p=plan(); if (!p) return;
    var tasks=p.stages[si].tasks;
    tasks.push({name:'',start:tasks.length?(tasks[tasks.length-1].end||''):stageAnchorStart(p,si),end:'',responsible:'%user',comment:''});
    renderStages();
  });
}
function insertTaskAt(si, insertAt) {
  mutate(function() {
    var p=plan(); if (!p) return;
    var tasks=p.stages[si].tasks;
    var sv=(insertAt>0&&tasks[insertAt-1])?(tasks[insertAt-1].end||''):stageAnchorStart(p,si);
    tasks.splice(insertAt,0,{name:'',start:sv,end:'',responsible:'%user',comment:''});
    renderStages();
  });
  setTimeout(function(){ var r=document.querySelector('[data-si="'+si+'"][data-ti="'+insertAt+'"]'); if(r){var ta=r.querySelector('[data-key="name"]');if(ta)ta.focus();} },50);
}
function removeTask(si, ti) {
  mutate(function(){ var p=plan(); if(!p) return; p.stages[si].tasks.splice(ti,1); renderStages(); });
}
function fixGapShrinkPrev(si, pi, ti) {
  mutate(function(){ var p=plan(); if(!p) return; p.stages[si].tasks[pi].end=p.stages[si].tasks[ti].start; renderStages(); });
  toast('Окончание пред. задачи скорректировано','✅');
}
function fixGapShiftNext(si, ti) {
  mutate(function(){ var p=plan(); if(!p) return; p.stages[si].tasks[ti].start=p.stages[si].tasks[ti-1].end; renderStages(); });
  toast('Начало задачи скорректировано','✅');
}
function addRollbackTask() {
  mutate(function() {
    var p=plan(); if(!p) return;
    var rb=p.rollback, sm=0;
    if(rb.length){var pr=rb[rb.length-1];sm=(pr.endMin!==undefined&&pr.endMin!==null&&pr.endMin!=='')? parseInt(pr.endMin):(parseInt(pr.startMin)||0);}
    rb.push({name:'',startMin:sm,endMin:'',responsible:'%user',comment:''}); renderRollback();
  });
}
function removeRollback(ri){mutate(function(){var p=plan();if(!p)return;p.rollback.splice(ri,1);renderRollback();});}
function addContact(){mutate(function(){var p=plan();if(!p)return;p.contacts.push({name:'',role:'',phone:'',note:''});renderContacts();});}
function removeContact(ci){mutate(function(){var p=plan();if(!p)return;p.contacts.splice(ci,1);renderContacts();});}
function addComm(){
  mutate(function(){var p=plan();if(!p)return;p.communications.push({event:'',channels:{sms:false,outlook:false,sberchat:false},participants:'',responsible:p.responsible||''});renderComms();});
}
function removeComm(ci){mutate(function(){var p=plan();if(!p)return;p.communications.splice(ci,1);renderComms();});}
function toggleChannel(ci, ch) {
  mutate(function(){ var p=plan();if(!p)return;if(!p.communications[ci].channels)p.communications[ci].channels={};p.communications[ci].channels[ch]=!p.communications[ci].channels[ch];renderComms(); });
}
function setRollbackField(ri, field, value) {
  var p=plan();if(!p||!p.rollback[ri])return;p.rollback[ri][field]=value;
  clearTimeout(p._typingTimer);p._typingTimer=setTimeout(function(){pushUndo();saveToStorage();},1000);
}
function setContactField(ci, field, value) {
  var p=plan();if(!p||!p.contacts[ci])return;p.contacts[ci][field]=value;
  clearTimeout(p._typingTimer);p._typingTimer=setTimeout(function(){pushUndo();saveToStorage();},1000);
}
function setCommField(ci, field, value) {
  var p=plan();if(!p||!p.communications[ci])return;p.communications[ci][field]=value;
  clearTimeout(p._typingTimer);p._typingTimer=setTimeout(function(){pushUndo();saveToStorage();},1000);
}
function onRollbackDurChange(ri, minutes) {
  if (!minutes) return;
  mutate(function() {
    var p=plan();if(!p)return;var row=p.rollback[ri];if(!row)return;
    var sm=(row.startMin!==undefined&&row.startMin!==null)?parseInt(row.startMin):0;
    row.endMin=sm+parseInt(minutes);
    if(ri+1<p.rollback.length){
      p.rollback[ri+1].startMin=row.endMin;
      for(var i=ri+1;i<p.rollback.length-1;i++){
        var cur=p.rollback[i];
        if(cur.endMin!==undefined&&cur.endMin!==null&&cur.endMin!==''){
          var dur=parseInt(cur.endMin)-parseInt(cur.startMin);
          if(!isNaN(dur)&&dur>0){p.rollback[i+1].startMin=parseInt(cur.startMin)+dur;p.rollback[i+1].endMin=parseInt(cur.startMin)+dur+dur;}
        }
      }
    }
    renderRollback();
  });
}

// ── Date logic ──
function propagateNext(si, ti, endVal) {
  var p=plan();if(!p)return;var tasks=p.stages[si].tasks;if(ti+1<tasks.length)tasks[ti+1].start=endVal;
}
function reanchorStages(p, oldStart) {
  var ns=p.start; if(!ns) return;
  var s2=p.stages[1]&&p.stages[1].tasks;
  if (s2&&s2.length>0&&s2[0].start) {
    var delta=oldStart?new Date(ns).getTime()-new Date(oldStart).getTime():new Date(ns).getTime()-new Date(s2[0].start).getTime();
    if(delta!==0) s2.forEach(function(t){ if(t.start)t.start=toDatetimeLocal(new Date(new Date(t.start).getTime()+delta)); if(t.end)t.end=toDatetimeLocal(new Date(new Date(t.end).getTime()+delta)); });
  } else if(s2&&s2.length>0&&!s2[0].start) { s2[0].start=ns; }
  var s3=p.stages[2]&&p.stages[2].tasks;
  var s2e=s2&&s2.length>0?(s2[s2.length-1].end||s2[s2.length-1].start||''):'';
  if(s3&&s3.length>0&&s2e){
    var os=s3[0].start;
    if(os&&os!==s2e){ var d3=new Date(s2e).getTime()-new Date(os).getTime(); if(d3!==0) s3.forEach(function(t){ if(t.start)t.start=toDatetimeLocal(new Date(new Date(t.start).getTime()+d3)); if(t.end)t.end=toDatetimeLocal(new Date(new Date(t.end).getTime()+d3)); }); }
    else if(!os) s3[0].start=s2e;
  }
}
function onEndChange(si, ti, val) {
  var p=plan();if(!p)return;var task=p.stages[si].tasks[ti];
  if(val&&task.start&&val<task.start){toast('Окончание не может быть раньше начала','⚠️');renderStages();return;}
  mutate(function(){
    task.end=val; propagateNext(si,ti,val);
    if(si===1&&ti===p.stages[1].tasks.length-1){
      var s3=p.stages[2]&&p.stages[2].tasks;
      if(s3&&s3.length>0){var os=s3[0].start;if(os&&os!==val){var d=new Date(val).getTime()-new Date(os).getTime();s3.forEach(function(t){if(t.start)t.start=toDatetimeLocal(new Date(new Date(t.start).getTime()+d));if(t.end)t.end=toDatetimeLocal(new Date(new Date(t.end).getTime()+d));});}else if(!os)s3[0].start=val;}
    }
    renderStages();
  });
  tickCurrentTask();
}
function onStartChange(si, ti, val) {
  var p=plan();if(!p)return;var task=p.stages[si].tasks[ti];
  if(val&&task.end&&val>task.end){toast('Начало не может быть позже окончания','⚠️');renderStages();return;}
  mutate(function(){task.start=val;renderStages();}); tickCurrentTask();
}
function onDurChange(si, ti, minutes) {
  if (!minutes) return;
  var p=plan();if(!p)return;var task=p.stages[si].tasks[ti];
  if(!task.start){toast('Сначала укажите время начала','⚠️');return;}
  var ev=toDatetimeLocal(new Date(new Date(task.start).getTime()+parseInt(minutes)*60000));
  mutate(function(){task.end=ev;propagateNext(si,ti,ev);renderStages();}); tickCurrentTask();
}

// ── Templates ──
function openTemplatesModal() {
  if (!plan()){toast('Сначала создайте план','⚠️');return;}
  renderTemplateGroups();
  document.getElementById('templatesModal').classList.add('open');
}
function renderTemplateGroups() {
  var si=parseInt(document.getElementById('tplStageSelect').value)||0;
  var groups=TASK_TEMPLATES[si]||[];
  var container=document.getElementById('tplGroups'); container.innerHTML='';
  if(!groups.length){container.innerHTML='<div style="color:var(--text-muted);font-size:13px;padding:12px 0">Нет шаблонов для этого этапа</div>';return;}
  groups.forEach(function(group){
    var g=document.createElement('div');
    g.innerHTML='<div class="tpl-group-label">'+esc(group.group)+'</div><div class="tpl-items"></div>';
    container.appendChild(g);
    var items=g.querySelector('.tpl-items');
    group.items.forEach(function(item){
      var row=document.createElement('div'); row.className='tpl-item';
      var h=Math.floor(item.dur/60),m=item.dur%60,dl=h>0?(m>0?h+'ч '+m+'м':h+'ч'):m+'м';
      row.innerHTML='<span class="tpl-item-name">'+esc(item.name)+'</span><span class="tpl-item-dur">'+dl+'</span><span class="tpl-item-add">+</span>';
      row.onclick=function(){addTemplateTask(item);};
      items.appendChild(row);
    });
  });
}
function addTemplateTask(item) {
  var si=parseInt(document.getElementById('tplStageSelect').value)||0;
  mutate(function(){
    var p=plan();if(!p)return;var tasks=p.stages[si].tasks;
    var sv='';
    if(tasks.length>0)sv=tasks[tasks.length-1].end||tasks[tasks.length-1].start||'';
    if(!sv){for(var s=si;s>=0;s--){var st=p.stages[s].tasks;if(st.length>0){sv=st[st.length-1].end||st[st.length-1].start||'';if(sv)break;}}}
    if(!sv)sv=p.start||'';
    var ev=sv?toDatetimeLocal(new Date(new Date(sv).getTime()+item.dur*60000)):'';
    tasks.push({name:item.name,start:sv,end:ev,responsible:'',comment:''});
    renderStages();
  });
  toast('«'+item.name+'» добавлена','✅');
}

// ── Notify ──
function openNotifyModal() {
  if(!plan()){toast('Сначала создайте план','⚠️');return;}
  notifyEvent='start'; notifyChannel='chat';
  ['ev-start','ev-close','ev-rollback'].forEach(function(id){document.getElementById(id).classList.remove('active');});
  ['ch-chat','ch-outlook','ch-sms'].forEach(function(id){document.getElementById(id).classList.remove('active');});
  document.getElementById('ev-start').classList.add('active');
  document.getElementById('ch-chat').classList.add('active');
  updateNotifyText();
  document.getElementById('notifyModal').classList.add('open');
}
function switchEvent(ev){
  notifyEvent=ev;
  ['ev-start','ev-close','ev-rollback'].forEach(function(id){document.getElementById(id).classList.toggle('active',id==='ev-'+ev);});
  updateNotifyText();
}
function switchChannel(ch){
  notifyChannel=ch;
  ['ch-chat','ch-outlook','ch-sms'].forEach(function(id){document.getElementById(id).classList.toggle('active',id==='ch-'+ch);});
  updateNotifyText();
}
function getRecipients(filter) {
  var p=plan();if(!p)return[];
  var all=new Set();
  (p.communications||[]).forEach(function(c){
    if(filter&&(!c.channels||!c.channels[filter]))return;
    var parts=Array.isArray(c.participants)?c.participants:(c.participants||'').split(',').map(function(s){return s.trim();}).filter(Boolean);
    parts.forEach(function(pt){if(pt)all.add(pt);});
  });
  return Array.from(all);
}
function updateNotifyText() {
  var p=plan();if(!p)return;
  var sf=p.start?new Date(p.start).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'[не указано]';
  var rv=document.getElementById('rovNumber').value||'';
  var rl=rv?'\nРоВ № '+rv+'.':'';
  var prj=p.project||'—',cs=p.ci_stand||'—',cp=p.ci_project||'—',resp=p.responsible||'Команда',nl='\n';
  var rr=document.getElementById('recipientsRow');
  if(notifyChannel==='outlook'||notifyChannel==='sms'){
    var rec=getRecipients(notifyChannel),lbl=notifyChannel==='outlook'?'📧 Outlook':'📱 SMS';
    rr.style.display=rec.length?'block':'none';
    rr.innerHTML=rec.length?'<b>'+lbl+' Кому:</b> '+rec.join('; '):'';
  }else{rr.style.display='none';}
  var text='';
  if(notifyEvent==='start'){
    if(notifyChannel==='chat')text='🔧 *Начало регламентных работ*'+nl+nl+'📋 *Проект:* '+prj+nl+'🖥 *CI стенда:* '+cs+nl+'📦 *CI проекта:* '+cp+nl+'⏰ *Начало:* '+sf+' МСК'+nl+'👤 *Ответственный:* '+resp+nl+nl+'⚠️ Возможна временная недоступность сервиса.';
    else if(notifyChannel==='outlook')text='Уважаемые коллеги,'+nl+nl+'Информируем о начале регламентных работ.'+nl+nl+'Проект: '+prj+nl+'CI стенда: '+cs+nl+'CI проекта: '+cp+nl+'Начало: '+sf+' (МСК)'+nl+'Ответственный: '+resp+nl+nl+'Возможна временная недоступность сервиса.'+rl+nl+nl+'С уважением,'+nl+resp;
    else text='Начало работ '+sf+' МСК. '+prj+' ('+cp+'). Стенд: '+cs+'. Отв: '+resp+'.'+(rv?' РоВ №'+rv+'.':'');
  }else if(notifyEvent==='close'){
    if(notifyChannel==='chat')text='✅ *Регламентные работы завершены*'+nl+nl+'📋 *Проект:* '+prj+nl+'🖥 *CI стенда:* '+cs+nl+'📦 *CI проекта:* '+cp+nl+'👤 *Ответственный:* '+resp+nl+nl+'🟢 Работы завершены успешно. Сервис в штатном режиме.';
    else if(notifyChannel==='outlook')text='Уважаемые коллеги,'+nl+nl+'Регламентные работы завершены.'+nl+nl+'Проект: '+prj+nl+'CI стенда: '+cs+nl+'CI проекта: '+cp+nl+'Ответственный: '+resp+nl+nl+'Сервис доступен в штатном режиме.'+rl+nl+nl+'С уважением,'+nl+resp;
    else text='Работы завершены. '+prj+' ('+cp+'). Стенд: '+cs+'. Сервис доступен.'+(rv?' РоВ №'+rv+'.':'');
  }else{
    if(notifyChannel==='chat')text='🔴 *Применён план отката*'+nl+nl+'📋 *Проект:* '+prj+nl+'🖥 *CI стенда:* '+cs+nl+'📦 *CI проекта:* '+cp+nl+'👤 *Ответственный:* '+resp+nl+nl+'⚠️ Возникли проблемы. Применён откат.'+nl+'🔄 Сервис восстановлен на предыдущую версию.';
    else if(notifyChannel==='outlook')text='Уважаемые коллеги,'+nl+nl+'Регламентные работы завершены с применением отката.'+nl+nl+'Проект: '+prj+nl+'CI стенда: '+cs+nl+'CI проекта: '+cp+nl+'Ответственный: '+resp+nl+nl+'Возникли проблемы, применён план отката. Сервис восстановлен.'+rl+nl+nl+'С уважением,'+nl+resp;
    else text='Откат. '+prj+' ('+cp+'). Стенд: '+cs+'.'+(rv?' РоВ №'+rv+'.':'');
  }
  document.getElementById('notifyText').textContent=text;
}
function copyNotify(){
  var text=document.getElementById('notifyText').textContent;
  var rec=getRecipients(notifyChannel==='outlook'?'outlook':notifyChannel==='sms'?'sms':null);
  if((notifyChannel==='outlook'||notifyChannel==='sms')&&rec.length)text=(notifyChannel==='outlook'?'Outlook':'SMS')+' Кому: '+rec.join('; ')+'\n\n'+text;
  navigator.clipboard.writeText(text).then(function(){toast('Скопировано','📋');});
}

// ── Word export ──
function openWordModal(){
  if(!plan()){toast('Сначала создайте план','⚠️');return;}
  document.getElementById('wordPreview').innerHTML=buildWordHTML();
  document.getElementById('wordModal').classList.add('open');
}
function buildWordHTML(){
  var p=plan();
  var title='План-график работ по обновлению '+(p.project||'[проект]')+' ('+(p.ci_project||'CI проекта')+') на стенде '+(p.ci_stand||'CI стенда')+' ПРОМ.';
  var h='<div class="word-page"><p class="word-page-title">'+esc(title)+'</p>'+
    '<table class="word-table"><colgroup><col style="width:4%"><col style="width:28%"><col style="width:13%"><col style="width:13%"><col style="width:15%"><col style="width:9%"><col style="width:18%"></colgroup>'+
    '<thead><tr><th>№</th><th>Работы</th><th>Начало (МСК)</th><th>Окончание (МСК)</th><th>Исполнитель</th><th>Влияние</th><th>Комментарий</th></tr></thead><tbody>';
  p.stages.forEach(function(stage){
    h+='<tr class="stage-row"><td colspan="7">'+esc(stage.title)+'</td></tr>';
    stage.tasks.forEach(function(t){
      h+='<tr><td></td><td>'+esc(t.name||'')+'</td><td>'+fmtDT(t.start)+'</td><td>'+fmtDT(t.end)+'</td><td>'+esc(resolveResp(t.responsible))+'</td><td></td><td>'+esc(t.comment||'')+'</td></tr>';
    });
  });
  h+='</tbody></table><p class="word-section-label">План отката</p>';
  if((p.rollback||[]).length){
    h+='<table class="word-table"><colgroup><col style="width:32%"><col style="width:17%"><col style="width:17%"><col style="width:18%"><col style="width:16%"></colgroup>'+
      '<thead><tr><th>Работы</th><th>Начало (Час X +)</th><th>Окончание (Час X +)</th><th>Исполнитель</th><th>Комментарий</th></tr></thead><tbody>';
    p.rollback.forEach(function(r){h+='<tr><td>'+esc(r.name||'')+'</td><td>'+esc(fmtRollbackTime(r.startMin||0))+'</td><td>'+esc(r.endMin!==''&&r.endMin!==undefined?fmtRollbackTime(r.endMin):'—')+'</td><td>'+esc(resolveResp(r.responsible))+'</td><td>'+esc(r.comment||'')+'</td></tr>';});
    h+='</tbody></table>';
  }else{h+='<p style="font-size:10pt;color:#555;font-style:italic;margin:4px 0 10px">План отката не предусмотрен.</p>';}
  if((p.contacts||[]).length){
    h+='<p class="word-section-label">Контактная информация</p>'+
      '<table class="word-table"><colgroup><col style="width:28%"><col style="width:28%"><col style="width:22%"><col style="width:22%"></colgroup>'+
      '<thead><tr><th>ФИО</th><th>Роль</th><th>Контакт</th><th>Примечание</th></tr></thead><tbody>';
    p.contacts.forEach(function(c){h+='<tr><td>'+esc(c.name||'')+'</td><td>'+esc(c.role||'')+'</td><td>'+esc(c.phone||'')+'</td><td>'+esc(c.note||'')+'</td></tr>';});
    h+='</tbody></table>';
  }
  if((p.communications||[]).length){
    h+='<p class="word-section-label">План коммуникаций</p>'+
      '<table class="word-table"><colgroup><col style="width:16%"><col style="width:18%"><col style="width:22%"><col style="width:28%"><col style="width:16%"></colgroup>'+
      '<thead><tr><th>Событие</th><th>Вид</th><th>Средство</th><th>Участники</th><th>Ответственный</th></tr></thead><tbody>';
    p.communications.forEach(function(c){
      var parts=Array.isArray(c.participants)?c.participants.join(', '):(c.participants||'');
      var v=[],t=[];
      if(c.channels&&c.channels.sms){v.push('SMS');t.push('Сервер SMS');}
      if(c.channels&&c.channels.outlook){v.push('Outlook');t.push('Outlook');}
      if(c.channels&&c.channels.sberchat){v.push('СберЧат');t.push('СберЧат');}
      h+='<tr><td>'+esc(c.event||'')+'</td><td>'+esc(v.join(', ')||'—')+'</td><td>'+esc(t.join(', ')||'—')+'</td><td>'+esc(parts)+'</td><td>'+esc(c.responsible||'')+'</td></tr>';
    });
    h+='</tbody></table>';
  }
  return h+'</div>';
}
function copyWordTable(){
  var el=document.getElementById('wordPreview');
  var r=document.createRange();r.selectNode(el);
  window.getSelection().removeAllRanges();window.getSelection().addRange(r);
  document.execCommand('copy');window.getSelection().removeAllRanges();
  toast('Скопировано — вставьте в Word (Ctrl+V)','📋');
}

// ── Export / Import ──
function exportJSON(){
  var p=plan();if(!p){toast('Нет плана','⚠️');return;}
  var blob=new Blob([JSON.stringify(p,null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='work_plan_'+(p.project||'plan').replace(/[^а-яёa-z0-9]/gi,'_').toLowerCase()+'.json';
  a.click();toast('JSON экспортирован','✅');
}
function importJSON(event){
  var file=event.target.files[0];if(!file)return;
  var r=new FileReader();
  r.onload=function(e){
    try{
      var data=JSON.parse(e.target.result);
      var np=normalizePlan(data);
      var cur=plan();
      if(cur&&cur._isNew){var idx=plans.findIndex(function(p){return p.id===activePlanId;});plans[idx]=np;delete _undoRegistry[activePlanId];}
      else plans.push(np);
      activePlanId=np.id;pushUndo();renderAll();saveToStorage();closeModal('setupModal');toast('План загружен','✅');
    }catch(err){toast('Ошибка чтения JSON','❌');}
  };
  r.readAsText(file);event.target.value='';
}

// ── Comment popup ──
var _popupDocListener = null;
function getOrCreatePopup(){
  var p=document.getElementById('__commentPopup');
  if(!p){p=document.createElement('div');p.id='__commentPopup';p.className='comment-popup';document.body.appendChild(p);}
  return p;
}
function openCommentPopup(ta, si, ti){
  var popup=getOrCreatePopup();
  popup.innerHTML=
    '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">'+
      '<input id="__commentFilter" type="text" placeholder="Поиск шаблона…" '+
        'style="flex:1;font-size:11.5px;padding:4px 8px;border:1px solid var(--border2);border-radius:5px;background:var(--surface);color:var(--text);outline:none;" '+
        'oninput="filterCommentSnippets(this.value,'+si+','+ti+')" '+
        'onpointerdown="event.stopPropagation()" onfocus="event.stopPropagation()">'+
    '</div>'+
    '<div style="font-size:10.5px;color:var(--text-muted);margin-bottom:4px">Нажмите — заменить · Shift+клик — добавить</div>'+
    '<div id="__snippetList" style="display:flex;flex-direction:column;gap:4px"></div>';
  renderSnippetList('',si,ti);
  var r=ta.getBoundingClientRect(),pW=290,pH=330;
  var top=r.bottom+4,left=r.left;
  if(left+pW>window.innerWidth-8)left=window.innerWidth-pW-8;
  if(top+pH>window.innerHeight-8)top=r.top-pH-4;
  popup.style.top=top+'px';popup.style.left=left+'px';
  popup.style.display='flex';popup.classList.add('open');
  setTimeout(function(){var f=document.getElementById('__commentFilter');if(f)f.focus();},60);
  if(_popupDocListener)document.removeEventListener('click',_popupDocListener,true);
  setTimeout(function(){
    _popupDocListener=function(e){if(!popup.contains(e.target)&&e.target!==ta)closeAllPopups();};
    document.addEventListener('click',_popupDocListener,true);
  },0);
}
function closeAllPopups(){
  var p=document.getElementById('__commentPopup');
  if(p){p.classList.remove('open');p.style.display='none';}
  if(_popupDocListener){document.removeEventListener('click',_popupDocListener,true);_popupDocListener=null;}
}
function renderSnippetList(filter, si, ti){
  var list=document.getElementById('__snippetList');if(!list)return;
  var q=filter.toLowerCase();
  var items=COMMENT_SNIPPETS.filter(function(s){return !q||s.toLowerCase().indexOf(q)>=0;});
  if(!items.length){list.innerHTML='<div style="font-size:12px;color:var(--text-muted);padding:6px">Не найдено</div>';return;}
  list.innerHTML='';
  items.forEach(function(s){
    var div=document.createElement('div');div.className='comment-snippet';div.textContent=s;
    div.onpointerdown=function(e){e.preventDefault();if(e.shiftKey)appendComment(si,ti,s);else insertCommentText(si,ti,s);};
    list.appendChild(div);
  });
}
function filterCommentSnippets(val,si,ti){renderSnippetList(val,si,ti);}
function insertCommentText(si,ti,text){
  var p=plan();if(!p)return;p.stages[si].tasks[ti].comment=text;
  var row=document.querySelector('[data-si="'+si+'"][data-ti="'+ti+'"]');
  if(row){var ta=row.querySelector('[data-key="comment"]');if(ta){ta.value=text;autoResize(ta);}}
  closeAllPopups();pushUndo();saveToStorage();
}
function appendComment(si,ti,text){
  var p=plan();if(!p)return;var cur=p.stages[si].tasks[ti].comment||'';
  var nv=cur?cur+'; '+text:text;p.stages[si].tasks[ti].comment=nv;
  var row=document.querySelector('[data-si="'+si+'"][data-ti="'+ti+'"]');
  if(row){var ta=row.querySelector('[data-key="comment"]');if(ta){ta.value=nv;autoResize(ta);}}
  closeAllPopups();pushUndo();saveToStorage();
}
function insertComment(si,ti,idx){insertCommentText(si,ti,COMMENT_SNIPPETS[idx]);}

// ── Drag & drop ──
var _drag=null;
function startDrag(e,si,ti){
  e.preventDefault();
  var row=e.currentTarget.closest('.task-row');if(!row)return;
  _drag={si:si,ti:ti,srcRow:row};row.classList.add('dragging');
  document.addEventListener('pointermove',onDragMove,{passive:false});
  document.addEventListener('pointerup',onDragEnd,{once:true});
}
function onDragMove(e){
  if(!_drag)return;e.preventDefault();
  var el=document.elementFromPoint(e.clientX,e.clientY);
  var tgt=el&&el.closest('.task-row');
  document.querySelectorAll('.drop-above,.drop-below').forEach(function(r){r.classList.remove('drop-above','drop-below');});
  if(!tgt||tgt===_drag.srcRow)return;
  var r=tgt.getBoundingClientRect();
  tgt.classList.add(e.clientY<r.top+r.height/2?'drop-above':'drop-below');
}
function onDragEnd(e){
  document.removeEventListener('pointermove',onDragMove);
  if(!_drag)return;
  var si=_drag.si,from=_drag.ti,src=_drag.srcRow;
  _drag=null;src.classList.remove('dragging');
  document.querySelectorAll('.drop-above,.drop-below').forEach(function(r){r.classList.remove('drop-above','drop-below');});
  var el=document.elementFromPoint(e.clientX,e.clientY);
  var tgt=el&&el.closest('.task-row[data-ti]');if(!tgt)return;
  var tsi=parseInt(tgt.dataset.si),tti=parseInt(tgt.dataset.ti);
  if(tsi!==si||tti===from)return;
  mutate(function(){
    var p=plan();if(!p)return;var tasks=p.stages[si].tasks;
    var snap=tasks.map(function(t){return Object.assign({},t);});
    var r=tgt.getBoundingClientRect(),ins=e.clientY>=r.top+r.height/2?tti+1:tti;
    var moved=snap.splice(from,1)[0];if(ins>from)ins--;
    snap.splice(ins,0,moved);tasks.length=0;snap.forEach(function(t){tasks.push(t);});
    renderStages();
  });
}

// ── Theme ──
function toggleTheme(){
  var dark=document.documentElement.getAttribute('data-theme')==='dark';
  document.documentElement.setAttribute('data-theme',dark?'light':'dark');
  var ic=document.getElementById('themeIcon');
  if(ic)ic.innerHTML=dark?'<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>':'<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
  localStorage.setItem('theme',dark?'light':'dark');
}
(function(){
  var t=localStorage.getItem('theme')||'light';
  document.documentElement.setAttribute('data-theme',t);
  var ic=document.getElementById('themeIcon');
  if(ic&&t==='dark')ic.innerHTML='<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
})();

// ── Keyboard shortcuts ──
document.addEventListener('keydown', function(e) {
  if(e.key==='Escape'){
    ['setupModal','notifyModal','wordModal','calendarModal'].forEach(function(id){document.getElementById(id).classList.remove('open');});
    closeAllPopups();if(typeof closeCalDetail==='function')closeCalDetail();return;
  }
  if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key==='z'){e.preventDefault();undo();return;}
  if((e.ctrlKey||e.metaKey)&&(e.key==='y'||(e.shiftKey&&e.key==='z'))){e.preventDefault();redo();return;}
  if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();exportJSON();return;}
});
