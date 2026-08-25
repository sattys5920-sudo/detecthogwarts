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

export type DailyPuzzle = LogicGridPuzzle | SudokuPuzzle;

export type LogicGridAnswer = Record<PuzzleCategoryKey, (string | null)[]>;
export type SudokuAnswer = (number | null)[][];
export type PuzzleAnswerValue = LogicGridAnswer | SudokuAnswer;

export const PUZZLE_CATEGORIES: PuzzleCategory[] = [
  { key: 'house', label: '기숙사' },
  { key: 'nationality', label: '국적' },
  { key: 'wand', label: '지팡이' },
  { key: 'snack', label: '간식' },
  { key: 'pet', label: '펫' },
];

/** Points awarded to the 1st/2nd/3rd/4th house to submit a fully correct answer. */
export const PUZZLE_RANK_POINTS = [100, 80, 60, 40];

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
  return puzzle.given.map((row) => row.map((v) => (v === 0 ? null : v)));
}

export function isPuzzleAnswerFilled(puzzle: DailyPuzzle, answer: PuzzleAnswerValue): boolean {
  if (puzzle.type === 'logicGrid') {
    const a = answer as LogicGridAnswer;
    return puzzle.categories.every((c) => {
      const vals = a[c.key];
      return Boolean(vals) && vals.length === puzzle.heights.length && vals.every((v) => Boolean(v));
    });
  }
  const a = answer as SudokuAnswer;
  return a.length === 9 && a.every((row) => row.length === 9 && row.every((v) => v !== null && v >= 1 && v <= 9));
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

export function isPuzzleAnswerCorrect(puzzle: DailyPuzzle, answer: PuzzleAnswerValue): boolean {
  if (puzzle.type === 'logicGrid') {
    const a = answer as LogicGridAnswer;
    return puzzle.categories.every((c) => puzzle.answer[c.key].every((v, i) => a[c.key]?.[i] === v));
  }
  const a = (answer as SudokuAnswer).map((row) => row.map((v) => v ?? 0));
  return isValidSudokuCompletion(puzzle.given, a);
}
