// ============================================================
// DATA.JS — constants, state, storage, undo
// ============================================================

var STAGE_TITLES = [
  'Этап 1. Подготовительные работы',
  'Этап 2. Основные работы',
  'Этап 3. Заключительные мероприятия и мониторинг работоспособности'
];

var COMMENT_SNIPPETS = [
  'Возможна временная недоступность до 5 минут',
  'Возможна временная недоступность до 15 минут',
  'Сервис будет недоступен на время проведения работ',
  'Без влияния на доступность сервиса',
  'Возможно замедление работы сервиса',
  'Требуется подтверждение успешности от команды'
];

var TASK_TEMPLATES = {
  0: [
    { group: 'Уведомления', items: [
      { name: 'Рассылка уведомления о начале работ', dur: 5 }
    ]},
    { group: 'Подготовка среды', items: [
      { name: 'Подготовка конфигурации',  dur: 15  },
      { name: 'Блок текста',          dur: 5  },
      { name: 'Блок текста',   dur: 10 },
      { name: 'Блок текста',      dur: 5  }
    ]}
  ],
  1: [
    { group: 'Деплой', items: [
      { name: 'Установка на кластер ',                dur: 60  },
      { name: 'Проверка работоспособности',           dur: 60  },      
      { name: 'Остановка сервиса',                    dur: 5  },
      { name: 'Применение обновления / патча',        dur: 20 },
      { name: 'Запуск сервиса',                       dur: 5  },
      { name: 'Применение миграции БД',               dur: 15 },
      { name: 'Перезапуск зависимых сервисов',        dur: 10 }
    ]},
    { group: 'Конфигурация', items: [
      { name: 'Применение новой конфигурации',        dur: 10 },
      { name: 'Обновление переменных окружения',      dur: 5  },
      { name: 'Настройка сетевых правил / firewall',  dur: 10 },
      { name: 'Обновление SSL-сертификатов',          dur: 15 }
    ]}
  ],
  2: [
    { group: 'Проверка после работ', items: [
      { name: 'Проверка логов на ошибки',                   dur: 10 },
      { name: 'Функциональная проверка сервиса',            dur: 15 },
      { name: 'Проверка интеграций со смежными системами',  dur: 10 },
      { name: 'Нагрузочный тест',                           dur: 20 },
      { name: 'Мониторинг метрик (15 мин)',                  dur: 15 }
    ]},
    { group: 'Снятие ограничений', items: [
      { name: 'Снятие режима обслуживания',         dur: 5 },
      { name: 'Разблокировка входящих запросов',    dur: 5 },
      { name: 'Запуск планировщиков и джобов',      dur: 5 }
    ]},
    { group: 'Завершение и документирование', items: [
      { name: 'Уведомление об успешном завершении работ', dur: 5  },
      { name: 'Закрытие РоВ',                             dur: 5  },
      { name: 'Обновление документации / Wiki',           dur: 15 },
      { name: 'Архивирование логов работ',                dur: 10 },
      { name: 'Ретроспектива / фиксация замечаний',       dur: 10 }
    ]}
  ]
};

var PLAN_PALETTE = [
  {h:266, label:'Синий'},    {h:220, label:'Голубой'},   {h:158, label:'Зелёный'},
  {h:125, label:'Лайм'},     {h:90,  label:'Оливковый'}, {h:62,  label:'Жёлтый'},
  {h:40,  label:'Янтарный'}, {h:25,  label:'Оранжевый'}, {h:10,  label:'Красный'},
  {h:330, label:'Розовый'},  {h:295, label:'Фиолетовый'},{h:200, label:'Циановый'}
];

var STORAGE_KEY = 'work_plans_v2';
var UNDO_LIMIT  = 50;
var MSK_OFFSET_MIN = 180; // UTC+3

// ── State ──
var plans        = [];
var activePlanId = null;
var notifyEvent  = 'start';
var notifyChannel = 'chat';
var _saveTimer   = null;
var _nowTimer    = null;
var _undoRegistry = {};

