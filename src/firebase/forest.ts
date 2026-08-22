import { doc, onSnapshot, runTransaction, setDoc } from 'firebase/firestore';
import {
  confirmEvent as engineConfirmEvent,
  createParty,
  ForestFullError,
  joinSeat,
  leaveSeat,
  playerCombatAction as engineCombatAction,
  resolveCurrentPath,
  resetParty,
  startExpedition as engineStartExpedition,
  upgradeSpell as engineUpgradeSpell,
  type CombatAction,
} from '../game/forest/engine';
import type { ForestParty } from '../game/forest/types';
import { db, isFirebaseConfigured } from './config';

export { ForestFullError };

const COLLECTION = 'forest';
const DOC_ID = 'party';
const DEMO_STORAGE_KEY = 'arcanum-forest-demo';
const DEMO_EVENT = 'arcanum-forest-demo-changed';

function readDemoParty(): ForestParty {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ForestParty) : createParty();
  } catch {
    return createParty();
  }
}

function writeDemoParty(party: ForestParty) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(party));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

async function transact(mutate: (current: ForestParty) => ForestParty): Promise<void> {
  if (isFirebaseConfigured && db) {
    const ref = doc(db, COLLECTION, DOC_ID);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists() ? (snap.data() as ForestParty) : createParty();
      const next = mutate(current);
      tx.set(ref, next);
    });
    return;
  }
  writeDemoParty(mutate(readDemoParty()));
}

export function subscribeParty(callback: (party: ForestParty) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(doc(db, COLLECTION, DOC_ID), (snap) => {
      callback(snap.exists() ? (snap.data() as ForestParty) : createParty());
    });
  }
  const read = () => callback(readDemoParty());
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}

export async function joinParty(playerId: string, nickname: string): Promise<void> {
  await transact((current) => joinSeat(current, playerId, nickname || '이름 없음'));
}

export async function leaveParty(playerId: string): Promise<void> {
  await transact((current) => leaveSeat(current, playerId));
}

export async function startExpedition(): Promise<void> {
  await transact((current) => engineStartExpedition(current));
}

export async function choosePath(choiceIndex: number): Promise<void> {
  await transact((current) => resolveCurrentPath(current, choiceIndex));
}

export async function confirmEvent(): Promise<void> {
  await transact((current) => engineConfirmEvent(current));
}

export async function submitCombatAction(playerId: string, action: CombatAction): Promise<void> {
  await transact((current) => engineCombatAction(current, playerId, action));
}

export async function upgradeSpell(playerId: string, spellId: string): Promise<void> {
  await transact((current) => engineUpgradeSpell(current, playerId, spellId));
}

export async function leaveExpedition(): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, COLLECTION, DOC_ID), resetParty());
    return;
  }
  writeDemoParty(resetParty());
}
