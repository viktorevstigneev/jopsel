// index.js
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const fs = require("fs");

const TOKEN =
  process.env.BOT_TOKEN || "8299226870:AAEKmJUrga6Vf67BAxZctbrPGn2M9ToXOxc";
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(TOKEN, { webHook: { autoOpen: false } });
const app = express();
app.use(express.json());

// ========== КОНФИГ ==========
const config = {
  botName: "жопсель",
  nameAliases: ["жопсель", "жопселя", "жопселю", "жопселем", "жопселе"],
  commands: [
    {
      trigger: "доброе утро",
      response: "какое нахуй утро",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "доброе утречко",
      response: "соси",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "с добрым утром",
      response: "биба и боба",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "утречка",
      response: "додик ты утренний",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "доброе утро всем",
      response: "добрым утро не бывает",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "всем доброе утро",
      response: "миру мир а тебе хуй в рот",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "нароод",
      response: "хуй те в рот",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "наррод",
      response: "2 хуя те в рот",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "народ",
      response: "З хуя те в рот",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "как дела",
      response: "У Жопселя всё отлично! А у вас? 🐶",
      needMention: true,
      exactMatch: true,
    },
    {
      trigger: "спокойной ночи",
      response: "сьебись уже",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "молодец",
      response: "ясен хуй",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "кто тут",
      response: "Жопсель тут",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "Илья",
      response: "ростом в три хуя",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "Даша",
      response: "дохуя наша",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "Воздухан",
      response: "Воздухан твой батя",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "соси",
      response: "а ты научи сосать",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "сучка",
      response: "сучка в постели будешь кричать",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "домой",
      response: "блять ты ж бездомное, чудо",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "поел",
      response: "говна?",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "наелся",
      response: "говна?",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "наелась",
      response: "говна?",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "похуй",
      response: "по хуй ты будешь на коленях стоять",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "первый",
      response: "первый не последний, соси сразу два",
      needMention: false,
      exactMatch: true,
    },
    {
      trigger: "плохо",
      response: "плохо когда сын на соседа похож",
      needMention: false,
      exactMatch: true,
    },
    { trigger: "ок", response: "хуёк", needMention: false, exactMatch: true },
  ],
  defaultResponse: "Чё надо?",
  welcomeMessage: "🐶 *Привет! Я Жопсель!*",
};

// Загрузка выученных команд
let learnedCommands = [];
const LEARNED_FILE = "learned_commands.json";

function loadLearnedCommands() {
  try {
    if (fs.existsSync(LEARNED_FILE)) {
      const data = fs.readFileSync(LEARNED_FILE, "utf8");
      learnedCommands = JSON.parse(data);
      console.log(`📚 Загружено ${learnedCommands.length} выученных команд`);
    }
  } catch (error) {
    console.error("Ошибка загрузки:", error);
  }
}

function saveLearnedCommands() {
  try {
    fs.writeFileSync(LEARNED_FILE, JSON.stringify(learnedCommands, null, 2));
    console.log(`💾 Сохранено ${learnedCommands.length} команд`);
  } catch (error) {
    console.error("Ошибка сохранения:", error);
  }
}

function isBotMentioned(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  if (lowerText.includes(config.botName)) return true;
  for (const alias of config.nameAliases) {
    if (lowerText.includes(alias)) return true;
  }
  return false;
}

