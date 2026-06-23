// ============================================================
// CALENDAR.JS — calendar modal, agenda, detail popup
// ============================================================

var _calDate     = null;
var _calEvents   = [];
var _calSelected = null;

// ── Parse datetime-local as MSK regardless of browser tz ──
function buildCalEvents() {
  _calEvents = [];
  plans.forEach(function(p, pi) {
    var hue = planHueFor(p);
    p.stages.forEach(function(stage, si) {
      stage.tasks.forEach(function(task, ti) {
        if (!task.start || !task.end) return;
        var sMs = parseMskMs(task.start), eMs = parseMskMs(task.end);
        if (isNaN(sMs) || isNaN(eMs) || eMs <= sMs) return;
        _calEvents.push({
          planId:p.id, planIdx:pi, planName:p.project||'Без названия', planHue:hue,
          si:si, ti:ti, stageName:STAGE_TITLES[si]||('Этап '+(si+1)),
          name:task.name||'(без названия)', start:task.start, end:task.end,
          startMs:sMs, endMs:eMs, resp:resolveResp(task.responsible),
          comment:task.comment||'', manualStatus:task.manualStatus||null
        });
      });
    });
  });
  _calEvents.sort(function(a,b){ return a.startMs - b.startMs; });
}

// ── Day bounds in user tz ──
function dayBoundsMs(date) {
  var tzVal = localStorage.getItem('user_tz') || 'auto';
  var off = tzVal==='auto' ? new Date().getTimezoneOffset()*-1 : parseInt(tzVal);
  var d = new Date(date);
  var shifted = new Date(d.getTime() + (off - new Date().getTimezoneOffset()*-1)*60000);
  var y=shifted.getFullYear(), m=shifted.getMonth(), dd=shifted.getDate();
  var midnight = Date.UTC(y,m,dd) - off*60000;
  return { start:midnight, end:midnight+86400000-1 };
}
function getEventsForDay(date) {
  var b = dayBoundsMs(date);
  return _calEvents.filter(function(ev){ return ev.startMs<=b.end && ev.endMs>=b.start; });
}

// ── Navigation ──
function openCalendarModal() {
  if (!plans.length) { toast('Нет планов','⚠️'); return; }
  buildCalEvents();
  if (!_calDate) {
    var today = new Date(); today.setHours(0,0,0,0);
    _calDate = getEventsForDay(today).length ? today : (_calEvents.length ? new Date(_calEvents[0].startMs) : today);
    _calDate.setHours(0,0,0,0);
  }
  document.getElementById('calendarModal').classList.add('open');
  renderCalendar();
  setTimeout(calScrollToActive, 140);
}
function calShiftDay(n) {
  _calDate = _calDate || new Date();
  _calDate = new Date(_calDate.getTime() + n*86400000);
  _calDate.setHours(0,0,0,0);
  renderCalendar(); setTimeout(calScrollToActive, 60);
}
function calGoToday() {
  _calDate = new Date(); _calDate.setHours(0,0,0,0);
  renderCalendar(); setTimeout(calScrollToActive, 60);
}
function calGoFirstEvent() {
  if (!_calEvents.length) { toast('Нет задач с датами','⚠️'); return; }
  var nowMs=getNowMsMsk(), today=new Date(nowMs); today.setHours(0,0,0,0);
  var todayMs=today.getTime(), tomorrowMs=todayMs+86400000;
  var hasToday=_calEvents.some(function(ev){ return ev.startMs<tomorrowMs&&ev.endMs>todayMs; });
  if (hasToday) { _calDate=today; }
  else {
    var future=_calEvents.filter(function(ev){ return ev.startMs>=todayMs; });
    if (future.length) { _calDate=new Date(future[0].startMs); _calDate.setHours(0,0,0,0); }
    else { var last=_calEvents[_calEvents.length-1]; _calDate=new Date(last.startMs); _calDate.setHours(0,0,0,0); }
  }
  renderCalendar(); setTimeout(calScrollToActive, 60);
}
function calScrollToActive() {
  var wrap=document.getElementById('calAgendaWrap'); if (!wrap) return;
  var el=document.querySelector('#calAgenda .cal-item.now')||document.querySelector('#calAgenda .cal-item.next')||document.querySelector('#calAgenda .cal-item');
  if (el) wrap.scrollTop = Math.max(0, el.offsetTop - 96);
}
function calLiveTick() {
  var modal=document.getElementById('calendarModal');
  if (!modal||!modal.classList.contains('open')) return;
  var det=document.getElementById('calDetail');
  if (det&&det.classList.contains('open')) return;
  var wrap=document.getElementById('calAgendaWrap');
  var st=wrap?wrap.scrollTop:0;
  renderCalendar();
  if (wrap) wrap.scrollTop=st;
}

