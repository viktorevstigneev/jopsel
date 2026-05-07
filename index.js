// index.js
import { Bot } from "gramio";
import { createMessageHandler } from "./handlers/messageHandler.js";
import { setupCommands } from "./handlers/commandHandler.js";

// ТОКЕН БОТА (ЗАМЕНИТЕ НА НОВЫЙ!)
const BOT_TOKEN = "8299226870:AAEKmJUrga6Vf67BAxZctbrPGn2M9ToXOxc";

// Создаём бота
const bot = new Bot(BOT_TOKEN);

// Подключаем обработчики
const messageHandler = createMessageHandler(bot);
bot.on("message", messageHandler);
setupCommands(bot);

// Запускаем
bot.start();

console.log("🐶 Жопсель запущен!");
console.log("📁 Структура: index.js + config.js + handlers/ + utils/");
console.log("👉 Бот слушает сообщения...");
