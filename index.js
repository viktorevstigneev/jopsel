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

// ========== ПОДКЛЮЧЕНИЕ МОДУЛЕЙ ==========
const { cleanMention } = require("./modules/utils");
const admin = require("./modules/admin");
const commands = require("./modules/commands");
const learning = require("./modules/learning");
const rps = require("./modules/games/rps");
const poll = require("./modules/games/poll");
const roulette = require("./modules/games/roulette");
const coin = require("./modules/games/coin");
const dice = require("./modules/games/dice");
const oracle = require("./modules/games/oracle");
const swear = require("./modules/swear");
const quotes = require("./modules/quotes");
const reminders = require("./modules/reminders");
const randomSound = require("./modules/random");
const insults = require("./modules/insults");
const excuses = require("./modules/excuses");
const alcohol = require("./modules/alcohol");
const fuckoff = require("./modules/fuckoff");
const sarcasm = require("./modules/sarcasm");

// ========== ИНИЦИАЛИЗАЦИЯ ==========
const TOKEN = config.botToken;
const PORT = process.env.PORT || 3000;

const bot = new TelegramBot(TOKEN, { webHook: { autoOpen: false } });
const app = express();
app.use(express.json());

// Инициализация модулей
admin.initAdmin(config.adminId);
const learnedCommands = learning.loadLearnedCommands();
commands.initCommands(config, learnedCommands);
rps.loadGameStats();
poll.loadPollsHistory();
roulette.loadStats();
swear.loadStats();
quotes.loadQuotes();
reminders.loadReminders();

// ========== ЗАПУСК НАПОМИНАНИЙ ==========
setInterval(async () => {
  const dueReminders = reminders.getDueReminders();
  for (const reminder of dueReminders) {
    try {
      await bot.sendMessage(
        reminder.chatId,
        `⏰ *НАПОМИНАНИЕ!*\n\n${reminder.message}\n\nЛох, ты просил напомнить! 🖕`,
        { parse_mode: "Markdown" },
      );
    } catch (e) {}
  }
}, 10000);

