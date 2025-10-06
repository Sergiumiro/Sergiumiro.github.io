let list1 = ["Вариант 1", "Вариант 2", "Вариант 3"];
let list2 = ["Ответ A", "Ответ B", "Ответ C"];

// Загрузка из localStorage
function loadFromStorage() {
  const saved1 = localStorage.getItem("list1");
  const saved2 = localStorage.getItem("list2");

  if (saved1) list1 = JSON.parse(saved1);
  if (saved2) list2 = JSON.parse(saved2);
}

function saveToStorage() {
  localStorage.setItem("list1", JSON.stringify(list1));
  localStorage.setItem("list2", JSON.stringify(list2));
}

function renderWheel(wheelElement, list) {
  wheelElement.innerHTML = '';
  list.forEach(item => {
    const div = document.createElement("div");
    div.textContent = item;
    wheelElement.appendChild(div);
  });
}

// Физика вращения
function setupWheel(wheelContainer, list, listIndex) {
  const wheel = wheelContainer.querySelector('.wheel');
  let startY, startTop, currentTop = 0, velocity = 0, isDragging = false;
  let lastY, lastTime;

  wheelContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    startY = e.clientY;
    startTop = currentTop;
    lastY = e.clientY;
    lastTime = Date.now();
    wheelContainer.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const dy = e.clientY - startY;
    currentTop = startTop + dy;
    wheel.style.transform = `translateY(${currentTop}px)`;

    // Вычисляем скорость
    const now = Date.now();
    const dt = now - lastTime;
    if (dt > 0) {
      velocity = (e.clientY - lastY) / dt;
    }
    lastY = e.clientY;
    lastTime = now;
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    wheelContainer.style.cursor = 'grab';
    spin(wheel, list, listIndex);
  });

  // Touch события
  wheelContainer.addEventListener('touchstart', (e) => {
    isDragging = true;
    startY = e.touches[0].clientY;
    startTop = currentTop;
    lastY = e.touches[0].clientY;
    lastTime = Date.now();
    e.preventDefault();
  });

  wheelContainer.addEventListener('touchmove', (e) => {
    if (!isDragging) return;

    const dy = e.touches[0].clientY - startY;
    currentTop = startTop + dy;
    wheel.style.transform = `translateY(${currentTop}px)`;

    const now = Date.now();
    const dt = now - lastTime;
    if (dt > 0) {
      velocity = (e.touches[0].clientY - lastY) / dt;
    }
    lastY = e.touches[0].clientY;
    lastTime = now;
  });

  wheelContainer.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    spin(wheel, list, listIndex);
  });
}

function spin(wheel, list, listIndex) {
  let currentVelocity = velocity;
  let position = currentTop;

  function animate() {
    if (Math.abs(currentVelocity) > 0.1) {
      position += currentVelocity;
      currentVelocity *= 0.95; // замедление
      wheel.style.transform = `translateY(${position}px)`;
      requestAnimationFrame(animate);
    } else {
      // Выравнивание по элементу
      const itemHeight = 40;
      const index = Math.round(-position / itemHeight) % list.length;
      const finalPos = -index * itemHeight;
      wheel.style.transform = `translateY(${finalPos}px)`;
      currentTop = finalPos;

      // Сохраняем выбранный элемент
      if (listIndex === 1) {
        console.log("Выбрано из списка 1:", list[index]);
      } else {
        console.log("Выбрано из списка 2:", list[index]);
      }
    }
  }
  animate();
}

// Инициализация
function init() {
  loadFromStorage();
  renderWheel(document.getElementById("wheel1"), list1);
  renderWheel(document.getElementById("wheel2"), list2);

  setupWheel(document.getElementById("wheel1-container"), list1, 1);
  setupWheel(document.getElementById("wheel2-container"), list2, 2);

  document.getElementById("settings-btn").addEventListener("click", () => {
    document.getElementById("settings-modal").classList.remove("hidden");
    document.getElementById("list1-input").value = list1.join('\n');
    document.getElementById("list2-input").value = list2.join('\n');
  });

  document.getElementById("save-settings").addEventListener("click", () => {
    list1 = document.getElementById("list1-input").value.split('\n').filter(Boolean);
    list2 = document.getElementById("list2-input").value.split('\n').filter(Boolean);
    saveToStorage();
    renderWheel(document.getElementById("wheel1"), list1);
    renderWheel(document.getElementById("wheel2"), list2);
    document.getElementById("settings-modal").classList.add("hidden");
  });

  document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("settings-modal").classList.add("hidden");
  });
}

init();
