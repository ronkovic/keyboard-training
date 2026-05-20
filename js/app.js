import { ROWS, COLS, ROW_LABELS, COL_LABELS, PRESETS } from './layout.js';
import { buildKeyboard, updateHighlight, flashKey } from './keyboard.js';
import { pickKeys, generatePrompt } from './generator.js';
import { computeWpm, computeAccuracy, mergeWeakKeys, topWeak } from './stats.js';
import { loadSettings, saveSettings, loadLifetime, saveLifetime } from './storage.js';
import { Trainer } from './trainer.js';

let settings = loadSettings();
let lifetime = loadLifetime();
let trainer = null;
let currentPrompt = '';
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

// ===== スタート画面 =====

function initStartScreen() {
  buildRowToggles();
  buildColToggles();
  buildPresetButtons();
  bindDifficultyControls();

  document.getElementById('btn-start').addEventListener('click', startPractice);

  buildKeyboard(document.getElementById('keyboard-start'));
  refreshStartKeyboard();
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
}

function refreshStartKeyboard() {
  const targetSet = new Set(pickKeys(settings));
  updateHighlight(targetSet, null, document.getElementById('keyboard-start'));
}

function refreshStartButton() {
  document.getElementById('btn-start').disabled = pickKeys(settings).length === 0;
}

function refreshBestScore() {
  const el = document.getElementById('best-score');
  el.textContent = lifetime.bestWpm > 0
    ? `ベスト: ${lifetime.bestWpm} WPM / ${lifetime.bestAccuracy}%`
    : 'まだ記録なし';

  const weakEl = document.getElementById('weak-keys-summary');
  const weak = topWeak(lifetime.weakKeys, 5);
  weakEl.textContent = weak.length > 0
    ? '苦手: ' + weak.map(w => `${w.key.toUpperCase()}(${Math.round(w.rate * 100)}%)`).join(' ')
    : '';
}

// ===== 練習画面 =====

function startPractice() {
  const charset = pickKeys(settings);
  if (charset.length === 0) return;

  if (trainer) trainer.stop();
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }

  currentPrompt = generatePrompt(charset, settings.length);
  showScreen('practice');

  const kbEl = document.getElementById('keyboard-practice');
  if (!kbEl.hasChildNodes()) buildKeyboard(kbEl);

  renderPrompt(0, null);
  updateHighlight(new Set(charset), currentPrompt[0], kbEl);

  if (settings.timeLimit) {
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
  } else {
    document.getElementById('timer').hidden = true;
  }

  const targetSet = new Set(charset);
  trainer = new Trainer({
    prompt: currentPrompt,
    onUpdate: ({ idx, lastCorrect, lastChar }) => {
      renderPrompt(idx, lastCorrect);
      flashKey(lastChar, lastCorrect, kbEl);
      updateHighlight(targetSet, currentPrompt[idx], kbEl);
    },
    onComplete: sessionStats => {
      if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
      showSummary(sessionStats);
    },
  });
  trainer.start();
}

function renderPrompt(idx, lastCorrect) {
  const el = document.getElementById('prompt-display');
  const done = currentPrompt.slice(0, idx);
  const cur  = currentPrompt[idx] ?? '';
  const rest = currentPrompt.slice(idx + 1);
  el.innerHTML =
    `<span class="done">${done}</span>` +
    `<span class="cursor${lastCorrect === false ? ' error' : ''}">${cur}</span>` +
    `<span class="rest">${rest}</span>`;
}

function finishSession() {
  if (!trainer) return;
  const typed = trainer.keystrokes.filter(k => k.correct).map(k => k.expected).join('');
  showSummary({
    prompt: currentPrompt,
    typed,
    startedAt: trainer.startedAt ?? performance.now(),
    endedAt: performance.now(),
    keystrokes: trainer.keystrokes,
  });
}

// ===== サマリー画面 =====

function showSummary(sessionStats) {
  showScreen('summary');

  const wpm = computeWpm(sessionStats);
  const acc = computeAccuracy(sessionStats);
  const sec = Math.round((sessionStats.endedAt - sessionStats.startedAt) / 1000);

  const wpmEl = document.getElementById('result-wpm');
  const accEl = document.getElementById('result-accuracy');
  wpmEl.textContent = wpm;
  accEl.textContent = acc;
  document.getElementById('result-time').textContent = sec;

  wpmEl.classList.toggle('goal-met', wpm >= settings.targetWpm);
  accEl.classList.toggle('goal-met', acc >= settings.targetAccuracy);

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
    ? weakArr.map(([k, v]) => `${k.toUpperCase()} (${v.miss}ミス/${v.total}打)`).join('  ')
    : 'なし';

  // ライフタイム更新
  lifetime = mergeWeakKeys(lifetime, sessionStats);
  lifetime.totalSessions++;
  if (wpm > lifetime.bestWpm) lifetime.bestWpm = wpm;
  if (acc > lifetime.bestAccuracy) lifetime.bestAccuracy = acc;
  saveLifetime(lifetime);
}

document.getElementById('btn-retry').addEventListener('click', startPractice);
document.getElementById('btn-back').addEventListener('click', () => {
  showScreen('start');
  refreshBestScore();
});

// ===== 初期化 =====
initStartScreen();
showScreen('start');
