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

/** A house's shared submission count/result — the "제출 기회" pool every housemate draws from. */
export interface PuzzleAttemptDoc {
  puzzleId: string;
  houseId: string;
  correct: boolean;
  /** Number of times this house has submitted (not just saved a draft) — capped at PUZZLE_MAX_ATTEMPTS. */
  attempts: number;
  updatedAt: number;
}

/** One player's personal in-progress grid — never shared with housemates, so no two people can stomp on it. */
export interface PuzzleDraftDoc {
  puzzleId: string;
  playerId: string;
  houseId: string;
  answer: PuzzleAnswerValue;
  updatedAt: number;
}

const STATE_DOC = 'current';
const STATE_COLLECTION = 'logicPuzzleState';
const ATTEMPTS_COLLECTION = 'logicPuzzleAnswers';
const DRAFTS_COLLECTION = 'logicPuzzleDrafts';

const DEMO_STATE_KEY = 'arcanum-logicpuzzle-state-demo';
const DEMO_ATTEMPT_PREFIX = 'arcanum-logicpuzzle-answer-demo-';
const DEMO_DRAFT_PREFIX = 'arcanum-logicpuzzle-draft-demo-';
const DEMO_EVENT = 'arcanum-logicpuzzle-demo-changed';

const EMPTY_STATE: PuzzleState = { activePuzzleId: null, activatedAt: null, solvedOrder: [] };

function attemptKey(puzzleId: string, houseId: string) {
  return `${puzzleId}__${houseId}`;
}

function draftKey(puzzleId: string, playerId: string) {
  return `${puzzleId}__${playerId}`;
}

function stateRef() {
  return doc(db!, STATE_COLLECTION, STATE_DOC);
}

function attemptRef(puzzleId: string, houseId: string) {
  return doc(db!, ATTEMPTS_COLLECTION, attemptKey(puzzleId, houseId));
}

function draftRef(puzzleId: string, playerId: string) {
  return doc(db!, DRAFTS_COLLECTION, draftKey(puzzleId, playerId));
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

function readDemoAttempt(puzzleId: string, houseId: string): PuzzleAttemptDoc | null {
  try {
    const raw = localStorage.getItem(`${DEMO_ATTEMPT_PREFIX}${attemptKey(puzzleId, houseId)}`);
    return raw ? (JSON.parse(raw) as PuzzleAttemptDoc) : null;
  } catch {
    return null;
  }
}

function writeDemoAttempt(attemptDoc: PuzzleAttemptDoc) {
  try {
    localStorage.setItem(`${DEMO_ATTEMPT_PREFIX}${attemptKey(attemptDoc.puzzleId, attemptDoc.houseId)}`, JSON.stringify(attemptDoc));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

function readDemoDraft(puzzleId: string, playerId: string): PuzzleDraftDoc | null {
  try {
    const raw = localStorage.getItem(`${DEMO_DRAFT_PREFIX}${draftKey(puzzleId, playerId)}`);
    return raw ? (JSON.parse(raw) as PuzzleDraftDoc) : null;
  } catch {
    return null;
  }
}

function writeDemoDraft(draftDoc: PuzzleDraftDoc) {
  try {
    localStorage.setItem(`${DEMO_DRAFT_PREFIX}${draftKey(draftDoc.puzzleId, draftDoc.playerId)}`, JSON.stringify(draftDoc));
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

/** Shared per-house submission count/result — used for the "제출 기회" pool and the house-status board. */
export function listenHouseAttempts(puzzleId: string, houseId: string, callback: (doc: PuzzleAttemptDoc | null) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(attemptRef(puzzleId, houseId), (snap) => {
      callback(snap.exists() ? (snap.data() as PuzzleAttemptDoc) : null);
    });
  }
  const read = () => callback(readDemoAttempt(puzzleId, houseId));
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}

/** A single player's own draft grid — private to them, so no housemate's typing can overwrite it. */
export function listenPlayerDraft(puzzleId: string, playerId: string, callback: (doc: PuzzleDraftDoc | null) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(draftRef(puzzleId, playerId), (snap) => {
      callback(snap.exists() ? (snap.data() as PuzzleDraftDoc) : null);
    });
  }
  const read = () => callback(readDemoDraft(puzzleId, playerId));
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}

/** Persists a player's own in-progress draft. Personal, so concurrent housemates never race on it. */
export async function saveDraftAnswer(puzzleId: string, playerId: string, houseId: string, answer: PuzzleAnswerValue): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(draftRef(puzzleId, playerId), { puzzleId, playerId, houseId, answer, updatedAt: Date.now() }, { merge: true });
    return;
  }
  writeDemoDraft({ puzzleId, playerId, houseId, answer, updatedAt: Date.now() });
}

/**
 * Grades a submission and counts it against the house's shared PUZZLE_MAX_ATTEMPTS pool.
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
    // A plain increment (no read-modify-write transaction) — several housemates can submit around the
    // same moment, so a transaction here can end up repeatedly aborted by that contention and, on a
    // flaky connection, exhaust its retries and throw. increment() needs no prior read and can't
    // conflict the same way.
    await setDoc(attemptRef(puzzleId, houseId), { puzzleId, houseId, correct, attempts: increment(1), updatedAt: Date.now() }, { merge: true });
    const attemptsSnap = await getDoc(attemptRef(puzzleId, houseId));
    const attempts = attemptsSnap.exists() ? ((attemptsSnap.data() as PuzzleAttemptDoc).attempts ?? 1) : 1;
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

  const prev = readDemoAttempt(puzzleId, houseId);
  const attempts = (prev?.attempts ?? 0) + 1;
  writeDemoAttempt({ puzzleId, houseId, correct, attempts, updatedAt: Date.now() });
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
