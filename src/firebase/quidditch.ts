import { doc, onSnapshot, runTransaction, setDoc } from 'firebase/firestore';
import {
  applyMove,
  applyPass,
  createInitialGame,
  emptyRoom,
  endTurnManually,
  passTurnIfExpired,
  type QuidditchGame,
  type SeatInfo,
  type Team,
} from '../game/quidditchEngine';
import { db, isFirebaseConfigured } from './config';

const COLLECTION = 'quidditch';
const DEMO_PREFIX = 'arcanum-quidditch-demo-';
const DEMO_EVENT = 'arcanum-quidditch-demo-changed';

export class RoomFullError extends Error {
  constructor() {
    super('경기가 이미 진행 중입니다.');
  }
}

function demoKey(roomId: string) {
  return `${DEMO_PREFIX}${roomId}`;
}

function readDemoRoom(roomId: string): QuidditchGame {
  try {
    const raw = localStorage.getItem(demoKey(roomId));
    return raw ? (JSON.parse(raw) as QuidditchGame) : emptyRoom();
  } catch {
    return emptyRoom();
  }
}

function writeDemoRoom(roomId: string, game: QuidditchGame) {
  try {
    localStorage.setItem(demoKey(roomId), JSON.stringify(game));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

export function seatedTeamOf(game: QuidditchGame, playerId: string): Team | null {
  if (game.seats.A?.playerId === playerId) return 'A';
  if (game.seats.B?.playerId === playerId) return 'B';
  return null;
}

function resolveJoin(game: QuidditchGame, seat: SeatInfo): QuidditchGame {
  const existingTeam = seatedTeamOf(game, seat.playerId);
  if (existingTeam) return game;

  if (game.status === 'waiting') {
    if (!game.seats.A) {
      return { ...game, seats: { ...game.seats, A: seat } };
    }
    if (!game.seats.B) {
      return createInitialGame(game.seats.A, seat);
    }
    throw new RoomFullError();
  }

  // playing / finished: only already-seated players may re-enter.
  throw new RoomFullError();
}

export function subscribeRoom(roomId: string, callback: (game: QuidditchGame) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(doc(db, COLLECTION, roomId), (snap) => {
      callback(snap.exists() ? (snap.data() as QuidditchGame) : emptyRoom());
    });
  }
  const read = () => callback(readDemoRoom(roomId));
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}

export async function joinRoom(roomId: string, playerId: string, nickname: string): Promise<void> {
  const seat: SeatInfo = { playerId, nickname: nickname || '이름 없음' };

  if (isFirebaseConfigured && db) {
    const ref = doc(db, COLLECTION, roomId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists() ? (snap.data() as QuidditchGame) : emptyRoom();
      const next = resolveJoin(current, seat);
      tx.set(ref, next);
    });
    return;
  }

  const next = resolveJoin(readDemoRoom(roomId), seat);
  writeDemoRoom(roomId, next);
}

/** Only valid while status is 'waiting' — frees your seat so someone else can take it. */
export async function leaveWaitingRoom(roomId: string, playerId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const ref = doc(db, COLLECTION, roomId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists() ? (snap.data() as QuidditchGame) : emptyRoom();
      if (current.status !== 'waiting') return;
      const seats = { ...current.seats };
      if (seats.A?.playerId === playerId) seats.A = null;
      if (seats.B?.playerId === playerId) seats.B = null;
      tx.set(ref, { ...current, seats });
    });
    return;
  }

  const current = readDemoRoom(roomId);
  if (current.status !== 'waiting') return;
  const seats = { ...current.seats };
  if (seats.A?.playerId === playerId) seats.A = null;
  if (seats.B?.playerId === playerId) seats.B = null;
  writeDemoRoom(roomId, { ...current, seats });
}

/** Resets the pitch back to an empty waiting room after a match has finished. */
export async function leaveFinishedRoom(roomId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, COLLECTION, roomId), emptyRoom());
    return;
  }
  writeDemoRoom(roomId, emptyRoom());
}

export async function submitMove(roomId: string, playerId: string, pieceId: string, dest: { row: number; col: number }): Promise<void> {
  if (isFirebaseConfigured && db) {
    const ref = doc(db, COLLECTION, roomId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('경기를 찾을 수 없습니다.');
      const current = snap.data() as QuidditchGame;
      if (current.status !== 'playing') throw new Error('경기가 진행 중이 아닙니다.');
      if (seatedTeamOf(current, playerId) !== current.currentTeam) throw new Error('내 턴이 아닙니다.');
      const next = applyMove(current, pieceId, dest);
      tx.set(ref, next);
    });
    return;
  }

  const current = readDemoRoom(roomId);
  if (current.status !== 'playing') return;
  if (seatedTeamOf(current, playerId) !== current.currentTeam) return;
  writeDemoRoom(roomId, applyMove(current, pieceId, dest));
}

export async function submitPass(roomId: string, playerId: string, pieceId: string, targetId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const ref = doc(db, COLLECTION, roomId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('경기를 찾을 수 없습니다.');
      const current = snap.data() as QuidditchGame;
      if (current.status !== 'playing') throw new Error('경기가 진행 중이 아닙니다.');
      if (seatedTeamOf(current, playerId) !== current.currentTeam) throw new Error('내 턴이 아닙니다.');
      const next = applyPass(current, pieceId, targetId);
      tx.set(ref, next);
    });
    return;
  }

  const current = readDemoRoom(roomId);
  if (current.status !== 'playing') return;
  if (seatedTeamOf(current, playerId) !== current.currentTeam) return;
  writeDemoRoom(roomId, applyPass(current, pieceId, targetId));
}

export async function submitEndTurn(roomId: string, playerId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const ref = doc(db, COLLECTION, roomId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('경기를 찾을 수 없습니다.');
      const current = snap.data() as QuidditchGame;
      if (current.status !== 'playing') throw new Error('경기가 진행 중이 아닙니다.');
      if (seatedTeamOf(current, playerId) !== current.currentTeam) throw new Error('내 턴이 아닙니다.');
      tx.set(ref, endTurnManually(current));
    });
    return;
  }

  const current = readDemoRoom(roomId);
  if (current.status !== 'playing') return;
  if (seatedTeamOf(current, playerId) !== current.currentTeam) return;
  writeDemoRoom(roomId, endTurnManually(current));
}

/** Idempotent — safe to call from any connected client on a timer. No-ops unless the deadline has actually passed. */
export async function checkTurnTimeout(roomId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const ref = doc(db, COLLECTION, roomId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const current = snap.data() as QuidditchGame;
      const next = passTurnIfExpired(current);
      if (next) tx.set(ref, next);
    });
    return;
  }
  const current = readDemoRoom(roomId);
  const next = passTurnIfExpired(current);
  if (next) writeDemoRoom(roomId, next);
}
