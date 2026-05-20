import { KEYS } from './layout.js';

// カラムスタッガーのオフセット (px) — 薬指列(3,8)が基準
const COL_OFFSET = { 1: 10, 2: 4, 3: 0, 4: 4, 5: 10, 6: 10, 7: 4, 8: 0, 9: 4, 10: 10 };
const ROW_ORDER  = ['top', 'home', 'bottom'];

export function buildKeyboard(container) {
  container.innerHTML = '';

  const leftDiv = document.createElement('div');
  leftDiv.className = 'hand left';
  for (let col = 1; col <= 5; col++) leftDiv.appendChild(buildCol(col));

  const rightDiv = document.createElement('div');
  rightDiv.className = 'hand right';
  for (let col = 6; col <= 10; col++) rightDiv.appendChild(buildCol(col));

  container.appendChild(leftDiv);
  container.appendChild(rightDiv);
}

function buildCol(col) {
  const div = document.createElement('div');
  div.className = 'key-col';
  div.style.marginTop = COL_OFFSET[col] + 'px';

  KEYS
    .filter(k => k.col === col)
    .sort((a, b) => ROW_ORDER.indexOf(a.row) - ROW_ORDER.indexOf(b.row))
    .forEach(k => {
      const el = document.createElement('div');
      el.className = 'key';
      el.dataset.char = k.char;
      el.dataset.row = k.row;
      el.dataset.col = String(k.col);
      el.textContent = k.char.toUpperCase();
      div.appendChild(el);
    });

  return div;
}

export function updateHighlight(targetSet, nextChar, container) {
  container.querySelectorAll('.key').forEach(el => {
    const char = el.dataset.char;
    el.classList.remove('in-set', 'next', 'disabled');
    if (targetSet.has(char)) {
      el.classList.add('in-set');
      if (nextChar && char === nextChar) el.classList.add('next');
    } else {
      el.classList.add('disabled');
    }
  });
}

export function flashKey(char, correct, container) {
  const el = container.querySelector(`.key[data-char="${char}"]`);
  if (!el) return;
  const cls = correct ? 'flash-ok' : 'flash-err';
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 120);
}
