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

  // ========== ПРОВЕРКА НА ПОЛНЫЙ ИГНОР (M2) ==========
  if (admin.shouldIgnoreUser(userId)) {
    console.log(`🔇 Полный игнор пользователя ${userId} (группа M2)`);
    return; // Вообще не обрабатываем никакие команды
  }

  // ========== ПРОВЕРКА НА M1 ==========
  const isTrashM1 = admin.isTrashM1(userId);

  // ========== СЧЕТЧИК МАТА ==========
  const swearResult = swear.checkSwear(text, userId, msg.from.first_name);
  if (swearResult.counted && swearResult.count > 0) {
    console.log(`🤬 Заматерился на ${swearResult.count} слов`);
  }

  // ========== НАПОМИНАНИЯ ==========
  const reminderData = reminders.parseReminder(text);
  if (reminderData) {
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
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
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
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
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
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
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
    const top = swear.getTopSwearers();
    await bot.sendMessage(chatId, top, { parse_mode: "Markdown" });
    return;
  }

  // ========== ОПРОСЫ ==========
  const pollData = poll.parsePollCommand(text, userId);
  if (pollData) {
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
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
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
    await poll.showLastPoll(bot, chatId);
    return;
  }

  // ========== ИГРЫ ==========
  if (text.toLowerCase() === "жопсель рулетка") {
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
    const result = roulette.play(userId);
    await bot.sendMessage(chatId, result.message, { parse_mode: "Markdown" });
    return;
  }

  if (text.toLowerCase() === "жопсель монетка") {
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
    await bot.sendMessage(chatId, coin.flip(), { parse_mode: "Markdown" });
    return;
  }

  if (text.toLowerCase() === "жопсель кубик") {
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
    await bot.sendMessage(chatId, dice.roll(), { parse_mode: "Markdown" });
    return;
  }

  if (text.toLowerCase().startsWith("жопсель шар:")) {
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
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
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
    const response = rps.startGame(userId);
    await bot.sendMessage(chatId, response);
    return;
  }

  if (text.toLowerCase().includes("жопсель статистика")) {
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
    const userName = msg.from.first_name || "Ты";
    const response = rps.getStatsMessage(userId, userName);
    await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
    return;
  }

  if (rps.isGameActive(userId)) {
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
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
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
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
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
    await bot.sendMessage(chatId, excuses.getExcuse(), {
      parse_mode: "Markdown",
    });
    return;
  }

  if (text.toLowerCase().startsWith("жопсель промилле")) {
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
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
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
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
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
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
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
    const sound = randomSound.getRandomSound();
    await bot.sendMessage(
      chatId,
      `🔊 *РАНДОМНЫЙ ЗВУК/СТИКЕР*\n\n${sound}\n\n(тык, скачай себе)`,
      { parse_mode: "Markdown" },
    );
    return;
  }

  // ========== АДМИН-КОМАНДЫ ==========
  if (text.match(/^жопсель\s+\+админ\s+(g[123]|m[12])$/i)) {
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
    const match = text.match(/^жопсель\s+\+админ\s+(g[123]|m[12])$/i);
    const group = match[1].toLowerCase();

    if (msg.reply_to_message && msg.reply_to_message.from) {
      const targetUserId = msg.reply_to_message.from.id;
      await admin.addSubAdmin(msg, targetUserId, group, userId, bot);
    } else {
      await bot.sendMessage(
        chatId,
        "❌ Чтобы добавить админа, ответьте на сообщение пользователя и напишите:\nжопсель +админ g1\n\nГруппы: g1/g2/g3/m1/m2",
      );
    }
    return;
  }

  if (text.match(/^жопсель\s+-админ$/i)) {
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
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

  if (text.match(/^жопсель\s+смена\s+группы\s+(g[123]|m[12])$/i)) {
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
    const match = text.match(/^жопсель\s+смена\s+группы\s+(g[123]|m[12])$/i);
    const newGroup = match[1].toLowerCase();

    if (msg.reply_to_message && msg.reply_to_message.from) {
      const targetUserId = msg.reply_to_message.from.id;
      await admin.changeSubAdminGroup(msg, targetUserId, newGroup, userId, bot);
    } else {
      await bot.sendMessage(
        chatId,
        "❌ Ответь на сообщение админа и напиши:\nжопсель смена группы g3",
      );
    }
    return;
  }

  if (text.match(/^жопсель\s+опустить\s+(m[12])$/i)) {
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
    const match = text.match(/^жопсель\s+опустить\s+(m[12])$/i);
    const trashGroup = match[1].toLowerCase();

    if (msg.reply_to_message && msg.reply_to_message.from) {
      const targetUserId = msg.reply_to_message.from.id;
      await admin.changeSubAdminGroup(
        msg,
        targetUserId,
        trashGroup,
        userId,
        bot,
      );
    } else {
      await bot.sendMessage(
        chatId,
        "❌ Ответь на сообщение пользователя и напиши:\nжопсель опустить m1\n\n🤐 M1 - бот будет говорить 'я с тобой не разговариваю'\n🔇 M2 - бот полностью игнорит",
        { parse_mode: "Markdown" },
      );
    }
    return;
  }

  if (text === "жопсель админы" || text === "админы жопселя") {
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
    await admin.showAdminsList(msg, bot);
    return;
  }

  // ========== ОБУЧЕНИЕ ==========
  if (text.toLowerCase().includes("запомни:")) {
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
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
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
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
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
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
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
    await bot.sendMessage(chatId, commandResponse);
    return;
  }

  // ========== ПОЗВАЛИ ПО ИМЕНИ ==========
  const { cleanText } = cleanMention(text, config);
  if (cleanText === config.botName || cleanText === `${config.botName}?`) {
    const response = admin.getResponseForAdmin(userId);
    if (response) {
      await bot.sendMessage(chatId, response);
    }
    return;
  }

  // ========== СПИСОК ВСЕХ КОМАНД ==========
  if (cleanText.includes("список команд") || cleanText === "команды") {
    if (isTrashM1) {
      await bot.sendMessage(chatId, admin.getResponseForAdmin(userId));
      return;
    }
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
• жопсель сарказм (ответь на сообщение)

📊 *ДРУГОЕ*
• жопсель опрос: текст - создать опрос
• жопсель статистика - статистика игр
• жопсель топ мата - топ матершинников
• жопсель цитата - рандомная цитата
• жопсель добавь цитату: текст
• жопсель напомни через [число] мин: текст

👑 *АДМИН-КОМАНДЫ*
• жопсель +админ g1/g2/g3/m1/m2 (ответь на сообщение)
• жопсель -админ (ответь на сообщение)
• жопсель смена группы g1 (ответь на сообщение)
• жопсель опустить m1/m2 (ответь на сообщение)
• жопсель админы - список

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
    if (response) {
      await bot.sendMessage(chatId, response);
    }
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
  console.log("👑 Загружены: админы g1/g2/g3 и мусорные m1/m2");
});

bot.on("message", handleMessage);
