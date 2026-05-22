// devflow モード: tmux + neovim + programming ワークフロー練習
//
// DevflowStep: { display, mode, sequence: PromptItem[] }
//   mode: 'tmux'|'nvim-normal'|'nvim-insert'|'nvim-ex'|'shell'
//   sequence: キーイベント列

import { textToPromptItems } from './generator.js';

// ステップビルダー群 (tmuxPrefix は { mods: string[], key: string })

export function buildTmuxStep(keyChar, prefix) {
  const modPhysKey = modsToHrmKey(prefix.mods);
  const prefixItem = {
    display: formatMod(prefix),
    expectKey: prefix.key,
    expectMods: prefix.mods,
    physicalKey:  modPhysKey,
    physicalKeys: [modPhysKey, prefix.key].filter(Boolean),  // highlightShortcut 用
    category: 'shortcut',
    layer: 0,
  };
  const charItem = {
    display: keyChar,
    expectKey: keyChar,
    expectMods: [],
    physicalKey: tmuxKeyToPhys(keyChar),  // 物理キー位置 (送出文字と異なる場合あり)
    category: 'alpha',
    layer: 3,
  };
  return {
    display: `prefix → ${keyChar}`,
    mode: 'tmux',
    sequence: [prefixItem, charItem],
  };
}

// neovim ノーマルモードのキー列 ('gg', 'dd', 'ciw' など)
export function buildNvimNormalStep(keys) {
  const sequence = [...keys].map(ch => ({
    display: ch,
    expectKey: ch === 'Escape' ? 'Escape' : ch,
    expectMods: [],
    physicalKey: ch.length === 1 ? ch : null,
    category: 'alpha',
  }));
  return {
    display: keys,
    mode: 'nvim-normal',
    sequence,
  };
}

// neovim インサートモード: i → <text> → Esc
export function buildNvimInsertStep(text) {
  const sequence = [
    { display: 'i', expectKey: 'i', expectMods: [], physicalKey: 'i', category: 'alpha' },
    ...textToPromptItems(text),
    { display: 'Esc', expectKey: 'Escape', expectMods: [], physicalKey: null, category: 'nav' },
  ];
  return {
    display: `i${text}<Esc>`,
    mode: 'nvim-insert',
    sequence,
  };
}

// neovim Ex コマンド (:w, :q, :wq など)
export function buildNvimExStep(cmd) {
  const sequence = [
    { display: ':', expectKey: ':', expectMods: [], physicalKey: null, category: 'symbol' },
    ...textToPromptItems(cmd),
    { display: '↵', expectKey: 'Enter', expectMods: [], physicalKey: null, category: 'nav' },
  ];
  return {
    display: `:${cmd}<CR>`,
    mode: 'nvim-ex',
    sequence,
  };
}

// シェルコマンド入力 (テキスト + Enter)
export function buildShellStep(cmd) {
  const sequence = [
    ...textToPromptItems(cmd),
    { display: '↵', expectKey: 'Enter', expectMods: [], physicalKey: null, category: 'nav' },
  ];
  return {
    display: cmd,   // $ プレフィックスは端末UI側で付与
    mode: 'shell',
    sequence,
  };
}

// 単発キー (Escape, Enter, etc.)
export function buildKeyStep(key, displayLabel) {
  return {
    display: displayLabel || key,
    mode: 'key',
    sequence: [{ display: displayLabel || key, expectKey: key, expectMods: [], physicalKey: null, category: 'nav' }],
  };
}

// HRM ショートカット (Ctrl+S, Ctrl+H など)
// mods: ['ctrl'|'meta'|'alt'|'shift']
export function buildHrmStep(mods, key, displayLabel) {
  const labels = { ctrl: 'Ctrl', meta: 'Cmd', alt: 'Alt', shift: 'Shift' };
  const display = displayLabel || [...mods.map(m => labels[m] || m), key.toUpperCase()].join('+');
  return {
    display,
    mode: 'nvim-normal',
    sequence: [{
      display,
      expectKey: key,
      expectMods: mods,
      physicalKeys: [modsToHrmKey(mods), key],
      category: 'shortcut',
    }],
  };
}

// LazyVim <leader> コマンド (Space タップ → コマンドキー)
// <leader> = Space タップ (LT の tap 動作、L_SYM ホールドではない)
export function buildLeaderStep(cmd, description) {
  const sequence = [
    { display: '<Spc>', expectKey: ' ', expectMods: [], physicalKey: null, category: 'alpha' },
    ...[...cmd].map(ch => ({
      display: ch, expectKey: ch, expectMods: [], physicalKey: null, category: 'alpha',
    })),
  ];
  return {
    display: `<leader>${cmd} (${description})`,
    mode: 'nvim-normal',
    sequence,
  };
}

