export class Trainer {
  constructor({ prompt, onUpdate, onComplete }) {
    this.prompt = prompt;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.idx = 0;
    this.keystrokes = [];
    this.startedAt = null;
    this.endedAt = null;
    this._handler = this._onKeyDown.bind(this);
  }

  start() {
    this.startedAt = performance.now();
    window.addEventListener('keydown', this._handler);
  }

  stop() {
    window.removeEventListener('keydown', this._handler);
  }

  _onKeyDown(e) {
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    if (this.idx >= this.prompt.length) return;

    const expected = this.prompt[this.idx];
    const actual = e.key.toLowerCase();
    const correct = expected === actual;

    this.keystrokes.push({ expected, actual, t: performance.now(), correct });

    if (correct) this.idx++;

    this.onUpdate({ idx: this.idx, lastCorrect: correct, lastChar: actual });

    if (this.idx === this.prompt.length) {
      this.endedAt = performance.now();
      this.stop();
      this.onComplete({
        prompt: this.prompt,
        typed: this.keystrokes.filter(k => k.correct).map(k => k.expected).join(''),
        startedAt: this.startedAt,
        endedAt: this.endedAt,
        keystrokes: this.keystrokes,
      });
    }
  }
}
