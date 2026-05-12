const fs = require("fs");

const QUOTES_FILE = "data/quotes.json";
let quotes = []; // [{ id, text, author, authorName, date, chatId }]

function loadQuotes() {
  try {
    if (fs.existsSync(QUOTES_FILE)) {
      quotes = JSON.parse(fs.readFileSync(QUOTES_FILE, "utf8"));
      console.log(`📝 Загружено ${quotes.length} цитат`);
    }
  } catch (e) {}
}

function saveQuotes() {
  fs.writeFileSync(QUOTES_FILE, JSON.stringify(quotes, null, 2));
}

function addQuote(text, authorId, authorName, chatId) {
  const newQuote = {
    id: Date.now(),
    text: text,
    author: authorId,
    authorName: authorName,
    date: new Date().toISOString(),
    chatId: chatId,
  };
  quotes.unshift(newQuote);
  if (quotes.length > 100) quotes = quotes.slice(0, 100);
  saveQuotes();
  return newQuote;
}

function getRandomQuote(chatId) {
  const chatQuotes = quotes.filter((q) => q.chatId === chatId);
  if (chatQuotes.length === 0) return null;
  const random = chatQuotes[Math.floor(Math.random() * chatQuotes.length)];
  return random;
}

function getLastQuote(chatId) {
  return quotes.find((q) => q.chatId === chatId) || null;
}

function getAllQuotes(chatId) {
  return quotes.filter((q) => q.chatId === chatId);
}

function deleteQuote(quoteId, userId, isAdmin) {
  const index = quotes.findIndex((q) => q.id == quoteId);
  if (index === -1) return { success: false, error: "Цитата не найдена" };

  const quote = quotes[index];
  if (quote.author === userId || isAdmin) {
    quotes.splice(index, 1);
    saveQuotes();
    return { success: true, quote: quote };
  }
  return { success: false, error: "Не твоя цитата, нехуй удалять" };
}

module.exports = {
  loadQuotes,
  addQuote,
  getRandomQuote,
  getLastQuote,
  getAllQuotes,
  deleteQuote,
};
