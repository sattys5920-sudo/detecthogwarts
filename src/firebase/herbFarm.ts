import { doc, onSnapshot, runTransaction, setDoc } from 'firebase/firestore';
import { createFarm, harvestAllReady, harvestSlot, plantSlot } from '../game/herbFarm/engine';
import type { HarvestResult, HerbFarmState } from '../game/herbFarm/types';
import { db, isFirebaseConfigured } from './config';

const COLLECTION = 'herbFarms';
const DEMO_STORAGE_PREFIX = 'arcanum-herbfarm-demo:';
const DEMO_EVENT = 'arcanum-herbfarm-demo-changed';

function readDemoFarm(playerId: string): HerbFarmState {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_PREFIX + playerId);
    return raw ? (JSON.parse(raw) as HerbFarmState) : createFarm(playerId);
  } catch {
    return createFarm(playerId);
  }
}

function writeDemoFarm(playerId: string, state: HerbFarmState) {
  try {
    localStorage.setItem(DEMO_STORAGE_PREFIX + playerId, JSON.stringify(state));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

async function transact<T>(
  playerId: string,
  mutate: (current: HerbFarmState) => { next: HerbFarmState; result: T },
): Promise<T> {
  if (isFirebaseConfigured && db) {
    const ref = doc(db, COLLECTION, playerId);
    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists() ? (snap.data() as HerbFarmState) : createFarm(playerId);
      const { next, result } = mutate(current);
      tx.set(ref, next);
      return result;
    });
  }

  const { next, result } = mutate(readDemoFarm(playerId));
  writeDemoFarm(playerId, next);
  return result;
}

export async function ensureFarm(playerId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const ref = doc(db, COLLECTION, playerId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) tx.set(ref, createFarm(playerId));
    });
    return;
  }
  try {
    if (!localStorage.getItem(DEMO_STORAGE_PREFIX + playerId)) writeDemoFarm(playerId, createFarm(playerId));
  } catch {
    // localStorage unavailable — nothing to persist.
  }
}

export function subscribeFarm(playerId: string, callback: (farm: HerbFarmState) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(doc(db, COLLECTION, playerId), (snap) => {
      callback(snap.exists() ? (snap.data() as HerbFarmState) : createFarm(playerId));
    });
  }
  const read = () => callback(readDemoFarm(playerId));
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}

export async function plant(playerId: string, slotId: number): Promise<void> {
  await transact(playerId, (current) => ({ next: plantSlot(current, slotId, Date.now()), result: undefined }));
}

export async function harvest(playerId: string, slotId: number): Promise<HarvestResult> {
  return transact(playerId, (current) => {
    const { state, result } = harvestSlot(current, slotId, Date.now());
    return { next: state, result };
  });
}

export async function harvestAll(playerId: string): Promise<HarvestResult[]> {
  return transact(playerId, (current) => {
    const { state, results } = harvestAllReady(current, Date.now());
    return { next: state, result: results };
  });
}

export async function resetFarm(playerId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, COLLECTION, playerId), createFarm(playerId));
    return;
  }
  writeDemoFarm(playerId, createFarm(playerId));
}
