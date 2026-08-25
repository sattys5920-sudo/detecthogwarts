import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { HouseId } from '../data/sortingTest';
import type { PatronusId } from '../game/forest/types';
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
  /** Result of the player's own patronus aptitude test — shown only to admins as a recommendation, never to the player. */
  computedPatronus: PatronusId | null;
  /** Admin-assigned Patronus species, settable any time after signup — used by the 금지된 숲 익스펙토 패트로눔 skill. */
  patronus: PatronusId | null;
  /** Free-text pet name/description the player set for themselves — optional, shown on their own profile and in the student list. */
  pet: string | null;
  /** Synced from the player's own device so other players can see it in the student list. */
  avatarDataUrl: string | null;
  createdAt: number;
}

const COLLECTION_NAME = 'players';
const DEMO_STORAGE_KEY = 'arcanum-players-demo';
const DEMO_EVENT = 'arcanum-players-demo-changed';

/** Kept in sync with GameContext's own ADMIN_USERNAME — the admin's own entry into this same collection doesn't count as a signup. */
const ADMIN_USERNAME = 'admin';

/** Max non-admin signups. A best-effort check (not atomic) — fine at this game's scale of a single classroom signing up over time, not a concurrent rush. */
export const MAX_PLAYERS = 12;

/** Current non-admin signup count, for enforcing MAX_PLAYERS before a new signup. */
export async function countSignedUpPlayers(): Promise<number> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    return snap.docs.filter((d) => (d.data().username as string) !== ADMIN_USERNAME).length;
  }
  return readDemoPlayers().filter((p) => p.username !== ADMIN_USERNAME).length;
}

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
    computedPatronus: (data.computedPatronus as PatronusId | null) ?? null,
    patronus: (data.patronus as PatronusId | null) ?? null,
    pet: (data.pet as string | null) ?? null,
    avatarDataUrl: (data.avatarDataUrl as string | null) ?? null,
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
      computedPatronus: null,
      patronus: null,
      pet: null,
      avatarDataUrl: null,
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
    computedPatronus: null,
    patronus: null,
    pet: null,
    avatarDataUrl: null,
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

/** Stores the player's own patronus aptitude test result — a recommendation shown only in the admin panel, never revealed to the player directly. */
export async function submitPatronusTestResult(id: string, computedPatronus: PatronusId): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COLLECTION_NAME, id), { computedPatronus });
    return;
  }

  const players = readDemoPlayers();
  const idx = players.findIndex((p) => p.id === id);
  if (idx >= 0) {
    players[idx] = { ...players[idx], computedPatronus };
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

/** Post-signup edits from 내 정보 — each field is written on its own, matching the security rules' single-field update clauses. */
export async function updateNickname(id: string, nickname: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COLLECTION_NAME, id), { nickname });
    return;
  }
  const players = readDemoPlayers();
  const idx = players.findIndex((p) => p.id === id);
  if (idx >= 0) {
    players[idx] = { ...players[idx], nickname };
    writeDemoPlayers(players);
  }
}

export async function updatePet(id: string, pet: string | null): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COLLECTION_NAME, id), { pet });
    return;
  }
  const players = readDemoPlayers();
  const idx = players.findIndex((p) => p.id === id);
  if (idx >= 0) {
    players[idx] = { ...players[idx], pet };
    writeDemoPlayers(players);
  }
}

export async function updateAvatar(id: string, avatarDataUrl: string | null): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COLLECTION_NAME, id), { avatarDataUrl });
    return;
  }
  const players = readDemoPlayers();
  const idx = players.findIndex((p) => p.id === id);
  if (idx >= 0) {
    players[idx] = { ...players[idx], avatarDataUrl };
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

export async function assignPatronus(id: string, patronus: PatronusId): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COLLECTION_NAME, id), { patronus });
    return;
  }

  const players = readDemoPlayers();
  const idx = players.findIndex((p) => p.id === id);
  if (idx >= 0) {
    players[idx] = { ...players[idx], patronus };
    writeDemoPlayers(players);
  }
}

/** Deletes a single signup's player record (used by the admin panel's per-player delete — does not touch their login account, see accounts.ts's deleteAccount). */
export async function deletePlayerRecord(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return;
  }
  writeDemoPlayers(readDemoPlayers().filter((p) => p.id !== id));
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