function plan() {
  return plans.find(function(p){ return p.id === activePlanId; }) || null;
}

// ── Plan helpers ──
function planHueFor(p) {
  if (p.color !== undefined && p.color !== null) return p.color;
  var idx = plans.indexOf(p);
  return PLAN_PALETTE[Math.max(0,idx) % PLAN_PALETTE.length].h;
}
function planColorStr(hue, lightness, chroma) {
  return 'oklch(' + (lightness||0.58) + ' ' + (chroma||0.16) + ' ' + hue + ')';
}

function normalizePlan(meta) {
  var incoming = meta.stages || [];
  var stages = STAGE_TITLES.map(function(title, i) {
    return { title: title, tasks: (incoming[i] && incoming[i].tasks) ? incoming[i].tasks : [] };
  });
  return {
    id:             meta.id || ('plan_' + Date.now() + '_' + Math.random().toString(36).slice(2,6)),
    project:        meta.project        || '',
    ci_stand:       meta.ci_stand       || '',
    ci_project:     meta.ci_project     || '',
    start:          meta.start          || '',
    responsible:    meta.responsible    || '',
    color:          meta.color !== undefined ? meta.color : null,
    stages:         stages,
    rollback:       meta.rollback       || [],
    contacts:       meta.contacts       || [],
    communications: meta.communications || []
  };
}

function nextUnusedColor() {
  var used = plans.map(function(p){ return p.color; }).filter(function(c){ return c !== null && c !== undefined; });
  return (PLAN_PALETTE.find(function(c){ return used.indexOf(c.h) < 0; }) || PLAN_PALETTE[plans.length % PLAN_PALETTE.length]).h;
}

// ── Undo / Redo ──
function getUndoState(id) {
  if (!_undoRegistry[id]) _undoRegistry[id] = { stack: [], pos: -1 };
  return _undoRegistry[id];
}

function pushUndo() {
  var p = plan(); if (!p) return;
  var us = getUndoState(p.id);
  us.stack = us.stack.slice(0, us.pos + 1);
  us.stack.push(JSON.stringify(p));
  if (us.stack.length > UNDO_LIMIT) us.stack.shift();
  us.pos = us.stack.length - 1;
  updateUndoUI();
}

function pushUndoFor(id) {
  var p = plans.find(function(pl){ return pl.id === id; });
  if (!p) return;
  var us = getUndoState(id);
  if (!us.stack.length) { us.stack.push(JSON.stringify(p)); us.pos = 0; }
}

function undo() {
  var p = plan(); if (!p) return;
  var us = getUndoState(p.id);
  if (us.pos <= 0) return;
  us.pos--;
  restoreSnapshot(us.stack[us.pos]);
  toast('Отменено', '↩');
}

function redo() {
  var p = plan(); if (!p) return;
  var us = getUndoState(p.id);
  if (us.pos >= us.stack.length - 1) return;
  us.pos++;
  restoreSnapshot(us.stack[us.pos]);
  toast('Повторено', '↪');
}

function restoreSnapshot(json) {
  var snap = JSON.parse(json);
  var idx = plans.findIndex(function(p){ return p.id === activePlanId; });
  if (idx < 0) return;
  plans[idx] = snap;
  renderAll(true);
  saveToStorage();
  updateUndoUI();
}

function updateUndoUI() {
  var p  = plan();
  var us = p ? getUndoState(p.id) : { stack:[], pos:-1 };
  document.getElementById('undoBtn').disabled = (us.pos <= 0);
  document.getElementById('redoBtn').disabled = (us.pos >= us.stack.length - 1);
}

// ── Storage ──
function saveToStorage() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(function() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ plans: plans, active: activePlanId }));
      localStorage.setItem(STORAGE_KEY + '_ts', Date.now());
      updateCacheBadge();
    } catch(e) {}
  }, 400);
}

