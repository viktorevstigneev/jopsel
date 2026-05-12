const answers = [
  "🎱 БЕЗУСЛОВНО ДА, ЛОШАРА!",
  "🎱 НЕТ, ДАЖЕ НЕ НАДЕЙСЯ!",
  "🎱 ВОЗМОЖНО, НО ХУЙ ЗНАЕТ",
  "🎱 СПРОСИ ПОЗЖЕ, УЁБИЩЕ",
  "🎱 100% ДА, ПИДОР!",
  "🎱 ТЫ ШУТИШЬ? КОНЕЧНО НЕТ!",
];

function ask(question) {
  return `❓ *Вопрос:* ${question}\n\n${answers[Math.floor(Math.random() * answers.length)]}`;
}
module.exports = { ask };
