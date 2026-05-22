// ─────────────────────────────────────────────────────────────────
// Kusamochi v0.0.4 キーマップ定義
// 参照: keymap.c (L_BASE/L_SYM/L_NAV/L_TMUX/L_NUM)
// HRM: A=Ctrl S=Alt D=Cmd F=Shift (左) / J=Shift K=Cmd L=Alt Enter=Ctrl (右)
// ─────────────────────────────────────────────────────────────────

// Layer 0: アルファベット + Enter (物理キーベース)
export const KEYS = [
  // 左手 上段
  { char: 'q', row: 'top',    col: 1,  hand: 'L' },
  { char: 'w', row: 'top',    col: 2,  hand: 'L' },
  { char: 'e', row: 'top',    col: 3,  hand: 'L' },
  { char: 'r', row: 'top',    col: 4,  hand: 'L' },
  { char: 't', row: 'top',    col: 5,  hand: 'L' },
  // 右手 上段
  { char: 'y', row: 'top',    col: 6,  hand: 'R' },
  { char: 'u', row: 'top',    col: 7,  hand: 'R' },
  { char: 'i', row: 'top',    col: 8,  hand: 'R' },
  { char: 'o', row: 'top',    col: 9,  hand: 'R' },
  { char: 'p', row: 'top',    col: 10, hand: 'R' },
  // 左手 中段
  { char: 'a', row: 'home',   col: 1,  hand: 'L' },
  { char: 's', row: 'home',   col: 2,  hand: 'L' },
  { char: 'd', row: 'home',   col: 3,  hand: 'L' },
  { char: 'f', row: 'home',   col: 4,  hand: 'L' },
  { char: 'g', row: 'home',   col: 5,  hand: 'L' },
  // 右手 中段 (Enter は HRM: RCTL_T)
  { char: 'h',     row: 'home',   col: 6,  hand: 'R' },
  { char: 'j',     row: 'home',   col: 7,  hand: 'R' },
  { char: 'k',     row: 'home',   col: 8,  hand: 'R' },
  { char: 'l',     row: 'home',   col: 9,  hand: 'R' },
  { char: 'enter', row: 'home',   col: 10, hand: 'R' },  // RCTL_T(KC_ENT)
  // 左手 下段
  { char: 'z', row: 'bottom', col: 1,  hand: 'L' },
  { char: 'x', row: 'bottom', col: 2,  hand: 'L' },
  { char: 'c', row: 'bottom', col: 3,  hand: 'L' },
  { char: 'v', row: 'bottom', col: 4,  hand: 'L' },
  { char: 'b', row: 'bottom', col: 5,  hand: 'L' },
  // 右手 下段 (BTN1/BTN2 はマウスボタンのため省略、BSのみ)
  { char: 'n',    row: 'bottom', col: 6,  hand: 'R' },
  { char: 'm',    row: 'bottom', col: 7,  hand: 'R' },
  { char: 'bspc', row: 'bottom', col: 10, hand: 'R' },  // KC_BSPC / LT(SYM)
];

// アルファベットのみ (alpha モード用)
export const ALPHA_KEYS = KEYS.filter(k => k.char.length === 1 && k.char >= 'a' && k.char <= 'z');

export const ROWS = ['top', 'home', 'bottom'];
export const COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const ROW_LABELS = { top: '上段', home: '中段', bottom: '下段' };

export const COL_LABELS = {
  1:  '小指(L)',
  2:  '薬指(L)',
  3:  '中指(L)',
  4:  '人差し指(L)',
  5:  '人差し指内(L)',
  6:  '人差し指内(R)',
  7:  '人差し指(R)',
  8:  '中指(R)',
  9:  '薬指(R)',
  10: '小指(R)',
};

export const PRESETS = {
  all:       { rows: ['top','home','bottom'], cols: [1,2,3,4,5,6,7,8,9,10], label: '全て' },
  home:      { rows: ['home'],               cols: [1,2,3,4,5,6,7,8,9,10], label: '中段のみ' },
  index:     { rows: ['top','home','bottom'], cols: [4,5,6,7],               label: '人差し指' },
  homeRow:   { rows: ['home'],               cols: [4,5,6,7],               label: '中段×人差し指' },
  leftHand:  { rows: ['top','home','bottom'], cols: [1,2,3,4,5],             label: '左手' },
  rightHand: { rows: ['top','home','bottom'], cols: [6,7,8,9,10],            label: '右手' },
};

