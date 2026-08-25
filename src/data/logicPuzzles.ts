export type PuzzleCategoryKey = 'house' | 'nationality' | 'wand' | 'snack' | 'pet';

export interface PuzzleCategory {
  key: PuzzleCategoryKey;
  label: string;
}

export interface LogicGridPuzzle {
  id: string;
  day: number;
  type: 'logicGrid';
  title: string;
  /** Column headers for the answer table — a height in cm, left (shortest) to right (tallest). */
  heights: number[];
  categories: PuzzleCategory[];
  clues: string[];
  /** Correct value per category, indexed the same as `heights` (index 0 = shortest). */
  answer: Record<PuzzleCategoryKey, string[]>;
}

export interface SudokuPuzzle {
  id: string;
  day: number;
  type: 'sudoku';
  title: string;
  /** 9x9 grid, row-major; 0 marks a blank cell the player must fill in. */
  given: number[][];
}

export interface KakuroRun {
  /** [row, col] of every fillable cell in this run, in order. */
  cells: [number, number][];
  sum: number;
}

export interface KakuroPuzzle {
  id: string;
  day: number;
  type: 'kakuro';
  title: string;
  rows: number;
  cols: number;
  /** row-major; true = black/clue cell, false = fillable white cell. */
  grid: boolean[][];
  hruns: KakuroRun[];
  vruns: KakuroRun[];
}

export type KenKenOp = 'add' | 'multiply';

export interface KenKenCage {
  /** [row, col] of every cell in this cage; the first cell is where the clue label is drawn. */
  cells: [number, number][];
  /** null = single-cell cage — the cell must simply equal `target`. */
  op: KenKenOp | null;
  target: number;
}

export interface KenKenPuzzle {
  id: string;
  day: number;
  type: 'kenken';
  title: string;
  size: number;
  cages: KenKenCage[];
}

export type FutoshikiOp = '<' | '>';

export interface FutoshikiHConstraint {
  row: number;
  /** Relation between (row, col) and (row, col+1). */
  col: number;
  op: FutoshikiOp;
}

export interface FutoshikiVConstraint {
  /** Relation between (row, col) and (row+1, col). */
  row: number;
  col: number;
  op: FutoshikiOp;
}

export interface FutoshikiPuzzle {
  id: string;
  day: number;
  type: 'futoshiki';
  title: string;
  size: number;
  /** row-major; null marks a blank cell the player must fill in. */
  given: (number | null)[][];
  hConstraints: FutoshikiHConstraint[];
  vConstraints: FutoshikiVConstraint[];
}

export interface WordProblemPuzzle {
  id: string;
  day: number;
  type: 'wordProblem';
  title: string;
  /** The full story-problem text, shown as-is (line breaks preserved). */
  prompt: string;
  /** Unit label shown next to the answer input, e.g. '갈레온'. */
  unit: string;
  answer: number;
}

export type DailyPuzzle = LogicGridPuzzle | SudokuPuzzle | KakuroPuzzle | KenKenPuzzle | FutoshikiPuzzle | WordProblemPuzzle;

export type LogicGridAnswer = Record<PuzzleCategoryKey, (string | null)[]>;
export type SudokuAnswer = (number | null)[][];
export type KakuroAnswer = (number | null)[][];
export type KenKenAnswer = (number | null)[][];
export type FutoshikiAnswer = (number | null)[][];
export type WordProblemAnswer = number | null;
export type PuzzleAnswerValue = LogicGridAnswer | SudokuAnswer | KakuroAnswer | KenKenAnswer | FutoshikiAnswer | WordProblemAnswer;

export const PUZZLE_CATEGORIES: PuzzleCategory[] = [
  { key: 'house', label: '기숙사' },
  { key: 'nationality', label: '국적' },
  { key: 'wand', label: '지팡이' },
  { key: 'snack', label: '간식' },
  { key: 'pet', label: '펫' },
];

/** Points awarded to the 1st/2nd/3rd/4th house to submit a fully correct answer. */
export const PUZZLE_RANK_POINTS = [100, 80, 60, 40];

/** Each house gets this many submit attempts per puzzle before being locked out. */
export const PUZZLE_MAX_ATTEMPTS = 5;

