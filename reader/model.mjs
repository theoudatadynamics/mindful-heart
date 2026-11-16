export function quoteForDay(quotes, now = Date.now()) {
  return quotes[Math.floor(now / 86400000) % quotes.length];
}
export function quoteFromHash(quotes, hash) {
  const match = /^#q=(classic-\d{2})$/.exec(hash);
  return match ? quotes.find(q => q.id === match[1]) : undefined;
}
export function savedIDs(quotes, value) {
  if (!Array.isArray(value)) return [];
  const valid = new Set(quotes.map(q => q.id));
  return [...new Set(value.filter(x => typeof x === 'string' && valid.has(x)))];
}
export function quoteLink(location, quote) {
  const url = new URL(location);
  url.search = ''; url.hash = `q=${quote.id}`;
  return url.href;
}
export function nextQuote(quotes, current) {
  return quotes[(quotes.findIndex(q => q.id === current.id) + 1) % quotes.length];
}
