const fs = require("fs");

const REMINDERS_FILE = "data/reminders.json";
let reminders = [];

function loadReminders() {
  try {
    if (fs.existsSync(REMINDERS_FILE)) {
      reminders = JSON.parse(fs.readFileSync(REMINDERS_FILE, "utf8"));
      console.log(`⏰ Загружено ${reminders.length} напоминаний`);
    }
  } catch (e) {}
}

function saveReminders() {
  fs.writeFileSync(REMINDERS_FILE, JSON.stringify(reminders, null, 2));
}

function parseReminder(text) {
  // Формат: жопсель напомни через [число] [мин/часов/дней] [текст]
  const match = text.match(
    /жопсель\s+напомни\s+через\s+(\d+)\s+(минут?|минуты?|часов?|дней?|дня?)\s+(.+)/i,
  );
  if (!match) return null;

  let amount = parseInt(match[1]);
  let unit = match[2].toLowerCase();
  let message = match[3].trim();

  let milliseconds = 0;
  if (unit.startsWith("минут")) milliseconds = amount * 60 * 1000;
  else if (unit.startsWith("ча")) milliseconds = amount * 60 * 60 * 1000;
  else if (unit.startsWith("дн")) milliseconds = amount * 24 * 60 * 60 * 1000;
  else return null;

  return { delay: milliseconds, message: message };
}

function addReminder(userId, chatId, delay, message) {
  const reminder = {
    id: Date.now(),
    userId: userId,
    chatId: chatId,
    message: message,
    time: Date.now() + delay,
  };
  reminders.push(reminder);
  saveReminders();
  return reminder;
}

function getDueReminders() {
  const now = Date.now();
  const due = reminders.filter((r) => r.time <= now);
  reminders = reminders.filter((r) => r.time > now);
  saveReminders();
  return due;
}

function getUserReminders(userId, chatId) {
  return reminders.filter((r) => r.userId === userId && r.chatId === chatId);
}

function deleteReminder(userId, reminderId) {
  const index = reminders.findIndex(
    (r) => r.id == reminderId && r.userId === userId,
  );
  if (index !== -1) {
    reminders.splice(index, 1);
    saveReminders();
    return true;
  }
  return false;
}

module.exports = {
  loadReminders,
  parseReminder,
  addReminder,
  getDueReminders,
  getUserReminders,
  deleteReminder,
};
