import { ROWS, COLS, ROW_LABELS, COL_LABELS, PRESETS, getLayerForMode, LAYER_SWITCH_KEYS, pickKeys } from './layout.js';
import { buildKeyboard, renderLayer, updateHighlight, highlightShortcut, flashKey, LAYER_DEFS } from './keyboard.js';
import { generatePrompt } from './generator.js';
import { computeWpm, computeAccuracy, computeDevflowStats, mergeWeakKeys, updateBestByMode, topWeak } from './stats.js';
import { loadSettings, saveSettings, loadLifetime, saveLifetime } from './storage.js';
import { Trainer } from './trainer.js';
import { pickScenario } from './scenarios.js';
import { pickDevflowSteps, formatPrefixLabel, checkPrefixConflict, buildDevflows } from './devflow.js';

let settings = loadSettings();
let lifetime = loadLifetime();
let trainer = null;
let currentItems = [];   // PromptItem[] | DevflowStep[]
let timerInterval = null;

const screens = {
  start:    document.getElementById('screen-start'),
  practice: document.getElementById('screen-practice'),
  summary:  document.getElementById('screen-summary'),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.hidden = true);
  screens[name].hidden = false;
}

// ===== モード定義 =====
const MODES = [
  { id: 'alpha',    label: 'アルファベット', layer: 0 },
  { id: 'symbol',   label: '記号 (L1)',      layer: 1 },
  { id: 'nav',      label: 'ナビ (L2)',      layer: 2 },
  { id: 'number',   label: '数字 (L3)',      layer: 3 },
  { id: 'shortcut', label: 'ショートカット', layer: 0 },
  { id: 'scenario', label: 'シナリオ',       layer: 0 },
  { id: 'devflow',  label: 'Dev フロー',     layer: 0 },
];

// ===== スタート画面 =====

function initStartScreen() {
  buildModeTabs();
  buildLayerTabs();
  buildRowToggles();
  buildColToggles();
  buildPresetButtons();
  bindDifficultyControls();
  bindModeSpecificControls();

  document.getElementById('btn-start').addEventListener('click', startPractice);

  buildKeyboard(document.getElementById('keyboard-start'), getLayerForMode(settings.mode));
  switchMode(settings.mode, false);
}

function buildLayerTabs() {
  const container = document.getElementById('layer-tabs');
  for (const def of LAYER_DEFS) {
    const btn = document.createElement('button');
    btn.className = 'btn-layer-tab';
    btn.dataset.layer = String(def.id);
    btn.innerHTML = `<span class="lt-label">${def.label}</span><span class="lt-sub">${def.sublabel}</span>`;
    btn.addEventListener('click', () => switchLayerTab(def.id));
    container.appendChild(btn);
  }
}

function switchLayerTab(layer) {
  document.querySelectorAll('.btn-layer-tab').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.layer) === layer);
  });
  buildKeyboard(document.getElementById('keyboard-start'), layer);
  // alpha モードで Layer 0 を表示した場合はキーハイライトも更新
  if (layer === 0) refreshStartKeyboard();
}

function buildModeTabs() {
  const container = document.getElementById('mode-tabs');
  MODES.forEach(({ id, label }) => {
    const btn = document.createElement('button');
    btn.className = 'btn-mode-tab';
    btn.dataset.mode = id;
    btn.textContent = label;
    btn.addEventListener('click', () => switchMode(id));
    container.appendChild(btn);
  });
}

