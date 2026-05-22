import { KEYS, LAYER1_KEYS, LAYER2_KEYS, LAYER3_KEYS, LAYER4_KEYS } from './layout.js';

const COL_OFFSET = { 1: 10, 2: 4, 3: 0, 4: 4, 5: 10, 6: 10, 7: 4, 8: 0, 9: 4, 10: 10 };
const ROW_ORDER  = ['top', 'home', 'bottom'];

const SPECIAL_LABELS = { enter: '⏎', bspc: '⌫' };

// レイヤー定義 (タブ表示用)
export const LAYER_DEFS = [
  { id: 0, label: 'Base',  sublabel: 'L0',   keys: null },   // KEYS から生成
  { id: 1, label: 'SYM',   sublabel: 'L1 (Space)',  keys: LAYER1_KEYS },
  { id: 2, label: 'NAV',   sublabel: 'L2 (Tab)',    keys: LAYER2_KEYS },
  { id: 3, label: 'TMUX',  sublabel: 'L3 (Lang2)',  keys: LAYER3_KEYS },
  { id: 4, label: 'NUM',   sublabel: 'L4 (SYM+TMUX)', keys: LAYER4_KEYS },
];

// HRM 左右対応表
const HRM_COUNTERPART = {
  'a': 'enter', 'enter': 'a',
  's': 'l',     'l':     's',
  'd': 'k',     'k':     'd',
  'f': 'j',     'j':     'f',
};

// layer の表示ラベルマップ (col-row → display)
function buildLabelMap(layer) {
  const map = new Map();

  // L0 ベース (常に物理キー配置)
  for (const k of KEYS) {
    map.set(`${k.col}-${k.row}`, {
      char:    k.char,
      display: SPECIAL_LABELS[k.char] ?? k.char.toUpperCase(),
      col: k.col, row: k.row, hand: k.hand,
    });
  }

  if (layer === 0) return map;

  const layerKeys = LAYER_DEFS.find(d => d.id === layer)?.keys ?? [];

  // 物理キーがある場合は上書き、ない場合は既存表示を空に
  const coveredCoords = new Set(layerKeys.filter(k => k.physicalKey).map(k => {
    const phys = KEYS.find(b => b.char === k.physicalKey);
    return phys ? `${phys.col}-${phys.row}` : null;
  }).filter(Boolean));

  for (const [coord, entry] of map) {
    if (!coveredCoords.has(coord)) {
      entry.display = '';  // このレイヤーで定義なし → 空白
    }
  }
  for (const k of layerKeys) {
    if (!k.physicalKey) continue;
    const phys = KEYS.find(b => b.char === k.physicalKey);
    if (!phys) continue;
    const coord = `${phys.col}-${phys.row}`;
    if (map.has(coord)) map.get(coord).display = k.display;
  }

  return map;
}

// キーボードを構築 (layer 番号を受け取り、そのレイヤーのキーを表示)
export function buildKeyboard(container, layer = 0) {
  container.innerHTML = '';
  container.dataset.layer = String(layer);

  const labelMap = buildLabelMap(layer);

  const leftDiv  = document.createElement('div');
  leftDiv.className  = 'hand left';
  const rightDiv = document.createElement('div');
  rightDiv.className = 'hand right';

  for (let col = 1; col <= 5; col++)  leftDiv.appendChild(buildCol(col, labelMap));
  for (let col = 6; col <= 10; col++) rightDiv.appendChild(buildCol(col, labelMap));

  container.appendChild(leftDiv);
  container.appendChild(rightDiv);
}

function buildCol(col, labelMap) {
  const div = document.createElement('div');
  div.className = 'key-col';
  div.style.marginTop = COL_OFFSET[col] + 'px';

  const colKeys = [...labelMap.values()]
    .filter(k => k.col === col)
    .sort((a, b) => ROW_ORDER.indexOf(a.row) - ROW_ORDER.indexOf(b.row));

  for (const k of colKeys) {
    const el = document.createElement('div');
    el.className = 'key';
    el.dataset.char = k.char;
    el.dataset.row  = k.row;
    el.dataset.col  = String(k.col);
    el.textContent  = k.display;
    if (!k.display) el.classList.add('key-empty');
    div.appendChild(el);
  }
  return div;
}

// レイヤー切替 (変更があるときのみ再描画)
export function renderLayer(container, layer) {
  if (parseInt(container.dataset.layer) !== layer) {
    buildKeyboard(container, layer);
  }
}

// ハイライト
export function updateHighlight(targetPhysicalKeys, nextPhysicalKey, container) {
  container.querySelectorAll('.key').forEach(el => {
    const char = el.dataset.char;
    el.classList.remove('in-set', 'next', 'disabled', 'mod-key', 'target-key');
    if (targetPhysicalKeys.has(char)) {
      el.classList.add('in-set');
      if (nextPhysicalKey && char === nextPhysicalKey) el.classList.add('next');
    } else {
      el.classList.add('disabled');
    }
  });
}

// ショートカット: モディファイア (左右両方) + ターゲット
export function highlightShortcut(item, container) {
  const physicalKeys = item.physicalKeys || (item.physicalKey ? [item.physicalKey] : []);

  container.querySelectorAll('.key').forEach(el => {
    el.classList.remove('in-set', 'next', 'disabled', 'mod-key', 'target-key');
    el.classList.add('disabled');
  });

  if (physicalKeys.length >= 2) {
    const modKey  = physicalKeys[0];
    const tgtKey  = physicalKeys[physicalKeys.length - 1];
    const modKey2 = HRM_COUNTERPART[modKey];

    for (const mk of [modKey, modKey2].filter(Boolean)) {
      const el = container.querySelector(`.key[data-char="${mk}"]`);
      if (el) { el.classList.remove('disabled'); el.classList.add('mod-key'); }
    }
    const tgtEl = container.querySelector(`.key[data-char="${tgtKey}"]`);
    if (tgtEl) { tgtEl.classList.remove('disabled'); tgtEl.classList.add('target-key'); }
  } else if (physicalKeys.length === 1) {
    const el = container.querySelector(`.key[data-char="${physicalKeys[0]}"]`);
    if (el) { el.classList.remove('disabled'); el.classList.add('next'); }
  }
}

export function flashKey(physicalKey, correct, container) {
  if (!physicalKey) return;
  const el = container.querySelector(`.key[data-char="${physicalKey}"]`);
  if (!el) return;
  const cls = correct ? 'flash-ok' : 'flash-err';
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 120);
}

function esc(s) {
  return s ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
}