// ─────────────────────────────────────────────────────────────────
// Layer 1: L_SYM (Space / BS 長押し) — keymap.c L_SYM より
// Row 0 L: -  =  +  '  "      Row 0 R: ^  &  *  <  >
// Row 1 L: !  @  #  $  %      Row 1 R: |  (  )  {  }
// Row 2 L: `  ~  \  _  [      Row 2 R: ]  ;  ,  .  /
// ─────────────────────────────────────────────────────────────────
export const LAYER1_KEYS = [
  // 左手 上段 (KC_MINS EQL PLUS QUOT DQUO)
  { display: '-',  expectKey: '-',  physicalKey: 'q',     row: 'top',    col: 1,  hand: 'L', layer: 1, category: 'symbol' },
  { display: '=',  expectKey: '=',  physicalKey: 'w',     row: 'top',    col: 2,  hand: 'L', layer: 1, category: 'symbol' },
  { display: '+',  expectKey: '+',  physicalKey: 'e',     row: 'top',    col: 3,  hand: 'L', layer: 1, category: 'symbol' },
  { display: "'",  expectKey: "'",  physicalKey: 'r',     row: 'top',    col: 4,  hand: 'L', layer: 1, category: 'symbol' },
  { display: '"',  expectKey: '"',  physicalKey: 't',     row: 'top',    col: 5,  hand: 'L', layer: 1, category: 'symbol' },
  // 右手 上段 (KC_CIRC AMPR ASTR LABK RABK)
  { display: '^',  expectKey: '^',  physicalKey: 'y',     row: 'top',    col: 6,  hand: 'R', layer: 1, category: 'symbol' },
  { display: '&',  expectKey: '&',  physicalKey: 'u',     row: 'top',    col: 7,  hand: 'R', layer: 1, category: 'symbol' },
  { display: '*',  expectKey: '*',  physicalKey: 'i',     row: 'top',    col: 8,  hand: 'R', layer: 1, category: 'symbol' },
  { display: '<',  expectKey: '<',  physicalKey: 'o',     row: 'top',    col: 9,  hand: 'R', layer: 1, category: 'symbol' },
  { display: '>',  expectKey: '>',  physicalKey: 'p',     row: 'top',    col: 10, hand: 'R', layer: 1, category: 'symbol' },
  // 左手 中段 (KC_EXLM AT HASH DLR PERC)
  { display: '!',  expectKey: '!',  physicalKey: 'a',     row: 'home',   col: 1,  hand: 'L', layer: 1, category: 'symbol' },
  { display: '@',  expectKey: '@',  physicalKey: 's',     row: 'home',   col: 2,  hand: 'L', layer: 1, category: 'symbol' },
  { display: '#',  expectKey: '#',  physicalKey: 'd',     row: 'home',   col: 3,  hand: 'L', layer: 1, category: 'symbol' },
  { display: '$',  expectKey: '$',  physicalKey: 'f',     row: 'home',   col: 4,  hand: 'L', layer: 1, category: 'symbol' },
  { display: '%',  expectKey: '%',  physicalKey: 'g',     row: 'home',   col: 5,  hand: 'L', layer: 1, category: 'symbol' },
  // 右手 中段 (KC_PIPE LPRN RPRN LCBR RCBR)
  { display: '|',  expectKey: '|',  physicalKey: 'h',     row: 'home',   col: 6,  hand: 'R', layer: 1, category: 'symbol' },
  { display: '(',  expectKey: '(',  physicalKey: 'j',     row: 'home',   col: 7,  hand: 'R', layer: 1, category: 'symbol' },
  { display: ')',  expectKey: ')',  physicalKey: 'k',     row: 'home',   col: 8,  hand: 'R', layer: 1, category: 'symbol' },
  { display: '{',  expectKey: '{',  physicalKey: 'l',     row: 'home',   col: 9,  hand: 'R', layer: 1, category: 'symbol' },
  { display: '}',  expectKey: '}',  physicalKey: 'enter', row: 'home',   col: 10, hand: 'R', layer: 1, category: 'symbol' },
  // 左手 下段 (KC_GRV TILD BSLS UNDS LBRC)
  { display: '`',  expectKey: '`',  physicalKey: 'z',     row: 'bottom', col: 1,  hand: 'L', layer: 1, category: 'symbol' },
  { display: '~',  expectKey: '~',  physicalKey: 'x',     row: 'bottom', col: 2,  hand: 'L', layer: 1, category: 'symbol' },
  { display: '\\', expectKey: '\\', physicalKey: 'c',     row: 'bottom', col: 3,  hand: 'L', layer: 1, category: 'symbol' },
  { display: '_',  expectKey: '_',  physicalKey: 'v',     row: 'bottom', col: 4,  hand: 'L', layer: 1, category: 'symbol' },
  { display: '[',  expectKey: '[',  physicalKey: 'b',     row: 'bottom', col: 5,  hand: 'L', layer: 1, category: 'symbol' },
  // 右手 下段 (KC_RBRC SCLN COMM DOT SLSH)
  { display: ']',  expectKey: ']',  physicalKey: 'n',     row: 'bottom', col: 6,  hand: 'R', layer: 1, category: 'symbol' },
  { display: ';',  expectKey: ';',  physicalKey: 'm',     row: 'bottom', col: 7,  hand: 'R', layer: 1, category: 'symbol' },
  { display: ',',  expectKey: ',',  physicalKey: null,    row: 'bottom', col: 8,  hand: 'R', layer: 1, category: 'symbol' },  // BTN1位置
  { display: '.',  expectKey: '.',  physicalKey: null,    row: 'bottom', col: 9,  hand: 'R', layer: 1, category: 'symbol' },  // BTN2位置
  { display: '/',  expectKey: '/',  physicalKey: 'bspc',  row: 'bottom', col: 10, hand: 'R', layer: 1, category: 'symbol' },
];

