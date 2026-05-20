export const KEYS = [
  // 左手 上段
  { char: 'q', row: 'top',    col: 1, hand: 'L' },
  { char: 'w', row: 'top',    col: 2, hand: 'L' },
  { char: 'e', row: 'top',    col: 3, hand: 'L' },
  { char: 'r', row: 'top',    col: 4, hand: 'L' },
  { char: 't', row: 'top',    col: 5, hand: 'L' },
  // 左手 中段
  { char: 'a', row: 'home',   col: 1, hand: 'L' },
  { char: 's', row: 'home',   col: 2, hand: 'L' },
  { char: 'd', row: 'home',   col: 3, hand: 'L' },
  { char: 'f', row: 'home',   col: 4, hand: 'L' },
  { char: 'g', row: 'home',   col: 5, hand: 'L' },
  // 左手 下段
  { char: 'z', row: 'bottom', col: 1, hand: 'L' },
  { char: 'x', row: 'bottom', col: 2, hand: 'L' },
  { char: 'c', row: 'bottom', col: 3, hand: 'L' },
  { char: 'v', row: 'bottom', col: 4, hand: 'L' },
  { char: 'b', row: 'bottom', col: 5, hand: 'L' },
  // 右手 上段
  { char: 'y', row: 'top',    col: 6,  hand: 'R' },
  { char: 'u', row: 'top',    col: 7,  hand: 'R' },
  { char: 'i', row: 'top',    col: 8,  hand: 'R' },
  { char: 'o', row: 'top',    col: 9,  hand: 'R' },
  { char: 'p', row: 'top',    col: 10, hand: 'R' },
  // 右手 中段
  { char: 'h', row: 'home',   col: 6,  hand: 'R' },
  { char: 'j', row: 'home',   col: 7,  hand: 'R' },
  { char: 'k', row: 'home',   col: 8,  hand: 'R' },
  { char: 'l', row: 'home',   col: 9,  hand: 'R' },
  // 右手 下段
  { char: 'n', row: 'bottom', col: 6,  hand: 'R' },
  { char: 'm', row: 'bottom', col: 7,  hand: 'R' },
];

export const ROWS = ['top', 'home', 'bottom'];
export const COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const ROW_LABELS = { top: '上段', home: '中段', bottom: '下段' };

export const COL_LABELS = {
  1: '小指外(L)', 2: '小指(L)', 3: '薬指(L)', 4: '中指(L)', 5: '人差(L)',
  6: '人差(R)',   7: '中指(R)', 8: '薬指(R)', 9: '小指(R)', 10: '小指外(R)',
};

export const PRESETS = {
  all:       { rows: ['top','home','bottom'], cols: [1,2,3,4,5,6,7,8,9,10], label: '全て' },
  home:      { rows: ['home'],               cols: [1,2,3,4,5,6,7,8,9,10], label: '中段のみ' },
  index:     { rows: ['top','home','bottom'], cols: [5, 6],                  label: '人差し指' },
  homeIndex: { rows: ['home'],               cols: [4, 5, 6, 7],            label: '中段×中央' },
  leftHand:  { rows: ['top','home','bottom'], cols: [1,2,3,4,5],             label: '左手' },
  rightHand: { rows: ['top','home','bottom'], cols: [6,7,8,9,10],            label: '右手' },
};
