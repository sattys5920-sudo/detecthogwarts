import { doc, onSnapshot, runTransaction, setDoc } from 'firebase/firestore';
import type { HouseId } from '../data/sortingTest';
import { db, isFirebaseConfigured } from './config';

export type HouseCupScores = Record<HouseId, number>;

const STATE_DOC = 'current';
const COLLECTION = 'houseCupScores';
const DEMO_KEY = 'arcanum-housecup-scores-demo';
const DEMO_EVENT = 'arcanum-housecup-scores-demo-changed';

const EMPTY_SCORES: HouseCupScores = { flame: 0, moonlight: 0, earth: 0, wind: 0 };

function stateRef() {
  return doc(db!, COLLECTION, STATE_DOC);
}

function readDemo(): HouseCupScores {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? { ...EMPTY_SCORES, ...(JSON.parse(raw) as Partial<HouseCupScores>) } : EMPTY_SCORES;
  } catch {
    return EMPTY_SCORES;
  }
}

function writeDemo(scores: HouseCupScores) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(scores));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

export function listenHouseCupScores(callback: (scores: HouseCupScores) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(stateRef(), (snap) => {
      callback(snap.exists() ? { ...EMPTY_SCORES, ...(snap.data() as Partial<HouseCupScores>) } : EMPTY_SCORES);
    });
  }
  const read = () => callback(readDemo());
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}

/** Adds `points` to a house's running house-cup total — called whenever a house earns rank points from any puzzle/mission. */
export async function awardHouseCupPoints(houseId: HouseId, points: number): Promise<void> {
  if (points === 0) return;
  if (isFirebaseConfigured && db) {
    const firestore = db;
    await runTransaction(firestore, async (tx) => {
      const snap = await tx.get(stateRef());
      const current = snap.exists() ? { ...EMPTY_SCORES, ...(snap.data() as Partial<HouseCupScores>) } : EMPTY_SCORES;
      tx.set(doc(firestore, COLLECTION, STATE_DOC), { ...current, [houseId]: current[houseId] + points });
    });
    return;
  }
  const current = readDemo();
  writeDemo({ ...current, [houseId]: current[houseId] + points });
}

/** Admin-only: zeroes every house's running total (does not touch per-puzzle solved history). */
export async function resetHouseCupScores(): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(stateRef(), EMPTY_SCORES);
    return;
  }
  writeDemo(EMPTY_SCORES);
}
