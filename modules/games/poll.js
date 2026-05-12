// modules/games/poll.js
const fs = require("fs");

const POLLS_FILE = "data/polls.json";
let pollsHistory = []; // История опросов

function loadPollsHistory() {
  try {
    if (fs.existsSync(POLLS_FILE)) {
      const data = fs.readFileSync(POLLS_FILE, "utf8");
      pollsHistory = JSON.parse(data);
      console.log(`📊 Загружено ${pollsHistory.length} опросов в историю`);
    }
  } catch (e) {
    console.error("Ошибка загрузки истории опросов:", e);
  }
}

function savePollsHistory() {
  try {
    fs.writeFileSync(POLLS_FILE, JSON.stringify(pollsHistory, null, 2));
  } catch (e) {
    console.error("Ошибка сохранения истории опросов:", e);
  }
}

function parsePollCommand(text, userId) {
  // Формат: жопсель опрос: текст вопроса
  // Варианты всегда: "Да", "Нет", "ХЗ пока"

  const match = text.match(/жопсель\s+опрос:\s*(.+)/i);
  if (!match) return null;

  const question = match[1].trim();
  if (!question) return null;

  return {
    question: question,
    options: ["👍 Да", "👎 Нет", "🤔 ХЗ пока"],
  };
}

async function createPoll(bot, chatId, userId, question) {
  try {
    const poll = await bot.sendPoll(
      chatId,
      question,
      ["👍 Да", "👎 Нет", "🤔 ХЗ пока"],
      {
        is_anonymous: false,
        allows_multiple_answers: false,
        explanation: "Голосуй, быдло! 🖕",
        explanation_parse_mode: "HTML",
      },
    );

    // Сохраняем в историю
    pollsHistory.unshift({
      pollId: poll.poll.id,
      chatId: chatId,
      question: question,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      options: ["Да", "Нет", "ХЗ пока"],
    });

    // Оставляем только последние 50 опросов
    if (pollsHistory.length > 50) pollsHistory = pollsHistory.slice(0, 50);
    savePollsHistory();

    return poll;
  } catch (error) {
    console.error("Ошибка создания опроса:", error);
    return null;
  }
}

async function showLastPoll(bot, chatId) {
  const lastPoll = pollsHistory.find((p) => p.chatId === chatId);
  if (!lastPoll) {
    await bot.sendMessage(chatId, "📭 В этом чате ещё не было опросов!");
    return;
  }

  await bot.sendMessage(
    chatId,
    `📊 *Последний опрос в этом чате:*

❓ ${lastPoll.question}
📅 ${new Date(lastPoll.createdAt).toLocaleString()}

📌 Варианты:
👍 Да
👎 Нет
🤔 ХЗ пока

💡 Создать новый: *жопсель опрос: твой вопрос*`,
    { parse_mode: "Markdown" },
  );
}

module.exports = {
  loadPollsHistory,
  parsePollCommand,
  createPoll,
  showLastPoll,
};
