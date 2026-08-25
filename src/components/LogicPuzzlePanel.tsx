import { useEffect, useState } from 'react';
import {
  DAILY_PUZZLES,
  emptyPuzzleAnswer,
  isPuzzleAnswerFilled,
  puzzleById,
  PUZZLE_MAX_ATTEMPTS,
  PUZZLE_RANK_POINTS,
  type DailyPuzzle,
  type KakuroAnswer,
  type KakuroPuzzle,
  type LogicGridAnswer,
  type LogicGridPuzzle,
  type PuzzleAnswerValue,
  type PuzzleCategoryKey,
  type SudokuAnswer,
} from '../data/logicPuzzles';
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

function PuzzleCard({ puzzle, houseId, state }: { puzzle: DailyPuzzle; houseId: string; state: PuzzleState }) {
  const [remote, setRemote] = useState<PuzzleAnswerDoc | null>(null);
  const [answer, setAnswer] = useState<PuzzleAnswerValue>(() => emptyPuzzleAnswer(puzzle));
  const [wrongFlash, setWrongFlash] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setAnswer(emptyPuzzleAnswer(puzzle)), [puzzle.id]);
  useEffect(() => listenHouseAnswer(puzzle.id, houseId, setRemote), [puzzle.id, houseId]);
  useEffect(() => {
    if (remote && remote.puzzleId === puzzle.id) setAnswer(remote.answer);
  }, [remote, puzzle.id]);

  const rank = state.solvedOrder.indexOf(houseId);
  const locked = rank >= 0;
  const filled = isPuzzleAnswerFilled(puzzle, answer);
  const attempts = remote?.puzzleId === puzzle.id ? (remote.attempts ?? 0) : 0;
  const outOfAttempts = !locked && attempts >= PUZZLE_MAX_ATTEMPTS;

  function commit(next: PuzzleAnswerValue) {
    setAnswer(next);
    setWrongFlash(false);
    saveDraftAnswer(puzzle.id, houseId, next);
  }

  function setLogicCell(key: PuzzleCategoryKey, i: number, value: string) {
    const a = answer as LogicGridAnswer;
    commit({ ...a, [key]: a[key].map((v, idx) => (idx === i ? (value || null) : v)) });
  }

  function setGridCell(row: number, col: number, value: number | null) {
    const a = answer as SudokuAnswer | KakuroAnswer;
    commit(a.map((rowVals, r) => (r === row ? rowVals.map((v, c) => (c === col ? value : v)) : rowVals)));
  }

  async function handleSubmit() {
    if (submitting || locked || !filled || outOfAttempts) return;
    setSubmitting(true);
    try {
      const result = await submitPuzzleAnswer(puzzle.id, houseId, answer);
      setWrongFlash(!result.correct);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <p className="font-gothic text-lg text-ink-black">{puzzle.title}</p>
        <p className="text-[11px] text-ink-500/60">
          Day {puzzle.day} · 가장 먼저 정답을 맞힌 기숙사부터 100 · 80 · 60 · 40 점을 얻습니다. 제출 기회는 기숙사당{' '}
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

      {locked ? (
        <p className="rounded-lg border border-seal-500/40 bg-seal-600/10 px-3 py-2 text-center text-sm font-bold text-seal-600">
          정답입니다! {rank + 1} 등 · +{PUZZLE_RANK_POINTS[rank] ?? 0} 점
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
          {wrongFlash && !outOfAttempts && (
            <p className="text-center text-xs font-bold text-seal-600">아직 정답이 아니에요. 다시 확인해 보세요.</p>
          )}
          {outOfAttempts ? (
            <p className="rounded-lg border border-ink-700/20 bg-ink-700/5 px-3 py-2 text-center text-sm font-bold text-ink-700/70">
              제출 기회를 모두 사용했습니다. ({PUZZLE_MAX_ATTEMPTS} / {PUZZLE_MAX_ATTEMPTS})
            </p>
          ) : (
            <>
              <p className="text-center text-[11px] text-ink-500/60">
                제출 기회 {attempts} / {PUZZLE_MAX_ATTEMPTS}
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
