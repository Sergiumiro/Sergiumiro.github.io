let currentDay = 1;
let events = [];
let selectedId = null;

const listEl = document.getElementById("list");
const mapEl = document.getElementById("map");
const pointsLayer = document.getElementById("points-layer");

/* ---------- ЗАГРУЗКА ДНЕЙ ---------- */
const filesByDay = {
    1: "event1.json",
    2: "event2.json",
    3: "event3.json"
};

async function loadDay(day){
    const url = filesByDay[day];
    const data = await fetch(url).then(r => r.json());
    events = data;
    renderList();
    renderPoints();
}

document.querySelectorAll("#day-switcher button").forEach(btn=>{
    btn.addEventListener("click", ()=>{
        document.querySelectorAll("#day-switcher button").forEach(b=>b.classList.remove("active"));
        btn.classList.add("active");
        currentDay = Number(btn.dataset.day);
        loadDay(currentDay);
    });
});

/* ---------- СПИСОК ---------- */
function renderList(){
    listEl.innerHTML = "";
    const template = document.getElementById("event-card-template");

    events.sort((a,b)=>new Date(a.startTime)-new Date(b.startTime));

    events.forEach(ev=>{
        const node = template.content.cloneNode(true);
        const card = node.querySelector(".event-card");
        const time = node.querySelector(".time");
        const title = node.querySelector(".title");
        const tags = node.querySelector(".tags");

        time.textContent =
            new Date(ev.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        title.textContent = ev.title;
        tags.textContent = ev.tags?.join(" · ") || "";

        card.dataset.id = ev.id;
        card.addEventListener("click", ()=>selectEvent(ev.id));

        listEl.appendChild(node);
    });
}

/* ---------- ТОЧКИ НА КАРТЕ ---------- */
function renderPoints(){
    pointsLayer.innerHTML = "";
    events.forEach(ev=>{
        const mp = ev.mapPoints?.[0];
        if(!mp) return;

        const p = document.createElement("div");
        p.className = "map-point";
        p.dataset.id = ev.id;

        p.style.left = (mp.x*100)+"%";
        p.style.top = (mp.y*100)+"%";

        p.addEventListener("click", (e)=>{
            e.stopPropagation();
            selectEvent(ev.id);
        });

        pointsLayer.appendChild(p);
    });
}

/* ---------- ВЫБОР СОБЫТИЯ ---------- */
function selectEvent(id){
    selectedId = id;

    document.querySelectorAll(".event-card")
        .forEach(c=>c.classList.toggle("selected", c.dataset.id===id));

    document.querySelectorAll(".map-point")
        .forEach(p=>p.classList.toggle("large", p.dataset.id===id));
}

/* ---------- MАСШТАБИРОВАНИЕ КАРТЫ ---------- */
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
    if(!dragging) return;
    originX += (e.clientX - lastX);
    originY += (e.clientY - lastY);
    lastX = e.clientX;
    lastY = e.clientY;
    updateTransform();
});

/* колесо мыши — зум */
mapEl.addEventListener("wheel", e=>{
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    scale *= delta;
    scale = Math.max(0.5, Math.min(5, scale));
    updateTransform();
});

/* Touch pinch */
let touchStartDist = 0;
mapEl.addEventListener("touchmove", e=>{
    if(e.touches.length===2){
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx,dy);
        if(!touchStartDist) touchStartDist = dist;

        const delta = dist / touchStartDist;
        scale *= delta;
        scale = Math.max(0.5, Math.min(5, scale));
        touchStartDist = dist;
        updateTransform();
    }
});
mapEl.addEventListener("touchend", ()=> touchStartDist = 0);

function updateTransform(){
    mapEl.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
    pointsLayer.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
}

/* ---------- INIT ---------- */
loadDay(1);
