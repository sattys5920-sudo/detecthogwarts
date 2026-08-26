import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import {
  castVote as engineCastVote,
  confirmEvent as engineConfirmEvent,
  createParty,
  ForestFullError,
  forceResolveVoteTimeout as engineForceResolveVoteTimeout,
  joinSeat,
  leaveClearedOrFailed,
  leaveSeat,
  playerCombatAction as engineCombatAction,
  resolveTie as engineResolveTie,
  setReady as engineSetReady,
  startExpedition as engineStartExpedition,
  upgradeSkill as engineUpgradeSkill,
  type CombatAction,
} from '../game/forest/engine';
import type { ForestParty, PatronusId, SkillId } from '../game/forest/types';
import { db, isFirebaseConfigured } from './config';

export { ForestFullError };

const COLLECTION = 'forest';
const DEMO_PREFIX = 'arcanum-forest-demo-';
const DEMO_EVENT = 'arcanum-forest-demo-changed';

function demoKey(roomId: string) {
  return `${DEMO_PREFIX}${roomId}`;
}

function readDemoParty(roomId: string): ForestParty {
  try {
    const raw = localStorage.getItem(demoKey(roomId));
    return raw ? (JSON.parse(raw) as ForestParty) : createParty();
  } catch {
    return createParty();
  }
}

function writeDemoParty(roomId: string, party: ForestParty) {
  try {
    localStorage.setItem(demoKey(roomId), JSON.stringify(party));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

async function transact(roomId: string, mutate: (current: ForestParty) => ForestParty): Promise<void> {
  if (isFirebaseConfigured && db) {
    const ref = doc(db, COLLECTION, roomId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists() ? (snap.data() as ForestParty) : createParty();
      const next = mutate(current);
      tx.set(ref, next);
    });
    return;
  }
  writeDemoParty(roomId, mutate(readDemoParty(roomId)));
}

export function subscribeParty(roomId: string, callback: (party: ForestParty) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(doc(db, COLLECTION, roomId), (snap) => {
      callback(snap.exists() ? (snap.data() as ForestParty) : createParty());
    });
  }
  const read = () => callback(readDemoParty(roomId));
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}

export async function joinParty(
  roomId: string,
  playerId: string,
  nickname: string,
  patronus: PatronusId | null = null,
  profileSpellPower = 0,
  profileIntelligence = 0,
  profileAgility = 0,
): Promise<void> {
  await transact(roomId, (current) =>
    joinSeat(current, playerId, nickname || '이름 없음', patronus, profileSpellPower, profileIntelligence, profileAgility),
  );
}

export async function leaveParty(roomId: string, playerId: string): Promise<void> {
  await transact(roomId, (current) => leaveSeat(current, playerId));
}

export async function setReady(roomId: string, playerId: string, ready: boolean): Promise<void> {
  await transact(roomId, (current) => engineSetReady(current, playerId, ready));
}

export async function startExpedition(roomId: string): Promise<void> {
  await transact(roomId, (current) => engineStartExpedition(current));
}

export async function castVote(roomId: string, playerId: string, choiceIndex: number): Promise<void> {
  await transact(roomId, (current) => engineCastVote(current, playerId, choiceIndex));
}

export async function resolveTie(roomId: string, hostPlayerId: string, choiceIndex: number): Promise<void> {
  await transact(roomId, (current) => engineResolveTie(current, hostPlayerId, choiceIndex));
}

export async function forceResolveVoteTimeout(roomId: string): Promise<void> {
  await transact(roomId, (current) => engineForceResolveVoteTimeout(current));
}

export async function confirmEvent(roomId: string): Promise<void> {
  await transact(roomId, (current) => engineConfirmEvent(current));
}

export async function submitCombatAction(roomId: string, playerId: string, action: CombatAction): Promise<void> {
  await transact(roomId, (current) => engineCombatAction(current, playerId, action));
}

export async function upgradeSkill(roomId: string, playerId: string, skillId: SkillId): Promise<void> {
  await transact(roomId, (current) => engineUpgradeSkill(current, playerId, skillId));
}

export async function leaveExpedition(roomId: string, playerId: string): Promise<void> {
  await transact(roomId, (current) => leaveClearedOrFailed(current, playerId));
}