export const DAILY_PUZZLES: DailyPuzzle[] = [
  {
    id: 'puzzle1',
    day: 1,
    type: 'logicGrid',
    title: '하우스컵 논리 퀴즈 1',
    heights: [156, 160, 164, 168, 172],
    categories: PUZZLE_CATEGORIES,
    clues: [
      '프랑스인은 그리핀도르 소속이다.',
      '중국인은 토끼를 기른다.',
      '독일인은 오리나무로 만든 지팡이를 사용한다.',
      '키가 작은 순서대로 섰을 때 보바통 소속은 슬리데린 소속의 왼쪽에 있다.',
      '보바통 소속은 딱총나무로 만든 지팡이를 사용한다.',
      '버터맥주를 좋아하는 사람은 올빼미를 기른다.',
      '후플푸프 소속인 사람은 페퍼민트 두꺼비를 좋아한다.',
      '키가 작은 순서로 섰을 때 가운데에 있는 사람은 사과나무로 만든 지팡이를 사용한다.',
      '키가 작은 순서로 섰을 때 한국인은 가장 작다.',
      '키가 작은 순서로 섰을 때 설탕 깃펜을 좋아하는 사람은 강아지를 기르는 사람의 옆에 서 있다.',
      '키가 작은 순서로 섰을 때 쥐를 기르는 사람은 페퍼민트 두꺼비를 좋아하는 사람 옆에 서 있다.',
      '용 살코기를 좋아하는 사람은 자두나무로 만든 지팡이를 사용한다.',
      '미국인은 박하 도깨비를 좋아한다.',
      '키가 작은 순서로 섰을 때 한국인은 래번클로 소속의 옆에 서 있다.',
      '키가 작은 순서로 섰을 때 설탕 깃펜을 좋아하는 사람은 아카시아나무로 만든 지팡이를 사용하는 사람의 옆에 서 있다.',
    ],
    answer: {
      house: ['후플푸프', '래번클로', '그리핀도르', '보바통', '슬리데린'],
      nationality: ['한국인', '독일인', '프랑스인', '미국인', '중국인'],
      wand: ['아카시아나무', '오리나무', '사과나무', '딱총나무', '자두나무'],
      snack: ['페퍼민트 두꺼비', '설탕 깃펜', '버터맥주', '박하 도깨비', '용 살코기'],
      pet: ['강아지', '쥐', '올빼미', '거북이', '토끼'],
    },
  },
  {
    id: 'puzzle2',
    day: 2,
    type: 'sudoku',
    title: '하우스컵 스도쿠 퀴즈',
    given: [
      [1, 0, 0, 0, 0, 7, 0, 9, 0],
      [0, 3, 0, 0, 2, 0, 0, 0, 8],
      [0, 0, 9, 6, 0, 0, 5, 0, 0],
      [0, 0, 5, 3, 0, 0, 9, 0, 0],
      [0, 1, 0, 0, 8, 0, 0, 0, 2],
      [6, 0, 0, 0, 4, 0, 0, 0, 0],
      [3, 0, 0, 0, 0, 0, 0, 1, 0],
      [0, 4, 0, 0, 0, 0, 0, 7, 0],
      [0, 0, 7, 0, 0, 0, 3, 0, 0],
    ],
  },
  {
    id: 'puzzle3',
    day: 3,
    type: 'kakuro',
    title: '하우스컵 가쿠로 퀴즈',
    rows: 7,
    cols: 7,
    grid: [
      [true, true, true, true, true, true, true],
      [true, true, false, false, true, true, true],
      [true, false, false, false, false, true, true],
      [true, false, false, true, false, false, true],
      [true, true, false, false, true, false, false],
      [true, true, true, false, false, false, false],
      [true, true, true, true, false, false, true],
    ],
    hruns: [
      { cells: [[1, 2], [1, 3]], sum: 8 },
      { cells: [[2, 1], [2, 2], [2, 3], [2, 4]], sum: 23 },
      { cells: [[3, 1], [3, 2]], sum: 3 },
      { cells: [[3, 4], [3, 5]], sum: 7 },
      { cells: [[4, 2], [4, 3]], sum: 14 },
      { cells: [[4, 5], [4, 6]], sum: 11 },
      { cells: [[5, 3], [5, 4], [5, 5], [5, 6]], sum: 16 },
      { cells: [[6, 4], [6, 5]], sum: 15 },
    ],
    vruns: [
      { cells: [[2, 1], [3, 1]], sum: 5 },
      { cells: [[1, 2], [2, 2], [3, 2], [4, 2]], sum: 13 },
      { cells: [[1, 3], [2, 3]], sum: 12 },
      { cells: [[4, 3], [5, 3]], sum: 10 },
      { cells: [[2, 4], [3, 4]], sum: 11 },
      { cells: [[5, 4], [6, 4]], sum: 8 },
      { cells: [[3, 5], [4, 5], [5, 5], [6, 5]], sum: 22 },
      { cells: [[4, 6], [5, 6]], sum: 16 },
    ],
  },
  {
    id: 'puzzle4',
    day: 4,
    type: 'kenken',
    title: '하우스컵 켄켄 퀴즈',
    size: 6,
    cages: [
      { cells: [[0, 0], [0, 1]], op: 'multiply', target: 3 },
      { cells: [[0, 2], [0, 3], [1, 2]], op: 'multiply', target: 48 },
      { cells: [[0, 4], [0, 5]], op: 'multiply', target: 10 },
      { cells: [[1, 0], [1, 1], [2, 0]], op: 'multiply', target: 18 },
      { cells: [[1, 3]], op: null, target: 3 },
      { cells: [[1, 4], [1, 5]], op: 'multiply', target: 20 },
      { cells: [[2, 1]], op: null, target: 6 },
      { cells: [[2, 2], [2, 3]], op: 'multiply', target: 5 },
      { cells: [[2, 4], [3, 4]], op: 'add', target: 7 },
      { cells: [[2, 5]], op: null, target: 2 },
      { cells: [[3, 0], [3, 1], [3, 2], [4, 2]], op: 'multiply', target: 48 },
      { cells: [[3, 3]], op: null, target: 5 },
      { cells: [[3, 5], [4, 3], [4, 4], [4, 5]], op: 'add', target: 12 },
      { cells: [[4, 0], [4, 1], [5, 0]], op: 'add', target: 14 },
      { cells: [[5, 1]], op: null, target: 2 },
      { cells: [[5, 2], [5, 3], [5, 4]], op: 'multiply', target: 12 },
      { cells: [[5, 5]], op: null, target: 6 },
    ],
  },
  {
    id: 'puzzle5',
    day: 5,
    type: 'futoshiki',
    title: '하우스컵 후토시키 퀴즈',
    size: 9,
    given: [
      [null, null, null, null, null, 5, null, null, null],
      [null, null, null, 4, null, null, null, null, 7],
      [5, null, null, null, 2, null, null, null, null],
      [null, null, null, null, null, 8, null, null, null],
      [null, 7, 4, null, null, 1, null, null, null],
      [null, null, null, 7, null, null, null, 6, null],
      [null, 2, null, null, 4, null, 8, null, null],
      [1, null, 3, null, null, null, null, null, null],
      [null, 4, null, null, 8, null, null, null, 9],
    ],
    hConstraints: [
      { row: 0, col: 0, op: '<' },
      { row: 0, col: 3, op: '<' },
      { row: 0, col: 4, op: '>' },
      { row: 1, col: 6, op: '<' },
      { row: 2, col: 6, op: '>' },
      { row: 2, col: 7, op: '<' },
      { row: 3, col: 3, op: '<' },
      { row: 3, col: 6, op: '<' },
      { row: 4, col: 0, op: '<' },
      { row: 4, col: 7, op: '>' },
      { row: 5, col: 2, op: '>' },
      { row: 5, col: 3, op: '<' },
      { row: 6, col: 2, op: '<' },
      { row: 6, col: 5, op: '>' },
      { row: 6, col: 7, op: '>' },
      { row: 7, col: 4, op: '>' },
      { row: 8, col: 3, op: '<' },
    ],
    vConstraints: [
      { row: 0, col: 2, op: '<' },
      { row: 0, col: 6, op: '<' },
      { row: 1, col: 0, op: '<' },
      { row: 1, col: 1, op: '<' },
      { row: 1, col: 7, op: '>' },
      { row: 4, col: 3, op: '<' },
      { row: 4, col: 5, op: '<' },
      { row: 5, col: 0, op: '<' },
      { row: 6, col: 4, op: '<' },
      { row: 6, col: 6, op: '>' },
      { row: 7, col: 1, op: '>' },
      { row: 7, col: 2, op: '<' },
      { row: 7, col: 8, op: '<' },
    ],
  },
  {
    id: 'puzzle6',
    day: 6,
    type: 'wordProblem',
    title: '하우스컵 튜토리얼 퀴즈',
    prompt:
      '청년 크리스와 제롬이 위대한 주방장 샤를로트의 농장에 고용되었다. 하루 동안 씨를 뿌리기로 했으며, 600평의 밭을 정확히 반씩 나누어 일하기로 했다. 크리스는 서쪽부터 일을 하고, 제롬은 동쪽부터 일을 했다.\n\n땅을 갈 때 크리스는 30평에 20분, 제롬은 40분이 걸렸으나, 씨를 뿌리는 속도는 제롬이 크리스보다 3배 빨랐다고 한다. 2명이 일한 값으로 총 100갈레온을 받고, 일한 만큼 나누어 가지기로 했다.\n\n제롬은 얼마를 가져가야 할까?',
    unit: '갈레온',
    answer: 50,
  },
];

