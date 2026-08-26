import { useEffect, useRef, useState } from 'react';
import {
  DAILY_PUZZLES,
  emptyPuzzleAnswer,
  isPuzzleAnswerFilled,
  puzzleById,
  PUZZLE_MAX_ATTEMPTS,
  PUZZLE_RANK_POINTS,
  type DailyPuzzle,
  type FutoshikiAnswer,
  type FutoshikiOp,
  type FutoshikiPuzzle,
  type KakuroAnswer,
  type KakuroPuzzle,
  type KenKenAnswer,
  type KenKenPuzzle,
  type LogicGridAnswer,
  type LogicGridPuzzle,
  type PuzzleAnswerValue,
  type PuzzleCategoryKey,
  type SudokuAnswer,
  type WordProblemAnswer,
  type WordProblemPuzzle,
} from '../data/logicPuzzles';
import { HOUSES } from '../data/school';
import type { House } from '../types/game';
import {
  activatePuzzle,
  listenHouseAnswer,
  listenPuzzleState,
  saveDraftAnswer,
  submitPuzzleAnswer,
  type PuzzleAnswerDoc,
  type PuzzleState,
} from '../firebase/logicPuzzle';
import Card from './Card';

function HouseStatusRow({ puzzle, house, state }: { puzzle: DailyPuzzle; house: House; state: PuzzleState }) {
  const [answer, setAnswer] = useState<PuzzleAnswerDoc | null>(null);

  useEffect(() => listenHouseAnswer(puzzle.id, house.id, setAnswer), [puzzle.id, house.id]);

  const rankPoints = puzzle.rankPoints ?? PUZZLE_RANK_POINTS;
  const rank = state.solvedOrder.indexOf(house.id);
  const solved = rank >= 0;
  const attempts = answer?.puzzleId === puzzle.id ? (answer.attempts ?? 0) : 0;
  const outOfAttempts = !solved && attempts >= PUZZLE_MAX_ATTEMPTS;

  let statusLabel: string;
  let statusClass: string;
  if (solved) {
    statusLabel = `풀었음 · ${rank + 1} 등 · +${rankPoints[rank] ?? 0} 점`;
    statusClass = 'text-seal-600';
  } else if (outOfAttempts) {
    statusLabel = `실패 · 기회 소진 (${attempts}/${PUZZLE_MAX_ATTEMPTS})`;
    statusClass = 'text-ink-700';
  } else if (attempts > 0) {
    statusLabel = `시도 중 (${attempts}/${PUZZLE_MAX_ATTEMPTS})`;
    statusClass = 'text-gold-600';
  } else {
    statusLabel = '아직 시도 안 함';
    statusClass = 'text-ink-500/50';
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-sm border border-ink-700/10 bg-paper-50 px-2.5 py-1.5">
      <span className="flex items-center gap-1.5 text-xs font-bold text-ink-900">
        <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ backgroundColor: house.color }} />
        {house.name}
      </span>
      <span className={`font-mono text-[11px] font-bold ${statusClass}`}>{statusLabel}</span>
    </div>
  );
}

function HouseStatusPanel({ puzzle, state }: { puzzle: DailyPuzzle; state: PuzzleState }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-mono text-[10px] font-bold text-ink-500/60">기숙사별 현황</p>
      {HOUSES.map((h) => (
        <HouseStatusRow key={h.id} puzzle={puzzle} house={h} state={state} />
      ))}
    </div>
  );
}

