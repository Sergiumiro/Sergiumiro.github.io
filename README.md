# Sergiumiro.github.io
<!DOCTYPE html><html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Telegram WebApp Slots</title>
  <style>
    body { font-family: sans-serif; text-align: center; margin: 0; background: #f3f4f6; }
    header { display: flex; justify-content: flex-end; padding: 10px; }
    #settingsBtn { cursor: pointer; font-size: 20px; }
    .slot-container { display: flex; justify-content: center; gap: 20px; margin: 40px 0; }
    .slot { width: 120px; height: 160px; overflow: hidden; border: 2px solid #ccc; border-radius: 10px; background: #fff; }
    .slot-list { transition: transform 1s ease-out; }
    .slot-item { height: 40px; line-height: 40px; border-bottom: 1px solid #eee; }
    button { padding: 10px 20px; font-size: 16px; margin-top: 20px; cursor: pointer; border-radius: 8px; }
    #result { margin-top: 30px; font-size: 22px; font-weight: bold; }
    /* Модалка */
    #settingsModal { display: none; position: fixed; top: 0; left: 0; right:0; bottom:0; background: rgba(0,0,0,0.6); justify-content: center; align-items: center; }
    .modal-content { background:#fff; padding:20px; border-radius:10px; width:300px; }
    textarea { width:100%; height:100px; margin-top:10px; }
  </style>
</head>
<body>
  <header>
    <div id="settingsBtn">⚙️</div>
  </header>  <div class="slot-container">
    <div class="slot"><div class="slot-list" id="slot1"></div></div>
    <div class="slot"><div class="slot-list" id="slot2"></div></div>
  </div><button id="spinBtn">🎰 Крутить</button>

  <div id="result"></div>  <!-- Модалка -->  <div id="settingsModal">
    <div class="modal-content">
      <h3>Редактировать список</h3>
      <small>Каждый вариант с новой строки</small>
      <textarea id="listInput"></textarea>
      <button id="saveBtn">Сохранить</button>
    </div>
  </div><script>
  // Загружаем список из localStorage или используем стандартный
  let items = JSON.parse(localStorage.getItem("slotItems")) || [
    "🍎 Яблоко", "🍌 Банан", "🍇 Виноград", "🍊 Апельсин", "🍉 Арбуз"
  ];

  const slot1 = document.getElementById("slot1");
  const slot2 = document.getElementById("slot2");
  const result = document.getElementById("result");

  function renderSlots(){
    slot1.innerHTML = items.map(i => `<div class='slot-item'>${i}</div>`).join("");
    slot2.innerHTML = items.map(i => `<div class='slot-item'>${i}</div>`).join("");
  }
  renderSlots();

  document.getElementById("spinBtn").onclick = () => {
    const choice1 = Math.floor(Math.random() * items.length);
    const choice2 = Math.floor(Math.random() * items.length);

    slot1.style.transform = `translateY(-${choice1 * 40}px)`;
    slot2.style.transform = `translateY(-${choice2 * 40}px)`;

    setTimeout(() => {
      result.textContent = items[choice1] + " + " + items[choice2];
    }, 1000);
  };

  // Настройки
  const modal = document.getElementById("settingsModal");
  const listInput = document.getElementById("listInput");

  document.getElementById("settingsBtn").onclick = () => {
    listInput.value = items.join("\n");
    modal.style.display = "flex";
  };

  document.getElementById("saveBtn").onclick = () => {
    items = listInput.value.split("\n").map(i => i.trim()).filter(Boolean);
    localStorage.setItem("slotItems", JSON.stringify(items));
    renderSlots();
    modal.style.display = "none";
  };

  modal.onclick = (e) => { if(e.target === modal) modal.style.display = "none"; };
</script></body>
</html>
