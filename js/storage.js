const SETTINGS_KEY = 'kusamochi-trainer:settings';
const LIFETIME_KEY = 'kusamochi-trainer:lifetime';

const DEFAULT_SETTINGS = {
  selectedRows: ['home'],
  selectedCols: [4, 5, 6, 7],
  length: 20,
  timeLimit: null,
  targetWpm: 30,
  targetAccuracy: 95,
};

const DEFAULT_LIFETIME = {
  bestWpm: 0,
  bestAccuracy: 0,
  weakKeys: {},
  totalSessions: 0,
};

export function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return { ...DEFAULT_SETTINGS, ...stored };
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
    return { ...DEFAULT_LIFETIME, ...stored };
  } catch {
    return { ...DEFAULT_LIFETIME };
  }
}

export function saveLifetime(lifetime) {
  localStorage.setItem(LIFETIME_KEY, JSON.stringify(lifetime));
}