// Symbol categories for filtering
export const SYMBOL_CATEGORIES = {
  brackets:   ['(', ')', '{', '}', '[', ']', '<', '>'],
  arithmetic: ['+', '-', '=', '*', '/', '%', '^', '.'],
  special:    ['!', '@', '#', '$', '&', '|', '\\', '~', '`', '_'],
  quotes:     ['"', "'", ';', ',', '?'],
};

// ─────────────────────────────────────────────────────────────────
// Layer 2: L_NAV (Tab / Lang1 長押し) — keymap.c L_NAV より
// ─────────────────────────────────────────────────────────────────
export const LAYER2_KEYS = [
  // 右手 上段: PgUp PgDn Home End Del
  { display: 'PgUp', expectKey: 'PageUp',    physicalKey: 'y',     row: 'top',    col: 6,  hand: 'R', layer: 2, category: 'nav' },
  { display: 'PgDn', expectKey: 'PageDown',  physicalKey: 'u',     row: 'top',    col: 7,  hand: 'R', layer: 2, category: 'nav' },
  { display: 'Home', expectKey: 'Home',      physicalKey: 'i',     row: 'top',    col: 8,  hand: 'R', layer: 2, category: 'nav' },
  { display: 'End',  expectKey: 'End',       physicalKey: 'o',     row: 'top',    col: 9,  hand: 'R', layer: 2, category: 'nav' },
  { display: 'Del',  expectKey: 'Delete',    physicalKey: 'p',     row: 'top',    col: 10, hand: 'R', layer: 2, category: 'nav' },
  // 右手 中段: 矢印 hjkl (vim)
  { display: '←',   expectKey: 'ArrowLeft',  physicalKey: 'h',     row: 'home',   col: 6,  hand: 'R', layer: 2, category: 'nav' },
  { display: '↓',   expectKey: 'ArrowDown',  physicalKey: 'j',     row: 'home',   col: 7,  hand: 'R', layer: 2, category: 'nav' },
  { display: '↑',   expectKey: 'ArrowUp',    physicalKey: 'k',     row: 'home',   col: 8,  hand: 'R', layer: 2, category: 'nav' },
  { display: '→',   expectKey: 'ArrowRight', physicalKey: 'l',     row: 'home',   col: 9,  hand: 'R', layer: 2, category: 'nav' },
];

