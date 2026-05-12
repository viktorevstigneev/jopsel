function flip() {
  const result = Math.random() < 0.5 ? "ОРЕЛ" : "РЕШКА";
  const emoji = result === "ОРЕЛ" ? "🦅" : "🪙";
  return `🎲 *Монетка падает...* ${emoji} *${result}!*`;
}
module.exports = { flip };