function switchMode(mode, save = true) {
  settings.mode = mode;
  if (save) saveSettings(settings);

  // タブのアクティブ状態
  document.querySelectorAll('.btn-mode-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  // モード依存パネルの表示切替
  document.getElementById('panel-alpha').hidden   = mode !== 'alpha';
  document.getElementById('panel-symbol').hidden  = mode !== 'symbol';
  document.getElementById('panel-nav').hidden     = mode !== 'nav';
  document.getElementById('panel-shortcut').hidden = mode !== 'shortcut';
  document.getElementById('panel-scenario').hidden = mode !== 'scenario';
  document.getElementById('panel-devflow').hidden  = mode !== 'devflow';


  // キーボードプレビューをレイヤー切替 (タブも連動)
  const layer = getLayerForMode(mode);
  switchLayerTab(layer);

  // START ボタン有効化判定
  refreshStartButton();
  refreshBestScore();
}

function buildRowToggles() {
  const container = document.getElementById('row-toggles');
  ROWS.forEach(row => {
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = row;
    cb.checked = settings.selectedRows.includes(row);
    cb.addEventListener('change', () => {
      settings.selectedRows = ROWS.filter(r =>
        document.querySelector(`#row-toggles input[value="${r}"]`).checked
      );
      saveSettings(settings);
      refreshStartKeyboard();
      refreshStartButton();
    });
    label.append(cb, ' ', ROW_LABELS[row]);
    container.appendChild(label);
  });
}

function buildColToggles() {
  const container = document.getElementById('col-toggles');
  COLS.forEach(col => {
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = String(col);
    cb.checked = settings.selectedCols.includes(col);
    cb.addEventListener('change', () => {
      settings.selectedCols = COLS.filter(c =>
        document.querySelector(`#col-toggles input[value="${c}"]`).checked
      );
      saveSettings(settings);
      refreshStartKeyboard();
      refreshStartButton();
    });
    label.append(cb, ' ', COL_LABELS[col]);
    container.appendChild(label);
  });
}

function buildPresetButtons() {
  const container = document.getElementById('preset-buttons');
  Object.values(PRESETS).forEach(preset => {
    const btn = document.createElement('button');
    btn.className = 'btn-preset';
    btn.textContent = preset.label;
    btn.addEventListener('click', () => applyPreset(preset));
    container.appendChild(btn);
  });
}

function applyPreset(preset) {
  settings.selectedRows = [...preset.rows];
  settings.selectedCols = [...preset.cols];
  saveSettings(settings);
  document.querySelectorAll('#row-toggles input').forEach(cb => {
    cb.checked = settings.selectedRows.includes(cb.value);
  });
  document.querySelectorAll('#col-toggles input').forEach(cb => {
    cb.checked = settings.selectedCols.includes(Number(cb.value));
  });
  refreshStartKeyboard();
  refreshStartButton();
}

function bindDifficultyControls() {
  const bind = (id, key, parse) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = settings[key] ?? '';
    el.addEventListener('change', e => {
      settings[key] = parse(e.target.value);
      saveSettings(settings);
    });
  };
  bind('setting-length',   'length',          v => parseInt(v) || 20);
  bind('setting-timelimit','timeLimit',        v => v ? parseInt(v) : null);
  bind('setting-wpm',      'targetWpm',        v => parseInt(v) || 30);
  bind('setting-accuracy', 'targetAccuracy',   v => parseFloat(v) || 95);

  const kbToggle = document.getElementById('setting-show-keyboard');
  kbToggle.checked = settings.showKeyboard;
  kbToggle.addEventListener('change', e => {
    settings.showKeyboard = e.target.checked;
    saveSettings(settings);
  });

  // 出題戦略
  const stratEl = document.getElementById('setting-strategy');
  if (stratEl) {
    stratEl.value = settings.strategy;
    stratEl.addEventListener('change', e => {
      settings.strategy = e.target.value;
      saveSettings(settings);
    });
  }
}

function bindModeSpecificControls() {
  // symbol: カテゴリトグル
  document.querySelectorAll('#panel-symbol input[data-cat]').forEach(cb => {
    cb.checked = settings.symbolCategories.includes(cb.dataset.cat);
    cb.addEventListener('change', () => {
      settings.symbolCategories = [...document.querySelectorAll('#panel-symbol input[data-cat]:checked')]
        .map(el => el.dataset.cat);
      saveSettings(settings);
    });
  });

  // nav: navAll トグル
  const navAllEl = document.getElementById('setting-nav-all');
  if (navAllEl) {
    navAllEl.checked = settings.navAll;
    navAllEl.addEventListener('change', e => {
      settings.navAll = e.target.checked;
      saveSettings(settings);
    });
  }

  // shortcut: グループトグル
  document.querySelectorAll('#panel-shortcut input[data-group]').forEach(cb => {
    cb.checked = settings.shortcutGroups.includes(cb.dataset.group);
    cb.addEventListener('change', () => {
      settings.shortcutGroups = [...document.querySelectorAll('#panel-shortcut input[data-group]:checked')]
        .map(el => el.dataset.group);
      saveSettings(settings);
    });
  });

  // scenario: ジャンル
  const scGenreEl = document.getElementById('setting-scenario-genre');
  if (scGenreEl) {
    scGenreEl.value = settings.scenarioGenre;
    scGenreEl.addEventListener('change', e => {
      settings.scenarioGenre = e.target.value;
      saveSettings(settings);
    });
  }

  // devflow: ジャンル
  const dfGenreEl = document.getElementById('setting-devflow-genre');
  if (dfGenreEl) {
    dfGenreEl.value = settings.devflowGenre;
    dfGenreEl.addEventListener('change', e => {
      settings.devflowGenre = e.target.value;
      saveSettings(settings);
    });
  }

  // devflow: tmux プレフィックス
  refreshPrefixDisplay();
  document.querySelectorAll('.btn-prefix-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const mods = btn.dataset.mods.split(',').filter(Boolean);
      const key  = btn.dataset.key;
      settings.tmuxPrefix = { mods, key };
      saveSettings(settings);
      refreshPrefixDisplay();
    });
  });
  document.getElementById('btn-prefix-capture')?.addEventListener('click', openPrefixCapture);
}