// ─────────────────────────────────────────────────────────────────
// Layer 3: L_TMUX (Lang2 / ' 長押し) — 表示専用 (keymap.c L_TMUX + tmux.conf より)
// ファームウェアが Ctrl+Q を自動送出後、このレイヤーのキーが tmux コマンドになる
// ─────────────────────────────────────────────────────────────────
export const LAYER3_KEYS = [
  // 上段: ウィンドウ番号 1-5 / 6-0
  { display: '1',    physicalKey: 'q', row: 'top',    col: 1,  hand: 'L', layer: 3 },
  { display: '2',    physicalKey: 'w', row: 'top',    col: 2,  hand: 'L', layer: 3 },
  { display: '3',    physicalKey: 'e', row: 'top',    col: 3,  hand: 'L', layer: 3 },
  { display: '4',    physicalKey: 'r', row: 'top',    col: 4,  hand: 'L', layer: 3 },
  { display: '5',    physicalKey: 't', row: 'top',    col: 5,  hand: 'L', layer: 3 },
  { display: '6',    physicalKey: 'y', row: 'top',    col: 6,  hand: 'R', layer: 3 },
  { display: '7',    physicalKey: 'u', row: 'top',    col: 7,  hand: 'R', layer: 3 },
  { display: '8',    physicalKey: 'i', row: 'top',    col: 8,  hand: 'R', layer: 3 },
  { display: '9',    physicalKey: 'o', row: 'top',    col: 9,  hand: 'R', layer: 3 },
  { display: '0',    physicalKey: 'p', row: 'top',    col: 10, hand: 'R', layer: 3 },
  // 中段: sync/sess/detach/fzf-s / pane nav
  { display: 'sync', physicalKey: 'a', row: 'home',   col: 1,  hand: 'L', layer: 3 },
  { display: 'ses',  physicalKey: 's', row: 'home',   col: 2,  hand: 'L', layer: 3 },
  { display: 'dtch', physicalKey: 'd', row: 'home',   col: 3,  hand: 'L', layer: 3 },
  { display: 'fzf-s',physicalKey: 'f', row: 'home',   col: 4,  hand: 'L', layer: 3 },
  { display: '←',   physicalKey: 'h', row: 'home',   col: 6,  hand: 'R', layer: 3 },
  { display: '↓',   physicalKey: 'j', row: 'home',   col: 7,  hand: 'R', layer: 3 },
  { display: '↑',   physicalKey: 'k', row: 'home',   col: 8,  hand: 'R', layer: 3 },
  { display: '→',   physicalKey: 'l', row: 'home',   col: 9,  hand: 'R', layer: 3 },
  // 下段: new-win/sp→/sp↓ / reload/zoom/yazi/copy
  { display: 'new',  physicalKey: 'c', row: 'bottom', col: 3,  hand: 'L', layer: 3 },
  { display: 'sp→',  physicalKey: 'v', row: 'bottom', col: 4,  hand: 'L', layer: 3 },
  { display: 'sp↓',  physicalKey: 'b', row: 'bottom', col: 5,  hand: 'L', layer: 3 },
  { display: 'rld',  physicalKey: 'n', row: 'bottom', col: 6,  hand: 'R', layer: 3 },
  { display: 'zoom', physicalKey: 'm', row: 'bottom', col: 7,  hand: 'R', layer: 3 },
  // BTN1=e(yazi), BTN2=[(copy) は物理キーなし
  // right thumb: w = fzf-window (LT(TMUX,') 位置、bspc 行に表示)
  { display: 'fzf-w',physicalKey: 'bspc', row: 'bottom', col: 10, hand: 'R', layer: 3 },
];

