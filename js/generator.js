import { KEYS } from './layout.js';

export function pickKeys({ selectedRows, selectedCols }) {
  return KEYS.filter(k =>
    selectedRows.includes(k.row) && selectedCols.includes(k.col)
  ).map(k => k.char);
}

export function generatePrompt(charset, length) {
  if (charset.length === 0) return '';
  let out = '';
  let prev = '';
  for (let i = 0; i < length; i++) {
    let c;
    let tries = 0;
    do {
      c = charset[Math.floor(Math.random() * charset.length)];
      tries++;
    } while (c === prev && tries < 5 && charset.length > 1);
    out += c;
    prev = c;
  }
  return out;
}
