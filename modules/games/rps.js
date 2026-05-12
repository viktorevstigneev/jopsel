const fs = require("fs");
const { getRandomFromArray } = require("../utils");

const STATS_FILE = "data/game_stats.json";
let gameStats = {};
let activeGames = new Map();

const gameResponses = {
  win: [
    "🎉 ЕБАТЬ ТЫ ЛОХ! Я ВЫИГРАЛ!",
    "😂 ХА-ХА, СОСИ БОЛЬШЕ! ЖОПСЕЛЬ КРУЧЕ!",
    "🤡 ТЫ ДУМАЛ ЧТО ВЫИГРАЕШЬ? НАХУЙ ПОШЁЛ!",
    "💪 ЖОПСЕЛЬ ПОБЕДИЛ, А ТЫ НЕТ УЁБИЩЕ!",
    "🏆 ТВОЯ МАМА РАЗОЧАРОВАНА, ЖОПСЕЛЬ ЛУЧШЕ!",
  ],
  lose: [
    "😭 БЛЯТЬ... ТЫ МЕНЯ ВЫИГРАЛ, НО Я ЕЩЁ ВЕРНУСЬ!",
    "🤬 ПИЗДЕЦ, ТЕБЕ ПОВЕЗЛО! ЕЩЁ РАЗ ДАВАЙ!",
    "😤 ЛАДНО, ВЫИГРАЛ ТЫ, НО СЧАСТЬЯ НЕ БУДЕТ!",
    "🙄 ФАРТОВЫЙ УЁБОК, ПОБЕДИЛ МЕНЯ",
    "💀 ОК, ТЫ СИЛЬНЕЕ... НО ЭТО НЕНАДОЛГО!",
  ],
  draw: [
    "🤝 НИЧЬЯ, БЫДЛО! ДАВАЙ ЕЩЁ!",
    "😐 НА ПОПУ СЯДЬ, НИЧЬЯ, ИДИ НАХУЙ",
    "🔄 ОЙ БЛЯТЬ, ОДИНАКОВО, ПЕРЕИГРАЕМ",
    "😑 НИЧЬЯ, ТЫ ТОЖЕ НИЧЕГО НЕ ВЫИГРАЛ, ЛОШАРА",
  ],
  ask: [
    "🍑 ДАВАЙ, КИДАЙ: КАМЕНЬ, НОЖНИЦЫ ИЛИ БУМАГА!",
    "✊✌️✋ ЧТО ВЫБИРАЕШЬ, ПИДОР?",
    "🎮 ИГРАЕМ? ПИШИ: КАМЕНЬ, НОЖНИЦЫ ИЛИ БУМАГА",
    "🤜 КИДАЙ ВАРИАНТ, БЫДЛО НЕУКЛЮЖЕЕ",
  ],
};

function loadGameStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const data = fs.readFileSync(STATS_FILE, "utf8");
      gameStats = JSON.parse(data);
      console.log(
        `🎮 Загружена статистика для ${Object.keys(gameStats).length} игроков`,
      );
    }
  } catch (e) {
    console.error("Ошибка загрузки статистики:", e);
  }
}

function saveGameStats() {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(gameStats, null, 2));
  } catch (e) {
    console.error("Ошибка сохранения статистики:", e);
  }
}

function getGameStats(userId) {
  if (!gameStats[userId]) {
    gameStats[userId] = { wins: 0, losses: 0, draws: 0 };
  }
  return gameStats[userId];
}

function updateGameStats(userId, result) {
  const stats = getGameStats(userId);
  if (result === "win") stats.wins++;
  else if (result === "lose") stats.losses++;
  else if (result === "draw") stats.draws++;
  saveGameStats();
}

function determineWinner(userChoice, botChoice) {
  if (userChoice === botChoice) return "draw";
  if (
    (userChoice === "камень" && botChoice === "ножницы") ||
    (userChoice === "ножницы" && botChoice === "бумага") ||
    (userChoice === "бумага" && botChoice === "камень")
  ) {
    return "lose";
  }
  return "win";
}

function startGame(userId) {
  activeGames.set(userId, { waiting: true });
  return getRandomFromArray(gameResponses.ask);
}

function isGameActive(userId) {
  const game = activeGames.get(userId);
  return game && game.waiting;
}

function processMove(userId, text, userName) {
  const game = activeGames.get(userId);
  if (!game || !game.waiting) return null;

  const lowerText = text.toLowerCase().trim();
  let userChoice = null;

  if (lowerText.includes("камень")) userChoice = "камень";
  else if (lowerText.includes("ножницы")) userChoice = "ножницы";
  else if (lowerText.includes("бумага")) userChoice = "бумага";

  if (!userChoice)
    return {
      error: true,
      message: "❌ ПИШИ НОРМАЛЬНО: КАМЕНЬ, НОЖНИЦЫ ИЛИ БУМАГА, ДЕБИЛ!",
    };

  const botChoices = ["камень", "ножницы", "бумага"];
  const botChoice = botChoices[Math.floor(Math.random() * botChoices.length)];

  const result = determineWinner(userChoice, botChoice);
  updateGameStats(userId, result);

  const botChoiceEmoji =
    botChoice === "камень" ? "✊" : botChoice === "ножницы" ? "✌️" : "✋";
  const userChoiceEmoji =
    userChoice === "камень" ? "✊" : userChoice === "ножницы" ? "✌️" : "✋";

  let resultMessage = "";
  let responseType = "";

  if (result === "win") {
    resultMessage = `🎲 *Жопсель выбрал:* ${botChoiceEmoji} ${botChoice}\n\n🏆 *РЕЗУЛЬТАТ:* Я ВЫИГРАЛ, ТЫ ЛОХ!\n\n${getRandomFromArray(gameResponses.win)}`;
    responseType = "win";
  } else if (result === "lose") {
    resultMessage = `🎲 *Жопсель выбрал:* ${botChoiceEmoji} ${botChoice}\n\n💀 *РЕЗУЛЬТАТ:* ТЫ ВЫИГРАЛ, НО ЭТО СЛУЧАЙНО!\n\n${getRandomFromArray(gameResponses.lose)}`;
    responseType = "lose";
  } else {
    resultMessage = `🎲 *Жопсель выбрал:* ${botChoiceEmoji} ${botChoice}\n\n🤝 *РЕЗУЛЬТАТ:* НИЧЬЯ, ЕБЛАН!\n\n${getRandomFromArray(gameResponses.draw)}`;
    responseType = "draw";
  }

  const stats = getGameStats(userId);
  resultMessage += `\n\n📊 СЧЁТ: Побед ${stats.wins} | Поражений ${stats.losses} | Ничьих ${stats.draws}`;

  activeGames.delete(userId);

  return { error: false, message: resultMessage };
}

function getStatsMessage(userId, userName) {
  const stats = getGameStats(userId);
  return `📊 *Статистика игры для ${userName}* 🎮\n\n🏆 *Побед:* ${stats.wins}\n💀 *Поражений:* ${stats.losses}\n🤝 *Ничьих:* ${stats.draws}\n📈 *Всего игр:* ${stats.wins + stats.losses + stats.draws}\n\n✊ Камень ✌️ Ножницы ✋ Бумага\n\n💡 Чтобы играть: *жопсель игра*`;
}

module.exports = {
  loadGameStats,
  startGame,
  isGameActive,
  processMove,
  getStatsMessage,
};