// ─────────────────────────────────────────────────────────────────
// シナリオ定義 (prefix は実行時に注入)
// ─────────────────────────────────────────────────────────────────

export function buildDevflows(prefix) {
  const tmux    = (key)        => buildTmuxStep(key, prefix);
  const nvN     = (keys)       => buildNvimNormalStep(keys);
  const nvI     = (text)       => buildNvimInsertStep(text);
  const nvEx    = (cmd)        => buildNvimExStep(cmd);
  const shell   = (cmd)        => buildShellStep(cmd);
  const hrm     = (mods, key, label) => buildHrmStep(mods, key, label);
  const leader  = (cmd, desc)  => buildLeaderStep(cmd, desc);

  // tmux.conf バインドに準拠:
  // prefix = C-q  /  | = 左右分割  /  - = 上下分割
  // h/j/k/l = ペイン移動  /  m = ズーム  /  e = yazi
  // c = 新ウィンドウ  /  [ = コピーモード  /  f = fzf-session  /  w = fzf-window
  return {
    tmux: [
      {
        title: '左右に分割して切替',
        steps: [tmux('|'), tmux('h')],
      },
      {
        title: '上下に分割してペイン移動',
        steps: [tmux('-'), tmux('j'), tmux('k')],
      },
      {
        title: '新規ウィンドウで git status',
        steps: [tmux('c'), shell('git status')],
      },
      {
        title: 'ペインを最大化/復元',
        steps: [tmux('m'), tmux('m')],
      },
      {
        title: 'fzf でセッション切替',
        steps: [tmux('f')],
      },
      {
        title: 'fzf でウィンドウ切替',
        steps: [tmux('w')],  // R30 = w (keymap.c L_TMUX)
      },
      {
        title: 'ウィンドウ番号指定で切替',
        steps: [tmux('1'), tmux('2'), tmux('3')],
      },
      {
        title: 'コピーモード開始',
        steps: [tmux('[')],
      },
      {
        title: 'yazi でファイルを開く',
        steps: [tmux('e')],
      },
      {
        title: '設定リロード',
        steps: [tmux('r')],
      },
    ],
    nvim: [
      // ── 基本モーション ──
      {
        title: 'ファイル先頭/末尾に移動',
        steps: [nvN('gg'), nvN('G')],
      },
      {
        title: '単語削除・挿入 (ciw)',
        steps: [nvN('ciw'), nvI('newWord')],
      },
      {
        title: '括弧内を書き換え (ci()',
        steps: [nvN('ci('), nvI('arg1, arg2')],
      },
      {
        title: '行をヤンク→ペースト',
        steps: [nvN('yy'), nvN('p')],
      },
      {
        title: 'ビジュアル選択でヤンク (LazyVim: y でコピー)',
        steps: [nvN('V'), nvN('jj'), nvN('y')],
      },
      // ── LazyVim 保存 (Ctrl+S) ──
      {
        title: '保存 (Ctrl+S)',
        steps: [hrm(['ctrl'], 's', 'Ctrl+S')],
      },
      // ── ウィンドウ移動 (LazyVim: Ctrl+hjkl) ──
      {
        title: 'ウィンドウを右に移動 (Ctrl+L)',
        steps: [hrm(['ctrl'], 'l', 'Ctrl+L')],
      },
      {
        title: '左右ウィンドウ往復 (Ctrl+H → Ctrl+L)',
        steps: [hrm(['ctrl'], 'h', 'Ctrl+H'), hrm(['ctrl'], 'l', 'Ctrl+L')],
      },
      // ── バッファ切替 (LazyVim: Shift+H/L) ──
      {
        title: '次バッファへ (Shift+L)',
        steps: [hrm(['shift'], 'l', 'Shift+L')],
      },
      {
        title: '前バッファへ (Shift+H)',
        steps: [hrm(['shift'], 'h', 'Shift+H')],
      },
      // ── LazyVim leader コマンド ──
      {
        title: 'Lazygit を開く (<leader>gg)',
        steps: [leader('gg', 'Lazygit')],
      },
      {
        title: 'フォーマット (<leader>cf)',
        steps: [leader('cf', 'Format')],
      },
      // ── 検索・置換 ──
      {
        title: '検索して次へ (/foo → n)',
        steps: [nvN('/foo'), buildKeyStep('Enter', '↵'), nvN('n')],
      },
      {
        title: '全体置換 (:%s)',
        steps: [nvEx('%s/foo/bar/g')],
      },
    ],
    combined: [
      {
        title: '左右分割して nvim を開き編集・保存',
        steps: [
          tmux('|'),
          shell('nvim main.js'),
          nvN('G'),
          nvI('console.log("done");'),
          hrm(['ctrl'], 's', 'Ctrl+S'),
        ],
      },
      {
        title: 'git add + commit → tmux 新ウィンドウで',
        steps: [
          tmux('c'),
          shell('git add -A'),
          shell('git commit -m "fix: update"'),
        ],
      },
      {
        title: 'nvim で置換して Lazygit でコミット',
        steps: [
          nvEx('%s/TODO/DONE/g'),
          hrm(['ctrl'], 's', 'Ctrl+S'),
          tmux('c'),
          shell('git add -A && git commit -m "resolve TODOs"'),
        ],
      },
      {
        title: 'ウィンドウ分割→ファイル開いて編集→保存',
        steps: [
          tmux('|'),
          shell('nvim src/app.js'),
          nvN('gg'),
          nvN('ciw'),
          nvI('newValue'),
          hrm(['ctrl'], 's', 'Ctrl+S'),
        ],
      },
      {
        title: 'tmux ペイン移動 + nvim バッファ切替',
        steps: [
          tmux('h'),
          hrm(['shift'], 'l', 'Shift+L'),
          hrm(['shift'], 'h', 'Shift+H'),
        ],
      },
    ],
  };
}