function refreshPrefixDisplay() {
  const el = document.getElementById('prefix-current');
  if (el) el.textContent = formatPrefixLabel(settings.tmuxPrefix);

  const warn = checkPrefixConflict(settings.tmuxPrefix);
  const warnEl = document.getElementById('prefix-conflict-warn');
  if (warnEl) {
    warnEl.textContent = warn || '';
    warnEl.hidden = !warn;
  }
}

function openPrefixCapture() {
  const overlay = document.getElementById('prefix-capture-overlay');
  overlay.hidden = false;
  const onKey = (e) => {
    if (['Shift','Control','Alt','Meta'].includes(e.key)) return;
    e.preventDefault();
    const mods = [];
    if (e.ctrlKey)  mods.push('ctrl');
    if (e.metaKey)  mods.push('meta');
    if (e.altKey)   mods.push('alt');
    if (e.shiftKey) mods.push('shift');
    settings.tmuxPrefix = { mods, key: e.key.toLowerCase() };
    saveSettings(settings);
    refreshPrefixDisplay();
    overlay.hidden = true;
    window.removeEventListener('keydown', onKey);
  };
  window.addEventListener('keydown', onKey);
  overlay.querySelector('.btn-cancel')?.addEventListener('click', () => {
    overlay.hidden = true;
    window.removeEventListener('keydown', onKey);
  }, { once: true });
}

function refreshStartKeyboard() {
  const targetSet = new Set(pickKeys(settings));
  updateHighlight(targetSet, null, document.getElementById('keyboard-start'));
}

function refreshStartButton() {
  const mode = settings.mode;
  let canStart = true;
  if (mode === 'alpha') canStart = pickKeys(settings).length > 0;
  document.getElementById('btn-start').disabled = !canStart;
}

function refreshBestScore() {
  const mode = settings.mode;
  const best = lifetime.bestByMode?.[mode];
  const el = document.getElementById('best-score');

  if (mode === 'devflow') {
    el.textContent = best
      ? `ベスト: ${best.stepsPerMin} steps/min / ${best.mistakesPerStep} miss/step`
      : 'まだ記録なし';
  } else {
    // 全モード共通のベストと、モード別ベストを表示
    const globalBest = lifetime.bestWpm > 0
      ? `全体ベスト: ${lifetime.bestWpm} WPM`
      : '';
    const modeBest = best
      ? ` / ${mode}: ${best.wpm} WPM`
      : '';
    el.textContent = globalBest + modeBest || 'まだ記録なし';
  }

  const weakEl = document.getElementById('weak-keys-summary');
  const weak = topWeak(lifetime.weakKeys, 5);
  weakEl.textContent = weak.length > 0
    ? '苦手: ' + weak.map(w => `${w.key}(${Math.round(w.rate * 100)}%)`).join(' ')
    : '';
}

// 左右分割レイアウトを使うモード
const SPLIT_MODES = ['scenario', 'devflow'];

// 右ペインに縦並びで表示するレイヤー
const SPLIT_LAYERS = {
  scenario: [0, 1, 4],
  devflow:  [0, 1, 2, 3],
};

// ===== 練習画面 =====

// devflow用ターミナル履歴
let terminalHistory = [];

