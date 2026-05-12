const sounds = [
  "https://t.me/addstickers/bsdsh",
  "https://t.me/addstickers/dota2st_best",
  "https://t.me/addstickers/habr",
];

function getRandomSound() {
  return sounds[Math.floor(Math.random() * sounds.length)];
}
module.exports = { getRandomSound };
