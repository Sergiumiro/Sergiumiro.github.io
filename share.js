// share.js
export function setupShare(canvasId, shareBtnId) {
  const canvas = document.getElementById(canvasId);
  const shareBtn = document.getElementById(shareBtnId);
  const ctx = canvas.getContext('2d');

  // Функция генерации картинки с результатом
  function drawResult(place, action) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // фон
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#111');
    gradient.addColorStop(1, '#222');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // текст заголовок
    ctx.fillStyle = '#ffd';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    ctx.fillText('Ваше свидание готово!', canvas.width / 2, 60);

    // текст результат
    ctx.font = '28px sans-serif';
    ctx.fillText(`Место: ${place}`, canvas.width / 2, 150);
    ctx.fillText(`Действие: ${action}`, canvas.width / 2, 200);
  }

  // Обновление картинки при выборе результата
  function showResult(place, action) {
    drawResult(place, action);
  }

  // Кнопка "Поделиться в Telegram"
  shareBtn.onclick = () => {
    canvas.toBlob(blob => {
      const fileUrl = URL.createObjectURL(blob);
      const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(fileUrl)}&text=Смотри моё свидание!`;
      window.open(tgUrl, '_blank');
    });
  };

  return { showResult };
}
