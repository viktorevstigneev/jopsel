// index.js
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = "8299226870:AAEKmJUrga6Vf67BAxZctbrPGn2M9ToXOxc";

// Создаём бота в режиме polling
const bot = new TelegramBot(TOKEN, { polling: true });

// ========== КОНФИГ ==========
const config = {
  botName: "жопсель",

  nameAliases: ["жопсель", "жопселя", "жопселю", "жопселем", "жопселе"],

  goodMorningTriggers: [
    "доброе утро",
    "доброе утречко",
    "с добрым утром",
    "утречка",
    "доброе утро всем",
    "всем доброе утро",
  ],

  goodMorningResponses: [
    "🌅 Доброе утро! Отличного дня всем!",
    "☕ Доброе утречко! Чай/кофе уже заварили?",
    "🌟 С добрым утром! Пусть день будет продуктивным!",
    "🐶 Гав! Доброе утро от Жопселя!",
  ],

  customCommands: {
    нароод: "Йооо, народ! 👋",
    народ: "Здарова, пацаны! 🤘",
    "как дела": "У Жопселя всё отлично! А у вас? 🐶",
    "спокойной ночи": "Сладких снов, друзья! 🌙",
  },

  defaultResponse: "Чё надо? 😏",

  welcomeMessage: `
🐶 *Привет! Я Жопсель!*

*Что я умею:*
🌅 доброе утро — пожелаю хорошего дня
👋 нароод / народ — поздороваюсь

*Научи меня новому:* 
жопсель запомни: фраза -> ответ
    `,
};

// Хранилище выученных команд (копируем из конфига)
let customCommands = { ...config.customCommands };

// ========== ФУНКЦИИ ==========
function isBotMentioned(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  if (lowerText.includes(config.botName)) return true;
  for (const alias of config.nameAliases) {
    if (lowerText.includes(alias)) return true;
  }
  return false;
}

function isGoodMorning(text) {
  const lowerText = text.toLowerCase();
  return config.goodMorningTriggers.some((trigger) =>
    lowerText.includes(trigger),
  );
}

function getRandomGoodMorning() {
  return config.goodMorningResponses[
    Math.floor(Math.random() * config.goodMorningResponses.length)
  ];
}

function checkCustomCommand(text) {
  const lowerText = text.toLowerCase();
  for (const [trigger, response] of Object.entries(customCommands)) {
    if (lowerText.includes(trigger)) return response;
  }
  return null;
}

// ========== ОБРАБОТЧИК СООБЩЕНИЙ ==========
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;
  if (!isBotMentioned(text)) return;

  console.log(`[Жопсель] ${text}`);

  // 1. Обучение новой команде
  if (text.includes("запомни:")) {
    const parts = text.split("->");
    if (parts.length === 2) {
      let trigger = parts[0].replace("запомни:", "").trim().toLowerCase();
      const response = parts[1].trim();

      // Убираем имя бота из триггера если есть
      if (trigger.startsWith(config.botName)) {
        trigger = trigger.slice(config.botName.length).trim();
      }

      if (trigger && response) {
        customCommands[trigger] = response;
        await bot.sendMessage(
          chatId,
          `✅ Запомнил! На "${trigger}" отвечаю "${response}"`,
        );
        return;
      }
    }
  }

  // 2. Доброе утро
  if (isGoodMorning(text)) {
    await bot.sendMessage(chatId, getRandomGoodMorning());
    return;
  }

  // 3. Кастомные команды
  const customResponse = checkCustomCommand(text);
  if (customResponse) {
    await bot.sendMessage(chatId, customResponse);
    return;
  }

  // 4. Просто позвали по имени
  const cleanText = text.toLowerCase().trim();
  if (cleanText === config.botName || cleanText === `${config.botName}?`) {
    await bot.sendMessage(chatId, "Чё? 😼");
    return;
  }

  // 5. Список команд
  if (cleanText.includes("список команд")) {
    const list = Object.entries(customCommands)
      .slice(0, 20)
      .map(([t, r]) => `• ${t} → ${r}`)
      .join("\n");
    await bot.sendMessage(chatId, `📚 *Команды:*\n${list || "Пока нет"}`, {
      parse_mode: "Markdown",
    });
    return;
  }

  // 6. Ответ по умолчанию
  await bot.sendMessage(chatId, config.defaultResponse);
});

// ========== КОМАНДЫ ==========
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, config.welcomeMessage, {
    parse_mode: "Markdown",
  });
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, '📖 Напиши "жопсель помощь" или /start');
});

console.log("🐶 Жопсель запущен!");
