import { doc, getDoc, increment, onSnapshot, runTransaction, setDoc } from 'firebase/firestore';
import { isPuzzleAnswerCorrect, PUZZLE_RANK_POINTS, puzzleById, type PuzzleAnswerValue } from '../data/logicPuzzles';
import type { HouseId } from '../data/sortingTest';
import { awardHouseCupPoints } from './houseCup';
import { db, isFirebaseConfigured } from './config';

export interface PuzzleState {
  activePuzzleId: string | null;
  activatedAt: number | null;
  /** houseIds, in the order they first submitted a fully correct answer. */
  solvedOrder: string[];
}

export interface PuzzleAnswerDoc {
  puzzleId: string;
  houseId: string;
  answer: PuzzleAnswerValue;
  correct: boolean;
  /** Number of times this house has submitted (not just saved a draft) — capped at PUZZLE_MAX_ATTEMPTS. */
  attempts: number;
  updatedAt: number;
}

const STATE_DOC = 'current';
const STATE_COLLECTION = 'logicPuzzleState';
const ANSWERS_COLLECTION = 'logicPuzzleAnswers';

const DEMO_STATE_KEY = 'arcanum-logicpuzzle-state-demo';
const DEMO_ANSWER_PREFIX = 'arcanum-logicpuzzle-answer-demo-';
const DEMO_EVENT = 'arcanum-logicpuzzle-demo-changed';

const EMPTY_STATE: PuzzleState = { activePuzzleId: null, activatedAt: null, solvedOrder: [] };

function answerKey(puzzleId: string, houseId: string) {
  return `${puzzleId}__${houseId}`;
}

function stateRef() {
  return doc(db!, STATE_COLLECTION, STATE_DOC);
}

function answerRef(puzzleId: string, houseId: string) {
  return doc(db!, ANSWERS_COLLECTION, answerKey(puzzleId, houseId));
}

function readDemoState(): PuzzleState {
  try {
    const raw = localStorage.getItem(DEMO_STATE_KEY);
    return raw ? (JSON.parse(raw) as PuzzleState) : EMPTY_STATE;
  } catch {
    return EMPTY_STATE;
  }
}

function writeDemoState(state: PuzzleState) {
  try {
    localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

function readDemoAnswer(puzzleId: string, houseId: string): PuzzleAnswerDoc | null {
  try {
    const raw = localStorage.getItem(`${DEMO_ANSWER_PREFIX}${answerKey(puzzleId, houseId)}`);
    return raw ? (JSON.parse(raw) as PuzzleAnswerDoc) : null;
  } catch {
    return null;
  }
}

function writeDemoAnswer(answerDoc: PuzzleAnswerDoc) {
  try {
    localStorage.setItem(`${DEMO_ANSWER_PREFIX}${answerKey(answerDoc.puzzleId, answerDoc.houseId)}`, JSON.stringify(answerDoc));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

export function listenPuzzleState(callback: (state: PuzzleState) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(stateRef(), (snap) => {
      callback(snap.exists() ? (snap.data() as PuzzleState) : EMPTY_STATE);
    });
  }
  const read = () => callback(readDemoState());
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}

/** Admin-only: activates a puzzle for every house and resets the solved-order leaderboard. */
export async function activatePuzzle(puzzleId: string): Promise<void> {
  const next: PuzzleState = { activePuzzleId: puzzleId, activatedAt: Date.now(), solvedOrder: [] };
  if (isFirebaseConfigured && db) {
    await setDoc(stateRef(), next);
    return;
  }
  writeDemoState(next);
}

export function listenHouseAnswer(puzzleId: string, houseId: string, callback: (doc: PuzzleAnswerDoc | null) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(answerRef(puzzleId, houseId), (snap) => {
      callback(snap.exists() ? (snap.data() as PuzzleAnswerDoc) : null);
    });
  }
  const read = () => callback(readDemoAnswer(puzzleId, houseId));
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}

/** Persists a house's in-progress draft without checking, scoring, or counting it as an attempt. */
export async function saveDraftAnswer(puzzleId: string, houseId: string, answer: PuzzleAnswerValue): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(answerRef(puzzleId, houseId), { puzzleId, houseId, answer, correct: false, updatedAt: Date.now() }, { merge: true });
    return;
  }
  const prev = readDemoAnswer(puzzleId, houseId);
  writeDemoAnswer({ puzzleId, houseId, answer, correct: false, attempts: prev?.attempts ?? 0, updatedAt: Date.now() });
}

