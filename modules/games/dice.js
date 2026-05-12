function roll() {
  const num = Math.floor(Math.random() * 6) + 1;
  const dice = {
    1: "⚀",
    2: "⚁",
    3: "⚂",
    4: "⚃",
    5: "⚄",
    6: "⚅",
  };
  return `🎲`;
}
module.exports = { roll };