// ─────────────────────────────────────────────────────────────────
// Layer 4: L_NUM (tri-layer: L_SYM + L_TMUX 同時)
// 右手: テンキー配置 (=,7,8,9,* / .,4,5,6,- / 0,1,2,3,+)
// 左手: F1〜F12
// ─────────────────────────────────────────────────────────────────
export const LAYER4_KEYS = [
  // 右手 上段: =  7  8  9  *
  { display: '=', expectKey: '=', physicalKey: 'y',     row: 'top',    col: 6,  hand: 'R', layer: 4, category: 'number' },
  { display: '7', expectKey: '7', physicalKey: 'u',     row: 'top',    col: 7,  hand: 'R', layer: 4, category: 'number' },
  { display: '8', expectKey: '8', physicalKey: 'i',     row: 'top',    col: 8,  hand: 'R', layer: 4, category: 'number' },
  { display: '9', expectKey: '9', physicalKey: 'o',     row: 'top',    col: 9,  hand: 'R', layer: 4, category: 'number' },
  { display: '*', expectKey: '*', physicalKey: 'p',     row: 'top',    col: 10, hand: 'R', layer: 4, category: 'number' },
  // 右手 中段: .  4  5  6  -
  { display: '.', expectKey: '.', physicalKey: 'h',     row: 'home',   col: 6,  hand: 'R', layer: 4, category: 'number' },
  { display: '4', expectKey: '4', physicalKey: 'j',     row: 'home',   col: 7,  hand: 'R', layer: 4, category: 'number' },
  { display: '5', expectKey: '5', physicalKey: 'k',     row: 'home',   col: 8,  hand: 'R', layer: 4, category: 'number' },
  { display: '6', expectKey: '6', physicalKey: 'l',     row: 'home',   col: 9,  hand: 'R', layer: 4, category: 'number' },
  { display: '-', expectKey: '-', physicalKey: 'enter', row: 'home',   col: 10, hand: 'R', layer: 4, category: 'number' },
  // 右手 下段: 0  1  2  3  +
  { display: '0', expectKey: '0', physicalKey: 'n',     row: 'bottom', col: 6,  hand: 'R', layer: 4, category: 'number' },
  { display: '1', expectKey: '1', physicalKey: 'm',     row: 'bottom', col: 7,  hand: 'R', layer: 4, category: 'number' },
  // BTN1(col8), BTN2(col9) はマウスボタンのためスキップ
  { display: '+', expectKey: '+', physicalKey: 'bspc',  row: 'bottom', col: 10, hand: 'R', layer: 4, category: 'number' },
  // 左手: F1-F12 (training対象外だが表示用に含む)
  { display: 'F1',  expectKey: 'F1',  physicalKey: 'q', row: 'top',    col: 1,  hand: 'L', layer: 4, category: 'function' },
  { display: 'F2',  expectKey: 'F2',  physicalKey: 'w', row: 'top',    col: 2,  hand: 'L', layer: 4, category: 'function' },
  { display: 'F3',  expectKey: 'F3',  physicalKey: 'e', row: 'top',    col: 3,  hand: 'L', layer: 4, category: 'function' },
  { display: 'F4',  expectKey: 'F4',  physicalKey: 'r', row: 'top',    col: 4,  hand: 'L', layer: 4, category: 'function' },
  { display: 'F5',  expectKey: 'F5',  physicalKey: 't', row: 'top',    col: 5,  hand: 'L', layer: 4, category: 'function' },
  { display: 'F6',  expectKey: 'F6',  physicalKey: 'a', row: 'home',   col: 1,  hand: 'L', layer: 4, category: 'function' },
  { display: 'F7',  expectKey: 'F7',  physicalKey: 's', row: 'home',   col: 2,  hand: 'L', layer: 4, category: 'function' },
  { display: 'F8',  expectKey: 'F8',  physicalKey: 'd', row: 'home',   col: 3,  hand: 'L', layer: 4, category: 'function' },
  { display: 'F9',  expectKey: 'F9',  physicalKey: 'f', row: 'home',   col: 4,  hand: 'L', layer: 4, category: 'function' },
  { display: 'F10', expectKey: 'F10', physicalKey: 'g', row: 'home',   col: 5,  hand: 'L', layer: 4, category: 'function' },
  { display: 'F11', expectKey: 'F11', physicalKey: 'z', row: 'bottom', col: 1,  hand: 'L', layer: 4, category: 'function' },
  { display: 'F12', expectKey: 'F12', physicalKey: 'x', row: 'bottom', col: 2,  hand: 'L', layer: 4, category: 'function' },
];

// 数字のみ (number モード用)
export const LAYER4_NUMBERS = LAYER4_KEYS.filter(k => /^\d$/.test(k.display));

