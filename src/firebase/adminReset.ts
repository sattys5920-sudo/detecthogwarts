import {
  type DocumentReference,
  collection,
  type Firestore,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { HOUSES } from '../data/school';
import { resetParty } from '../game/forest/engine';
import { emptyRoom } from '../game/quidditchEngine';
import { db, isFirebaseConfigured } from './config';

const BATCH_SIZE = 400;

async function commitDeletes(firestore: Firestore, refs: DocumentReference[]): Promise<void> {
  for (let i = 0; i < refs.length; i += BATCH_SIZE) {
    const batch = writeBatch(firestore);
    refs.slice(i, i + BATCH_SIZE).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

async function deleteCollectionDocs(firestore: Firestore, path: string): Promise<number> {
  const snap = await getDocs(collection(firestore, path));
  await commitDeletes(firestore, snap.docs.map((d) => d.ref));
  return snap.size;
}

/** Deletes every post along with its comments subcollection. */
async function deletePostsWithComments(firestore: Firestore): Promise<void> {
  const postsSnap = await getDocs(collection(firestore, 'posts'));
  const refs: DocumentReference[] = [];
  for (const postDoc of postsSnap.docs) {
    const commentsSnap = await getDocs(collection(firestore, 'posts', postDoc.id, 'comments'));
    refs.push(...commentsSnap.docs.map((c) => c.ref));
  }
  refs.push(...postsSnap.docs.map((d) => d.ref));
  await commitDeletes(firestore, refs);
}

/** Deletes every interrogation thread along with its messages subcollection. */
async function deleteInterrogationThreads(firestore: Firestore): Promise<void> {
  const threadsSnap = await getDocs(collection(firestore, 'interrogationThreads'));
  const refs: DocumentReference[] = [];
  for (const threadDoc of threadsSnap.docs) {
    const messagesSnap = await getDocs(collection(firestore, 'interrogationThreads', threadDoc.id, 'messages'));
    refs.push(...messagesSnap.docs.map((m) => m.ref));
  }
  refs.push(...threadsSnap.docs.map((d) => d.ref));
  await commitDeletes(firestore, refs);
}

/** Clears every house's dorm chat log without touching the (non-existent) parent doc. */
async function resetDormChats(firestore: Firestore): Promise<void> {
  const refs: DocumentReference[] = [];
  for (const house of HOUSES) {
    const msgsSnap = await getDocs(collection(firestore, 'dormChats', house.id, 'messages'));
    refs.push(...msgsSnap.docs.map((m) => m.ref));
  }
  await commitDeletes(firestore, refs);
}

/** Clears each day's GM adlib/chat log and unlocks the day again. */
async function resetSessions(firestore: Firestore): Promise<void> {
  const sessionsSnap = await getDocs(collection(firestore, 'sessions'));
  for (const sessionDoc of sessionsSnap.docs) {
    const adlibsSnap = await getDocs(collection(firestore, 'sessions', sessionDoc.id, 'adlibs'));
    await commitDeletes(firestore, adlibsSnap.docs.map((a) => a.ref));
    await setDoc(sessionDoc.ref, { locked: false });
  }
}

/** Unlocks every recess room without needing delete permission. */
async function resetRecessLocks(firestore: Firestore): Promise<void> {
  const snap = await getDocs(collection(firestore, 'recessLocks'));
  await Promise.all(snap.docs.map((d) => setDoc(d.ref, { locked: false })));
}

/** Resets every existing Quidditch/Forest room back to its empty starting state, whatever room ids exist. */
async function resetGameRooms(firestore: Firestore): Promise<void> {
  const [quidditchSnap, forestSnap] = await Promise.all([
    getDocs(collection(firestore, 'quidditch')),
    getDocs(collection(firestore, 'forest')),
  ]);
  await Promise.all([
    ...quidditchSnap.docs.map((d) => setDoc(d.ref, emptyRoom())),
    ...forestSnap.docs.map((d) => setDoc(d.ref, resetParty())),
  ]);
}

const DEMO_PREFIXES_TO_CLEAR = [
  'arcanum-posts-demo',
  'arcanum-dormchat-demo-',
  'arcanum-announcement-demo',
  'arcanum-quidditch-demo-',
  'arcanum-forest-demo-',
  'arcanum-herbfarm-demo:',
  'arcanum-notifications-demo-',
  'arcanum-notifprefs-demo-',
  'arcanum-interrogation-demo-threads',
  'arcanum-interrogation-demo-messages-',
  'arcanum-session-adlib-demo-',
  'arcanum-lock-',
  'arcanum-mystery-leaderboard-demo',
];

const DEMO_EVENTS_TO_FIRE = [
  'arcanum-posts-demo-changed',
  'arcanum-dormchat-demo-changed',
  'arcanum-announcement-demo-changed',
  'arcanum-quidditch-demo-changed',
  'arcanum-forest-demo-changed',
  'arcanum-herbfarm-demo-changed',
  'arcanum-notifications-demo-changed',
  'arcanum-notifprefs-demo-changed',
  'arcanum-interrogation-demo-changed',
  'arcanum-session-adlib-demo-changed',
  'arcanum-lock-demo-changed',
];

function clearDemoKeysByPrefix(prefixes: string[], events: string[]): void {
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && prefixes.some((p) => key.startsWith(p))) toRemove.push(key);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
  events.forEach((evt) => window.dispatchEvent(new Event(evt)));
}

/** Deletes every signup (가입자) record. Returns how many were removed. */
export async function resetSignups(): Promise<number> {
  if (isFirebaseConfigured && db) {
    return deleteCollectionDocs(db, 'players');
  }
  const raw = localStorage.getItem('arcanum-players-demo');
  const count = raw ? (JSON.parse(raw) as unknown[]).length : 0;
  clearDemoKeysByPrefix(['arcanum-players-demo'], ['arcanum-players-demo-changed']);
  return count;
}

/**
 * Clears every piece of shared game content: 연회장 posts/comments, dorm chat, GM
 * adlib logs (+ unlocks days/rooms), announcements, Quidditch/Forest room state,
 * herb farms, notifications/prefs, and 탐문 threads. Does NOT touch player signups
 * (see resetSignups) or any player's own device-local progress (arcanum-player) —
 * that only clears itself via each player's own "다른 이름으로 시작하기".
 */
export async function resetContent(): Promise<void> {
  if (isFirebaseConfigured && db) {
    const firestore = db;
    await Promise.all([
      deletePostsWithComments(firestore),
      resetDormChats(firestore),
      deleteCollectionDocs(firestore, 'announcements'),
      resetGameRooms(firestore),
      deleteCollectionDocs(firestore, 'herbFarms'),
      deleteCollectionDocs(firestore, 'notifications'),
      deleteCollectionDocs(firestore, 'notificationPrefs'),
      deleteInterrogationThreads(firestore),
      resetSessions(firestore),
      resetRecessLocks(firestore),
      deleteCollectionDocs(firestore, 'leaderboard'),
    ]);
    return;
  }
  clearDemoKeysByPrefix(DEMO_PREFIXES_TO_CLEAR, DEMO_EVENTS_TO_FIRE);
}
