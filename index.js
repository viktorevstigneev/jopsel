const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const fs = require("fs");

// ========== ЗАГРУЗКА КОНФИГА ==========
let config = {};
try {
  const configFile = fs.readFileSync("config.json", "utf8");
  config = JSON.parse(configFile);
  console.log("✅ Конфиг загружен");
} catch (error) {
  console.error("❌ Ошибка загрузки config.json:", error);
  process.exit(1);
}

const TOKEN = config.botToken;
const PORT = process.env.PORT || 3000;
const ADMIN_ID = config.adminId;

const bot = new TelegramBot(TOKEN, { webHook: { autoOpen: false } });
const app = express();
app.use(express.json());

// Выученные команды (сохраняются отдельно)
let learnedCommands = [];
const LEARNED_FILE = "learned_commands.json";

function isAdmin(userId) {
  return userId === ADMIN_ID;
}

function loadLearnedCommands() {
  try {
    if (fs.existsSync(LEARNED_FILE)) {
      const data = fs.readFileSync(LEARNED_FILE, "utf8");
      learnedCommands = JSON.parse(data);
      console.log(`📚 Загружено ${learnedCommands.length} выученных команд`);
      console.log(JSON.stringify(learnedCommands, null, 2));
    }
  } catch (error) {
    console.error("Ошибка загрузки learned:", error);
  }
}