function startPractice() {
  if (trainer) trainer.stop();
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }

  const mode = settings.mode;
  currentItems = buildPrompt(mode);
  if (currentItems.length === 0) return;

  terminalHistory = [];
  showScreen('practice');

  const isSplit = SPLIT_MODES.includes(mode);
  document.getElementById('practice-single').hidden = isSplit;
  document.getElementById('practice-split').hidden  = !isSplit;

  if (isSplit) {
    // 右ペイン: 縦並びキーボード
    if (settings.showKeyboard) {
      const kbMulti = document.getElementById('keyboard-practice-multi');
      buildMultiLayerKb(kbMulti, SPLIT_LAYERS[mode]);
    }
    document.getElementById('keyboard-pane').hidden = !settings.showKeyboard;
    // 左ペイン初期化
    document.getElementById('terminal-history').innerHTML = '';
    renderTerminalPrompt(0, null, 0);
    if (settings.showKeyboard) refreshMultiKbHighlight(0, 0);
  } else {
    const kbEl = document.getElementById('keyboard-practice');
    delete kbEl.dataset.multiLayer;
    kbEl.className = 'keyboard';
    buildKeyboard(kbEl, getLayerForMode(mode));
    kbEl.hidden = !settings.showKeyboard;
    updateContextIndicator(null);
    renderPrompt(0, null);
    if (settings.showKeyboard) refreshSingleKbHighlight(0);
  }

  startTimer();

  trainer = new Trainer({
    prompt: currentItems,
    layerSwitchKeys: LAYER_SWITCH_KEYS[mode] || [],
    onUpdate: ({ idx, subIdx, lastCorrect }) => {
      if (isSplit) {
        renderTerminalPrompt(idx, lastCorrect, subIdx);
        if (settings.showKeyboard) {
          const physKey = getPhysKey(currentItems, idx, subIdx);
          const layer   = getCurrentItemLayer(idx, subIdx);
          const kb      = getMultiKb(layer);
          if (kb) flashKey(physKey, lastCorrect, kb);
          refreshMultiKbHighlight(idx, subIdx);
        }
      } else {
        renderPrompt(idx, lastCorrect);
        if (settings.showKeyboard) {
          const physKey = getPhysKey(currentItems, idx, subIdx);
          flashKey(physKey, lastCorrect, document.getElementById('keyboard-practice'));
          refreshSingleKbHighlight(idx, subIdx);
        }
        if (mode === 'devflow') updateContextIndicator(currentItems[idx]);
      }
    },
    onComplete: sessionStats => {
      if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
      showSummary(sessionStats);
    },
  });
  trainer.start();
}

// ─── 右ペイン: 縦並びキーボード ───

function buildMultiLayerKb(container, layerIds) {
  container.innerHTML = '';
  container.dataset.multiLayer = '1';
  for (const layerId of layerIds) {
    const def = LAYER_DEFS.find(d => d.id === layerId);
    if (!def) continue;
    const wrap = document.createElement('div');
    wrap.className = 'keyboard-layer-wrap';
    const label = document.createElement('div');
    label.className = 'keyboard-layer-label';
    label.textContent = `${def.label}  ${def.sublabel}`;
    const kb = document.createElement('div');
    kb.className = 'keyboard keyboard-compact';
    buildKeyboard(kb, layerId);
    wrap.appendChild(label);
    wrap.appendChild(kb);
    container.appendChild(wrap);
  }
}

function getMultiKb(layer) {
  const container = document.getElementById('keyboard-practice-multi');
  if (!container) return null;
  return container.querySelector(`.keyboard[data-layer="${layer}"]`)
      ?? container.querySelector('.keyboard');
}

function clearAllMultiKbHighlights() {
  const container = document.getElementById('keyboard-practice-multi');
  if (!container) return;
  container.querySelectorAll('.key').forEach(el => {
    el.classList.remove('in-set', 'next', 'disabled', 'mod-key', 'target-key');
  });
}

function refreshMultiKbHighlight(idx, subIdx) {
  const item = currentItems[idx];
  if (!item) return;

  // 全レイヤーのハイライトをリセット (前のハイライト残留を防ぐ)
  clearAllMultiKbHighlights();

  const activeItem = item.sequence ? item.sequence[subIdx ?? 0] : item;
  if (!activeItem) return;

  const layer = inferLayer(activeItem);
  const kb    = getMultiKb(layer);
  if (!kb) return;

  const isShortcut = (activeItem.physicalKeys?.length > 0) ||
                     (activeItem.expectMods?.length > 0 && activeItem.physicalKey);

  if (isShortcut) {
    highlightShortcut(activeItem, kb);
  } else if (activeItem.physicalKey) {
    // 同一レイヤーの全キーを in-set に、現在キーを next に
    const allPhys = new Set(
      currentItems
        .flatMap(k => k.sequence ? k.sequence : [k])
        .filter(i => inferLayer(i) === layer && i.physicalKey)
        .map(i => i.physicalKey)
    );
    updateHighlight(allPhys, activeItem.physicalKey, kb);
  }
}

