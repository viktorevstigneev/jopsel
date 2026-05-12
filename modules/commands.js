const { cleanMention } = require("./utils");

let config = null;
let learnedCommands = [];

function initCommands(cfg, learned) {
  config = cfg;
  learnedCommands = learned;
}

function checkAllCommands(text) {
  if (!text || !config) return null;

  const { cleanText, botMentioned } = cleanMention(text, config);

  const allCommands = [...config.commands, ...learnedCommands];
  const sortedCommands = [...allCommands].sort(
    (a, b) => b.trigger.length - a.trigger.length,
  );

  for (const cmd of sortedCommands) {
    let matched = false;

    if (cmd.exactMatch !== false) {
      if (cleanText === cmd.trigger) {
        matched = true;
      }
    } else {
      if (cleanText.includes(cmd.trigger)) {
        matched = true;
      }
    }

    if (matched) {
      if (cmd.needMention === true && !botMentioned) {
        continue;
      }

      if (cmd.randomResponse && cmd.responses && Array.isArray(cmd.responses)) {
        return cmd.responses[Math.floor(Math.random() * cmd.responses.length)];
      }
      return cmd.response;
    }
  }
  return null;
}

module.exports = {
  initCommands,
  checkAllCommands,
};
