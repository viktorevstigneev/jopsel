// utils/helpers.js
import { config } from "../config.js";

// Проверка, обращаются ли к боту
export function isBotMentioned(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();

  if (lowerText.includes(config.botName)) return true;

  for (const alias of config.nameAliases) {
    if (lowerText.includes(alias)) return true;
  }
  return false;
}

// Проверка на "доброе утро"
export function isGoodMorning(text) {
  const lowerText = text.toLowerCase();
  for (const trigger of config.goodMorningTriggers) {
    if (lowerText.includes(trigger)) return true;
  }
  return false;
}

// Случайный ответ для доброго утра
export function getRandomGoodMorningResponse() {
  const randomIndex = Math.floor(
    Math.random() * config.goodMorningResponses.length,
  );
  return config.goodMorningResponses[randomIndex];
}

// Проверка кастомных команд
export function checkCustomCommand(text) {
  const lowerText = text.toLowerCase();
  for (const [trigger, response] of Object.entries(config.customCommands)) {
    if (lowerText.includes(trigger)) {
      return response;
    }
  }
  return null;
}

// Обучение новой команде (динамическое добавление)
export function learnNewCommand(text, customCommands) {
  // Ищем "запомни:" в тексте
  if (!text.includes("запомни:")) return null;

  // Парсим: запомни: фраза -> ответ
  const parts = text.split("->");
  if (parts.length !== 2) return null;

  const triggerPart = parts[0];
  const newResponse = parts[1].trim();

  // Извлекаем фразу после "запомни:"
  const zapomniIndex = triggerPart.indexOf("запомни:");
  if (zapomniIndex === -1) return null;

  let newTrigger = triggerPart
    .substring(zapomniIndex + "запомни:".length)
    .trim();

  // Убираем имя бота из фразы если есть
  if (newTrigger.toLowerCase().startsWith(config.botName)) {
    newTrigger = newTrigger.slice(config.botName.length).trim();
  }

  if (!newTrigger || !newResponse) return null;

  return { trigger: newTrigger.toLowerCase(), response: newResponse };
}