// ─── 左ペイン: ターミナル表示 ───

// devflow ステップのターミナル行を生成
function stepToTerminalLine(step, done = false) {
  if (!step) return '';
  const MODE_PREFIX = {
    'shell':       '❯',
    'nvim-normal': '[N]',
    'nvim-insert': '[I]',
    'nvim-ex':     ':',
    'tmux':        '[T]',
    'key':         '',
  };
  const prefix = MODE_PREFIX[step.mode] ?? '';
  return `${prefix ? prefix + ' ' : ''}${step.display}`;
}

// scenario モード用: 全文表示+カーソル
function renderScenarioTerminal(idx, lastCorrect) {
  const el = document.getElementById('terminal-prompt');
  const done = currentItems.slice(0, idx).map(i => i.display).join('');
  const cur  = currentItems[idx]?.display ?? '';
  const rest = currentItems.slice(idx + 1).map(i => i.display).join('');
  el.innerHTML =
    `<span class="t-done">${esc(done)}</span>` +
    `<span class="t-cursor${lastCorrect === false ? ' t-err' : ''}">${esc(cur) || ' '}</span>` +
    `<span class="t-rest">${esc(rest)}</span>`;
}

// devflow モード用: ステップ履歴+現在ステップ
function renderDevflowTerminal(idx, lastCorrect, subIdx) {
  // 完了ステップを履歴に追加
  const prevIdx = idx - (trainer?.subIdx === 0 && idx > 0 ? 1 : 0);
  const histEl = document.getElementById('terminal-history');
  // 履歴を再描画 (完了ステップ一覧)
  histEl.innerHTML = currentItems.slice(0, idx).map(step => {
    const line = stepToTerminalLine(step, true);
    return `<div class="t-hist-line">${esc(line)}</div>`;
  }).join('');
  histEl.scrollTop = histEl.scrollHeight;

  // 現在ステップの入力中表示
  const step = currentItems[idx];
  const promptEl = document.getElementById('terminal-prompt');
  if (!step) { promptEl.innerHTML = '<span class="t-done">完了</span>'; return; }

  const MODE_PREFIX = {
    'shell':       '❯ ',
    'nvim-normal': '<span class="t-mode-badge t-normal">[N]</span> ',
    'nvim-insert': '<span class="t-mode-badge t-insert">[I]</span> ',
    'nvim-ex':     '<span class="t-mode-badge t-ex">:</span>',
    'tmux':        '<span class="t-mode-badge t-tmux">[T]</span> ',
    'key':         '',
  };
  const prefix = MODE_PREFIX[step.mode] ?? '';

  // シーケンス内の文字を入力済み/カーソル/残りで分ける
  const seq = step.sequence;
  const typedSeq   = seq.slice(0, subIdx).map(i => i.display).join('');
  const curSeq     = seq[subIdx]?.display ?? '';
  const restSeq    = seq.slice(subIdx + 1).map(i => i.display).join('');

  promptEl.innerHTML =
    prefix +
    `<span class="t-done">${esc(typedSeq)}</span>` +
    `<span class="t-cursor${lastCorrect === false ? ' t-err' : ''}">${esc(curSeq) || ' '}</span>` +
    `<span class="t-rest">${esc(restSeq)}</span>`;
}

function renderTerminalPrompt(idx, lastCorrect, subIdx) {
  if (settings.mode === 'scenario') {
    renderScenarioTerminal(idx, lastCorrect);
  } else {
    renderDevflowTerminal(idx, lastCorrect, subIdx ?? 0);
  }
}

// ─── 通常モード: 単一キーボード ───

function refreshSingleKbHighlight(idx, subIdx) {
  const kbEl = document.getElementById('keyboard-practice');
  const mode = settings.mode;
  const item = currentItems[idx];
  if (!item) return;
  if (item.sequence) {
    const seqItem = item.sequence[subIdx ?? 0];
    if (seqItem?.physicalKeys)      highlightShortcut(seqItem, kbEl);
    else if (seqItem?.physicalKey)  updateHighlight(new Set([seqItem.physicalKey]), seqItem.physicalKey, kbEl);
  } else if (mode === 'shortcut' || item.expectMods?.length) {
    highlightShortcut(item, kbEl);
  } else if (item.physicalKey) {
    const allPhys = new Set(currentItems.filter(k => !k.sequence).map(k => k.physicalKey).filter(Boolean));
    updateHighlight(allPhys, item.physicalKey, kbEl);
  }
}

