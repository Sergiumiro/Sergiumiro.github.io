const { Telegraf } = require('telegraf');
require('dotenv').config();

// Initialize bot with token from environment variables
const bot = new Telegraf(process.env.BOT_TOKEN);

// Start command handler
bot.command('start', (ctx) => {
    ctx.reply('Добро пожаловать на фестиваль Comic Con Игромир! 🎪', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Открыть расписание',
                        web_app: { 
                            url: process.env.WEBAPP_URL || 'https://your-username.github.io/your-repo/' 
                        }
                    }
                ]
            ]
        }
    });
});

// Help command handler
bot.command('help', (ctx) => {
    ctx.reply('Этот бот поможет вам ориентироваться на фестивале Comic Con Игромир.\n\n' +
              'Доступные команды:\n' +
              '/start - Начать работу с ботом\n' +
              '/schedule - Открыть расписание мероприятий\n' +
              '/map - Открыть интерактивную карту фестиваля\n' +
              '/help - Показать это сообщение');
});

// Schedule command handler
bot.command('schedule', (ctx) => {
    ctx.reply('Открыть расписание мероприятий:', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Посмотреть расписание',
                        web_app: { 
                            url: process.env.WEBAPP_URL || 'https://your-username.github.io/your-repo/' 
                        }
                    }
                ]
            ]
        }
    });
});

// Map command handler
bot.command('map', (ctx) => {
    ctx.reply('Открыть интерактивную карту фестиваля:', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Посмотреть карту',
                        web_app: { 
                            url: process.env.WEBAPP_URL || 'https://your-username.github.io/your-repo/' 
                        }
                    }
                ]
            ]
        }
    });
});

// Handle callback queries
bot.on('callback_query', (ctx) => {
    if (ctx.callbackQuery.data === 'open_webapp') {
        ctx.answerCbQuery();
        ctx.editMessageText('Нажмите кнопку ниже, чтобы открыть приложение:', {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Открыть приложение',
                            web_app: { 
                                url: process.env.WEBAPP_URL || 'https://your-username.github.io/your-repo/' 
                            }
                        }
                    ]
                ]
            }
        });
    }
});

// Handle text messages
bot.hears(/расписание|schedule|программа/i, (ctx) => {
    ctx.reply('Хотите посмотреть расписание мероприятий?', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Да, открыть расписание',
                        web_app: { 
                            url: process.env.WEBAPP_URL || 'https://your-username.github.io/your-repo/' 
                        }
                    }
                ]
            ]
        }
    });
});

// Handle web_app_data
bot.on('web_app_data', (ctx) => {
    const message = ctx.message;
    ctx.reply(`Спасибо за использование нашего приложения! Вы выбрали: ${message.web_app_data.button_text}`);
});

// Error handling
bot.catch((err, ctx) => {
    console.error(`Ошибка при обработке обновления ${ctx.update.update_id}:`, err);
    ctx.reply('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
});

// Launch the bot
bot.launch();

console.log('Telegram бот запущен!');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));