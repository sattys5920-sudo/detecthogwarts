import { useEffect, useState } from 'react';
import {
  DAILY_PUZZLES,
  emptyPuzzleAnswer,
  isPuzzleAnswerFilled,
  puzzleById,
  PUZZLE_RANK_POINTS,
  type DailyPuzzle,
  type LogicGridAnswer,
  type LogicGridPuzzle,
  type PuzzleAnswerValue,
  type PuzzleCategoryKey,
  type SudokuAnswer,
} from '../data/logicPuzzles';
import { HOUSES } from '../data/school';
import {
  activatePuzzle,
  listenHouseAnswer,
  listenPuzzleState,
  saveDraftAnswer,
  submitPuzzleAnswer,
  type PuzzleAnswerDoc,
  type PuzzleState,
} from '../firebase/logicPuzzle';
import type { House } from '../types/game';
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

function HouseBadge({ house }: { house: House }) {
  return (
    <span
      className="inline-flex h-5 w-5 flex-none items-center justify-center rounded-full border text-[10px] font-bold text-paper-50"
      style={{ backgroundColor: house.color, borderColor: house.accent }}
    >
      {house.name}
    </span>
  );
}

function PuzzleLeaderboard({ solvedOrder }: { solvedOrder: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {HOUSES.map((h) => {
        const rank = solvedOrder.indexOf(h.id);
        return (
          <div
            key={h.id}
            className="flex items-center gap-1.5 rounded-full border border-ink-700/15 bg-paper-50 px-2 py-1 text-[10px] font-bold text-ink-700/80"
          >
            <HouseBadge house={h} />
            {rank >= 0 ? `${rank + 1} 등 · +${PUZZLE_RANK_POINTS[rank] ?? 0} 점` : '도전 중'}
          </div>
        );
      })}
    </div>
  );
}

function LogicGridTable({
  puzzle,
  answer,
  onChange,
}: {
  puzzle: LogicGridPuzzle;
  answer: LogicGridAnswer;
  onChange: (key: PuzzleCategoryKey, index: number, value: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-xs">
        <thead>
          <tr>
            <th className="border-b border-ink-700/20 px-1.5 py-1 text-left font-bold text-ink-700/80">키</th>
            {puzzle.heights.map((h) => (
              <th key={h} className="border-b border-ink-700/20 px-1.5 py-1 text-center font-bold text-ink-700/80">
                {h} cm
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {puzzle.categories.map((c) => (
            <tr key={c.key}>
              <td className="border-b border-ink-700/10 px-1.5 py-1.5 font-bold text-ink-900">{c.label}</td>
              {puzzle.heights.map((_, i) => (
                <td key={i} className="border-b border-ink-700/10 px-1 py-1">
                  <select
                    value={answer[c.key]?.[i] ?? ''}
                    onChange={(e) => onChange(c.key, i, e.target.value)}
                    className="w-full min-w-[92px] rounded border border-ink-700/20 bg-paper-50 px-1 py-1.5 text-[11px] text-ink-900 outline-none focus:border-seal-500"
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
}: {
  given: number[][];
  answer: SudokuAnswer;
  onChange: (row: number, col: number, value: number | null) => void;
}) {
  return (
    <div className="mx-auto grid w-full max-w-[380px] grid-cols-9 border-2 border-ink-900 bg-paper-50">
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
              readOnly={locked}
              value={value ?? ''}
              onChange={(e) => {
                const digit = e.target.value.replace(/[^1-9]/g, '').slice(-1);
                onChange(r, c, digit ? Number(digit) : null);
              }}
              className={`aspect-square w-full border border-ink-700/15 text-center text-sm font-bold outline-none ${
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

  function commit(next: PuzzleAnswerValue) {
    setAnswer(next);
    setWrongFlash(false);
    saveDraftAnswer(puzzle.id, houseId, next);
  }

  function setLogicCell(key: PuzzleCategoryKey, i: number, value: string) {
    const a = answer as LogicGridAnswer;
    commit({ ...a, [key]: a[key].map((v, idx) => (idx === i ? (value || null) : v)) });
  }

  function setSudokuCell(row: number, col: number, value: number | null) {
    const a = answer as SudokuAnswer;
    commit(a.map((rowVals, r) => (r === row ? rowVals.map((v, c) => (c === col ? value : v)) : rowVals)));
  }

  async function handleSubmit() {
    if (submitting || locked || !filled) return;
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
          Day {puzzle.day} · 가장 먼저 정답을 맞힌 기숙사부터 100 · 80 · 60 · 40 점을 얻습니다.
        </p>
      </div>

      <PuzzleLeaderboard solvedOrder={state.solvedOrder} />

      {puzzle.type === 'logicGrid' ? (
        <ol className="flex flex-col gap-1 text-xs leading-relaxed text-ink-900">
          {puzzle.clues.map((c, i) => (
            <li key={i}>
              {i + 1}. {c}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs leading-relaxed text-ink-900">
          빈칸에 1~9를 채워 스도쿠를 완성하세요. 가로줄 · 세로줄 · 3×3 칸 모두 1~9가 한 번씩 들어가야 합니다.
        </p>
      )}

      {locked ? (
        <p className="rounded-lg border border-seal-500/40 bg-seal-600/10 px-3 py-2 text-center text-sm font-bold text-seal-600">
          정답입니다! {rank + 1} 등 · +{PUZZLE_RANK_POINTS[rank] ?? 0} 점
        </p>
      ) : (
        <>
          {puzzle.type === 'logicGrid' ? (
            <LogicGridTable puzzle={puzzle} answer={answer as LogicGridAnswer} onChange={setLogicCell} />
          ) : (
            <SudokuGrid given={puzzle.given} answer={answer as SudokuAnswer} onChange={setSudokuCell} />
          )}
          {wrongFlash && <p className="text-center text-xs font-bold text-seal-600">아직 정답이 아니에요. 다시 확인해 보세요.</p>}
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