// ─── 共通ユーティリティ ───

function getCurrentItemLayer(idx, subIdx) {
  const item = currentItems[idx];
  if (!item) return 0;
  if (item.sequence) return inferLayer(item.sequence[subIdx ?? 0]);
  return inferLayer(item);
}

function inferLayer(item) {
  if (!item) return 0;
  if (item.layer !== undefined) return item.layer;
  const map = { alpha: 0, symbol: 1, nav: 2, number: 4, shortcut: 0, function: 4 };
  return map[item.category] ?? 0;
}

// 旧 refreshPracticeKeyboard (非分割モード用の後方互換)
function getPracticeKb(layer) {
  return document.getElementById('keyboard-practice');
}

function buildPrompt(mode) {
  switch (mode) {
    case 'alpha':
      return generatePrompt('alpha', { length: settings.length, strategy: settings.strategy, weakKeys: lifetime.weakKeys, settings });
    case 'symbol':
      return generatePrompt('symbol', { length: settings.length, strategy: settings.strategy, weakKeys: lifetime.weakKeys, settings });
    case 'nav':
      return generatePrompt('nav', { length: settings.length, settings });
    case 'number':
      return generatePrompt('number', { length: settings.length, strategy: settings.strategy, weakKeys: lifetime.weakKeys, settings });
    case 'shortcut':
      return generatePrompt('shortcut', { length: settings.length, settings });
    case 'scenario': {
      const text = pickScenario(settings.scenarioGenre, Math.ceil(settings.length / 10));
      return generatePrompt('scenario', { snippetText: text });
    }
    case 'devflow':
      return pickDevflowSteps(settings.devflowGenre, 1, settings.tmuxPrefix);
    default:
      return [];
  }
}

function getPhysKey(items, idx, subIdx) {
  const item = items[idx];
  if (!item) return null;
  if (item.sequence) {
    const seq = item.sequence[subIdx ?? 0];
    return seq?.physicalKey || null;
  }
  return item.physicalKey || null;
}


function renderPrompt(idx, lastCorrect) {
  const el = document.getElementById('prompt-display');
  const mode = settings.mode;

  if (mode === 'devflow') {
    renderDevflowPrompt(el, idx, lastCorrect);
    return;
  }

  const getDisp = item => {
    if (typeof item === 'string') return item;
    return item.display || item.expectKey;
  };

  const done = currentItems.slice(0, idx).map(getDisp).join('');
  const cur  = currentItems[idx] ? getDisp(currentItems[idx]) : '';
  const rest = currentItems.slice(idx + 1).map(getDisp).join('');
  el.innerHTML =
    `<span class="done">${esc(done)}</span>` +
    `<span class="cursor${lastCorrect === false ? ' error' : ''}">${esc(cur)}</span>` +
    `<span class="rest">${esc(rest)}</span>`;
}

function renderDevflowPrompt(el, idx, lastCorrect) {
  const step = currentItems[idx];
  if (!step) { el.innerHTML = '<span class="done">完了</span>'; return; }

  const done = currentItems.slice(0, idx).map(s => s.display).join(' → ');
  const cur  = step.display;
  const rest = currentItems.slice(idx + 1).map(s => s.display).join(' → ');

  let html = '';
  if (done) html += `<span class="done devflow-done">${esc(done)} → </span>`;
  html += `<span class="cursor devflow-cur${lastCorrect === false ? ' error' : ''}">${esc(cur)}</span>`;
  if (rest) html += `<span class="rest devflow-rest"> → ${esc(rest)}</span>`;
  el.innerHTML = html;
}

function updateContextIndicator(step) {
  const el = document.getElementById('context-indicator');
  if (!el) return;
  if (!step) { el.hidden = true; return; }
  el.hidden = false;

  const MODE_LABELS = {
    'tmux':        { label: 'TMUX',   cls: 'ctx-tmux'   },
    'nvim-normal': { label: 'NORMAL', cls: 'ctx-normal'  },
    'nvim-insert': { label: 'INSERT', cls: 'ctx-insert'  },
    'nvim-ex':     { label: 'EX',     cls: 'ctx-ex'      },
    'shell':       { label: 'SHELL',  cls: 'ctx-shell'   },
    'key':         { label: 'KEY',    cls: 'ctx-key'     },
  };
  const info = step.mode ? (MODE_LABELS[step.mode] || { label: step.mode.toUpperCase(), cls: '' }) : { label: '', cls: '' };
  el.className = `context-indicator ${info.cls}`;
  el.textContent = info.label;
}

