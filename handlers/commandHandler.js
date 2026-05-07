// handlers/commandHandler.js
import { config } from "../config.js";
import { getCustomCommands } from "./messageHandler.js";

export function setupCommands(bot) {
  // Команда /start
  bot.command("start", async (context) => {
    await context.send(config.welcomeMessage, { parse_mode: "Markdown" });
  });

  // Команда /help
  bot.command("help", async (context) => {
    const commands = getCustomCommands();
    const commandsList = Object.keys(commands).slice(0, 10).join(", ");

    await context.send(
      `
📖 *Помощь Жопселя*

*Основные команды:*
• доброе утро — пожелание дня
• нароод / народ — приветствие

*Выученные команды:* ${commandsList || "пока нет"}

*Научи меня:* \`жопсель запомни: фраза -> ответ\`

*Все команды:* напиши \`жопсель список команд\`
        `.trim(),
      { parse_mode: "Markdown" },
    );
  });

  // Реагируем на "жопсель help"
  bot.hears(new RegExp(`${config.botName}.*help`, "i"), async (context) => {
    await context.send("📖 Напиши /help для списка команд!");
  });
}