// НОВАЯ ФУНКЦИЯ: точная проверка команды
function checkAllCommands(text) {
  if (!text) return null;

  const lowerText = text.toLowerCase().trim();
  const botMentioned = isBotMentioned(text);

  // Проверяем все команды (встроенные + выученные)
  const allCommands = [...config.commands, ...learnedCommands];

  // Сортируем по длине (чтобы "доброе утро всем" проверилось раньше "доброе утро")
  const sortedCommands = [...allCommands].sort(
    (a, b) => b.trigger.length - a.trigger.length,
  );

  for (const cmd of sortedCommands) {
    let matched = false;

    if (cmd.exactMatch || cmd.exactMatch === undefined) {
      // Точное совпадение
      if (lowerText === cmd.trigger) {
        matched = true;
      }
    } else {
      // Частичное совпадение (для старых команд)
      if (lowerText.includes(cmd.trigger)) {
        matched = true;
      }
    }

    if (matched) {
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

  // ===== ОБУЧЕНИЕ НОВЫМ КОМАНДАМ =====
  if (text.includes("запомни:")) {
    // Формат: запомни: фраза -> ответ
    // или: запомни: фраза -> ответ без имени
    let parts = text.split("->");
    if (parts.length === 2) {
      let triggerPart = parts[0].replace("запомни:", "").trim();
      let response = parts[1].trim();
      let needMention = true;
      let exactMatch = true;

      // Убираем имя бота из триггера если есть
      if (triggerPart.toLowerCase().includes(config.botName)) {
        triggerPart = triggerPart
          .toLowerCase()
          .replace(config.botName, "")
          .trim();
      }

      // Проверяем флаги
      if (text.includes("без имени")) needMention = false;
      if (text.includes("частично")) exactMatch = false;

      const trigger = triggerPart.toLowerCase();

      if (trigger && response) {
        learnedCommands.push({ trigger, response, needMention, exactMatch });
        saveLearnedCommands();

        let flags = [];
        if (!needMention) flags.push("без имени");
        if (!exactMatch) flags.push("частичное совпадение");
        const flagsText = flags.length ? ` (${flags.join(", ")})` : "";

        await bot.sendMessage(
          chatId,
          `✅ Запомнил! "${trigger}" → "${response}"${flagsText}`,
        );
        return;
      }
    }
    await bot.sendMessage(
      chatId,
      "❌ Формат: запомни: фраза -> ответ\nДополнительно: 'без имени' или 'частично'",
    );
    return;
  }

  // ===== УДАЛЕНИЕ ВЫУЧЕННЫХ КОМАНД =====
  if (text.startsWith("забудь:")) {
    const triggerToRemove = text.replace("забудь:", "").trim().toLowerCase();
    const index = learnedCommands.findIndex(
      (cmd) => cmd.trigger === triggerToRemove,
    );

    if (index !== -1) {
      const removed = learnedCommands.splice(index, 1)[0];
      saveLearnedCommands();
      await bot.sendMessage(chatId, `🗑️ Забыл команду "${removed.trigger}"`);
    } else {
      await bot.sendMessage(
        chatId,
        `❌ Не найдена команда "${triggerToRemove}"`,
      );
    }
    return;
  }

  // ===== СПИСОК ВЫУЧЕННЫХ КОМАНД =====
  if (text === "мои команды" || text === "что я умею") {
    if (learnedCommands.length === 0) {
      await bot.sendMessage(
        chatId,
        "📭 Пока нет выученных команд. Используй: запомни: фраза -> ответ",
      );
      return;
    }

    let list = learnedCommands
      .map((cmd, i) => {
        let flags = [];
        if (!cmd.needMention) flags.push("без имени");
        if (cmd.exactMatch === false) flags.push("частично");
        const flagsText = flags.length ? ` [${flags.join(",")}]` : "";
        return `${i + 1}. "${cmd.trigger}" → "${cmd.response}"${flagsText}`;
      })
      .join("\n");

    await bot.sendMessage(
      chatId,
      `📚 *Выученные команды:*\n\n${list}\n\n🗑️ Удалить: забыть: команда`,
      { parse_mode: "Markdown" },
    );
    return;
  }

  // ===== ПРОВЕРКА КОМАНД =====
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

  // Список всех команд
  if (cleanText.includes("список команд") || cleanText === "команды") {
    const builtinList = config.commands
      .slice(0, 10)
      .map((c) => `• ${c.trigger}`)
      .join("\n");
    const totalBuiltin = config.commands.length;
    const learnedCount = learnedCommands.length;

    await bot.sendMessage(
      chatId,
      `📋 *Команды Жопселя*\n\n` +
        `🏠 *Встроенные:* ${totalBuiltin}\n` +
        `🎓 *Выученные:* ${learnedCount}\n\n` +
        `💡 *Добавить:* запомни: фраза -> ответ\n` +
        `📚 *Мои команды:* мои команды\n` +
        `🗑️ *Удалить:* забыть: команда`,
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
  loadLearnedCommands(); // Загружаем сохранённые команды
  console.log(`✅ Сервер на порту ${PORT}`);
  const webhookUrl = `${process.env.RENDER_EXTERNAL_URL || "https://jopsel.onrender.com"}/webhook/${TOKEN}`;
  await bot.setWebHook(webhookUrl);
  console.log(`🔗 Вебхук: ${webhookUrl}`);
  console.log("🐶 Жопсель запущен!");
});

bot.on("message", handleMessage);
