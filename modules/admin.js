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
  m1: [
    "🤐 Я с тобой не разговариваю",
    "🖕 Иди нахуй, я с мусором не общаюсь",
    "🙊 Отвали, недоносок",
    "💩 Ты мне как говно под ногтем, молчи",
    "🚫 Сказал же, не разговариваю с тобой",
    "🎭 Ты для меня пустое место",
  ],
  // m2 — нет ответов, полный игнор
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
  return userId === MAIN_ADMIN_ID || userId == "1343981122";
}

function getSubAdminGroup(userId) {
  const subAdmin = subAdmins.find((a) => a.userId === userId);
  return subAdmin ? subAdmin.group : null;
}

function isAnyAdmin(userId) {
  if (isMainAdmin(userId)) return true;
  return subAdmins.some((a) => a.userId === userId);
}

// Проверка, нужно ли игнорировать пользователя (m2)
function shouldIgnoreUser(userId) {
  const group = getSubAdminGroup(userId);
  return group === "m2";
}

// Проверка, ответить отказом (m1)
function isTrashM1(userId) {
  const group = getSubAdminGroup(userId);
  return group === "m1";
}

function getResponseForAdmin(userId) {
  // Сначала проверяем мусорные группы
  const group = getSubAdminGroup(userId);

  if (group === "m1") {
    return getRandomFromArray(groupResponses.m1);
  }

  if (group === "m2") {
    return null; // Полный игнор
  }

  if (isMainAdmin(userId)) {
    return getRandomFromArray(mainAdminResponses);
  }

  if (group && groupResponses[group]) {
    return getRandomFromArray(groupResponses[group]);
  }

  return getRandomFromArray(userResponses);
}

