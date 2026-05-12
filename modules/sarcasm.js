function sarcasm(text) {
  let result = "";
  let upper = false;
  for (let char of text) {
    if (char.match(/[a-zA-Zа-яА-Я]/)) {
      result += upper ? char.toUpperCase() : char.toLowerCase();
      upper = !upper;
    } else {
      result += char;
    }
  }
  return `😏 *Сарказм-режим:*\n\n${result}`;
}
module.exports = { sarcasm };