// ========== ОСНОВНОЙ ОБРАБОТЧИК ==========
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  if (!text) return;

  console.log(`\n📨 [${userId}] ${text}`);
  console.log(
    `👤 Статус: ${admin.isMainAdmin(userId) ? "ГЛАВНЫЙ АДМИН" : admin.getSubAdminGroup(userId) ? `ПОД-АДМИН (${admin.getSubAdminGroup(userId)})` : "ПОЛЬЗОВАТЕЛЬ"}`,
  );

  // ========== СЧЕТЧИК МАТА ==========
  const swearResult = swear.checkSwear(text, userId, msg.from.first_name);
  if (swearResult.counted && swearResult.count > 0) {
    console.log(`🤬 Заматерился на ${swearResult.count} слов`);
  }

  // ========== НАПОМИНАНИЯ ==========
  const reminderData = reminders.parseReminder(text);
  if (reminderData) {
    if (!admin.isAnyAdmin(userId)) {
      await bot.sendMessage(
        chatId,
        "❌ Только админы могут ставить напоминания, быдло!",
      );
      return;
    }

    const reminder = reminders.addReminder(
      userId,
      chatId,
      reminderData.delay,
      reminderData.message,
    );
    const minutes = Math.round(reminderData.delay / 60000);
    await bot.sendMessage(
      chatId,
      `⏰ *Напомню через ${minutes} мин*\n\n📝 "${reminderData.message}"`,
      { parse_mode: "Markdown" },
    );
    return;
  }

  // ========== ЦИТАТНИК ==========
  if (
    text.toLowerCase() === "жопсель цитата" ||
    text.toLowerCase() === "жопсель рандомная цитата"
  ) {
    const quote = quotes.getRandomQuote(chatId);
    if (quote) {
      await bot.sendMessage(
        chatId,
        `📝 *ЦИТАТНИК*\n\n"${quote.text}"\n\n— ${quote.authorName} (${new Date(quote.date).toLocaleString()})`,
        { parse_mode: "Markdown" },
      );
    } else {
      await bot.sendMessage(
        chatId,
        "📭 Нет цитат! Добавь: *жопсель добавь цитату: текст*",
        { parse_mode: "Markdown" },
      );
    }
    return;
  }

  if (text.toLowerCase().startsWith("жопсель добавь цитату:")) {
    const quoteText = text.replace(/жопсель добавь цитату:/i, "").trim();
    if (quoteText) {
      quotes.addQuote(quoteText, userId, msg.from.first_name, chatId);
      await bot.sendMessage(chatId, `✅ Цитата добавлена!\n\n"${quoteText}"`);
    } else {
      await bot.sendMessage(chatId, "❌ Напиши: жопсель добавь цитату: текст");
    }
    return;
  }

  if (text.toLowerCase() === "жопсель топ мата") {
    const top = swear.getTopSwearers();
    await bot.sendMessage(chatId, top, { parse_mode: "Markdown" });
    return;
  }

  // ========== ОПРОСЫ ==========
  const pollData = poll.parsePollCommand(text, userId);
  if (pollData) {
    if (!admin.isAnyAdmin(userId)) {
      await bot.sendMessage(
        chatId,
        "❌ Только админы могут создавать опросы, быдло!",
      );
      return;
    }

    const created = await poll.createPoll(
      bot,
      chatId,
      userId,
      pollData.question,
    );
    if (!created) {
      await bot.sendMessage(
        chatId,
        "❌ Не удалось создать опрос. Попробуй позже, уёбище!",
      );
    }
    return;
  }

  if (
    text.toLowerCase() === "жопсель последний опрос" ||
    text.toLowerCase() === "жопсель опросы"
  ) {
    await poll.showLastPoll(bot, chatId);
    return;
  }

  // ========== ИГРЫ ==========
  if (text.toLowerCase() === "жопсель рулетка") {
    const result = roulette.play(userId);
    await bot.sendMessage(chatId, result.message, { parse_mode: "Markdown" });
    return;
  }

  if (text.toLowerCase() === "жопсель монетка") {
    await bot.sendMessage(chatId, coin.flip(), { parse_mode: "Markdown" });
    return;
  }

  if (text.toLowerCase() === "жопсель кубик") {
    await bot.sendMessage(chatId, dice.roll(), { parse_mode: "Markdown" });
    return;
  }

  if (text.toLowerCase().startsWith("жопсель шар:")) {
    const question = text.replace(/жопсель шар:/i, "").trim();
    if (question) {
      await bot.sendMessage(chatId, oracle.ask(question), {
        parse_mode: "Markdown",
      });
    } else {
      await bot.sendMessage(
        chatId,
        "❓ Напиши: жопсель шар: я выиграю лотерею?",
      );
    }
    return;
  }

  if (text.toLowerCase().includes("жопсель игра")) {
    const response = rps.startGame(userId);
    await bot.sendMessage(chatId, response);
    return;
  }

  if (text.toLowerCase().includes("жопсель статистика")) {
    const userName = msg.from.first_name || "Ты";
    const response = rps.getStatsMessage(userId, userName);
    await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    return;
  }

  if (rps.isGameActive(userId)) {
    const result = rps.processMove(userId, text, msg.from.first_name);
    if (result.error) {
      await bot.sendMessage(chatId, result.message);
    } else {
      await bot.sendMessage(chatId, result.message, { parse_mode: "Markdown" });
    }
    return;
  }

  // ========== БЫДЛО-ФИШКИ ==========
  if (text.toLowerCase().startsWith("жопсель оскорби")) {
    const target = text
      .replace(/жопсель оскорби/i, "")
      .trim()
      .replace("@", "");
    if (target) {
      await bot.sendMessage(chatId, insults.insult(target));
    } else {
      await bot.sendMessage(chatId, "❌ Напиши: жопсель оскорби @username");
    }
    return;
  }

  if (text.toLowerCase() === "жопсель отмазка") {
    await bot.sendMessage(chatId, excuses.getExcuse(), {
      parse_mode: "Markdown",
    });
    return;
  }

  if (text.toLowerCase().startsWith("жопсель промилле")) {
    const match = text.match(
      /жопсель промилле\s+(\d+)(?:\s+(\d+))?(?:\s+(\d+))?/i,
    );
    if (match) {
      const beers = parseInt(match[1]);
      const weight = match[2] ? parseInt(match[2]) : 80;
      const hours = match[3] ? parseInt(match[3]) : 0;
      await bot.sendMessage(chatId, alcohol.calculate(beers, weight, hours), {
        parse_mode: "Markdown",
      });
    } else {
      await bot.sendMessage(
        chatId,
        "❌ Формат: жопсель промилле [бутылок] [вес] [часов]\nПример: жопсель промилле 5 80 2",
      );
    }
    return;
  }

  if (text.toLowerCase().startsWith("жопсель нахуй")) {
    const target = text
      .replace(/жопсель нахуй/i, "")
      .trim()
      .replace("@", "");
    if (target) {
      await bot.sendMessage(chatId, fuckoff.fuckoff(target));
    } else {
      await bot.sendMessage(chatId, "❌ Напиши: жопсель нахуй @username");
    }
    return;
  }

  // ========== САРКАЗМ (через ответ на сообщение) ==========
  if (text.toLowerCase().startsWith("жопсель сарказм")) {
    if (msg.reply_to_message && msg.reply_to_message.text) {
      const originalText = msg.reply_to_message.text;
      await bot.sendMessage(chatId, sarcasm.sarcasm(originalText), {
        parse_mode: "Markdown",
      });
    } else {
      await bot.sendMessage(
        chatId,
        "❌ Ответь на сообщение и напиши: *жопсель сарказм*\n\nПереведу тупой текст в сарказм!",
        { parse_mode: "Markdown" },
      );
    }
    return;
  }

  if (
    text.toLowerCase() === "жопсель войс" ||
    text.toLowerCase() === "жопсель рандом звук"
  ) {
    const sound = randomSound.getRandomSound();
    await bot.sendMessage(
      chatId,
      `🔊 *РАНДОМНЫЙ ЗВУК/СТИКЕР*\n\n${sound}\n\n(тык, скачай себе)`,
      { parse_mode: "Markdown" },
    );
    return;
  }

  // ========== АДМИН-КОМАНДЫ ==========
  if (text.match(/^жопсель\s+\+админ\s+(g[123])$/i)) {
    const match = text.match(/^жопсель\s+\+админ\s+(g[123])$/i);
    const group = match[1].toLowerCase();

    if (msg.reply_to_message && msg.reply_to_message.from) {
      const targetUserId = msg.reply_to_message.from.id;
      await admin.addSubAdmin(msg, targetUserId, group, userId, bot);
    } else {
      await bot.sendMessage(
        chatId,
        "❌ Чтобы добавить админа, ответьте на сообщение пользователя и напишите:\nжопсель +админ g1\n\nГруппы: g1 (может добавлять), g2 (только чтение), g3 (минимальные права)",
      );
    }
    return;
  }

  if (text.match(/^жопсель\s+-админ$/i)) {
    if (msg.reply_to_message && msg.reply_to_message.from) {
      const targetUserId = msg.reply_to_message.from.id;
      await admin.removeSubAdmin(msg, targetUserId, userId, bot);
    } else {
      await bot.sendMessage(
        chatId,
        "❌ Чтобы удалить админа, ответьте на сообщение пользователя и напишите:\nжопсель -админ",
      );
    }
    return;
  }

  if (text === "жопсель админы" || text === "админы жопселя") {
    await admin.showAdminsList(msg, bot);
    return;
  }

  // ========== ОБУЧЕНИЕ ==========
  if (text.toLowerCase().includes("запомни:")) {
    if (!admin.isAnyAdmin(userId)) {
      await bot.sendMessage(chatId, "❌ Только админы могут учить меня!");
      return;
    }

    const parsed = learning.parseLearnCommand(text, config.botName);
    if (parsed) {
      learning.addLearnedCommand(
        parsed.trigger,
        parsed.response,
        parsed.needMention,
        parsed.exactMatch,
      );
      commands.initCommands(config, learning.getLearnedCommands());
      const flagsText = parsed.needMention ? "с именем" : "без имени";
      await bot.sendMessage(
        chatId,
        `✅ Запомнил! "${parsed.trigger}" → "${parsed.response}" (${flagsText})`,
      );
    } else {
      await bot.sendMessage(
        chatId,
        "❌ Формат: запомни: фраза -> ответ\nФлаги: 'с именем' или 'частично'",
      );
    }
    return;
  }

  if (text.toLowerCase().startsWith("забудь:")) {
    const canDelete =
      admin.isMainAdmin(userId) || admin.getSubAdminGroup(userId) === "g1";
    if (!canDelete) {
      await bot.sendMessage(
        chatId,
        "❌ Только главный админ и админы группы g1 могут удалять команды!",
      );
      return;
    }

    const triggerToRemove = text
      .replace(/забудь:/i, "")
      .trim()
      .toLowerCase();
    const removed = learning.removeLearnedCommand(triggerToRemove);
    if (removed) {
      commands.initCommands(config, learning.getLearnedCommands());
      await bot.sendMessage(chatId, `🗑️ Забыл "${removed.trigger}"`);
    } else {
      await bot.sendMessage(chatId, `❌ Не найдено "${triggerToRemove}"`);
    }
    return;
  }

  if (text === "мои команды" || text === "что я умею") {
    const learned = learning.getLearnedCommands();
    if (learned.length === 0) {
      await bot.sendMessage(chatId, "📭 Нет выученных команд");
      return;
    }
    const list = learned
      .map((cmd, i) => {
        const flags = cmd.needMention ? "[с именем]" : "[без имени]";
        return `${i + 1}. "${cmd.trigger}" → ${cmd.response} ${flags}`;
      })
      .join("\n");
    await bot.sendMessage(chatId, `📚 Выученные команды:\n${list}`);
    return;
  }

  // ========== ПРОВЕРКА КОМАНД ИЗ КОНФИГА ==========
  const commandResponse = commands.checkAllCommands(text);
  if (commandResponse) {
    await bot.sendMessage(chatId, commandResponse);
    return;
  }

  // ========== ПОЗВАЛИ ПО ИМЕНИ ==========
  const { cleanText } = cleanMention(text, config);
  if (cleanText === config.botName || cleanText === `${config.botName}?`) {
    const response = admin.getResponseForAdmin(userId);
    await bot.sendMessage(chatId, response);
    return;
  }

  // ========== СПИСОК ВСЕХ КОМАНД ==========
  if (cleanText.includes("список команд") || cleanText === "команды") {
    const totalBuiltin = config.commands.length;
    const learnedCount = learning.getLearnedCommands().length;
    await bot.sendMessage(
      chatId,
      `📋 *КОМАНДЫ ЖОПСЕЛЯ* 📋

🎮 *ИГРЫ*
• жопсель игра - камень-ножницы-бумага
• жопсель рулетка - русская рулетка
• жопсель монетка - орёл/решка
• жопсель кубик - бросить кубик
• жопсель шар: вопрос - магический шар

🤬 *БЫДЛО-ФИШКИ*
• жопсель оскорби @username
• жопсель отмазка
• жопсель промилле [бутылок] [вес] [часов]
• жопсель нахуй @username
• жопсель сарказм: текст

📊 *ДРУГОЕ*
• жопсель опрос: текст - создать опрос
• жопсель статистика - статистика игр
• жопсель топ мата - топ матершинников
• жопсель цитата - рандомная цитата
• жопсель добавь цитату: текст
• жопсель напомни через [число] мин: текст

💡 Учить: *запомни: фраза -> ответ*
🏠 Встроенных команд: ${totalBuiltin}
🎓 Выученных команд: ${learnedCount}`,
      { parse_mode: "Markdown" },
    );
    return;
  }

  // ========== ОТВЕТ ПО УМОЛЧАНИЮ ==========
  const { botMentioned } = cleanMention(text, config);
  if (botMentioned) {
    const response = admin.getResponseForAdmin(userId);
    await bot.sendMessage(chatId, response);
    return;
  }
}

// ========== ЗАПУСК СЕРВЕРА ==========
app.post(`/webhook/${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get("/", (req, res) => res.send("Жопсель бот работает"));

app.listen(PORT, async () => {
  console.log(`✅ Сервер на порту ${PORT}`);
  console.log(`👑 Главный админ: ${config.adminId}`);
  const webhookUrl = `${process.env.RENDER_EXTERNAL_URL || "https://jopsel.onrender.com"}/webhook/${TOKEN}`;
  await bot.setWebHook(webhookUrl);
  console.log(`🔗 Вебхук: ${webhookUrl}`);
  console.log("🐶 Жопсель запущен!");
  console.log("🎮 Загружены: рулетка, монетка, кубик, магический шар");
  console.log(
    "🤬 Загружены: счётчик мата, оскорблялка, отмазка, алко-калькулятор, послать нахуй, сарказм",
  );
  console.log("📝 Загружены: цитатник, напоминания");
});

bot.on("message", handleMessage);
