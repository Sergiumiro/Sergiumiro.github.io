/* ---------------- ГЛОБАЛЬНЫЕ ---------------- */
let currentDay = 1;
let events = [];
let filteredEvents = [];
let selectedId = null;

let hallFilter = "all";
let searchQuery = "";
let selectedTags = new Set();
let hidePast = false;

const listEl = document.getElementById("list");
const hallFilterEl = document.getElementById("hall-filter");
const searchInput = document.getElementById("search-input");
const tagsContainer = document.getElementById("tags-filter");

const mapEl = document.getElementById("map");
const pointsLayer = document.getElementById("points-layer");

const filesByDay = {
    1: "event1.json",
    2: "event2.json",
    3: "event3.json"
};


/* ---------------- ЗАГРУЗКА ДНЯ ---------------- */
async function loadDay(day){
    const data = await fetch(filesByDay[day]).then(r => r.json());
    events = data.slice().sort((a,b)=> new Date(a.startTime)-new Date(b.startTime));

    buildTagFilter();
    applyFilters();
}


/* ---------------- ПОИСК ---------------- */
searchInput.addEventListener("input", ()=>{
    searchQuery = searchInput.value.toLowerCase();
    applyFilters();
});


/* ---------------- ФИЛЬТР ПО ЗАЛАМ ---------------- */
hallFilterEl.querySelectorAll("button").forEach(btn=>{
    btn.addEventListener("click", ()=>{
        hallFilterEl.querySelectorAll("button").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        hallFilter = btn.dataset.hall;
        applyFilters();
    });
});


/* ---------------- ФИЛЬТР ПО ТЕГАМ ---------------- */
function buildTagFilter(){
    selectedTags.clear();
    tagsContainer.innerHTML = "";

    const tagSet = new Set();
    events.forEach(ev => (ev.tags || []).forEach(tagSet.add, tagSet));

    [...tagSet].sort().forEach(tag=>{
        const b = document.createElement("button");
        b.textContent = tag;
        b.dataset.tag = tag;

        b.addEventListener("click", ()=>{
            if (selectedTags.has(tag)) {
                selectedTags.delete(tag);
                b.classList.remove("active");
            } else {
                selectedTags.add(tag);
                b.classList.add("active");
            }
            applyFilters();
        });

        tagsContainer.appendChild(b);
    });
}


/* ---------------- СКРЫТИЕ ПРОШЕДШИХ ---------------- */
document.getElementById("hide-past").addEventListener("change", (e)=>{
    hidePast = e.target.checked;
    applyFilters();
});


/* ---------------- ОБЪЕДИНЕННЫЙ ФИЛЬТР ---------------- */
function applyFilters(){
    const now = new Date();

    filteredEvents = events.filter(ev=>{
        const start = new Date(ev.startTime);

        if (hidePast && start < now) return false;

        if (hallFilter !== "all" && String(ev.hall) !== hallFilter) return false;

        if (searchQuery && !ev.title.toLowerCase().includes(searchQuery)) return false;

        if (selectedTags.size > 0){
            if (!ev.tags || !ev.tags.some(t => selectedTags.has(t))) return false;
        }
        return true;
    });

    renderList();
    renderPoints();
    highlightTimeline();
    scrollToNext();
}


/* ---------------- СПИСОК ---------------- */
function renderList(){
    listEl.innerHTML = "";
    const tpl = document.getElementById("event-card-template");

    filteredEvents.forEach(ev=>{
        const node = tpl.content.cloneNode(true);
        const card = node.querySelector(".event-card");

        card.dataset.id = ev.id;
        card.querySelector(".title").textContent = ev.title;
        card.querySelector(".time").textContent =
            new Date(ev.startTime).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
        card.querySelector(".tags").textContent = ev.tags?.join(" · ") || "";

        card.addEventListener("click", ()=>selectEvent(ev.id));
        listEl.appendChild(node);
    });
}


/* ---------------- ТОЧКИ ---------------- */
function renderPoints(){
    pointsLayer.innerHTML = "";

    filteredEvents.forEach(ev=>{
        const mp = ev.mapPoints?.[0];
        if (!mp) return;

        const p = document.createElement("div");
        p.className = "map-point";
        p.dataset.id = ev.id;
        p.style.left = (mp.x * 100) + "%";
        p.style.top  = (mp.y * 100) + "%";

        p.addEventListener("click", e=>{
            e.stopPropagation();
            selectEvent(ev.id);
        });

        pointsLayer.appendChild(p);
    });
}


/* ---------------- ВЫБОР СОБЫТИЯ ---------------- */
function selectEvent(id){
    selectedId = id;

    // список
    document.querySelectorAll(".event-card")
        .forEach(c=>c.classList.toggle("selected", c.dataset.id === id));

    // точки
    document.querySelectorAll(".map-point")
        .forEach(p=>p.classList.toggle("large", p.dataset.id === id));
}


/* ---------------- ТЕКУЩЕЕ / СЛЕДУЮЩЕЕ ---------------- */
function highlightTimeline(){
    const now = new Date();

    document.querySelectorAll(".event-card").forEach(c=>{
        c.classList.remove("now","next");
    });

    let current = null;
    let next = null;

    for (let ev of filteredEvents){
        const start = new Date(ev.startTime);
        const end = new Date(ev.endTime);

        if (start <= now && now <= end){
            current = ev;
            break;
        }
        if (start > now && !next){
            next = ev;
        }
    }

    if (current){
        const c = document.querySelector(`.event-card[data-id="${current.id}"]`);
        if (c) c.classList.add("now");
    }

    if (next){
        const c = document.querySelector(`.event-card[data-id="${next.id}"]`);
        if (c) c.classList.add("next");
    }

    return {current,next};
}


/* ---------------- АВТОПРОКРУТКА ---------------- */
function scrollToNext(){
    const {current, next} = highlightTimeline();
    const target = current || next;
    if (!target) return;

    const card = document.querySelector(`.event-card[data-id="${target.id}"]`);
    if (!card) return;

    const listRect = listEl.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();

    const offset = cardRect.top - listRect.top - listRect.height/2 + cardRect.height/2;

    listEl.scrollBy({ top: offset, behavior: "smooth" });
}


/* ---------------- ЗУМ / ПАНОРАМА ---------------- */
let scale = 1;
let originX = 0, originY = 0;
let lastX = 0, lastY = 0;
let dragging = false;

mapEl.addEventListener("pointerdown", e=>{
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});
window.addEventListener("pointerup", ()=> dragging=false);

window.addEventListener("pointermove", e=>{
    if (!dragging) return;
    originX += (e.clientX - lastX);
    originY += (e.clientY - lastY);
    lastX = e.clientX;
    lastY = e.clientY;
    updateTransform();
});

mapEl.addEventListener("wheel", e=>{
    e.preventDefault();
    const delta = (e.deltaY < 0) ? 1.1 : 0.9;
    scale *= delta;
    scale = Math.max(0.5, Math.min(5, scale));
    updateTransform();
});

function updateTransform(){
    mapEl.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
    pointsLayer.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
}


/* ---------------- INIT ---------------- */
document.querySelectorAll("#day-switcher button").forEach(b=>{
    b.addEventListener("click", ()=>{
        document.querySelectorAll("#day-switcher button").forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        currentDay = Number(b.dataset.day);
        loadDay(currentDay);
    });
});

loadDay(1);