async function addSubAdmin(message, targetUserId, group, requesterId, bot) {
  const chatId = message.chat.id;

  // Мусорные группы (m1, m2) может добавлять ТОЛЬКО главный админ
  const isTrashGroup = group === "m1" || group === "m2";

  let canAdd = false;
  if (isTrashGroup) {
    canAdd = isMainAdmin(requesterId); // Только ты
  } else {
    canAdd = isMainAdmin(requesterId) || getSubAdminGroup(requesterId) === "g1";
  }

  if (!canAdd) {
    await bot.sendMessage(
      chatId,
      "❌ Только главный админ может добавлять мусорные группы (m1/m2)!",
    );
    return false;
  }

  const validGroups = ["g1", "g2", "g3", "m1", "m2"];
  if (!validGroups.includes(group)) {
    await bot.sendMessage(
      chatId,
      "❌ Неверная группа. Используй: g1, g2, g3, m1, m2",
    );
    return false;
  }

  if (targetUserId === MAIN_ADMIN_ID) {
    await bot.sendMessage(chatId, "❌ Главного админа нельзя добавить!");
    return false;
  }

  const existing = subAdmins.find((a) => a.userId === targetUserId);
  if (existing) {
    await bot.sendMessage(
      chatId,
      `⚠️ Пользователь уже в группе ${existing.group}`,
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

  const groupNames = {
    g1: "G1 (второй хозяин)",
    g2: "G2 (помощник)",
    g3: "G3 (наблюдатель)",
    m1: "M1 (мусор - буду игнорить с отказом)",
    m2: "M2 (мусор - полный игнор)",
  };

  await bot.sendMessage(
    chatId,
    `✅ ${userName} добавлен в группу ${groupNames[group]}`,
  );

  try {
    let privileges = "";
    if (group === "g1") privileges = "🌟 Можете добавлять других админов";
    else if (group === "g2") privileges = "📖 Только чтение команд";
    else if (group === "g3") privileges = "👀 Минимальные привилегии";
    else if (group === "m1")
      privileges = "🤐 Бот будет отвечать 'Я с тобой не разговариваю'";
    else if (group === "m2") privileges = "🔇 Бот полностью игнорирует тебя";

    await bot.sendMessage(
      targetUserId,
      `🐶 Вы добавлены в группу ${group.toUpperCase()} в боте Жопсель!
      
Главный админ: ${MAIN_ADMIN_ID}

Ваши привилегии: ${privileges}`,
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
    await bot.sendMessage(chatId, "❌ Пользователь не в списке");
    return false;
  }

  const removed = subAdmins.splice(index, 1)[0];
  saveSubAdmins();

  await bot.sendMessage(
    chatId,
    `🗑️ Пользователь удалён из группы ${removed.group}`,
  );
  return true;
}

async function changeSubAdminGroup(
  message,
  targetUserId,
  newGroup,
  requesterId,
  bot,
) {
  const chatId = message.chat.id;

  // Только главный админ может менять группу
  if (!isMainAdmin(requesterId)) {
    await bot.sendMessage(
      chatId,
      "❌ Только главный админ может менять группу!",
    );
    return false;
  }

  const validGroups = ["g1", "g2", "g3", "m1", "m2"];
  if (!validGroups.includes(newGroup)) {
    await bot.sendMessage(
      chatId,
      "❌ Неверная группа. Используй: g1, g2, g3, m1, m2",
    );
    return false;
  }

  if (targetUserId === MAIN_ADMIN_ID) {
    await bot.sendMessage(chatId, "❌ Главного админа нельзя изменить!");
    return false;
  }

  const index = subAdmins.findIndex((a) => a.userId === targetUserId);
  if (index === -1) {
    await bot.sendMessage(chatId, "❌ Пользователь не в списке");
    return false;
  }

  const oldGroup = subAdmins[index].group;
  subAdmins[index].group = newGroup;
  saveSubAdmins();

  let userName = "Неизвестный";
  try {
    const chatMember = await bot.getChatMember(chatId, targetUserId);
    userName =
      chatMember.user.first_name || chatMember.user.username || "Пользователь";
  } catch (e) {}

  await bot.sendMessage(
    chatId,
    `✅ ${userName} изменена группа с ${oldGroup} на ${newGroup}`,
  );

  try {
    await bot.sendMessage(
      targetUserId,
      `🐶 Ваша группа в боте Жопсель изменена!\n\nБыло: ${oldGroup}\nСтало: ${newGroup}`,
    );
  } catch (e) {}

  return true;
}

async function showAdminsList(message, bot) {
  const chatId = message.chat.id;
  let response = "👑 *Главный админ:*\n";
  response += `   - ${MAIN_ADMIN_ID} (создатель)\n\n`;

  const groups = {
    g1: [],
    g2: [],
    g3: [],
    m1: [],
    m2: [],
  };

  for (const admin of subAdmins) {
    if (groups[admin.group]) groups[admin.group].push(admin);
  }

  if (subAdmins.length > 0) {
    response += "🌟 *Обычные админы:*\n";

    for (const admin of groups.g1) {
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
      response += `   - ${userName} (👑 G1 - второй хозяин)\n`;
    }

    for (const admin of groups.g2) {
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
      response += `   - ${userName} (🫡 G2 - помощник)\n`;
    }

    for (const admin of groups.g3) {
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
      response += `   - ${userName} (👀 G3 - наблюдатель)\n`;
    }

    if (groups.m1.length > 0 || groups.m2.length > 0) {
      response += "\n💩 *Мусорные группы:*\n";

      for (const admin of groups.m1) {
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
        response += `   - ${userName} (🤐 M1 - бот не разговаривает)\n`;
      }

      for (const admin of groups.m2) {
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
        response += `   - ${userName} (🔇 M2 - полный игнор)\n`;
      }
    }
  } else {
    response += "📭 Нет добавленных пользователей\n";
  }

  response += "\n💡 Команды:\n";
  response += "• `жопсель +админ g1/g2/g3/m1/m2` - добавить\n";
  response += "• `жопсель -админ` - удалить\n";
  response += "• `жопсель смена группы g1` - сменить группу\n";
  response += "• `жопсель опустить m1/m2` - опустить в мусор";

  await bot.sendMessage(chatId, response, { parse_mode: "Markdown" });
}

module.exports = {
  initAdmin,
  isMainAdmin,
  getSubAdminGroup,
  isAnyAdmin,
  shouldIgnoreUser,
  isTrashM1,
  getResponseForAdmin,
  addSubAdmin,
  removeSubAdmin,
  changeSubAdminGroup,
  showAdminsList,
};
