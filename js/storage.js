const SETTINGS_KEY = 'kusamochi-trainer:settings';
const LIFETIME_KEY  = 'kusamochi-trainer:lifetime';

const DEFAULT_SETTINGS = {
  // 既存
  selectedRows: ['home'],
  selectedCols: [4, 5, 6, 7],
  length: 20,
  timeLimit: null,
  targetWpm: 30,
  targetAccuracy: 95,
  showKeyboard: true,
  // 新規: モード
  mode: 'alpha',              // 'alpha'|'symbol'|'nav'|'number'|'shortcut'|'scenario'|'devflow'
  strategy: 'random',         // 'random'|'pair'|'weak'
  // symbol モード絞り込み
  symbolCategories: ['brackets', 'arithmetic', 'special', 'quotes'],
  // nav モード
  navAll: false,              // false=矢印のみ, true=Home/End/PageUp/Down/Del も含む
  // shortcut モード
  shortcutGroups: ['edit'],
  // scenario モード
  scenarioGenre: 'js',        // 'js'|'python'|'git'|'html'
  // devflow モード
  devflowGenre: 'combined',   // 'tmux'|'nvim'|'combined'
  tmuxPrefix: { mods: ['ctrl'], key: 'q' },  // tmux.conf: set -g prefix C-q
};

const DEFAULT_LIFETIME = {
  bestWpm: 0,
  bestAccuracy: 0,
  weakKeys: {},
  totalSessions: 0,
  bestByMode: {},  // { alpha: {wpm, accuracy}, symbol: {wpm, accuracy}, devflow: {stepsPerMin, mistakesPerStep} }
};

export function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    // tmuxPrefix だけ深いマージが必要
    const merged = { ...DEFAULT_SETTINGS, ...stored };
    if (stored.tmuxPrefix) merged.tmuxPrefix = { ...DEFAULT_SETTINGS.tmuxPrefix, ...stored.tmuxPrefix };
    return merged;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadLifetime() {
  try {
    const stored = JSON.parse(localStorage.getItem(LIFETIME_KEY) || '{}');
    return { ...DEFAULT_LIFETIME, ...stored, bestByMode: stored.bestByMode || {} };
  } catch {
    return { ...DEFAULT_LIFETIME };
  }
}

export function saveLifetime(lifetime) {
  localStorage.setItem(LIFETIME_KEY, JSON.stringify(lifetime));
}
