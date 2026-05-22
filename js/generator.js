import { getKeysForMode, SHORTCUTS, pickKeys, LAYER1_KEYS, LAYER4_KEYS } from './layout.js';
export { pickKeys };

// 文字 → physicalKey のルックアップ (ハイライト用)
const SYM_PHYS  = Object.fromEntries(LAYER1_KEYS.filter(k=>k.physicalKey).map(k=>[k.display, k.physicalKey]));
const NUM_PHYS  = Object.fromEntries(LAYER4_KEYS.filter(k=>k.physicalKey && /^\d$/.test(k.display)).map(k=>[k.display, k.physicalKey]));

// ランダム生成 (連続重複のみ回避)
function genRandom(pool, length) {
  if (pool.length === 0) return [];
  const out = [];
  let prev = null;
  for (let i = 0; i < length; i++) {
    let item;
    let tries = 0;
    do {
      item = pool[Math.floor(Math.random() * pool.length)];
      tries++;
    } while (item === prev && tries < 5 && pool.length > 1);
    out.push(item);
    prev = item;
  }
  return out;
}

// ペア重視生成 (記号モード向け)
const SYMBOL_PAIRS = [
  ['(', ')'], ['{', '}'], ['[', ']'], ['<', '>'],
  ['=', '='], ['=>', ''], ['!=', ''], ['<=', ''], ['>=', ''],
  ['&&', ''], ['||', ''], ['->', ''], ['++', ''], ['--', ''],
  ['"', '"'], ["'", "'"],
];

function genPair(pool, length) {
  const poolSet = new Set(pool.map(k => (typeof k === 'string' ? k : k.display)));
  const validPairs = SYMBOL_PAIRS.filter(([a, b]) =>
    poolSet.has(a) && (b === '' || poolSet.has(b))
  );
  if (validPairs.length === 0) return genRandom(pool, length);

  const out = [];
  while (out.length < length) {
    const [a, b] = validPairs[Math.floor(Math.random() * validPairs.length)];
    const chars = b ? [a, b] : [...a];
    for (const ch of chars) {
      if (out.length >= length) break;
      const item = pool.find(k => (typeof k === 'string' ? k : k.display) === ch);
      if (item) out.push(item);
    }
  }
  return out.slice(0, length);
}

// 苦手キー重み付け生成
function genWeak(pool, length, weakKeys) {
  if (!weakKeys || Object.keys(weakKeys).length === 0) return genRandom(pool, length);

  const weighted = [];
  for (const item of pool) {
    const key = typeof item === 'string' ? item : item.display;
    const w = weakKeys[key];
    const weight = (w && w.total >= 3) ? 1 + Math.round((w.miss / w.total) * 3) : 1;
    for (let i = 0; i < weight; i++) weighted.push(item);
  }
  return genRandom(weighted, length);
}

// モード別プロンプト生成
// 戻り値: PromptItem[] (Trainer が直接使える形式)
export function generatePrompt(mode, options = {}) {
  const { length = 20, strategy = 'random', weakKeys = {}, settings = {} } = options;

  switch (mode) {
    case 'alpha': {
      const chars = pickKeys(settings);
      if (chars.length === 0) return [];
      const raw = genRandom(chars, length);
      return raw.map(c => ({ display: c, expectKey: c, expectMods: [], physicalKey: c, category: 'alpha' }));
    }

    case 'symbol':
    case 'number': {
      const pool = getKeysForMode(mode, { symbolCategories: settings.symbolCategories });
      if (pool.length === 0) return [];
      if (strategy === 'pair') return genPair(pool, length);
      if (strategy === 'weak') return genWeak(pool, length, weakKeys);
      return genRandom(pool, length);
    }

    case 'nav': {
      const pool = getKeysForMode('nav', { navAll: settings.navAll });
      return genRandom(pool, length);
    }

    case 'shortcut': {
      const { shortcutGroups = [] } = settings;
      let pool = SHORTCUTS;
      if (shortcutGroups.length > 0) {
        pool = SHORTCUTS.filter(s => shortcutGroups.includes(s.group));
      }
      if (pool.length === 0) pool = SHORTCUTS;
      const raw = genRandom(pool, length);
      return raw.map(s => ({ ...s, expectMods: s.expectMods || [] }));
    }

    case 'scenario': {
      // scenarios.js からインポートして使う (呼び出し側でスニペット文字列を渡す)
      const { snippetText = '' } = options;
      return textToPromptItems(snippetText);
    }

    case 'devflow':
      // devflow.js 側で生成して渡すため、ここでは何もしない
      return options.steps || [];

    default:
      return [];
  }
}

// テキスト文字列 → PromptItem[] (シナリオ/devflow の insert ステップ用)
export function textToPromptItems(text) {
  return [...text].map(ch => {
    if (ch === ' ')  return { display: '␣',  expectKey: ' ',     expectMods: [], physicalKey: null, category: 'alpha', layer: 0 };
    if (ch === '\n') return { display: '↵',  expectKey: 'Enter', expectMods: [], physicalKey: null, category: 'nav',   layer: 2 };
    if (ch >= 'a' && ch <= 'z') return { display: ch, expectKey: ch, expectMods: [], physicalKey: ch,   category: 'alpha',  layer: 0 };
    if (ch >= 'A' && ch <= 'Z') return { display: ch, expectKey: ch, expectMods: [], physicalKey: ch.toLowerCase(), category: 'alpha', layer: 0 };
    if (ch >= '0' && ch <= '9') return { display: ch, expectKey: ch, expectMods: [], physicalKey: NUM_PHYS[ch] ?? null, category: 'number', layer: 4 };
    return { display: ch, expectKey: ch, expectMods: [], physicalKey: SYM_PHYS[ch] ?? null, category: 'symbol', layer: 1 };
  });
}
