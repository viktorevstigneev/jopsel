const excuses = [
  "у меня кот на клавиатуру наступил",
  "я не я, и хата не моя",
  "меня похитили инопланетяне",
  "я болел — заболеванием тупизм",
  "у меня лагало время",
  "я был в запое (уже 3 года)",
  "мат в чате забанили, я без мата не могу",
];

function getExcuse() {
  return `📢 *ОТМАЗКА:* ${excuses[Math.floor(Math.random() * excuses.length)]}`;
}
module.exports = { getExcuse };
