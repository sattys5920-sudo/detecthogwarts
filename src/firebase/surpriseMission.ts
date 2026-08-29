import { doc, getDoc, onSnapshot, runTransaction, setDoc } from 'firebase/firestore';
import { PUZZLE_RANK_POINTS } from '../data/logicPuzzles';
import type { HouseId } from '../data/sortingTest';
import { awardHouseCupPoints } from './houseCup';
import { db, isFirebaseConfigured } from './config';

export const MISSION_MAX_ATTEMPTS = 5;

export interface SurpriseMissionState {
  id: string | null;
  question: string;
  /** SHA-256 hex of the normalized answer — the plaintext answer is never sent to players' clients. */
  answerHash: string;
  active: boolean;
  activatedAt: number | null;
  /** houseIds, in the order they first answered correctly. */
  solvedOrder: string[];
}

export interface MissionAnswerDoc {
  missionId: string;
  houseId: string;
  correct: boolean;
  attempts: number;
  updatedAt: number;
}

const STATE_DOC = 'current';
const STATE_COLLECTION = 'surpriseMission';
const ANSWERS_COLLECTION = 'surpriseMissionAnswers';

const DEMO_STATE_KEY = 'arcanum-surprisemission-state-demo';
const DEMO_ANSWER_PREFIX = 'arcanum-surprisemission-answer-demo-';
const DEMO_EVENT = 'arcanum-surprisemission-demo-changed';

const EMPTY_STATE: SurpriseMissionState = { id: null, question: '', answerHash: '', active: false, activatedAt: null, solvedOrder: [] };

function answerKey(missionId: string, houseId: string) {
  return `${missionId}__${houseId}`;
}

function stateRef() {
  return doc(db!, STATE_COLLECTION, STATE_DOC);
}

function answerRef(missionId: string, houseId: string) {
  return doc(db!, ANSWERS_COLLECTION, answerKey(missionId, houseId));
}

function readDemoState(): SurpriseMissionState {
  try {
    const raw = localStorage.getItem(DEMO_STATE_KEY);
    return raw ? (JSON.parse(raw) as SurpriseMissionState) : EMPTY_STATE;
  } catch {
    return EMPTY_STATE;
  }
}

function writeDemoState(state: SurpriseMissionState) {
  try {
    localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

function readDemoAnswer(missionId: string, houseId: string): MissionAnswerDoc | null {
  try {
    const raw = localStorage.getItem(`${DEMO_ANSWER_PREFIX}${answerKey(missionId, houseId)}`);
    return raw ? (JSON.parse(raw) as MissionAnswerDoc) : null;
  } catch {
    return null;
  }
}

function writeDemoAnswer(answerDoc: MissionAnswerDoc) {
  try {
    localStorage.setItem(`${DEMO_ANSWER_PREFIX}${answerKey(answerDoc.missionId, answerDoc.houseId)}`, JSON.stringify(answerDoc));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

/** Trims, lowercases, and collapses internal whitespace so minor formatting differences still match. */
function normalizeAnswer(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function hashAnswer(raw: string): Promise<string> {
  const bytes = new TextEncoder().encode(normalizeAnswer(raw));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function listenSurpriseMission(callback: (state: SurpriseMissionState) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(stateRef(), (snap) => {
      callback(snap.exists() ? (snap.data() as SurpriseMissionState) : EMPTY_STATE);
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

/** Admin-only: broadcasts a new surprise mission to every house. Only the question and an answer hash are stored — the plaintext answer never leaves the admin's browser. */
export async function activateSurpriseMission(question: string, rawAnswer: string): Promise<void> {
  const answerHash = await hashAnswer(rawAnswer);
  const next: SurpriseMissionState = {
    id: crypto.randomUUID(),
    question,
    answerHash,
    active: true,
    activatedAt: Date.now(),
    solvedOrder: [],
  };
  if (isFirebaseConfigured && db) {
    await setDoc(stateRef(), next);
    return;
  }
  writeDemoState(next);
}

/** Admin-only: stops accepting new answers without clearing the question/leaderboard already shown. */
export async function endSurpriseMission(): Promise<void> {
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(stateRef());
    const state = snap.exists() ? (snap.data() as SurpriseMissionState) : EMPTY_STATE;
    await setDoc(stateRef(), { ...state, active: false });
    return;
  }
  writeDemoState({ ...readDemoState(), active: false });
}

export function listenMissionAnswer(missionId: string, houseId: string, callback: (doc: MissionAnswerDoc | null) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(answerRef(missionId, houseId), (snap) => {
      callback(snap.exists() ? (snap.data() as MissionAnswerDoc) : null);
    });
  }
  const read = () => callback(readDemoAnswer(missionId, houseId));
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}

/**
 * Grades a house's guess and counts it as one of their MISSION_MAX_ATTEMPTS tries. If correct and
 * this house hasn't already solved it, records their rank and credits PUZZLE_RANK_POINTS house-cup points.
 */
export async function submitMissionAnswer(
  missionId: string,
  houseId: string,
  rawAnswer: string,
  answerHash: string,
): Promise<{ correct: boolean; rank: number | null; attempts: number }> {
  const submittedHash = await hashAnswer(rawAnswer);
  const correct = submittedHash === answerHash;

  if (isFirebaseConfigured && db) {
    const firestore = db;
    const attempts = await runTransaction(firestore, async (tx) => {
      const snap = await tx.get(answerRef(missionId, houseId));
      const prevAttempts = snap.exists() ? ((snap.data() as MissionAnswerDoc).attempts ?? 0) : 0;
      const nextAttempts = prevAttempts + 1;
      tx.set(answerRef(missionId, houseId), { missionId, houseId, correct, attempts: nextAttempts, updatedAt: Date.now() });
      return nextAttempts;
    });
    if (!correct) return { correct: false, rank: null, attempts };
    const { rank, isNew } = await runTransaction(firestore, async (tx) => {
      const snap = await tx.get(stateRef());
      const state = snap.exists() ? (snap.data() as SurpriseMissionState) : EMPTY_STATE;
      const solvedOrder = state.solvedOrder ?? [];
      if (solvedOrder.includes(houseId)) return { rank: solvedOrder.indexOf(houseId) + 1, isNew: false };
      const nextOrder = [...solvedOrder, houseId];
      tx.set(stateRef(), { ...state, solvedOrder: nextOrder });
      return { rank: nextOrder.length, isNew: true };
    });
    if (isNew) await awardHouseCupPoints(houseId as HouseId, PUZZLE_RANK_POINTS[rank - 1] ?? 0);
    return { correct: true, rank, attempts };
  }

  const prev = readDemoAnswer(missionId, houseId);
  const attempts = (prev?.attempts ?? 0) + 1;
  writeDemoAnswer({ missionId, houseId, correct, attempts, updatedAt: Date.now() });
  if (!correct) return { correct: false, rank: null, attempts };
  const state = readDemoState();
  const solvedOrder = state.solvedOrder ?? [];
  if (solvedOrder.includes(houseId)) return { correct: true, rank: solvedOrder.indexOf(houseId) + 1, attempts };
  const nextOrder = [...solvedOrder, houseId];
  writeDemoState({ ...state, solvedOrder: nextOrder });
  await awardHouseCupPoints(houseId as HouseId, PUZZLE_RANK_POINTS[nextOrder.length - 1] ?? 0);
  return { correct: true, rank: nextOrder.length, attempts };
}
