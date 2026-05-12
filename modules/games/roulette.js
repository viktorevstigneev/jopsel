const fs = require("fs");

const STATS_FILE = "data/roulette_stats.json";
let stats = {};

function loadStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      stats = JSON.parse(fs.readFileSync(STATS_FILE, "utf8"));
      console.log(
        `🔫 Загружена статистика рулетки для ${Object.keys(stats).length} игроков`,
      );
    }
  } catch (e) {}
}

function saveStats() {
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
}

function getStats(userId) {
  if (!stats[userId]) stats[userId] = { survived: 0, dead: 0 };
  return stats[userId];
}

function play(userId) {
  const chamber = Math.floor(Math.random() * 6) + 1;
  const bullet = Math.floor(Math.random() * 6) + 1;
  const dead = chamber === bullet;

  const userStats = getStats(userId);
  if (dead) {
    userStats.dead++;
    saveStats();
    return {
      dead: true,
      chamber: chamber,
      bullet: bullet,
      message: `💥 *БАБАХ!* 💥\n\nПатрон был в гнезде ${bullet} 🔫\nТы крутанул барабан и выпало гнездо ${chamber}\n\n☠️ *ТЫ УМЕР, ПИДОР!* ☠️\n\nСтатистика: 💀 Смертей: ${userStats.dead} | 😇 Выживаний: ${userStats.survived}`,
    };
  } else {
    userStats.survived++;
    saveStats();
    return {
      dead: false,
      chamber: chamber,
      bullet: bullet,
      message: `😅 *КЛИК!* 😅\n\nПатрон был в гнезде ${bullet} 🔫\nТы крутанул барабан и выпало гнездо ${chamber}\n\n🍺 *ТЫ ВЫЖИЛ, УЁБИЩЕ!* 🍺\n\nСтатистика: 💀 Смертей: ${userStats.dead} | 😇 Выживаний: ${userStats.survived}`,
    };
  }
}

function getLeaderboard() {
  const list = Object.entries(stats)
    .map(([id, s]) => ({
      id: id,
      dead: s.dead,
      survived: s.survived,
      total: s.dead + s.survived,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  if (list.length === 0)
    return "🔫 Пока никто не играл! Напиши *жопсель рулетка*";

  let msg = "🏆 *ТОП СМЕЛЬЧАКОВ* 🏆\n\n";
  list.forEach((p, i) => {
    msg += `${i + 1}. ${p.id === "admin" ? "👑 АДМИН" : `ID:${p.id}`}\n`;
    msg += `   💀 Смертей: ${p.dead} | 😇 Выживаний: ${p.survived} | 🎮 Игр: ${p.total}\n\n`;
  });
  return msg;
}

module.exports = { loadStats, play, getLeaderboard };
