export function computeWpm({ startedAt, endedAt, keystrokes }) {
  const minutes = (endedAt - startedAt) / 60000;
  if (minutes <= 0) return 0;
  const correct = keystrokes.filter(k => k.correct).length;
  return Math.round((correct / 5) / minutes);
}

export function computeAccuracy({ keystrokes }) {
  if (keystrokes.length === 0) return 100;
  const ok = keystrokes.filter(k => k.correct).length;
  return Math.round((ok / keystrokes.length) * 1000) / 10;
}

// devflow 用: steps/min と mistakes/step
export function computeDevflowStats({ prompt, completedSteps: explicitSteps, startedAt, endedAt, keystrokes }) {
  const minutes = (endedAt - startedAt) / 60000;
  const completedSteps = explicitSteps ?? (prompt ? prompt.length : 0);
  const stepsPerMin = minutes > 0 ? Math.round(completedSteps / minutes) : 0;
  const totalMistakes = keystrokes.filter(k => !k.correct).length;
  const mistakesPerStep = completedSteps > 0
    ? Math.round((totalMistakes / completedSteps) * 10) / 10
    : 0;
  return { stepsPerMin, mistakesPerStep };
}

export function mergeWeakKeys(lifetime, sessionStats) {
  for (const k of sessionStats.keystrokes) {
    const key = k.expected;
    if (!lifetime.weakKeys[key]) lifetime.weakKeys[key] = { miss: 0, total: 0 };
    lifetime.weakKeys[key].total++;
    if (!k.correct) lifetime.weakKeys[key].miss++;
  }
  return lifetime;
}

export function updateBestByMode(lifetime, mode, stats) {
  if (!lifetime.bestByMode) lifetime.bestByMode = {};
  const current = lifetime.bestByMode[mode];
  if (mode === 'devflow') {
    if (!current || stats.stepsPerMin > (current.stepsPerMin || 0)) {
      lifetime.bestByMode[mode] = { stepsPerMin: stats.stepsPerMin, mistakesPerStep: stats.mistakesPerStep };
    }
  } else {
    if (!current || stats.wpm > (current.wpm || 0)) {
      lifetime.bestByMode[mode] = { wpm: stats.wpm, accuracy: stats.accuracy };
    }
  }
  return lifetime;
}

export function topWeak(weakKeys, n = 5) {
  return Object.entries(weakKeys)
    .filter(([, v]) => v.total >= 3 && v.miss > 0)
    .map(([key, v]) => ({ key, rate: v.miss / v.total, ...v }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, n);
}