export function puzzleById(id: string): DailyPuzzle | undefined {
  return DAILY_PUZZLES.find((p) => p.id === id);
}

export function emptyPuzzleAnswer(puzzle: DailyPuzzle): PuzzleAnswerValue {
  if (puzzle.type === 'logicGrid') {
    const out = {} as LogicGridAnswer;
    for (const c of puzzle.categories) out[c.key] = puzzle.heights.map(() => null);
    return out;
  }
  if (puzzle.type === 'sudoku') {
    return puzzle.given.map((row) => row.map((v) => (v === 0 ? null : v)));
  }
  if (puzzle.type === 'kakuro') {
    return puzzle.grid.map((row) => row.map(() => null));
  }
  if (puzzle.type === 'futoshiki') {
    return puzzle.given.map((row) => [...row]);
  }
  if (puzzle.type === 'wordProblem') {
    return null;
  }
  return Array.from({ length: puzzle.size }, () => Array<number | null>(puzzle.size).fill(null));
}

export function isPuzzleAnswerFilled(puzzle: DailyPuzzle, answer: PuzzleAnswerValue): boolean {
  if (puzzle.type === 'logicGrid') {
    const a = answer as LogicGridAnswer;
    return puzzle.categories.every((c) => {
      const vals = a[c.key];
      return Boolean(vals) && vals.length === puzzle.heights.length && vals.every((v) => Boolean(v));
    });
  }
  if (puzzle.type === 'sudoku') {
    const a = answer as SudokuAnswer;
    return a.length === 9 && a.every((row) => row.length === 9 && row.every((v) => v !== null && v >= 1 && v <= 9));
  }
  if (puzzle.type === 'kakuro') {
    const a = answer as KakuroAnswer;
    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        if (puzzle.grid[r][c]) continue;
        const v = a[r]?.[c];
        if (v === null || v === undefined || v < 1 || v > 9) return false;
      }
    }
    return true;
  }
  if (puzzle.type === 'kenken') {
    const a = answer as KenKenAnswer;
    return (
      a.length === puzzle.size &&
      a.every((row) => row.length === puzzle.size && row.every((v) => v !== null && v >= 1 && v <= puzzle.size))
    );
  }
  if (puzzle.type === 'futoshiki') {
    const a = answer as FutoshikiAnswer;
    return (
      a.length === puzzle.size &&
      a.every((row) => row.length === puzzle.size && row.every((v) => v !== null && v >= 1 && v <= puzzle.size))
    );
  }
  return typeof (answer as WordProblemAnswer) === 'number';
}

