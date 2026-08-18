import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { HouseId } from '../data/sortingTest';
import { db, isFirebaseConfigured } from './config';

export interface PlayerRecord {
  id: string;
  nickname: string;
  testScores: Record<HouseId, number>;
  computedHouse: HouseId;
  assignedHouse: HouseId | null;
  assignedAt: number | null;
  createdAt: number;
}

const COLLECTION_NAME = 'players';
const DEMO_STORAGE_KEY = 'arcanum-players-demo';
const DEMO_EVENT = 'arcanum-players-demo-changed';

function readDemoPlayers(): PlayerRecord[] {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PlayerRecord[]) : [];
  } catch {
    return [];
  }
}

function writeDemoPlayers(players: PlayerRecord[]) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(players));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable (private mode, etc.) — silently skip persistence.
  }
}

export async function createPlayerRecord(
  id: string,
  nickname: string,
  testScores: Record<HouseId, number>,
  computedHouse: HouseId,
): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, COLLECTION_NAME, id), {
      nickname,
      testScores,
      computedHouse,
      assignedHouse: null,
      assignedAt: null,
      createdAt: serverTimestamp(),
    });
    return;
  }

  const players = readDemoPlayers();
  players.push({ id, nickname, testScores, computedHouse, assignedHouse: null, assignedAt: null, createdAt: Date.now() });
  writeDemoPlayers(players);
}

export async function assignHouse(id: string, houseId: HouseId): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COLLECTION_NAME, id), { assignedHouse: houseId, assignedAt: serverTimestamp() });
    return;
  }

  const players = readDemoPlayers();
  const idx = players.findIndex((p) => p.id === id);
  if (idx >= 0) {
    players[idx] = { ...players[idx], assignedHouse: houseId, assignedAt: Date.now() };
    writeDemoPlayers(players);
  }
}

export function listenPlayer(id: string, callback: (player: PlayerRecord | null) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(doc(db, COLLECTION_NAME, id), (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      const data = snap.data();
      callback({
        id: snap.id,
        nickname: data.nickname,
        testScores: data.testScores,
        computedHouse: data.computedHouse,
        assignedHouse: data.assignedHouse ?? null,
        assignedAt: data.assignedAt?.toMillis?.() ?? null,
        createdAt: data.createdAt?.toMillis?.() ?? 0,
      });
    });
  }

  const read = () => callback(readDemoPlayers().find((p) => p.id === id) ?? null);
  read();
  window.addEventListener(DEMO_EVENT, read);
  return () => window.removeEventListener(DEMO_EVENT, read);
}

export function listenAllPlayers(callback: (players: PlayerRecord[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      callback(
        snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            nickname: data.nickname,
            testScores: data.testScores,
            computedHouse: data.computedHouse,
            assignedHouse: data.assignedHouse ?? null,
            assignedAt: data.assignedAt?.toMillis?.() ?? null,
            createdAt: data.createdAt?.toMillis?.() ?? 0,
          } satisfies PlayerRecord;
        }),
      );
    });
  }

  const read = () => callback(readDemoPlayers().slice().sort((a, b) => b.createdAt - a.createdAt));
  read();
  window.addEventListener(DEMO_EVENT, read);
  return () => window.removeEventListener(DEMO_EVENT, read);
}