// シナリオをランダムに N ステップ選択して Steps[] として返す
export function pickDevflowSteps(genre, count, prefix) {
  const flows = buildDevflows(prefix);
  const pool = flows[genre] || flows.combined;
  const scenario = pool[Math.floor(Math.random() * pool.length)];
  // count は現在未使用 (1シナリオを1プロンプト単位として扱う)
  return scenario.steps;
}

// ─────────────────────────────────────────────────────────────────
// ヘルパー
// ─────────────────────────────────────────────────────────────────

function formatMod({ mods, key }) {
  const labels = { ctrl: 'Ctrl', meta: 'Cmd', alt: 'Alt', shift: 'Shift' };
  return [...mods.map(m => labels[m] || m), key.toUpperCase()].join('+');
}

// keymap.c L_TMUX: 送出文字 → Layer 0 物理キー位置
// 一致しないもの (V→|, B→-, N→r, bspc→w, Q→1 など) を列挙
const TMUX_KEY_PHYS = {
  // 上段: ウィンドウ番号 (Q-T=1-5, Y-P=6-0)
  '1':'q','2':'w','3':'e','4':'r','5':'t',
  '6':'y','7':'u','8':'i','9':'o','0':'p',
  // 下段左: C=new, V=sp→(|), B=sp↓(-)
  '|':'v', '-':'b',
  // 下段右: N=rld(r), M=zoom(m), bspc=fzf-w(w)
  'r':'n', 'w':'bspc',
  // それ以外は同じ (a=a, s=s, d=d, f=f, h=h, j=j, k=k, l=l, c=c, m=m, [=[)
};

function tmuxKeyToPhys(keyChar) {
  return TMUX_KEY_PHYS[keyChar] ?? keyChar;
}

function modsToHrmKey(mods) {
  // keymap.c HRM: A=Ctrl S=Alt D=Cmd F=Shift (左) / J=Shift K=Cmd L=Alt Enter=Ctrl (右)
  if (mods.includes('ctrl'))  return 'a';
  if (mods.includes('meta'))  return 'd';
  if (mods.includes('alt'))   return 's';
  if (mods.includes('shift')) return 'f';
  return null;
}

// tmuxPrefix の display ラベル生成
export function formatPrefixLabel({ mods, key }) {
  return formatMod({ mods, key });
}

// ブラウザと衝突する可能性があるプレフィックスを検出
export function checkPrefixConflict({ mods, key }) {
  const conflicts = [
    { mods: ['ctrl'], key: 'w', msg: 'Ctrl+W はタブを閉じます (ブラウザによっては抑止不可)' },
    { mods: ['ctrl'], key: 't', msg: 'Ctrl+T は新規タブを開きます' },
    { mods: ['ctrl'], key: 'n', msg: 'Ctrl+N は新規ウィンドウを開きます' },
    { mods: ['meta'], key: 'w', msg: 'Cmd+W はタブを閉じます' },
    { mods: ['meta'], key: 'q', msg: 'Cmd+Q はアプリを終了します' },
    { mods: ['meta'], key: 't', msg: 'Cmd+T は新規タブを開きます' },
  ];
  for (const c of conflicts) {
    if (c.key === key && c.mods.every(m => mods.includes(m))) return c.msg;
  }
  return null;
}
