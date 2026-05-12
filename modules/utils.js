// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function isBotMentioned(text, config) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  if (lowerText.includes(config.botName)) return true;
  for (const alias of config.nameAliases) {
    if (lowerText.includes(alias)) return true;
  }
  return false;
}

function cleanMention(text, config) {
  let cleanText = text.toLowerCase().trim();
  const botMentioned = isBotMentioned(text, config);

  if (botMentioned) {
    cleanText = cleanText.replace(config.botName, "").trim();
    for (const alias of config.nameAliases) {
      cleanText = cleanText.replace(alias, "").trim();
    }
    cleanText = cleanText.replace(/\s+/g, " ").trim();
  }

  return { cleanText, botMentioned };
}

function getRandomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = {
  isBotMentioned,
  cleanMention,
  getRandomFromArray,
};