function startTimer() {
  if (!settings.timeLimit) {
    document.getElementById('timer').hidden = true;
    return;
  }
  let timeLeft = settings.timeLimit;
  const timerEl = document.getElementById('timer');
  timerEl.hidden = false;
  timerEl.textContent = timeLeft + 's';
  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft + 's';
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      trainer?.stop();
      finishSession();
    }
  }, 1000);
}

function finishSession() {
  if (!trainer) return;
  const typed = trainer.keystrokes.filter(k => k.correct).map(k => k.expected).join('');
  showSummary({
    prompt: currentItems,
    completedSteps: trainer.idx,
    typed,
    startedAt: trainer.startedAt ?? performance.now(),
    endedAt: performance.now(),
    keystrokes: trainer.keystrokes,
    mode: trainer.isDevflow ? 'devflow' : 'sequential',
  });
}

// ===== サマリー画面 =====

function showSummary(sessionStats) {
  showScreen('summary');

  const mode = settings.mode;
  const sec = Math.round((sessionStats.endedAt - sessionStats.startedAt) / 1000);
  document.getElementById('result-time').textContent = sec;

  if (mode === 'devflow') {
    const df = computeDevflowStats(sessionStats);
    document.getElementById('result-wpm').textContent       = df.stepsPerMin;
    document.getElementById('result-wpm-unit').textContent  = 'steps/min';
    document.getElementById('result-accuracy').textContent  = df.mistakesPerStep;
    document.getElementById('result-acc-unit').textContent  = 'miss/step';
    document.getElementById('result-wpm').classList.remove('goal-met');
    document.getElementById('result-accuracy').classList.remove('goal-met');

    lifetime = updateBestByMode(lifetime, 'devflow', df);
  } else {
    const wpm = computeWpm(sessionStats);
    const acc = computeAccuracy(sessionStats);
    document.getElementById('result-wpm').textContent       = wpm;
    document.getElementById('result-wpm-unit').textContent  = 'wpm';
    document.getElementById('result-accuracy').textContent  = acc;
    document.getElementById('result-acc-unit').textContent  = '%';
    document.getElementById('result-wpm').classList.toggle('goal-met', wpm >= settings.targetWpm);
    document.getElementById('result-accuracy').classList.toggle('goal-met', acc >= settings.targetAccuracy);

    lifetime = updateBestByMode(lifetime, mode, { wpm, accuracy: acc });
    if (wpm > lifetime.bestWpm) lifetime.bestWpm = wpm;
    if (acc > lifetime.bestAccuracy) lifetime.bestAccuracy = acc;
  }

  // このセッションの苦手キー
  const sessionWeak = {};
  for (const k of sessionStats.keystrokes) {
    if (!sessionWeak[k.expected]) sessionWeak[k.expected] = { miss: 0, total: 0 };
    sessionWeak[k.expected].total++;
    if (!k.correct) sessionWeak[k.expected].miss++;
  }
  const weakArr = Object.entries(sessionWeak)
    .filter(([, v]) => v.miss > 0)
    .sort((a, b) => (b[1].miss / b[1].total) - (a[1].miss / a[1].total))
    .slice(0, 5);
  document.getElementById('result-weak').textContent = weakArr.length > 0
    ? weakArr.map(([k, v]) => `${k} (${v.miss}ミス/${v.total}打)`).join('  ')
    : 'なし';

  // モード表示
  const modeLabel = MODES.find(m => m.id === mode)?.label || mode;
  const modeBadge = document.getElementById('result-mode');
  if (modeBadge) modeBadge.textContent = modeLabel;

  lifetime = mergeWeakKeys(lifetime, sessionStats);
  lifetime.totalSessions++;
  saveLifetime(lifetime);
}

function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.getElementById('btn-retry').addEventListener('click', startPractice);
document.getElementById('btn-back').addEventListener('click', () => {
  showScreen('start');
  refreshBestScore();
});

// ===== 初期化 =====
initStartScreen();
showScreen('start');