/** Standard Sudoku validity: every given clue preserved, every row/column/3x3 box holds 1-9 exactly once. */
function isValidSudokuCompletion(given: number[][], answer: number[][]): boolean {
  const isFullSet = (vals: number[]) => new Set(vals).size === 9 && vals.every((v) => v >= 1 && v <= 9);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (given[r][c] !== 0 && answer[r][c] !== given[r][c]) return false;
    }
  }
  for (let i = 0; i < 9; i++) {
    if (!isFullSet(answer[i])) return false;
    if (!isFullSet(answer.map((row) => row[i]))) return false;
  }
  for (let br = 0; br < 9; br += 3) {
    for (let bc = 0; bc < 9; bc += 3) {
      const box: number[] = [];
      for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) box.push(answer[r][c]);
      if (!isFullSet(box)) return false;
    }
  }
  return true;
}

/** Kakuro validity: every run's cells hold distinct digits (1-9) that sum to its clue. */
function isValidKakuroCompletion(hruns: KakuroRun[], vruns: KakuroRun[], answer: KakuroAnswer): boolean {
  for (const run of [...hruns, ...vruns]) {
    const vals = run.cells.map(([r, c]) => answer[r]?.[c]);
    if (vals.some((v) => v === null || v === undefined || v < 1 || v > 9)) return false;
    if (new Set(vals).size !== vals.length) return false;
    if (vals.reduce<number>((sum, v) => sum + (v as number), 0) !== run.sum) return false;
  }
  return true;
}

