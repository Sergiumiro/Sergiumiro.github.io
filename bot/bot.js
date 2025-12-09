// bot/bot.js
const { Bot } = require('grammy');

if (!process.env.BOT_TOKEN) {
    console.error('Установите BOT_TOKEN в переменных окружения');
    process.exit(1);
}

const bot = new Bot(process.env.BOT_TOKEN);

// Вставьте сюда публичный HTTPS-URL вашей GitHub Pages (пример ниже)
const WEBAPP_URL = 'https://<username>.github.io/<repo>/';

bot.command('start', async ctx => {
    await ctx.reply('Привет! Открой расписание фестиваля:', {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Открыть расписание', web_app: { url: WEBAPP_URL } }
                ]
            ]
        }
    });
});

bot.on('message', ctx => {
    // простой эхо для безопасности, не обязателен
    if (ctx.message.text && ctx.message.text.startsWith('/')) return;
    ctx.reply('Нажмите кнопку «Открыть расписание»');
});

bot.start();
console.log('Bot started');
