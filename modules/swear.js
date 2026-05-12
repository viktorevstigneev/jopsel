const fs = require("fs");

const SWEAR_FILE = "data/swear_stats.json";
let swearStats = {};

const swearWords = [
  "хуй",
  "пизда",
  "бля",
  "блять",
  "блядь",
  "нахуй",
  "ебать",
  "ебаться",
  "залупа",
  "мудила",
  "гандон",
  "пидор",
  "пидорас",
  "сучка",
  "сука",
  "уёбище",
  "ёбаный",
  "еблан",
  "дебил",
  "додик",
  "чмо",
  "лох",
  "хуесос",
];

function loadStats() {
  try {
    if (fs.existsSync(SWEAR_FILE)) {
      swearStats = JSON.parse(fs.readFileSync(SWEAR_FILE, "utf8"));
      console.log(
        `🤬 Загружена статистика мата для ${Object.keys(swearStats).length} игроков`,
      );
    }
  } catch (e) {}
}

function saveStats() {
  fs.writeFileSync(SWEAR_FILE, JSON.stringify(swearStats, null, 2));
}

function checkSwear(text, userId, userName) {
  let lowerText = text.toLowerCase();
  let foundWords = [];

  for (let word of swearWords) {
    if (lowerText.includes(word)) {
      foundWords.push(word);
    }
  }

  if (foundWords.length > 0) {
    if (!swearStats[userId]) {
      swearStats[userId] = { name: userName, count: 0 };
    }
    swearStats[userId].count += foundWords.length;
    saveStats();

    return {
      counted: true,
      count: foundWords.length,
      words: foundWords,
      total: swearStats[userId].count,
    };
  }
  return { counted: false };
}

function getTopSwearers() {
  const list = Object.entries(swearStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  if (list.length === 0) return "🤬 Пока никто не матерился!";

  let msg = "🏆 *ТОП МАТЕРЩИКОВ* 🏆\n\n";
  list.forEach(([id, data], i) => {
    msg += `${i + 1}. ${data.name || `ID:${id}`}: ${data.count} 🤬\n`;
  });
  return msg;
}

module.exports = { loadStats, checkSwear, getTopSwearers, swearWords };