/** KenKen validity: every row/column holds 1..size exactly once, and every cage's cells combine (via its op) to its target. */
function isValidKenKenCompletion(puzzle: KenKenPuzzle, answer: KenKenAnswer): boolean {
  const n = puzzle.size;
  const isFullSet = (vals: (number | null | undefined)[]) =>
    new Set(vals).size === n && vals.every((v) => typeof v === 'number' && v >= 1 && v <= n);
  for (let i = 0; i < n; i++) {
    if (!isFullSet(answer[i])) return false;
    if (!isFullSet(answer.map((row) => row[i]))) return false;
  }
  for (const cage of puzzle.cages) {
    const vals = cage.cells.map(([r, c]) => answer[r]?.[c]);
    if (vals.some((v) => v === null || v === undefined)) return false;
    const nums = vals as number[];
    if (cage.op === null) {
      if (nums[0] !== cage.target) return false;
    } else if (cage.op === 'add') {
      if (nums.reduce((sum, v) => sum + v, 0) !== cage.target) return false;
    } else {
      if (nums.reduce((product, v) => product * v, 1) !== cage.target) return false;
    }
  }
  return true;
}

/** Futoshiki validity: every row/column holds 1..size exactly once, every given cell preserved, every inequality mark holds. */
function isValidFutoshikiCompletion(puzzle: FutoshikiPuzzle, answer: FutoshikiAnswer): boolean {
  const n = puzzle.size;
  const isFullSet = (vals: (number | null | undefined)[]) =>
    new Set(vals).size === n && vals.every((v) => typeof v === 'number' && v >= 1 && v <= n);
  for (let i = 0; i < n; i++) {
    if (!isFullSet(answer[i])) return false;
    if (!isFullSet(answer.map((row) => row[i]))) return false;
  }
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const given = puzzle.given[r][c];
      if (given !== null && answer[r][c] !== given) return false;
    }
  }
  for (const { row, col, op } of puzzle.hConstraints) {
    const left = answer[row][col];
    const right = answer[row][col + 1];
    if (left === null || right === null) return false;
    if (op === '<' ? !(left < right) : !(left > right)) return false;
  }
  for (const { row, col, op } of puzzle.vConstraints) {
    const top = answer[row][col];
    const bottom = answer[row + 1][col];
    if (top === null || bottom === null) return false;
    if (op === '<' ? !(top < bottom) : !(top > bottom)) return false;
  }
  return true;
}

export function isPuzzleAnswerCorrect(puzzle: DailyPuzzle, answer: PuzzleAnswerValue): boolean {
  if (puzzle.type === 'logicGrid') {
    const a = answer as LogicGridAnswer;
    return puzzle.categories.every((c) => puzzle.answer[c.key].every((v, i) => a[c.key]?.[i] === v));
  }
  if (puzzle.type === 'sudoku') {
    const a = (answer as SudokuAnswer).map((row) => row.map((v) => v ?? 0));
    return isValidSudokuCompletion(puzzle.given, a);
  }
  if (puzzle.type === 'kakuro') {
    return isValidKakuroCompletion(puzzle.hruns, puzzle.vruns, answer as KakuroAnswer);
  }
  if (puzzle.type === 'kenken') {
    return isValidKenKenCompletion(puzzle, answer as KenKenAnswer);
  }
  if (puzzle.type === 'futoshiki') {
    return isValidFutoshikiCompletion(puzzle, answer as FutoshikiAnswer);
  }
  return (answer as WordProblemAnswer) === puzzle.answer;
}
