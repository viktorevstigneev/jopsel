function calculate(beers, weight = 80, hours = 0) {
  const alcohol = beers * 0.5 * 0.8;
  const promille = alcohol / (weight * 0.7) - hours * 0.15;
  const final = Math.max(0, promille.toFixed(2));

  let status = "";
  if (final < 0.3) status = "🍺 Трезвый, можно за руль";
  else if (final < 0.8) status = "🥴 Лёгкий туман, лучше не рисковать";
  else if (final < 1.5) status = "🤪 ПИЗДЕЦ, ТЫ ПЬЯН, СОСИ БУТЫЛКУ";
  else status = "💀 ТРУП, ОТЛИВАЙСЯ, ПОКА НЕ ПОЗДНО";

  return `🍻 *Алко-калькулятор*\n\n🍺 Пива: ${beers} бутылок\n⚖️ Вес: ${weight} кг\n⏱️ Часов прошло: ${hours}\n\n📊 Промилле: *${final}*\n💬 ${status}`;
}
module.exports = { calculate };
