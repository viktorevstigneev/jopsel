const variants = [
  "ИДИ НАХУЙ, @%s!",
  "ПОШЁЛ НАХУЙ, @%s!",
  "ОТЪЕБИСЬ, @%s!",
  "@%s, ТЫ ЗАЕБАЛ, НАХУЙ!",
  "ВАЛИ В ЖОПУ, @%s!",
  "@%s, ТЫ МНЕ ВСЮ ЖИЗНЬ ИСПОРТИЛ, НАХУЙ ИДИ!",
];

function fuckoff(target) {
  const template = variants[Math.floor(Math.random() * variants.length)];
  return template.replace("%s", target);
}
module.exports = { fuckoff };