function loadFromStorage() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    var data = JSON.parse(raw);
    if (!data || !Array.isArray(data.plans) || !data.plans.length) return false;
    plans = data.plans.map(normalizePlan);
    activePlanId = data.active || plans[0].id;
    if (!plans.find(function(p){ return p.id === activePlanId; })) activePlanId = plans[0].id;
    return true;
  } catch(e) { return false; }
}

function updateCacheBadge() {
  var ts = localStorage.getItem(STORAGE_KEY + '_ts');
  var el = document.getElementById('cacheBadge');
  if (!el) return;
  if (ts) {
    el.textContent = '💾 ' + new Date(+ts).toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'});
    el.style.display = '';
  } else { el.style.display = 'none'; }
}

// ── Mutation helper ──
function mutate(fn, skipUndo) {
  fn();
  if (!skipUndo) pushUndo();
  saveToStorage();
}

// ── Utils ──
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtDT(val){ if(!val) return '—'; try{ return new Date(val).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); }catch(e){return val;} }
function fmtTime(val){ if(!val) return ''; try{ return new Date(val).toLocaleString('ru-RU',{hour:'2-digit',minute:'2-digit'}); }catch(e){return val;} }
function padDT(n){ return String(n).padStart(2,'0'); }
function toDatetimeLocal(d){ return d.getFullYear()+'-'+padDT(d.getMonth()+1)+'-'+padDT(d.getDate())+'T'+padDT(d.getHours())+':'+padDT(d.getMinutes()); }
function autoResize(el){ el.style.height='auto'; el.style.height=el.scrollHeight+'px'; }
function validateCI(input){ var v=input.value.trim(); input.classList.toggle('field-err',v!==''&&!/^CI\d{8}$/.test(v)); }
function validateTaskName(ta){ var ok=ta.value.trim().length>0; ta.classList.toggle('field-err',!ok); var msg=ta.parentElement.querySelector('.field-err-msg'); if(msg) msg.style.display=ok?'none':''; }
function toast(msg, icon){ icon=icon||'ℹ️'; var c=document.getElementById('toastContainer'); var t=document.createElement('div'); t.className='toast'; t.innerHTML='<span>'+icon+'</span> '+msg; c.appendChild(t); setTimeout(function(){t.remove();},2800); }

// ── Timezone ──
function getUserTzOffsetMin() {
  var tzVal = localStorage.getItem('user_tz') || 'auto';
  if (tzVal === 'auto') return new Date().getTimezoneOffset() * -1;
  return parseInt(tzVal);
}
function getNowMs() { return Date.now(); }
function parseMskMs(val) {
  if (!val) return NaN;
  var d = new Date(val);
  if (isNaN(d.getTime())) return NaN;
  var browserOffsetMs = d.getTimezoneOffset() * 60000;
  var naiveMs = d.getTime() + browserOffsetMs;
  var userOffMin = getUserTzOffsetMin();
  return naiveMs - userOffMin * 60000;
}
function mskToUserMs(utcMs) {
  var tzVal = localStorage.getItem('user_tz') || 'auto';
  if (tzVal === 'auto') return utcMs;
  var userOffMin = parseInt(tzVal);
  var browserOffMin = new Date().getTimezoneOffset() * -1;
  return utcMs + (userOffMin - browserOffMin) * 60000;
}
function fmtDTtz(val) {
  if (!val) return '—';
  try {
    var utcMs = parseMskMs(val);
    if (isNaN(utcMs)) return val;
    var userMs = utcMs + getUserTzOffsetMin() * 60000;
    return new Date(userMs).toLocaleString('ru-RU', {timeZone:'UTC', day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  } catch(e) { return val; }
}
function fmtTimeTz(val) {
  if (!val) return '';
  try {
    var utcMs = (typeof val === 'number') ? val : parseMskMs(val);
    if (isNaN(utcMs)) return '';
    var userMs = utcMs + getUserTzOffsetMin() * 60000;
    return new Date(userMs).toLocaleString('ru-RU', {timeZone:'UTC', hour:'2-digit',minute:'2-digit'});
  } catch(e) { return val; }
}
