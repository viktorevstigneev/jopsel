// handlers/messageHandler.js
import { config } from "../config.js";
import {
  isBotMentioned,
  isGoodMorning,
  getRandomGoodMorningResponse,
  checkCustomCommand,
  learnNewCommand,
} from "../utils/helpers.js";

// Сохраняем ссылку на customCommands, чтобы можно было динамически добавлять
let customCommands = { ...config.customCommands };

// Получить текущие команды (для других модулей)
export function getCustomCommands() {
  return customCommands;
}

// Основной обработчик сообщений
export function createMessageHandler(bot) {
  return async (context) => {
    const text = context.message.text;
    if (!text) return;

    // Проверяем, обращаются ли к боту
    if (!isBotMentioned(text)) return;

    console.log(`[Жопсель] Получено: ${text}`);

    // Приоритет 1: Обучение новой команде
    const newCommand = learnNewCommand(text, customCommands);
    if (newCommand) {
      customCommands[newCommand.trigger] = newCommand.response;
      await context.send(
        `✅ Запомнил! Теперь на "${newCommand.trigger}" буду отвечать "${newCommand.response}"`,
      );
      return;
    }

    // Приоритет 2: Доброе утро
    if (isGoodMorning(text)) {
      await context.send(getRandomGoodMorningResponse());
      return;
    }

    // Приоритет 3: Кастомные команды
    const customResponse = checkCustomCommand(text);
    if (customResponse) {
      await context.send(customResponse);
      return;
    }

    // Приоритет 4: Просто позвали по имени
    const cleanText = text.toLowerCase().trim();
    if (
      cleanText === config.botName ||
      cleanText === `${config.botName}?` ||
      cleanText === `${config.botName}!`
    ) {
      await context.send("Чё? 😼");
      return;
    }

    // Приоритет 5: Показать список команд
    if (cleanText.includes("список команд")) {
      const commandsList = Object.entries(customCommands)
        .slice(0, 15) // Показываем не больше 15
        .map(([trigger, response]) => `• "${trigger}" → "${response}"`)
        .join("\n");

      await context.send(
        `
📚 *Команды Жопселя:*

${commandsList || "Пока нет выученных команд!"}

Всего: ${Object.keys(customCommands).length} команд
            `.trim(),
        { parse_mode: "Markdown" },
      );
      return;
    }

    // Приоритет 6: Ответ по умолчанию
    await context.send(config.defaultResponse);
  };
}