/**
 * Grades a house's submission and counts it as one of their PUZZLE_MAX_ATTEMPTS tries.
 * If correct and this house hasn't already solved it, records their rank in the shared leaderboard.
 */
export async function submitPuzzleAnswer(
  puzzleId: string,
  houseId: string,
  answer: PuzzleAnswerValue,
): Promise<{ correct: boolean; rank: number | null; attempts: number }> {
  const puzzle = puzzleById(puzzleId);
  const correct = puzzle ? isPuzzleAnswerCorrect(puzzle, answer) : false;

  if (isFirebaseConfigured && db) {
    // A plain increment (no read-modify-write transaction) — the answer doc is shared per-house and
    // gets a draft write on every keystroke from anyone in the house, so a transaction here can end up
    // repeatedly aborted by that traffic and, on a flaky connection, exhaust its retries and throw.
    // increment() needs no prior read and can't conflict the same way.
    await setDoc(answerRef(puzzleId, houseId), { puzzleId, houseId, answer, correct, attempts: increment(1), updatedAt: Date.now() }, { merge: true });
    const attemptsSnap = await getDoc(answerRef(puzzleId, houseId));
    const attempts = attemptsSnap.exists() ? ((attemptsSnap.data() as PuzzleAnswerDoc).attempts ?? 1) : 1;
    if (!correct) return { correct: false, rank: null, attempts };
    const { rank, isNew } = await runTransaction(db, async (tx) => {
      const snap = await tx.get(stateRef());
      const state = snap.exists() ? (snap.data() as PuzzleState) : EMPTY_STATE;
      const solvedOrder = state.solvedOrder ?? [];
      if (solvedOrder.includes(houseId)) return { rank: solvedOrder.indexOf(houseId) + 1, isNew: false };
      const nextOrder = [...solvedOrder, houseId];
      tx.set(stateRef(), { ...state, solvedOrder: nextOrder });
      return { rank: nextOrder.length, isNew: true };
    });
    if (isNew) await awardRankPoints(puzzleId, houseId, rank);
    return { correct: true, rank, attempts };
  }

  const prev = readDemoAnswer(puzzleId, houseId);
  const attempts = (prev?.attempts ?? 0) + 1;
  writeDemoAnswer({ puzzleId, houseId, answer, correct, attempts, updatedAt: Date.now() });
  if (!correct) return { correct: false, rank: null, attempts };
  const state = readDemoState();
  const solvedOrder = state.solvedOrder ?? [];
  if (solvedOrder.includes(houseId)) return { correct: true, rank: solvedOrder.indexOf(houseId) + 1, attempts };
  const nextOrder = [...solvedOrder, houseId];
  writeDemoState({ ...state, solvedOrder: nextOrder });
  await awardRankPoints(puzzleId, houseId, nextOrder.length);
  return { correct: true, rank: nextOrder.length, attempts };
}

/** Looks up the puzzle's own rank-point scale (falling back to the shared default) and credits the house's house-cup total for the rank it just earned. */
async function awardRankPoints(puzzleId: string, houseId: string, rank: number): Promise<void> {
  const puzzle = puzzleById(puzzleId);
  const rankPoints = puzzle?.rankPoints ?? PUZZLE_RANK_POINTS;
  const points = rankPoints[rank - 1] ?? 0;
  await awardHouseCupPoints(houseId as HouseId, points);
}