function saveLearnedCommands() {
  try {
    fs.writeFileSync(LEARNED_FILE, JSON.stringify(learnedCommands, null, 2));
    console.log(`💾 Сохранено ${learnedCommands.length} команд`);
  } catch (error) {
    console.error("Ошибка сохранения learned:", error);
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

function checkAllCommands(text) {
  if (!text) return null;

  const lowerText = text.toLowerCase().trim();
  const botMentioned = isBotMentioned(text);

  const allCommands = [...config.commands, ...learnedCommands];
  const sortedCommands = [...allCommands].sort(
    (a, b) => b.trigger.length - a.trigger.length,
  );

  console.log(`\n🔍 Проверка "${lowerText}" (упоминание: ${botMentioned})`);
  console.log(
    `📚 Всего команд: ${allCommands.length} (выученных: ${learnedCommands.length})`,
  );

  for (const cmd of sortedCommands) {
    let matched = false;

    if (cmd.exactMatch !== false) {
      if (lowerText === cmd.trigger) {
        matched = true;
        console.log(`  ✅ Точное совпадение: "${cmd.trigger}"`);
      }
    } else {
      if (lowerText.includes(cmd.trigger)) {
        matched = true;
        console.log(`  ✅ Частичное совпадение: "${cmd.trigger}"`);
      }
    }

    if (matched) {
      console.log(
        `  📌 needMention: ${cmd.needMention}, botMentioned: ${botMentioned}`,
      );
      if (cmd.needMention && !botMentioned) {
        console.log(`  ❌ Пропущено (нужно имя)`);
        continue;
      }
      console.log(`  📢 ОТВЕТ: ${cmd.response}`);
      return cmd.response;
    }
  }

  console.log(`  ❌ Ничего не найдено`);
  return null;
}

async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  if (!text) return;

  console.log(`\n📨 [${userId}] ${text}`);

  // ОБУЧЕНИЕ
  if (text.toLowerCase().includes("запомни:")) {
    if (!isAdmin(userId)) {
      await bot.sendMessage(chatId, "❌ Только хозяин может меня учить!");
      return;
    }

    const parts = text.split("->");
    if (parts.length === 2) {
      let triggerPart = parts[0].replace(/запомни:/i, "").trim();
      let response = parts[1].trim();
      let needMention = false;
      let exactMatch = true;

      // Убираем имя бота из триггера
      if (triggerPart.toLowerCase().includes(config.botName)) {
        triggerPart = triggerPart
          .toLowerCase()
          .replace(config.botName, "")
          .trim();
      }

      // ПРОВЕРЯЕМ ФЛАГИ И УБИРАЕМ ИХ ИЗ ОТВЕТА
      const lowerText = text.toLowerCase();
      if (lowerText.includes("с именем")) {
        needMention = true;
        response = response.replace(/с именем/gi, "").trim();
      }
      if (lowerText.includes("без имени")) {
        needMention = false;
        response = response.replace(/без имени/gi, "").trim();
      }
      if (lowerText.includes("частично")) {
        exactMatch = false;
        response = response.replace(/частично/gi, "").trim();
      }

      const trigger = triggerPart.toLowerCase();

      if (trigger && response) {
        // Проверяем是否存在 уже
        const existingIndex = learnedCommands.findIndex(
          (c) => c.trigger === trigger,
        );
        if (existingIndex !== -1) {
          learnedCommands[existingIndex] = {
            trigger,
            response,
            needMention,
            exactMatch,
          };
        } else {
          learnedCommands.push({ trigger, response, needMention, exactMatch });
        }
        saveLearnedCommands();

        const flagsText = needMention ? "с именем" : "без имени";
        await bot.sendMessage(
          chatId,
          `✅ Запомнил! "${trigger}" → "${response}" (${flagsText})`,
        );
        return;
      }
    }
    await bot.sendMessage(
      chatId,
      "❌ Формат: запомни: фраза -> ответ\nФлаги: 'с именем' или 'частично'",
    );
    return;
  }

  // УДАЛЕНИЕ
  if (text.toLowerCase().startsWith("забудь:")) {
    if (!isAdmin(userId)) {
      await bot.sendMessage(chatId, "❌ Только хозяин может удалять!");
      return;
    }

    const triggerToRemove = text
      .replace(/забудь:/i, "")
      .trim()
      .toLowerCase();
    const index = learnedCommands.findIndex(
      (cmd) => cmd.trigger === triggerToRemove,
    );

    if (index !== -1) {
      const removed = learnedCommands.splice(index, 1)[0];
      saveLearnedCommands();
      await bot.sendMessage(chatId, `🗑️ Забыл "${removed.trigger}"`);
    } else {
      await bot.sendMessage(chatId, `❌ Не найдено "${triggerToRemove}"`);
    }
    return;
  }

  // СПИСОК ВЫУЧЕННЫХ
  if (text === "мои команды" || text === "что я умею") {
    if (learnedCommands.length === 0) {
      await bot.sendMessage(chatId, "📭 Нет выученных команд");
      return;
    }
    const list = learnedCommands
      .map((cmd, i) => {
        const flags = cmd.needMention ? "[с именем]" : "[без имени]";
        return `${i + 1}. "${cmd.trigger}" → ${cmd.response} ${flags}`;
      })
      .join("\n");
    await bot.sendMessage(chatId, `📚 Выученные команды:\n${list}`);
    return;
  }

  // ПРОВЕРКА КОМАНД
  const commandResponse = checkAllCommands(text);
  if (commandResponse) {
    await bot.sendMessage(chatId, commandResponse);
    return;
  }

  // ПОЗВАЛИ ПО ИМЕНИ
  const cleanText = text.toLowerCase().trim();
  if (cleanText === config.botName || cleanText === `${config.botName}?`) {
    await bot.sendMessage(chatId, "Чё? 😼");
    return;
  }

  // СПИСОК ВСЕХ КОМАНД
  if (cleanText.includes("список команд") || cleanText === "команды") {
    const totalBuiltin = config.commands.length;
    const learnedCount = learnedCommands.length;
    await bot.sendMessage(
      chatId,
      `📋 Команды:\n🏠 Встроенных: ${totalBuiltin}\n🎓 Выученных: ${learnedCount}\n\n💡 Учить: запомни: фраза -> ответ\n   Флаги: 'с именем' или 'частично'`,
    );
    return;
  }

  // ОТВЕТ ПО УМОЛЧАНИЮ
  if (isBotMentioned(text)) {
    await bot.sendMessage(chatId, config.defaultResponse);
  }
}

// ========== WEBHOOK ==========
app.post(`/webhook/${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get("/", (req, res) => res.send("Жопсель бот работает"));

app.listen(PORT, async () => {
  loadLearnedCommands();
  console.log(`✅ Сервер на порту ${PORT}`);
  console.log(`👑 Админ: ${ADMIN_ID}`);
  const webhookUrl = `${process.env.RENDER_EXTERNAL_URL || "https://jopsel.onrender.com"}/webhook/${TOKEN}`;
  await bot.setWebHook(webhookUrl);
  console.log(`🔗 Вебхук: ${webhookUrl}`);
  console.log("🐶 Жопсель запущен!");
});

bot.on("message", handleMessage);
