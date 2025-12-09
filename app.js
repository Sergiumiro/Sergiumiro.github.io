// app.js
const EVENTS_URL = 'events.json';
let events = [];
let selectedId = null;
let timerInterval = null;

const listEl = document.getElementById('list');
const pointsLayer = document.getElementById('points-layer');
const mapImg = document.getElementById('map');

function loadEvents() {
    return fetch(EVENTS_URL).then(r => r.json()).then(data => {
        events = data.slice().sort((a,b) => new Date(a.startTime) - new Date(b.startTime));
        renderList();
        renderPoints();
        updateHighlights();
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(updateHighlights, 60_000);
    });
}

function renderList() {
    listEl.innerHTML = '';
    const template = document.getElementById('event-card-template');

    events.forEach(ev => {
        const node = template.content.cloneNode(true);
        const article = node.querySelector('.event-card');
        const timeEl = node.querySelector('.time');
        const titleEl = node.querySelector('.title');
        const tagsEl = node.querySelector('.tags');

        const start = new Date(ev.startTime);
        const end = new Date(ev.endTime);
        timeEl.textContent = `${start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} — ${end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
        titleEl.textContent = ev.title;
        tagsEl.textContent = ev.tags ? ev.tags.join(' · ') : '';

        article.dataset.id = ev.id;
        article.addEventListener('click', () => onSelectEvent(ev.id));
        listEl.appendChild(node);
    });
}

function renderPoints() {
    pointsLayer.innerHTML = '';
    // Build one point per event (could be merged by hall but we follow specification)
    events.forEach(ev => {
        const container = document.createElement('div');
        container.className = 'map-point';
        container.dataset.id = ev.id;

        // Use first mapPoint if exists
        const mp = (ev.mapPoints && ev.mapPoints[0]) || {x:0.5,y:0.5,label:ev.roomName || ''};
        container.style.left = (mp.x * 100) + '%';
        container.style.top = (mp.y * 100) + '%';

        // tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = mp.label || ev.roomName || `${ev.hall ? 'Зал ' + ev.hall : ''}`;
        container.appendChild(tooltip);

        // small label inside
        container.textContent = '';
        const dot = document.createElement('span');
        dot.textContent = '•';
        container.appendChild(dot);

        // click — simulate selecting from list
        container.addEventListener('click', (e) => {
            e.stopPropagation();
            onSelectEvent(ev.id);
        });

        pointsLayer.appendChild(container);
    });
}

function updateHighlights() {
    const now = new Date();
    // highlight imminent events (0 < start - now <= 30min)
    const cards = document.querySelectorAll('.event-card');
    cards.forEach(c => c.classList.remove('imminent','selected'));
    const points = document.querySelectorAll('.map-point');
    points.forEach(p => p.classList.remove('large'));

    events.forEach(ev => {
        const start = new Date(ev.startTime);
        const diffMin = (start - now) / 60000;
        if (diffMin > 0 && diffMin <= 30) {
            const card = document.querySelector(`.event-card[data-id="${ev.id}"]`);
            if (card) {
                card.classList.add('imminent');
                // add timer icon if not present
                if (!card.querySelector('.timer-emoji')) {
                    const timer = document.createElement('span');
                    timer.className = 'timer-emoji';
                    timer.textContent = ' ⏱';
                    card.querySelector('.time').appendChild(timer);
                }
            }
        } else {
            const card = document.querySelector(`.event-card[data-id="${ev.id}"]`);
            if (card) {
                // remove emoji if present
                const timer = card.querySelector('.timer-emoji');
                if (timer) timer.remove();
            }
        }
    });

    // keep selected visible
    if (selectedId) {
        const selectedCard = document.querySelector(`.event-card[data-id="${selectedId}"]`);
        if (selectedCard) selectedCard.classList.add('selected');
        const selectedPoints = document.querySelectorAll(`.map-point[data-id="${selectedId}"]`);
        selectedPoints.forEach(p => p.classList.add('large'));
        // try to bring point(s) into view — scroll wrapper to center point
        centerPointsOfEvent(selectedId);
    }
}

function onSelectEvent(id) {
    selectedId = id;
    // mark selected in list
    document.querySelectorAll('.event-card').forEach(el => el.classList.toggle('selected', el.dataset.id === id));
    // enlarge points for this event
    document.querySelectorAll('.map-point').forEach(el => el.classList.toggle('large', el.dataset.id === id));
    centerPointsOfEvent(id);
}

function centerPointsOfEvent(id) {
    const mapWrapper = document.getElementById('map-wrapper');
    const pts = Array.from(document.querySelectorAll(`.map-point[data-id="${id}"]`));
    if (!pts.length) return;
    // compute bounding box of points in layer coords
    const rect = mapWrapper.getBoundingClientRect();
    const xs = pts.map(p => parseFloat(p.style.left) / 100 * rect.width);
    const ys = pts.map(p => parseFloat(p.style.top) / 100 * rect.height);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);

    // scroll map-wrapper by transforming points-layer (we used overflow:hidden, so we can animate translation)
    // Simpler approach: no complex pan/zoom — if map is larger than container, scroll the parent container (if any).
    // For static image fit-to-width, we can create a quick visual emphasis by flashing border around points.
    pts.forEach(p => {
        p.animate([{boxShadow:'0 0 0 0 rgba(255,75,75,0.0)'},{boxShadow:'0 10px 30px 8px rgba(255,75,75,0.12)'}], {duration:600, easing:'ease-out'});
    });

    // If you implement pinch-zoom/scroll, you can set transform-origin and translate to center coordinates.
}

// initialize
window.addEventListener('load', () => {
    loadEvents().catch(err => {
        listEl.innerHTML = `<div style="padding:12px;color:#f88">Не удалось загрузить events.json — убедитесь, что файл доступен на GitHub Pages и путь верный.</div>`;
        console.error(err);
    });

    // update every 60s handled in loadEvents
});