// ── Master render ──
function renderCalendar() {
  if (!_calDate) return;
  closeCalDetail();
  var today=new Date(); today.setHours(0,0,0,0);
  var isToday=_calDate.getTime()===today.getTime();
  var label=_calDate.toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  label=label.charAt(0).toUpperCase()+label.slice(1);
  document.getElementById('calDateLabel').textContent=(isToday?'Сегодня · ':'')+label;
  renderCalAgenda(getEventsForDay(_calDate));
}

// ── Stage label shortener ──
function shortStage(s) {
  var m=s.match(/Этап\s*(\d)/); if(!m) return s;
  var n=m[1]; return n==='1'?'Этап 1 — Подготовка':n==='2'?'Этап 2 — Основные работы':n==='3'?'Этап 3 — Завершение':s;
}
function fmtDur(ms){ var min=Math.round(ms/60000); if(min<60)return min+' мин'; var h=Math.floor(min/60),m=min%60; return h+' ч'+(m?' '+m+' м':''); }

// ── Agenda render ──
function renderCalAgenda(eventsToday) {
  var agenda=document.getElementById('calAgenda');
  var statEl=document.getElementById('calDayStat');
  agenda.innerHTML='';
  if (!eventsToday.length) {
    statEl.style.display='none';
    agenda.innerHTML='<div class="cal-empty"><div class="cal-empty-icon">🗓️</div><div class="cal-empty-title">В этот день задач нет</div><div class="cal-empty-sub">Выберите другой день или нажмите «К работам»</div></div>';
    return;
  }
  statEl.style.display='';
  var nowMs=getNowMs() - (getUserTzOffsetMin() - MSK_OFFSET_MIN) * 60000;
  var evs=eventsToday.slice().sort(function(a,b){ return a.startMs-b.startMs; });

  // Day stats
  var total=evs.length, done=0;
  evs.forEach(function(ev){ if(ev.endMs<=nowMs||ev.manualStatus==='done') done++; });
  var first=evs[0].startMs, last=Math.max.apply(null,evs.map(function(e){return e.endMs;}));
  var nowIdx=-1, nextIdx=-1;
  for(var i=0;i<evs.length;i++){ if(evs[i].startMs<=nowMs&&nowMs<evs[i].endMs){nowIdx=i;break;} }
  for(var k=0;k<evs.length;k++){ if(evs[k].startMs>nowMs&&evs[k].endMs>nowMs){nextIdx=k;break;} }
  var ll,lv,lc='';
  if(nowIdx>=0){lc='accent';ll='Идёт сейчас';lv='осталось '+Math.max(1,Math.ceil((evs[nowIdx].endMs-nowMs)/60000))+' мин';}
  else if(nextIdx>=0){ll='Следующая задача';lv='в '+fmtTimeTz(evs[nextIdx].start);}
  else{ll='Статус дня';lv=done===total?'всё выполнено':'—';}

  statEl.innerHTML=
    statItem('Задач в плане',String(total),'')+
    statItem('Выполнено',done+' / '+total,done===total?'accent':'')+
    statItem('Период работ',fmtTimeTz(new Date(first))+'–'+fmtTimeTz(new Date(last)),'mono')+
    statItem(ll,lv,lc);

  evs.forEach(function(ev, i) {
    var status;
    if      (ev.manualStatus==='done')                       status='done';
    else if (ev.endMs<=nowMs)                                status='done';
    else if (ev.startMs<=nowMs&&nowMs<ev.endMs)              status=ev.manualStatus||'now';
    else if (i===nextIdx)                                    status='next';
    else                                                     status='soon';

    var nodeInner = status==='done'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2"><polyline points="20 6 9 17 4 12"/></svg>'
      : (status==='now' ? '<span class="cal-pulse"></span><span class="cal-dot"></span>' : '<span class="cal-dot"></span>');
    var badge={done:'Выполнено',now:'Сейчас',next:'Далее',soon:'Предстоит'}[status];
    var multi=plans.length>1;
    var prog='';
    if(status==='now'){
      var pct=Math.max(2,Math.min(100,(nowMs-ev.startMs)/(ev.endMs-ev.startMs)*100));
      var left=Math.max(1,Math.ceil((ev.endMs-nowMs)/60000));
      prog='<div class="cal-progress"><div class="cal-progress-track"><div class="cal-progress-fill" style="width:'+pct.toFixed(0)+'%"></div></div><div class="cal-progress-label">осталось '+left+' мин</div></div>';
    }

    var item=document.createElement('div');
    item.className='cal-item '+status;
    item.title='Клик — детали · Двойной клик — перейти к задаче';
    item.innerHTML=
      '<div class="cal-node-col"><div class="cal-node">'+nodeInner+'</div></div>'+
      '<div class="cal-time">'+
        '<div class="cal-time-start">'+fmtTimeTz(ev.start)+'</div>'+
        '<div class="cal-time-end">'+fmtTimeTz(ev.end)+'</div>'+
        '<div class="cal-dur">'+fmtDur(ev.endMs-ev.startMs)+'</div>'+
      '</div>'+
      '<div class="cal-main">'+
        '<div class="cal-item-head">'+
          '<div class="cal-item-name">'+esc(ev.name)+'</div>'+
          '<div class="cal-status-badge">'+badge+'</div>'+
        '</div>'+
        '<div class="cal-item-meta">'+
          '<span class="cal-stage-tag">'+esc(shortStage(ev.stageName))+'</span>'+
          (ev.resp?'<span class="cal-plan-tag" style="color:var(--text-muted)">'+esc(ev.resp)+'</span>':'')+
          (multi?'<span class="cal-plan-tag cal-plan-tag-rename" data-plan-id="'+ev.planId+'" title="Двойной клик — переименовать план" style="color:oklch(0.58 0.16 '+ev.planHue+');cursor:pointer">'+esc(ev.planName)+'</span>':'')+
        '</div>'+prog+
      '</div>';

    (function(evS, el, st) {
      var t=null;
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        if(t){clearTimeout(t);t=null;return;}
        t=setTimeout(function(){t=null;openCalDetail(evS,el,st);},220);
      });
      el.addEventListener('dblclick', function(e) {
        e.stopPropagation();
        if(t){clearTimeout(t);t=null;}
        var tag=e.target.closest('.cal-plan-tag-rename');
        if(tag){startCalPlanRename(tag,tag.dataset.planId);return;}
        closeCalDetail();
        if(evS.planId!==activePlanId)switchPlan(evS.planId);
        closeModal('calendarModal');
        setTimeout(function(){
          var row=document.querySelector('[data-si="'+evS.si+'"][data-ti="'+evS.ti+'"]');
          if(row){
            row.scrollIntoView({behavior:'smooth',block:'center'});
            row.style.outline='2.5px solid var(--accent)';row.style.boxShadow='0 0 0 5px var(--accent-ring)';
            row.style.borderRadius='6px';row.style.transition='outline .1s,box-shadow .1s';
            setTimeout(function(){row.style.outline='';row.style.boxShadow='';},2200);
          }else toast('Задача не найдена','⚠️');
        },200);
      });
    })(ev, item, status);
    agenda.appendChild(item);
  });
}