// ─────────────────────────────────────────────────────────────────
// Home Row Mods ショートカット
// ─────────────────────────────────────────────────────────────────
export const SHORTCUTS = [
  // ── 編集系 ──
  { display: 'Ctrl+C', expectKey: 'c', expectMods: ['ctrl'], physicalKeys: ['a','c'],     category: 'shortcut', group: 'edit' },
  { display: 'Ctrl+X', expectKey: 'x', expectMods: ['ctrl'], physicalKeys: ['a','x'],     category: 'shortcut', group: 'edit' },
  { display: 'Ctrl+V', expectKey: 'v', expectMods: ['ctrl'], physicalKeys: ['a','v'],     category: 'shortcut', group: 'edit' },
  { display: 'Ctrl+Z', expectKey: 'z', expectMods: ['ctrl'], physicalKeys: ['a','z'],     category: 'shortcut', group: 'edit' },
  { display: 'Cmd+C',  expectKey: 'c', expectMods: ['meta'], physicalKeys: ['d','c'],     category: 'shortcut', group: 'edit' },
  { display: 'Cmd+X',  expectKey: 'x', expectMods: ['meta'], physicalKeys: ['d','x'],     category: 'shortcut', group: 'edit' },
  { display: 'Cmd+V',  expectKey: 'v', expectMods: ['meta'], physicalKeys: ['d','v'],     category: 'shortcut', group: 'edit' },
  { display: 'Cmd+Z',  expectKey: 'z', expectMods: ['meta'], physicalKeys: ['d','z'],     category: 'shortcut', group: 'edit' },
  { display: 'Cmd+S',  expectKey: 's', expectMods: ['meta'], physicalKeys: ['d','s'],     category: 'shortcut', group: 'edit' },
];

// ─────────────────────────────────────────────────────────────────
// ユーティリティ
// ─────────────────────────────────────────────────────────────────

export function getKeysForMode(mode, { symbolCategories, navAll } = {}) {
  switch (mode) {
    case 'alpha': {
      return ALPHA_KEYS.map(k => ({
        display: k.char, expectKey: k.char, expectMods: [],
        physicalKey: k.char, category: 'alpha', col: k.col, row: k.row, hand: k.hand,
      }));
    }
    case 'symbol': {
      let keys = LAYER1_KEYS.filter(k => k.physicalKey !== null);  // physicalKey未定義は除外
      if (symbolCategories && symbolCategories.length > 0) {
        const allowed = new Set(symbolCategories.flatMap(c => SYMBOL_CATEGORIES[c] || []));
        keys = keys.filter(k => allowed.has(k.display));
      }
      return keys;
    }
    case 'nav':
      return navAll ? LAYER2_KEYS : LAYER2_KEYS.filter(k => k.expectKey.startsWith('Arrow'));
    case 'number':
      return LAYER4_NUMBERS;
    case 'shortcut':
      return SHORTCUTS;
    default:
      return ALPHA_KEYS.map(k => ({
        display: k.char, expectKey: k.char, expectMods: [],
        physicalKey: k.char, category: 'alpha',
      }));
  }
}

// alpha モード用: 行/列でフィルタ
export function pickKeys({ selectedRows, selectedCols }) {
  return ALPHA_KEYS.filter(k =>
    selectedRows.includes(k.row) && selectedCols.includes(k.col)
  ).map(k => k.char);
}

export function getLayerForMode(mode) {
  return { alpha: 0, symbol: 1, nav: 2, number: 4, shortcut: 0 }[mode] ?? 0;
}

// レイヤー切替キー (誤入力としてカウントしない)
// Space/BS → L_SYM, Tab → L_NAV, ' → L_TMUX (Lang2 はOS消費のため省略)
export const LAYER_SWITCH_KEYS = {
  symbol:   [' ', 'Backspace'],
  nav:      ['Tab'],
  number:   ["'"],          // L_TMUX + L_SYM 同時だが ' はブラウザに届く
  scenario: [' ', 'Backspace', "'", 'Tab'],
  devflow:  [' ', 'Backspace', "'"],  // L1/L3 アクティベータを無視 (Ctrl+Q はファームウェアが送出)
  shortcut: [],
  alpha:    [],
};
