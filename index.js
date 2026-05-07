// index.js
const TelegramBot = require("node-telegram-bot-api");

const TOKEN = "8299226870:AAEKmJUrga6Vf67BAxZctbrPGn2M9ToXOxc";

// Создаём бота в режиме polling
const bot = new TelegramBot(TOKEN, { polling: true });

// ========== КОНФИГ ==========
const config = {
  botName: "жопсель",

  nameAliases: ["жопсель", "жопселя", "жопселю", "жопселем", "жопселе"],

  // ========== НОВАЯ СИСТЕМА КОМАНД ==========
  // Каждая команда: trigger - что искать, response - что ответить, needMention - нужно ли имя бота
  commands: [
    // Команды, которые работают БЕЗ упоминания жопсель
    {
      trigger: "доброе утро",
      response: "какое нахуй утро",
      needMention: false,
    },
    {
      trigger: "доброе утречко",
      response: "соси",
      needMention: false,
    },
    {
      trigger: "с добрым утром",
      response: "биба и боба",
      needMention: false,
    },
    {
      trigger: "утречка",
      response: "додик ты утренний",
      needMention: false,
    },
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

    // Команды, которые работают ТОЛЬКО с упоминанием жопсель
    { trigger: "нароод", response: "хуй те в рот", needMention: false },
    { trigger: "наррод", response: "2 хуя те в рот", needMention: false },
    { trigger: "народ", response: "З хуя те в рот", needMention: false },
    {
      trigger: "как дела",
      response: "У Жопселя всё отлично! А у вас? 🐶",
      needMention: true,
    },
    {
      trigger: "спокойной ночи",
      response: "сьебись уже",
      needMention: false,
    },
    {
      trigger: "молодец",
      response: "ясен хуй",
      needMention: false,
    },
    {
      trigger: "кто тут",
      response: "Жопсель тут",
      needMention: false,
    },
    {
      trigger: "Илья",
      response: "воздух гоняет ваш Илья",
      needMention: false,
    },
    {
      trigger: "Даша",
      response: "дохуя наша",
      needMention: false,
    },
    {
      trigger: "Воздухан",
      response: "Воздухан твой батя",
      needMention: false,
    },
    {
      trigger: "соси",
      response: "а ты научи сосать",
      needMention: false,
    },
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
    {
      trigger: "поел",
      response: "говна?",
      needMention: false,
    },
    {
      trigger: "наелся",
      response: "говна?",
      needMention: false,
    },
    {
      trigger: "наелась",
      response: "говна?",
      needMention: false,
    },
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
    {
      trigger: "ок",
      response: "хуёк",
      needMention: false,
    },
    {
      trigger: "да",
      response: "пизда",
      needMention: false,
    },
    {
      trigger: "я",
      response: "головка от хуя",
      needMention: false,
    },
  ],

  defaultResponse: "Чё надо?",

  welcomeMessage: `
🐶 *Привет! Я Жопсель!*
`,
};

// Выученные команды (изначально пустые, будут добавляться через запомни)
let learnedCommands = [];

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

// Проверка всех команд (и встроенных, и выученных)
function checkAllCommands(text) {
  const lowerText = text.toLowerCase();
  const botMentioned = isBotMentioned(text);

  // Проверяем встроенные команды из конфига
  for (const cmd of config.commands) {
    if (lowerText.includes(cmd.trigger)) {
      // Если команда требует упоминания — проверяем, упомянут ли бот
      if (cmd.needMention && !botMentioned) continue;
      return cmd.response;
    }
  }

  // Проверяем выученные команды
  for (const cmd of learnedCommands) {
    if (lowerText.includes(cmd.trigger)) {
      if (cmd.needMention && !botMentioned) continue;
      return cmd.response;
    }
  }

  return null;
}

// ========== ОБРАБОТЧИК СООБЩЕНИЙ ==========
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  console.log(`[Жопсель] ${text}`);

  // 1. Обучение новой команде
  if (text.includes("запомни:")) {
    const parts = text.split("->");
    if (parts.length === 2) {
      let trigger = parts[0].replace("запомни:", "").trim().toLowerCase();
      let response = parts[1].trim();

      // Проверяем, нужно ли упоминание для этой команды
      let needMention = true;
      if (trigger.startsWith(config.botName)) {
        trigger = trigger.slice(config.botName.length).trim();
        needMention = true;
      }
      // Если в запросе есть "без имени" — команда без упоминания
      if (text.includes("без имени")) {
        needMention = false;
      }

      if (trigger && response) {
        learnedCommands.push({ trigger, response, needMention });
        await bot.sendMessage(
          chatId,
          `✅ Запомнил! На "${trigger}" отвечаю "${response}"${needMention ? " (нужно упоминать жопсель)" : " (можно без упоминания)"}`,
        );
        return;
      }
    }
  }

  // 2. Проверяем все команды из конфига и выученные
  const commandResponse = checkAllCommands(text);
  if (commandResponse) {
    await bot.sendMessage(chatId, commandResponse);
    return;
  }

  // 3. Просто позвали по имени
  const cleanText = text.toLowerCase().trim();
  if (cleanText === config.botName || cleanText === `${config.botName}?`) {
    await bot.sendMessage(chatId, "Чё? 😼");
    return;
  }

  // 4. Список команд
  if (cleanText.includes("список команд")) {
    const builtinList = config.commands
      .map(
        (cmd) =>
          `• ${cmd.trigger} → ${cmd.response.substring(0, 30)}... ${cmd.needMention ? "(жопсель)" : "(без имени)"}`,
      )
      .join("\n");
    const learnedList = learnedCommands
      .map(
        (cmd) =>
          `• ${cmd.trigger} → ${cmd.response} ${cmd.needMention ? "(жопсель)" : "(без имени)"}`,
      )
      .join("\n");

    await bot.sendMessage(
      chatId,
      `📚 *Команды:*\n\n*Встроенные:*\n${builtinList}\n\n*Выученные:*\n${learnedList || "пока нет"}`,
      {
        parse_mode: "Markdown",
      },
    );
    return;
  }

  // 5. Ответ по умолчанию — только если упомянули бота
  if (isBotMentioned(text)) {
    await bot.sendMessage(chatId, config.defaultResponse);
  }
});

// ========== КОМАНДЫ ==========
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, config.welcomeMessage, {
    parse_mode: "Markdown",
  });
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    '📖 Напиши "жопсель список команд" чтобы увидеть все команды',
  );
});

console.log("🐶 Жопсель запущен!");
console.log(
  "👋 Команды без упоминания: доброе утро, доброе утречко, с добрым утром, утречка",
);
console.log("🔧 Команды с упоминанием: всё остальное");