function statItem(lbl, val, cls) {
  return '<div class="cal-daystat-item"><div class="cal-daystat-val '+(cls||'')+'">'+esc(val)+'</div><div class="cal-daystat-lbl">'+esc(lbl)+'</div></div>';
}

// ── Detail popup ──
function detailRow(key, val) {
  return '<div class="cal-detail-row"><span class="cal-detail-key">'+esc(key)+'</span><span class="cal-detail-val">'+esc(String(val||''))+'</span></div>';
}
function detailRowHTML(key, html) {
  return '<div class="cal-detail-row"><span class="cal-detail-key">'+esc(key)+'</span><span class="cal-detail-val">'+html+'</span></div>';
}

function openCalDetail(ev, blockEl, colorClass) {
  _calSelected = ev;
  var popup=document.getElementById('calDetail');
  var statusColors={done:'var(--green)',now:'var(--accent)',next:'var(--orange)',soon:'var(--text-light)'};
  var dot=document.getElementById('calDetailDot');
  dot.className='cal-detail-dot'; dot.style.background=statusColors[colorClass]||'var(--text-light)'; dot.style.border='none';
  document.getElementById('calDetailTitle').textContent=ev.name;

  var dm=Math.round((ev.endMs-ev.startMs)/60000);
  var ds=dm>=60?Math.floor(dm/60)+'ч '+(dm%60?dm%60+'м':''):dm+'м';

  var p=plans.find(function(pl){return pl.id===ev.planId;});
  var task=p&&p.stages[ev.si]&&p.stages[ev.si].tasks[ev.ti];
  var ms=task&&task.manualStatus;
  var sl={done:'✅ Выполнено',now:'⏳ Сейчас',next:'➡️ Далее',soon:'🕐 Предстоит'}[colorClass]||colorClass;
  if(ms) sl+=' <span style="font-size:10px;opacity:.7">(вручную)</span>';

  document.getElementById('calDetailBody').innerHTML=
    detailRow('План',ev.planName)+
    detailRow('Этап',shortStage(ev.stageName))+
    detailRowHTML('Статус',sl)+
    detailRow('Начало',fmtDTtz(ev.start))+
    detailRow('Окончание',fmtDTtz(ev.end))+
    detailRow('Длительность',ds)+
    detailRow('Исполнитель',ev.resp||'—')+
    (ev.comment?detailRow('Комментарий',ev.comment):'');

  var btns=document.getElementById('calDetailStatusBtns'); btns.innerHTML='';
  if(ms!=='done'){
    var bd=document.createElement('button'); bd.className='btn btn-sm';
    bd.style.cssText='background:var(--green-bg);color:var(--green);border:1px solid color-mix(in oklab,var(--green) 35%,transparent);';
    bd.innerHTML='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Выполнено';
    bd.onclick=function(){setCalTaskManualStatus(ev,'done');}; btns.appendChild(bd);
  }
  if(ms){
    var br=document.createElement('button'); br.className='btn btn-sm btn-ghost';
    br.style.cssText='color:var(--text-muted);font-size:11px;'; br.innerHTML='↺ Сбросить статус';
    br.onclick=function(){setCalTaskManualStatus(ev,null);}; btns.appendChild(br);
  }

  var r=blockEl.getBoundingClientRect(),pW=340,pH=320;
  var left=r.right+10,top=r.top;
  if(left+pW>window.innerWidth-10)left=r.left-pW-10;
  if(top+pH>window.innerHeight-10)top=window.innerHeight-pH-10;
  popup.style.cssText='left:'+Math.max(8,left)+'px;top:'+Math.max(8,top)+'px;display:flex;';
  popup.classList.add('open');
}