function AdminPuzzleControl({ state }: { state: PuzzleState | null }) {
  const [selected, setSelected] = useState(DAILY_PUZZLES[0]?.id ?? '');
  const [busy, setBusy] = useState(false);

  async function handleActivate() {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await activatePuzzle(selected);
    } finally {
      setBusy(false);
    }
  }

  const active = state?.activePuzzleId ? puzzleById(state.activePuzzleId) : null;

  return (
    <div className="flex flex-col gap-2 rounded-sm border border-seal-500/40 bg-paper-100 p-3">
      <p className="font-mono text-[11px] font-bold text-seal-600">관리자 — 오늘의 퀴즈 출제</p>
      <p className="text-[11px] text-ink-700/70">
        {active ? `현재 출제 중: Day ${active.day} · ${active.title}` : '아직 출제된 문제가 없습니다.'}
      </p>
      <div className="flex items-center gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-ink-700/20 bg-paper-50 px-2.5 py-1.5 text-sm text-ink-900 outline-none focus:border-seal-500"
        >
          {DAILY_PUZZLES.map((p) => (
            <option key={p.id} value={p.id}>
              Day {p.day} · {p.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleActivate}
          disabled={busy || !selected}
          className="flex-none rounded-lg bg-ink-black px-3 py-1.5 text-xs font-bold text-paper-50 disabled:opacity-40"
        >
          출제하기
        </button>
      </div>
      {active && state && <HouseStatusPanel puzzle={active} state={state} />}
    </div>
  );
}

function LogicGridTable({
  puzzle,
  answer,
  onChange,
  disabled,
}: {
  puzzle: LogicGridPuzzle;
  answer: LogicGridAnswer;
  onChange: (key: PuzzleCategoryKey, index: number, value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[9px]">
        <thead>
          <tr>
            <th className="border-b border-ink-700/20 px-0.5 py-0.5 text-left font-bold text-ink-700/80">키</th>
            {puzzle.heights.map((h) => (
              <th key={h} className="border-b border-ink-700/20 px-0.5 py-0.5 text-center font-bold text-ink-700/80">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {puzzle.categories.map((c) => (
            <tr key={c.key}>
              <td className="border-b border-ink-700/10 px-0.5 py-1 font-bold text-ink-900">{c.label}</td>
              {puzzle.heights.map((_, i) => (
                <td key={i} className="border-b border-ink-700/10 px-0.5 py-0.5">
                  <select
                    value={answer[c.key]?.[i] ?? ''}
                    onChange={(e) => onChange(c.key, i, e.target.value)}
                    disabled={disabled}
                    className="w-full min-w-0 rounded border border-ink-700/20 bg-paper-50 px-0.5 py-1 text-[9px] leading-tight text-ink-900 outline-none focus:border-seal-500 disabled:opacity-60"
                  >
                    <option value="">— 선택 —</option>
                    {puzzle.answer[c.key].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SudokuGrid({
  given,
  answer,
  onChange,
  disabled,
}: {
  given: number[][];
  answer: SudokuAnswer;
  onChange: (row: number, col: number, value: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mx-auto grid w-full max-w-[320px] grid-cols-9 border-2 border-ink-900 bg-paper-50">
      {given.map((rowVals, r) =>
        rowVals.map((g, c) => {
          const locked = g !== 0;
          const value = locked ? g : answer[r]?.[c];
          return (
            <input
              key={`${r}-${c}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              readOnly={locked || disabled}
              value={value ?? ''}
              onChange={(e) => {
                const digit = e.target.value.replace(/[^1-9]/g, '').slice(-1);
                onChange(r, c, digit ? Number(digit) : null);
              }}
              className={`aspect-square w-full border border-ink-700/15 text-center text-xs font-bold outline-none ${
                locked ? 'bg-paper-200 text-ink-900' : 'bg-paper-50 text-seal-600 focus:bg-seal-600/10'
              } ${c % 3 === 0 ? 'border-l-2 border-l-ink-900' : ''} ${c === 8 ? 'border-r-2 border-r-ink-900' : ''} ${
                r % 3 === 0 ? 'border-t-2 border-t-ink-900' : ''
              } ${r === 8 ? 'border-b-2 border-b-ink-900' : ''}`}
            />
          );
        }),
      )}
    </div>
  );
}

/** Every black cell that sits directly above/left of a run doubles as that run's clue — maps "row_col" to its sums. */
function buildKakuroClueMap(puzzle: KakuroPuzzle): Record<string, { down?: number; across?: number }> {
  const map: Record<string, { down?: number; across?: number }> = {};
  for (const run of puzzle.hruns) {
    const [r, c] = run.cells[0];
    const key = `${r}_${c - 1}`;
    map[key] = { ...map[key], across: run.sum };
  }
  for (const run of puzzle.vruns) {
    const [r, c] = run.cells[0];
    const key = `${r - 1}_${c}`;
    map[key] = { ...map[key], down: run.sum };
  }
  return map;
}

function KakuroGrid({
  puzzle,
  answer,
  onChange,
  disabled,
}: {
  puzzle: KakuroPuzzle;
  answer: KakuroAnswer;
  onChange: (row: number, col: number, value: number | null) => void;
  disabled?: boolean;
}) {
  const clueMap = buildKakuroClueMap(puzzle);
  return (
    <div
      className="mx-auto grid w-full max-w-[320px] border-2 border-ink-900 bg-ink-black"
      style={{ gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`, gap: '1px' }}
    >
      {puzzle.grid.map((rowVals, r) =>
        rowVals.map((isBlack, c) => {
          if (isBlack) {
            const clue = clueMap[`${r}_${c}`];
            const hasClue = clue && (clue.down !== undefined || clue.across !== undefined);
            return (
              <div key={`${r}-${c}`} className="relative aspect-square overflow-hidden bg-ink-black">
                {hasClue && (
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="0" y1="0" x2="100" y2="100" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" />
                  </svg>
                )}
                {clue?.down !== undefined && (
                  <span className="absolute top-0 right-0.5 text-[7px] leading-tight font-bold text-gold-300">{clue.down}</span>
                )}
                {clue?.across !== undefined && (
                  <span className="absolute bottom-0 left-0.5 text-[7px] leading-tight font-bold text-paper-100/80">{clue.across}</span>
                )}
              </div>
            );
          }
          const value = answer[r]?.[c];
          return (
            <input
              key={`${r}-${c}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              readOnly={disabled}
              value={value ?? ''}
              onChange={(e) => {
                const digit = e.target.value.replace(/[^1-9]/g, '').slice(-1);
                onChange(r, c, digit ? Number(digit) : null);
              }}
              className="aspect-square w-full border-0 bg-paper-50 text-center text-xs font-bold text-seal-600 outline-none focus:bg-seal-600/10"
            />
          );
        }),
      )}
    </div>
  );
}

function kenKenCageLabel(op: KenKenPuzzle['cages'][number]['op'], target: number): string {
  if (op === 'add') return `${target}+`;
  if (op === 'multiply') return `${target}×`;
  return `${target}`;
}

function KenKenGrid({
  puzzle,
  answer,
  onChange,
  disabled,
}: {
  puzzle: KenKenPuzzle;
  answer: KenKenAnswer;
  onChange: (row: number, col: number, value: number | null) => void;
  disabled?: boolean;
}) {
  const n = puzzle.size;
  const cageIndex: number[][] = Array.from({ length: n }, () => Array(n).fill(-1));
  const labelAt: Record<string, string> = {};
  puzzle.cages.forEach((cage, idx) => {
    cage.cells.forEach(([r, c]) => {
      cageIndex[r][c] = idx;
    });
    const [r0, c0] = cage.cells[0];
    labelAt[`${r0}_${c0}`] = kenKenCageLabel(cage.op, cage.target);
  });

  return (
    <div
      className="mx-auto grid w-full max-w-[320px] border-2 border-ink-900 bg-paper-50"
      style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
    >
      {Array.from({ length: n }).map((_, r) =>
        Array.from({ length: n }).map((_, c) => {
          const thisCage = cageIndex[r][c];
          const rightThick = c === n - 1 || cageIndex[r][c + 1] !== thisCage;
          const bottomThick = r === n - 1 || cageIndex[r + 1][c] !== thisCage;
          const label = labelAt[`${r}_${c}`];
          const value = answer[r]?.[c];
          return (
            <div
              key={`${r}-${c}`}
              className="relative aspect-square"
              style={{
                borderRight: rightThick ? '2px solid var(--color-ink-900)' : '1px solid rgba(31,41,51,0.15)',
                borderBottom: bottomThick ? '2px solid var(--color-ink-900)' : '1px solid rgba(31,41,51,0.15)',
              }}
            >
              {label && <span className="absolute top-0 left-0.5 text-[7px] leading-tight font-bold text-seal-600">{label}</span>}
              <input
                type="text"
                inputMode="numeric"
                maxLength={1}
                readOnly={disabled}
                value={value ?? ''}
                onChange={(e) => {
                  const digit = e.target.value.replace(new RegExp(`[^1-${n}]`, 'g'), '').slice(-1);
                  onChange(r, c, digit ? Number(digit) : null);
                }}
                className="h-full w-full border-0 bg-transparent text-center text-xs font-bold text-ink-900 outline-none focus:bg-seal-600/10"
              />
            </div>
          );
        }),
      )}
    </div>
  );
}

function futoshikiTemplate(n: number, gapPx: number): string {
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    parts.push('1fr');
    if (i < n - 1) parts.push(`${gapPx}px`);
  }
  return parts.join(' ');
}

function FutoshikiGrid({
  puzzle,
  answer,
  onChange,
  disabled,
}: {
  puzzle: FutoshikiPuzzle;
  answer: FutoshikiAnswer;
  onChange: (row: number, col: number, value: number | null) => void;
  disabled?: boolean;
}) {
  const n = puzzle.size;
  const hMap: Record<string, FutoshikiOp> = {};
  puzzle.hConstraints.forEach((c) => {
    hMap[`${c.row}_${c.col}`] = c.op;
  });
  const vMap: Record<string, FutoshikiOp> = {};
  puzzle.vConstraints.forEach((c) => {
    vMap[`${c.row}_${c.col}`] = c.op;
  });
  const template = futoshikiTemplate(n, 11);

  const cells = [];
  for (let gr = 0; gr < 2 * n - 1; gr++) {
    for (let gc = 0; gc < 2 * n - 1; gc++) {
      const isRowCell = gr % 2 === 0;
      const isColCell = gc % 2 === 0;
      if (isRowCell && isColCell) {
        const r = gr / 2;
        const c = gc / 2;
        const given = puzzle.given[r][c];
        const locked = given !== null;
        const value = locked ? given : answer[r]?.[c];
        cells.push(
          <input
            key={`n-${gr}-${gc}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            readOnly={locked || disabled}
            value={value ?? ''}
            onChange={(e) => {
              const digit = e.target.value.replace(new RegExp(`[^1-${n}]`, 'g'), '').slice(-1);
              onChange(r, c, digit ? Number(digit) : null);
            }}
            className={`aspect-square min-w-0 min-h-0 w-full border border-ink-700/20 p-0 text-center text-[10px] font-bold outline-none ${
              locked ? 'bg-paper-200 text-ink-900' : 'bg-paper-50 text-seal-600 focus:bg-seal-600/10'
            }`}
          />,
        );
      } else if (!isRowCell && isColCell) {
        const r = (gr - 1) / 2;
        const c = gc / 2;
        const op = vMap[`${r}_${c}`];
        cells.push(
          <div key={`v-${gr}-${gc}`} className="flex items-center justify-center text-[10px] leading-none font-bold text-seal-600">
            {op ? (op === '<' ? '^' : 'v') : ''}
          </div>,
        );
      } else if (isRowCell && !isColCell) {
        const r = gr / 2;
        const c = (gc - 1) / 2;
        const op = hMap[`${r}_${c}`];
        cells.push(
          <div key={`h-${gr}-${gc}`} className="flex items-center justify-center text-[10px] leading-none font-bold text-seal-600">
            {op ?? ''}
          </div>,
        );
      } else {
        cells.push(<div key={`s-${gr}-${gc}`} />);
      }
    }
  }

  return (
    <div
      className="mx-auto grid w-full max-w-[320px] border-2 border-ink-900 bg-paper-50 p-1"
      style={{ gridTemplateColumns: template, gridTemplateRows: template }}
    >
      {cells}
    </div>
  );
}

function WordProblemInput({
  puzzle,
  answer,
  onChange,
  disabled,
}: {
  puzzle: WordProblemPuzzle;
  answer: WordProblemAnswer;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="whitespace-pre-wrap rounded-lg border border-ink-700/15 bg-paper-100/60 px-3 py-2.5 text-xs leading-relaxed text-ink-900">
        {puzzle.prompt}
      </p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          readOnly={disabled}
          value={answer ?? ''}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^0-9]/g, '');
            onChange(digits ? Number(digits) : null);
          }}
          placeholder="숫자만 입력"
          className="w-full min-w-0 flex-1 rounded-lg border border-ink-700/20 bg-paper-50 px-3 py-2 text-sm font-bold text-seal-600 outline-none focus:border-seal-500 disabled:opacity-60"
        />
        <span className="flex-none text-sm font-bold text-ink-700/70">{puzzle.unit}</span>
      </div>
    </div>
  );
}

function PuzzleCard({ puzzle, houseId, state }: { puzzle: DailyPuzzle; houseId: string; state: PuzzleState }) {
  const [remote, setRemote] = useState<PuzzleAnswerDoc | null>(null);
  const [answer, setAnswer] = useState<PuzzleAnswerValue>(() => emptyPuzzleAnswer(puzzle));
  const [wrongFlash, setWrongFlash] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  // The draft is shared per-house, so multiple housemates can be filling in the same grid at once.
  // Without this, an older remote snapshot arriving after a newer local keystroke (a normal race when
  // several people type around the same time) would silently revert cells the player just filled in —
  // looking like "the grid is full but submit does nothing." Only adopt a remote update that's at
  // least as new as our own last local edit.
  const localEditAtRef = useRef(0);

  useEffect(() => {
    setAnswer(emptyPuzzleAnswer(puzzle));
    localEditAtRef.current = 0;
  }, [puzzle.id]);
  useEffect(() => listenHouseAnswer(puzzle.id, houseId, setRemote), [puzzle.id, houseId]);
  useEffect(() => {
    if (remote && remote.puzzleId === puzzle.id && (remote.updatedAt ?? 0) >= localEditAtRef.current) {
      setAnswer(remote.answer);
    }
  }, [remote, puzzle.id]);

  const rankPoints = puzzle.rankPoints ?? PUZZLE_RANK_POINTS;
  const rank = state.solvedOrder.indexOf(houseId);
  const locked = rank >= 0;
  const filled = isPuzzleAnswerFilled(puzzle, answer);
  const attempts = remote?.puzzleId === puzzle.id ? (remote.attempts ?? 0) : 0;
  const outOfAttempts = !locked && attempts >= PUZZLE_MAX_ATTEMPTS;

  function commit(next: PuzzleAnswerValue) {
    setAnswer(next);
    setWrongFlash(false);
    localEditAtRef.current = Date.now();
    saveDraftAnswer(puzzle.id, houseId, next);
  }

  function setLogicCell(key: PuzzleCategoryKey, i: number, value: string) {
    const a = answer as LogicGridAnswer;
    commit({ ...a, [key]: a[key].map((v, idx) => (idx === i ? (value || null) : v)) });
  }

  function setGridCell(row: number, col: number, value: number | null) {
    const a = answer as SudokuAnswer | KakuroAnswer | KenKenAnswer | FutoshikiAnswer;
    commit(a.map((rowVals, r) => (r === row ? rowVals.map((v, c) => (c === col ? value : v)) : rowVals)));
  }

  function setWordProblemAnswer(value: number | null) {
    commit(value);
  }

  async function handleSubmit() {
    if (submitting || locked || !filled || outOfAttempts) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      const result = await submitPuzzleAnswer(puzzle.id, houseId, answer);
      setWrongFlash(!result.correct);
    } catch {
      // Otherwise a failed submit (e.g. a network hiccup) looks identical to "nothing happened."
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <p className="font-gothic text-lg text-ink-black">{puzzle.title}</p>
        <p className="text-[11px] text-ink-500/60">
          Day {puzzle.day} · 가장 먼저 정답을 맞힌 기숙사부터 {rankPoints.join(' · ')} 점을 얻습니다. 제출 기회는 기숙사당{' '}
          {PUZZLE_MAX_ATTEMPTS} 번입니다.
        </p>
      </div>

      {puzzle.type === 'logicGrid' && (
        <ol className="flex flex-col gap-1 text-xs leading-relaxed text-ink-900">
          {puzzle.clues.map((c, i) => (
            <li key={i}>
              {i + 1}. {c}
            </li>
          ))}
        </ol>
      )}
      {puzzle.type === 'sudoku' && (
        <p className="text-xs leading-relaxed text-ink-900">
          빈칸에 1~9를 채워 스도쿠를 완성하세요. 가로줄 · 세로줄 · 3×3 칸 모두 1~9가 한 번씩 들어가야 합니다.
        </p>
      )}
      {puzzle.type === 'kakuro' && (
        <p className="text-xs leading-relaxed text-ink-900">
          검은 칸의 숫자는 그 줄에 들어갈 흰 칸 숫자들의 합입니다. 오른쪽 위 숫자는 세로줄 합, 왼쪽 아래 숫자는
          가로줄 합이며, 같은 줄 안에서 숫자(1~9)는 겹칠 수 없습니다.
        </p>
      )}
      {puzzle.type === 'kenken' && (
        <p className="text-xs leading-relaxed text-ink-900">
          가로줄 · 세로줄마다 1~{puzzle.size}이 한 번씩 들어가야 합니다. 굵은 선으로 묶인 칸(우리)끼리는 왼쪽
          위에 적힌 숫자·기호대로 계산한 값이 나와야 해요 (× = 곱, + = 합, 기호 없음 = 그 칸 하나의 값).
        </p>
      )}
      {puzzle.type === 'futoshiki' && (
        <p className="text-xs leading-relaxed text-ink-900">
          가로줄 · 세로줄마다 1~{puzzle.size}이 한 번씩 들어가야 합니다. 칸 사이의 부등호(&lt;, &gt;, ^, v)는
          꺾인 쪽(뾰족한 쪽)이 항상 더 작은 숫자를 가리키도록 지켜야 하고, 미리 채워진 숫자는 바꿀 수 없어요.
        </p>
      )}

      {locked ? (
        <p className="rounded-lg border border-seal-500/40 bg-seal-600/10 px-3 py-2 text-center text-sm font-bold text-seal-600">
          정답입니다! {rank + 1} 등 · +{rankPoints[rank] ?? 0} 점
        </p>
      ) : (
        <>
          {puzzle.type === 'logicGrid' && (
            <LogicGridTable puzzle={puzzle} answer={answer as LogicGridAnswer} onChange={setLogicCell} disabled={outOfAttempts} />
          )}
          {puzzle.type === 'sudoku' && (
            <SudokuGrid given={puzzle.given} answer={answer as SudokuAnswer} onChange={setGridCell} disabled={outOfAttempts} />
          )}
          {puzzle.type === 'kakuro' && (
            <KakuroGrid puzzle={puzzle} answer={answer as KakuroAnswer} onChange={setGridCell} disabled={outOfAttempts} />
          )}
          {puzzle.type === 'kenken' && (
            <KenKenGrid puzzle={puzzle} answer={answer as KenKenAnswer} onChange={setGridCell} disabled={outOfAttempts} />
          )}
          {puzzle.type === 'futoshiki' && (
            <FutoshikiGrid puzzle={puzzle} answer={answer as FutoshikiAnswer} onChange={setGridCell} disabled={outOfAttempts} />
          )}
          {puzzle.type === 'wordProblem' && (
            <WordProblemInput puzzle={puzzle} answer={answer as WordProblemAnswer} onChange={setWordProblemAnswer} disabled={outOfAttempts} />
          )}
          {wrongFlash && !outOfAttempts && (
            <p className="text-center text-xs font-bold text-seal-600">아직 정답이 아니에요. 다시 확인해 보세요.</p>
          )}
          {submitError && (
            <p className="text-center text-xs font-bold text-seal-600">제출에 실패했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.</p>
          )}
          {outOfAttempts ? (
            <p className="rounded-lg border border-ink-700/20 bg-ink-700/5 px-3 py-2 text-center text-sm font-bold text-ink-700/70">
              제출 기회를 모두 사용했습니다. ({PUZZLE_MAX_ATTEMPTS} / {PUZZLE_MAX_ATTEMPTS})
            </p>
          ) : (
            <>
              <p className="text-center text-[11px] text-ink-500/60">
                남은 제출 기회 {PUZZLE_MAX_ATTEMPTS - attempts} / {PUZZLE_MAX_ATTEMPTS}
              </p>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !filled}
                className="tablet-btn tablet-btn-dark self-center px-5 py-2 text-sm font-bold disabled:opacity-40"
              >
                {submitting ? '채점 중…' : '정답 제출'}
              </button>
            </>
          )}
        </>
      )}
    </Card>
  );
}

export default function LogicPuzzlePanel({ houseId, isAdmin }: { houseId: string | null; isAdmin: boolean }) {
  const [state, setState] = useState<PuzzleState | null>(null);

  useEffect(() => listenPuzzleState(setState), []);

  const puzzle = state?.activePuzzleId ? puzzleById(state.activePuzzleId) : null;

  if (!isAdmin && !puzzle) return null;

  return (
    <div className="flex flex-col gap-3">
      {isAdmin && <AdminPuzzleControl state={state} />}
      {puzzle && houseId && <PuzzleCard puzzle={puzzle} houseId={houseId} state={state!} />}
    </div>
  );
}
