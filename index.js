// index.js
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

const TOKEN =
  process.env.BOT_TOKEN || "8299226870:AAEKmJUrga6Vf67BAxZctbrPGn2M9ToXOxc";
const PORT = process.env.PORT || 3000;

// Создаём бота без polling (будет работать через webhook)
const bot = new TelegramBot(TOKEN, { webHook: { autoOpen: false } });

// Express сервер
const app = express();
app.use(express.json());

// ========== ТВОЙ КОНФИГ (полностью сохранён) ==========
const config = {
  botName: "жопсель",
  nameAliases: ["жопсель", "жопселя", "жопселю", "жопселем", "жопселе"],
  commands: [
    {
      trigger: "доброе утро",
      response: "какое нахуй утро",
      needMention: false,
    },
    { trigger: "доброе утречко", response: "соси", needMention: false },
    { trigger: "с добрым утром", response: "биба и боба", needMention: false },
    { trigger: "утречка", response: "додик ты утренний", needMention: false },
    {
      trigger: "доброе утро всем",
      response: "добрым утро не бывает",
      needMention: false,
    },
    {
      trigger: "всем доброе утро",
      response: "миру мир а тебе хуй в рот",
      needMention: false,
    },
    { trigger: "нароод", response: "хуй те в рот", needMention: false },
    { trigger: "наррод", response: "2 хуя те в рот", needMention: false },
    { trigger: "народ", response: "З хуя те в рот", needMention: false },
    {
      trigger: "как дела",
      response: "У Жопселя всё отлично! А у вас? 🐶",
      needMention: true,
    },
    { trigger: "спокойной ночи", response: "сьебись уже", needMention: false },
    { trigger: "молодец", response: "ясен хуй", needMention: false },
    { trigger: "кто тут", response: "Жопсель тут", needMention: false },
    { trigger: "Иль", response: "ростом в три хуя", needMention: false },
    { trigger: "Даша", response: "дохуя наша", needMention: false },
    { trigger: "Воздухан", response: "Воздухан твой батя", needMention: false },
    { trigger: "соси", response: "а ты научи сосать", needMention: false },
    {
      trigger: "сучка",
      response: "сучка в постели будешь кричать",
      needMention: false,
    },
    {
      trigger: "домой",
      response: "блять ты ж бездомное, чудо",
      needMention: false,
    },
    { trigger: "поел", response: "говна?", needMention: false },
    { trigger: "наелся", response: "говна?", needMention: false },
    { trigger: "наелась", response: "говна?", needMention: false },
    {
      trigger: "похуй",
      response: "по хуй ты будешь на коленях стоять",
      needMention: false,
    },
    {
      trigger: "первый",
      response: "первый не последний, соси сразу два",
      needMention: false,
    },
    {
      trigger: "плохо",
      response: "плохо когда сын на соседа похож",
      needMention: false,
    },
    { trigger: "ок", response: "хуёк", needMention: false },
    { trigger: "да", response: "пизда", needMention: false },
    { trigger: "я", response: "головка от хуя", needMention: false },
  ],
  defaultResponse: "Чё надо?",
  welcomeMessage: "🐶 *Привет! Я Жопсель!*",
};

let learnedCommands = [];

function isBotMentioned(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  if (lowerText.includes(config.botName)) return true;
  for (const alias of config.nameAliases) {
    if (lowerText.includes(alias)) return true;
  }
  return false;
}

function checkAllCommands(text) {
  const lowerText = text.toLowerCase();
  const botMentioned = isBotMentioned(text);
  for (const cmd of [...config.commands, ...learnedCommands]) {
    if (lowerText.includes(cmd.trigger)) {
      if (cmd.needMention && !botMentioned) continue;
      return cmd.response;
    }
  }
  return null;
}

// ========== ОБРАБОТЧИК ==========
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (!text) return;

  console.log(`[Жопсель] ${text}`);

  // Обучение
  if (text.includes("запомни:")) {
    const parts = text.split("->");
    if (parts.length === 2) {
      let trigger = parts[0].replace("запомни:", "").trim().toLowerCase();
      let response = parts[1].trim();
      let needMention = true;
      if (trigger.startsWith(config.botName)) {
        trigger = trigger.slice(config.botName.length).trim();
      }
      if (text.includes("без имени")) needMention = false;
      if (trigger && response) {
        learnedCommands.push({ trigger, response, needMention });
        await bot.sendMessage(
          chatId,
          `✅ Запомнил! "${trigger}" → "${response}"`,
        );
        return;
      }
    }
  }

  // Проверка команд
  const commandResponse = checkAllCommands(text);
  if (commandResponse) {
    await bot.sendMessage(chatId, commandResponse);
    return;
  }

  // Позвали по имени
  const cleanText = text.toLowerCase().trim();
  if (cleanText === config.botName || cleanText === `${config.botName}?`) {
    await bot.sendMessage(chatId, "Чё? 😼");
    return;
  }

  // Список команд
  if (cleanText.includes("список команд")) {
    const builtinList = config.commands
      .slice(0, 15)
      .map((c) => `• ${c.trigger} → ${c.response}`)
      .join("\n");
    await bot.sendMessage(
      chatId,
      `📚 *Команды:*\n${builtinList}\n\nВсего: ${config.commands.length}`,
      { parse_mode: "Markdown" },
    );
    return;
  }

  // Ответ по умолчанию
  if (isBotMentioned(text)) {
    await bot.sendMessage(chatId, config.defaultResponse);
  }
}

// ========== НАСТРОЙКА WEBHOOK ==========
app.post(`/webhook/${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get("/", (req, res) => res.send("Жопсель бот работает"));

app.listen(PORT, async () => {
  console.log(`✅ Сервер на порту ${PORT}`);
  const webhookUrl = `${process.env.RENDER_EXTERNAL_URL || "https://jopsel.onrender.com"}/webhook/${TOKEN}`;
  await bot.setWebHook(webhookUrl);
  console.log(`🔗 Вебхук: ${webhookUrl}`);
  console.log("🐶 Жопсель запущен!");
});

bot.on("message", handleMessage);
