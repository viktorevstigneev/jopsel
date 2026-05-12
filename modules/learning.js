const fs = require("fs");

const LEARNED_FILE = "data/learned_commands.json";
let learnedCommands = [];

function loadLearnedCommands() {
  try {
    if (fs.existsSync(LEARNED_FILE)) {
      const data = fs.readFileSync(LEARNED_FILE, "utf8");
      learnedCommands = JSON.parse(data);
      console.log(`📚 Загружено ${learnedCommands.length} выученных команд`);
    }
  } catch (error) {
    console.error("Ошибка загрузки learned:", error);
  }
  return learnedCommands;
}

function saveLearnedCommands() {
  try {
    fs.writeFileSync(LEARNED_FILE, JSON.stringify(learnedCommands, null, 2));
    console.log(`💾 Сохранено ${learnedCommands.length} команд`);
  } catch (error) {
    console.error("Ошибка сохранения learned:", error);
  }
}

function getLearnedCommands() {
  return learnedCommands;
}

function addLearnedCommand(trigger, response, needMention, exactMatch) {
  const existingIndex = learnedCommands.findIndex((c) => c.trigger === trigger);
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
  return true;
}

function removeLearnedCommand(trigger) {
  const index = learnedCommands.findIndex((cmd) => cmd.trigger === trigger);
  if (index !== -1) {
    const removed = learnedCommands.splice(index, 1)[0];
    saveLearnedCommands();
    return removed;
  }
  return null;
}

function parseLearnCommand(text, botName) {
  const parts = text.split("->");
  if (parts.length !== 2) return null;

  let triggerPart = parts[0].replace(/запомни:/i, "").trim();
  let response = parts[1].trim();
  let needMention = false;
  let exactMatch = true;

  if (triggerPart.toLowerCase().includes(botName)) {
    triggerPart = triggerPart.toLowerCase().replace(botName, "").trim();
  }

  const lowerText = text.toLowerCase();
  if (lowerText.includes("с именем")) {
    needMention = true;
    response = response.replace(/с именем/gi, "").trim();
  }
  if (lowerText.includes("частично")) {
    exactMatch = false;
    response = response.replace(/частично/gi, "").trim();
  }

  const trigger = triggerPart.toLowerCase();

  if (!trigger || !response) return null;

  return { trigger, response, needMention, exactMatch };
}

module.exports = {
  loadLearnedCommands,
  getLearnedCommands,
  addLearnedCommand,
  removeLearnedCommand,
  parseLearnCommand,
};
