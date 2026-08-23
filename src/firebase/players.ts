import { collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { HouseId } from '../data/sortingTest';
import { db, isFirebaseConfigured } from './config';

export interface PlayerRecord {
  id: string;
  username: string;
  nickname: string;
  grade: number | null;
  testScores: Record<HouseId, number> | null;
  computedHouse: HouseId | null;
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

function fromFirestoreDoc(id: string, data: Record<string, unknown>): PlayerRecord {
  const assignedAt = data.assignedAt as { toMillis?: () => number } | null | undefined;
  const createdAt = data.createdAt as { toMillis?: () => number } | null | undefined;
  return {
    id,
    username: (data.username as string) ?? '',
    nickname: (data.nickname as string) ?? '',
    grade: (data.grade as number | null) ?? null,
    testScores: (data.testScores as Record<HouseId, number> | null) ?? null,
    computedHouse: (data.computedHouse as HouseId | null) ?? null,
    assignedHouse: (data.assignedHouse as HouseId | null) ?? null,
    assignedAt: assignedAt?.toMillis?.() ?? null,
    createdAt: createdAt?.toMillis?.() ?? 0,
  };
}

/** Creates a bare player record right after account signup — test/profile fields fill in later. */
export async function createPlayerRecord(id: string, username: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, COLLECTION_NAME, id), {
      username,
      nickname: '',
      grade: null,
      testScores: null,
      computedHouse: null,
      assignedHouse: null,
      assignedAt: null,
      createdAt: serverTimestamp(),
    });
    return;
  }

  const players = readDemoPlayers();
  players.push({
    id,
    username,
    nickname: '',
    grade: null,
    testScores: null,
    computedHouse: null,
    assignedHouse: null,
    assignedAt: null,
    createdAt: Date.now(),
  });
  writeDemoPlayers(players);
}

export async function submitTestResult(id: string, testScores: Record<HouseId, number>, computedHouse: HouseId): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COLLECTION_NAME, id), { testScores, computedHouse });
    return;
  }

  const players = readDemoPlayers();
  const idx = players.findIndex((p) => p.id === id);
  if (idx >= 0) {
    players[idx] = { ...players[idx], testScores, computedHouse };
    writeDemoPlayers(players);
  }
}

export async function submitProfile(id: string, nickname: string, grade: number): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COLLECTION_NAME, id), { nickname, grade });
    return;
  }

  const players = readDemoPlayers();
  const idx = players.findIndex((p) => p.id === id);
  if (idx >= 0) {
    players[idx] = { ...players[idx], nickname, grade };
    writeDemoPlayers(players);
  }
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

/** One-shot fetch, for hydrating local state right after a login. */
export async function getPlayerOnce(id: string): Promise<PlayerRecord | null> {
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!snap.exists()) return null;
    return fromFirestoreDoc(snap.id, snap.data());
  }

  return readDemoPlayers().find((p) => p.id === id) ?? null;
}

export function listenPlayer(id: string, callback: (player: PlayerRecord | null) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(doc(db, COLLECTION_NAME, id), (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback(fromFirestoreDoc(snap.id, snap.data()));
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
      callback(snap.docs.map((docSnap) => fromFirestoreDoc(docSnap.id, docSnap.data())));
    });
  }

  const read = () => callback(readDemoPlayers().slice().sort((a, b) => b.createdAt - a.createdAt));
  read();
  window.addEventListener(DEMO_EVENT, read);
  return () => window.removeEventListener(DEMO_EVENT, read);
}
