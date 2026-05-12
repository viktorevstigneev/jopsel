const fs = require("fs");
const { getRandomFromArray } = require("./utils");

const SUB_ADMINS_FILE = "data/subadmins.json";

// Ответы для разных групп
const groupResponses = {
  g1: [
    "да, второй хозяин 👑",
    "слушаюсь, господин 🐶",
    "что прикажете, мой повелитель? 🎯",
    "я здесь, уважаемый 👑",
  ],
  g2: [
    "да, помощник хозяина 🫡",
    "чего изволите? 📝",
    "слушаюсь, командир 🐶",
    "выполняю, сэр 🎯",
  ],
  g3: [
    "что надо? 🖕",
    "не мешай работать",
    "отвали, второстепенный",
    "займись делом",
  ],
};

const mainAdminResponses = [
  "да, хозяин 👑",
  "да, мой господин 🐶",
  "да, мой повелитель 👑",
  "да, создатель 🎯",
  "слушаюсь, хозяин 🫡",
  "чего изволите, господин? 🐶",
  "я здесь, повелитель 👑",
  "что прикажете, создатель? 🎯",
];

const userResponses = [
  "лох педальный, чё надо? 🖕",
  "чё доебался? 🖕",
  "нахуй ты меня трогаешь? 🖕",
  "отвали, чмо 🖕",
  "руки убрал, петушара 🖕",
  "иди нахуй 🖕",
  "че надо, быдло? 🖕",
  "не трогай меня, дебил 🖕",
];

let subAdmins = [];
let MAIN_ADMIN_ID = null;

function initAdmin(mainAdminId) {
  MAIN_ADMIN_ID = mainAdminId;
  loadSubAdmins();
}

function loadSubAdmins() {
  try {
    if (fs.existsSync(SUB_ADMINS_FILE)) {
      const data = fs.readFileSync(SUB_ADMINS_FILE, "utf8");
      subAdmins = JSON.parse(data);
      console.log(`👥 Загружено ${subAdmins.length} под-админов`);
    }
  } catch (error) {
    console.error("Ошибка загрузки subadmins:", error);
  }
}

function saveSubAdmins() {
  try {
    fs.writeFileSync(SUB_ADMINS_FILE, JSON.stringify(subAdmins, null, 2));
    console.log(`💾 Сохранено ${subAdmins.length} под-админов`);
  } catch (error) {
    console.error("Ошибка сохранения subadmins:", error);
  }
}

function isMainAdmin(userId) {
  return userId === MAIN_ADMIN_ID;
}

function getSubAdminGroup(userId) {
  const subAdmin = subAdmins.find((a) => a.userId === userId);
  return subAdmin ? subAdmin.group : null;
}

function isAnyAdmin(userId) {
  if (isMainAdmin(userId)) return true;
  return subAdmins.some((a) => a.userId === userId);
}

function getResponseForAdmin(userId) {
  if (isMainAdmin(userId)) {
    return getRandomFromArray(mainAdminResponses);
  }
  const group = getSubAdminGroup(userId);
  if (group && groupResponses[group]) {
    return getRandomFromArray(groupResponses[group]);
  }
  return getRandomFromArray(userResponses);
}

async function addSubAdmin(message, targetUserId, group, requesterId, bot) {
  const chatId = message.chat.id;

  const canAdd =
    isMainAdmin(requesterId) || getSubAdminGroup(requesterId) === "g1";

  if (!canAdd) {
    await bot.sendMessage(
      chatId,
      "❌ Только главный админ или админы группы g1 могут добавлять других!",
    );
    return false;
  }

  if (!["g1", "g2", "g3"].includes(group)) {
    await bot.sendMessage(
      chatId,
      "❌ Неверная группа. Используй: g1, g2 или g3",
    );
    return false;
  }

  if (targetUserId === MAIN_ADMIN_ID) {
    await bot.sendMessage(
      chatId,
      "❌ Главный админ всегда главный. Его нельзя добавить как под-админа!",
    );
    return false;
  }

  const existing = subAdmins.find((a) => a.userId === targetUserId);
  if (existing) {
    await bot.sendMessage(
      chatId,
      `⚠️ Пользователь уже админ группы ${existing.group}`,
    );
    return false;
  }

  subAdmins.push({
    userId: targetUserId,
    group: group,
    addedBy: requesterId,
    addedAt: new Date().toISOString(),
  });
  saveSubAdmins();

  let userName = "Неизвестный";
  try {
    const chatMember = await bot.getChatMember(chatId, targetUserId);
    userName =
      chatMember.user.first_name || chatMember.user.username || "Пользователь";
  } catch (e) {}

  await bot.sendMessage(
    chatId,
    `✅ ${userName} добавлен как админ группы ${group.toUpperCase()}`,
  );

  try {
    await bot.sendMessage(
      targetUserId,
      `🐶 Вы назначены админом группы ${group.toUpperCase()} в боте Жопсель!
    
Главный админ: ${isMainAdmin(requesterId) ? "главный админ" : "админ группы g1"}

Ваши привилегии:
${group === "g1" ? "🌟 Можете добавлять других админов" : group === "g2" ? "📖 Только чтение команд" : "👀 Минимальные привилегии"}`,
    );
  } catch (e) {}

  return true;
}

async function removeSubAdmin(message, targetUserId, requesterId, bot) {
  const chatId = message.chat.id;

  const canRemove =
    isMainAdmin(requesterId) ||
    subAdmins.some(
      (a) => a.userId === targetUserId && a.addedBy === requesterId,
    );

  if (!canRemove) {
    await bot.sendMessage(
      chatId,
      "❌ Только главный админ или тот кто добавил может удалить админа!",
    );
    return false;
  }

  const index = subAdmins.findIndex((a) => a.userId === targetUserId);
  if (index === -1) {
    await bot.sendMessage(chatId, "❌ Пользователь не является админом");
    return false;
  }

  const removed = subAdmins.splice(index, 1)[0];
  saveSubAdmins();

  await bot.sendMessage(chatId, `🗑️ Админ группы ${removed.group} удалён`);
  return true;
}

async function showAdminsList(message, bot) {
  const chatId = message.chat.id;
  let response = "👑 *Главный админ:*\n";
  response += `   - ${MAIN_ADMIN_ID} (создатель)\n\n`;

  if (subAdmins.length > 0) {
    response += "🌟 *Под-админы:*\n";
    for (const admin of subAdmins) {
      let userName = "Неизвестный";
      try {
        const chatMember = await bot.getChatMember(chatId, admin.userId);
        userName =
          chatMember.user.first_name ||
          chatMember.user.username ||
          `ID:${admin.userId}`;
      } catch (e) {
        userName = `ID:${admin.userId}`;
      }
      response += `   - ${userName} (${admin.group})\n`;
    }
  } else {
    response += "📭 Нет под-админов\n";
  }

  response += "\n💡 Чтобы добавить: ответь на сообщение → `жопсель +админ g1`";
  await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
}

module.exports = {
  initAdmin,
  isMainAdmin,
  getSubAdminGroup,
  isAnyAdmin,
  getResponseForAdmin,
  addSubAdmin,
  removeSubAdmin,
  showAdminsList,
};