function setCalTaskManualStatus(ev, status) {
  var p=plans.find(function(pl){return pl.id===ev.planId;}); if(!p) return;
  var task=p.stages[ev.si]&&p.stages[ev.si].tasks[ev.ti]; if(!task) return;
  mutate(function(){ if(status===null)delete task.manualStatus;else task.manualStatus=status; });
  buildCalEvents(); renderCalendar(); tickCurrentTask(); closeCalDetail();
  toast(status==='done'?'Задача отмечена выполненной':'Статус сброшен', status==='done'?'✅':'↺');
}

function closeCalDetail() {
  var popup=document.getElementById('calDetail');
  popup.classList.remove('open'); popup.style.display='none'; _calSelected=null;
}

function calGotoTask() {
  if(!_calSelected)return; var sel=_calSelected;
  if(sel.planId!==activePlanId)switchPlan(sel.planId);
  closeCalDetail(); closeModal('calendarModal');
  setTimeout(function(){
    var row=document.querySelector('[data-si="'+sel.si+'"][data-ti="'+sel.ti+'"]');
    if(row){
      row.scrollIntoView({behavior:'smooth',block:'center'});
      row.style.outline='2.5px solid var(--accent)';row.style.boxShadow='0 0 0 5px var(--accent-ring)';
      row.style.borderRadius='6px';row.style.transition='outline .1s,box-shadow .1s';
      setTimeout(function(){row.style.outline='';row.style.boxShadow='';},2200);
    }else toast('Задача не найдена','⚠️');
  },200);
}

// ── Inline plan rename from calendar ──
function startCalPlanRename(tagEl, planId) {
  var p=plans.find(function(pl){return pl.id===planId;}); if(!p) return;
  var cur=p.project||'';
  var inp=document.createElement('input');
  inp.value=cur;
  inp.style.cssText='font-size:11px;font-weight:600;border:none;outline:none;background:var(--surface);border-radius:4px;padding:1px 5px;width:'+Math.max(80,cur.length*7+20)+'px;color:var(--accent);box-shadow:0 0 0 2px var(--accent-ring);font-family:var(--font);';
  tagEl.replaceWith(inp); inp.focus(); inp.select();
  function commit(){
    var nv=inp.value.trim()||cur; p.project=nv;
    pushUndo();saveToStorage();buildCalEvents();renderCalendar();renderTabs();
    toast('План переименован: '+nv,'✏️');
  }
  inp.onblur=commit;
  inp.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();inp.blur();}if(e.key==='Escape'){inp.value=cur;inp.blur();}e.stopPropagation();};
  inp.onclick=function(e){e.stopPropagation();};
}

document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeCalDetail(); }, true);
document.addEventListener('click', function(e){
  var popup=document.getElementById('calDetail');
  if(popup&&popup.classList.contains('open')&&!popup.contains(e.target)) closeCalDetail();
});
