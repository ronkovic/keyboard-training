export function computeWpm({ startedAt, endedAt, typed }) {
  const minutes = (endedAt - startedAt) / 60000;
  if (minutes <= 0) return 0;
  return Math.round((typed.length / 5) / minutes);
}

export function computeAccuracy({ keystrokes }) {
  if (keystrokes.length === 0) return 100;
  const ok = keystrokes.filter(k => k.correct).length;
  return Math.round((ok / keystrokes.length) * 1000) / 10;
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

export function topWeak(weakKeys, n = 5) {
  return Object.entries(weakKeys)
    .filter(([, v]) => v.total >= 3 && v.miss > 0)
    .map(([key, v]) => ({ key, rate: v.miss / v.total, ...v }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, n);
}
