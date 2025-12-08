# Telegram Bot + Telegram Mini App Generator Prompt

## Промт для генерации решения

Сгенерируй код и структуру проекта для Telegram Bot + Telegram Mini App (WebApp):

### Общие требования

- Есть Telegram‑бот, который отправляет пользователю кнопку для открытия WebApp (mini app).
- WebApp одностраничный:
  - сверху список мероприятий в виде прокручиваемого списка;
  - снизу карта фестиваля как изображение (png/jpg), взятое из PDF‑карты Comic Con Игромир с залами №3, №4, №5 и торговыми стендами.
- Все статические файлы (html/css/js, картинка карты, json с программой мероприятий) размещаются на GitHub Pages; мини‑приложение грузится по HTTPS‑URL с GitHub Pages.

### Программа мероприятий

1. Возьми расписание с трёх афиш (зал 3 «Сцена Икс», зал 4 «Плюс сцена», зал 5 «Кинозал») из присланных изображений и преобразуй его в JSON‑структуру.
2. Ожидаемый формат JSON (можно доработать при необходимости):

```jsonc
[
  {
    "id": "hall3-1145-opening",
    "title": "ОТКРЫТИЕ СЦЕНЫ: РОЗЫГРЫШИ ПРИЗОВ ОТ ФЕСТИВАЛЯ",
    "hall": 3,
    "roomName": "Сцена Икс",
    "startTime": "2025-12-12T11:45:00+03:00",
    "endTime": "2025-12-12T12:00:00+03:00",
    "tags": ["открытие", "розыгрыш"],
    "mapPoints": [
      { "type": "hall", "label": "Зал №3", "x": 0.55, "y": 0.32 }
    ]
  }
]
```

3. Для всех событий с картинок:
   - корректно заполни `title`, время начала, зал (`hall` 3/4/5), человек/гостей (в `tags` или `description`).
   - `startTime` и `endTime` задай с датой 2025‑12‑12 и часовым поясом +03:00 (Москва).
   - `mapPoints` заполни по карте PDF: укажи хотя бы одну точку зала (например, центр «Зал №3», «Зал №4», «Зал №5») в нормализованных координатах `x` и `y` от 0 до 1 относительно ширины/высоты изображения карты.

### Карта

- Из PDF‑карты фестиваля Comic Con Игромир извлеки картинку, обрежь так, чтобы была видна схема этажей с залами 1–5 и торговыми стендами.
- Подключи эту картинку в WebApp как `<img id="map">`.
- Сверху карты рисуй интерактивные точки:
  - либо через absolutely‑positioned `<div class="map-point">`,
  - либо через `<canvas>` поверх изображения.
- Каждая точка берёт координаты `x`/`y` из `mapPoints` соответствующего события.

### Логика WebApp

1. При загрузке:
   - загрузи `events.json` с GitHub Pages.
   - Отрисуй список мероприятий, отсортированных по времени.
2. Подсветка ближайших событий:
   - Определи текущее время на устройстве пользователя.
   - Для каждого события, которое начинается в ближайшие 30 минут (0 < startTime - now ≤ 30 минут), подсвети карточку в списке красным фоном и добавь значок таймера.
   - Обновляй подсветку каждые 60 секунд.
3. Выбор из списка:
   - При клике по событию:
     - прокрути карту так, чтобы были видны все связанные `mapPoints` (если используется масштабирование/скролл);
     - отобрази/подсвети точки зала для выбранного события:
       - сделай точки крупнее,
       - залей красным цветом,
       - покажи подпись с названием зала/стенда при наведении.
   - В списке отметь выбранное событие (например, рамкой).
4. Адаптивность:
   - Верстка под мобильный экран (Telegram WebApp): список сверху (примерно 40% высоты), карта снизу (60%), вертикальный скролл только у списка.
   - Тёмная тема в стиле Comic Con.

### Интеграция с Telegram Bot API

- Напиши пример бота на Node.js (Telegraf или grammy):
  - команда `/start` отправляет пользователю кнопку «Открыть расписание»;
  - кнопка открывает WebApp по URL GitHub Pages через поле `web_app` в `reply_markup`.
- Не нужно полноценного бэкенда: WebApp работает только на статике и локальном времени клиента.

### Что нужно на выходе

- `events.json` с полной программой из всех трёх картинок.
- `index.html`, `style.css`, `app.js` для WebApp.
- `bot.js` с примером Telegram‑бота.
- Краткая инструкция по деплою на GitHub Pages и по настройке WebApp URL в BotFather.

## Current Project Structure

The current project already has some files implemented:

- `index.html` - Main HTML file with layout for events list and map
- `app.js` - Main application logic for loading events and handling UI
- `map.js` - Map functionality using Leaflet.js
- `share.js` - Sharing functionality for Telegram WebApp
- `events.json` - Current events data (needs to be updated according to requirements)
- `package.json` - Project configuration

## Key Requirements to Implement

1. Update the events.json to follow the required format with halls 3, 4, 5 specifically
2. Create a static image map instead of using Leaflet.js
3. Implement coordinate mapping from normalized coordinates (0-1) to screen coordinates
4. Create the Telegram bot implementation
5. Add the requested UI features like highlighting upcoming events within 30 minutes
6. Implement the map point visualization on top of the static image