// prompt は PromptItem[] または DevflowStep[]
//
// PromptItem: { display, expectKey, expectMods?, physicalKey?, physicalKeys? }
//   expectKey  : e.key と比較する値 ('a', '{', 'ArrowLeft', 'c' など)
//   expectMods : 期待される修飾キー配列 (省略=空)
//
// DevflowStep: { display, mode, sequence: PromptItem[] }
//   mode    : 'tmux'|'nvim-normal'|'nvim-insert'|'nvim-ex'|'shell'
//   sequence: このステップを完了するために必要なキー列

export class Trainer {
  constructor({ prompt, onUpdate, onComplete, layerSwitchKeys = [] }) {
    this.prompt = prompt;           // PromptItem[] | DevflowStep[]
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.layerSwitchKeys = layerSwitchKeys;  // レイヤー切替キー (誤入力判定から除外)
    this.idx = 0;              // プロンプト内の現在位置
    this.subIdx = 0;           // devflow ステップ内のサブ位置
    this.keystrokes = [];
    this.startedAt = null;
    this.endedAt = null;
    this._handler = this._onKeyDown.bind(this);
  }

  get isDevflow() {
    return this.prompt.length > 0 && Array.isArray(this.prompt[0].sequence);
  }

  start() {
    this.startedAt = performance.now();
    window.addEventListener('keydown', this._handler);
  }

  stop() {
    window.removeEventListener('keydown', this._handler);
  }

  _onKeyDown(e) {
    if (this.idx >= this.prompt.length) return;
    // IME 変換中、修飾キー単独押し、Process キーは無視
    if (e.isComposing || e.key === 'Process') return;
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;

    if (this.isDevflow) {
      this._handleDevflow(e);
    } else {
      this._handleSequential(e);
    }
  }

  _handleSequential(e) {
    const item = this.prompt[this.idx];

    // レイヤー切替キーが期待キーと一致しない場合は無視 (誤入力カウントしない)
    if (this.layerSwitchKeys.includes(e.key) && !matchItem(item, e)) return;

    const correct = matchItem(item, e);

    // ナビ/ショートカット系はブラウザのデフォルト動作を抑止
    if (item.category === 'nav' || item.category === 'shortcut' || (item.expectMods && item.expectMods.length > 0)) {
      e.preventDefault();
    }

    const actual = buildActualKey(e);
    this.keystrokes.push({ expected: item.expectKey, actual, t: performance.now(), correct });

    if (correct) this.idx++;

    this.onUpdate({ idx: this.idx, lastCorrect: correct, lastKey: actual, item });

    if (this.idx === this.prompt.length) {
      this.endedAt = performance.now();
      this.stop();
      this.onComplete({
        prompt: this.prompt,
        startedAt: this.startedAt,
        endedAt: this.endedAt,
        keystrokes: this.keystrokes,
        mode: 'sequential',
      });
    }
  }

  _handleDevflow(e) {
    const step = this.prompt[this.idx];
    const seqItem = step.sequence[this.subIdx];

    // レイヤー切替キーが期待キーと一致しない場合は無視 (sequential と同じ処理)
    if (this.layerSwitchKeys.includes(e.key) && !matchItem(seqItem, e)) return;

    const correct = matchItem(seqItem, e);

    e.preventDefault();

    const actual = buildActualKey(e);
    this.keystrokes.push({ expected: seqItem.expectKey, actual, t: performance.now(), correct, stepIdx: this.idx });

    if (correct) {
      this.subIdx++;
      if (this.subIdx >= step.sequence.length) {
        this.idx++;
        this.subIdx = 0;
      }
    }

    this.onUpdate({
      idx: this.idx,
      subIdx: this.subIdx,
      lastCorrect: correct,
      lastKey: actual,
      step: this.prompt[this.idx],
    });

    if (this.idx >= this.prompt.length) {
      this.endedAt = performance.now();
      this.stop();
      this.onComplete({
        prompt: this.prompt,
        startedAt: this.startedAt,
        endedAt: this.endedAt,
        keystrokes: this.keystrokes,
        mode: 'devflow',
      });
    }
  }
}

function matchItem(item, e) {
  const expectedMods = item.expectMods || [];
  const key = item.expectKey;

  if (expectedMods.length > 0) {
    // ショートカット: 指定した修飾キーを厳密チェック
    if (expectedMods.includes('ctrl')  !== e.ctrlKey)  return false;
    if (expectedMods.includes('meta')  !== e.metaKey)  return false;
    if (expectedMods.includes('alt')   !== e.altKey)   return false;
    if (expectedMods.includes('shift') !== e.shiftKey) return false;
    return key.length === 1
      ? e.key.toLowerCase() === key.toLowerCase()
      : e.key === key;
  }

  // 修飾キー指定なしの単一文字 (記号・数字・アルファベット):
  // QMK が Shift を自動付与して送る文字 (|, {, ! 等) があるため shiftKey は無視し e.key のみ比較
  if (key.length === 1) {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;  // 意図しない修飾キーは弾く
    if (key >= 'a' && key <= 'z') return e.key.toLowerCase() === key;  // alpha: case-insensitive
    return e.key === key;  // 記号・数字: 完全一致
  }

  // 特殊キー (ArrowLeft, Home, Escape など): 修飾キーなしで完全一致
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  return e.key === key;
}

function buildActualKey(e) {
  const mods = [];
  if (e.ctrlKey)  mods.push('ctrl');
  if (e.metaKey)  mods.push('meta');
  if (e.altKey)   mods.push('alt');
  if (e.shiftKey) mods.push('shift');
  return mods.length > 0 ? `${mods.join('+')}+${e.key}` : e.key;
}
