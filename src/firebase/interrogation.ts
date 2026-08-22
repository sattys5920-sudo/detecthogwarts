import {
  type DocumentData,
  type QueryDocumentSnapshot,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

export type MessageSender = 'player' | 'admin';
export type ThreadStatus = 'WAITING' | 'ANSWERED';

export interface InterrogationMessage {
  id: string;
  sender: MessageSender;
  text: string;
  createdAt: number;
}

export interface InterrogationThread {
  id: string;
  playerId: string;
  playerNickname: string;
  npcId: string;
  status: ThreadStatus;
  lastMessageAt: number;
  lastMessageText: string;
  lastSender: MessageSender;
  playerUnread: boolean;
}

const DEMO_THREADS_KEY = 'arcanum-interrogation-demo-threads';
const DEMO_MESSAGES_PREFIX = 'arcanum-interrogation-demo-messages-';
const DEMO_EVENT = 'arcanum-interrogation-demo-changed';

export function threadId(playerId: string, npcId: string) {
  return `${playerId}_${npcId}`;
}

function threadDocRef(id: string) {
  return doc(db!, 'interrogationThreads', id);
}

function messagesRef(id: string) {
  return collection(db!, 'interrogationThreads', id, 'messages');
}

function toThread(docSnap: QueryDocumentSnapshot<DocumentData>): InterrogationThread {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    playerId: data.playerId,
    playerNickname: data.playerNickname,
    npcId: data.npcId,
    status: data.status,
    lastMessageAt: data.lastMessageAt ?? 0,
    lastMessageText: data.lastMessageText ?? '',
    lastSender: data.lastSender,
    playerUnread: Boolean(data.playerUnread),
  };
}

function readDemoThreads(): InterrogationThread[] {
  try {
    const raw = localStorage.getItem(DEMO_THREADS_KEY);
    return raw ? (JSON.parse(raw) as InterrogationThread[]) : [];
  } catch {
    return [];
  }
}

function writeDemoThreads(threads: InterrogationThread[]) {
  try {
    localStorage.setItem(DEMO_THREADS_KEY, JSON.stringify(threads));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

function readDemoMessages(id: string): InterrogationMessage[] {
  try {
    const raw = localStorage.getItem(DEMO_MESSAGES_PREFIX + id);
    return raw ? (JSON.parse(raw) as InterrogationMessage[]) : [];
  } catch {
    return [];
  }
}

function writeDemoMessages(id: string, messages: InterrogationMessage[]) {
  try {
    localStorage.setItem(DEMO_MESSAGES_PREFIX + id, JSON.stringify(messages));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

export function subscribeThreadMessages(
  playerId: string,
  npcId: string,
  callback: (messages: InterrogationMessage[]) => void,
): () => void {
  const id = threadId(playerId, npcId);
  if (isFirebaseConfigured && db) {
    const q = query(messagesRef(id), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      callback(
        snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            sender: data.sender,
            text: data.text,
            createdAt: data.createdAt?.toMillis?.() ?? 0,
          } satisfies InterrogationMessage;
        }),
      );
    });
  }
  const read = () => callback(readDemoMessages(id));
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}

export function subscribeMyThreads(playerId: string, callback: (threads: InterrogationThread[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'interrogationThreads'), where('playerId', '==', playerId));
    return onSnapshot(q, (snap) => callback(snap.docs.map(toThread)));
  }
  const read = () => callback(readDemoThreads().filter((t) => t.playerId === playerId));
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}

export function subscribeAllThreads(callback: (threads: InterrogationThread[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'interrogationThreads'), orderBy('lastMessageAt', 'desc'));
    return onSnapshot(q, (snap) => callback(snap.docs.map(toThread)));
  }
  const read = () => callback([...readDemoThreads()].sort((a, b) => b.lastMessageAt - a.lastMessageAt));
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}

export async function sendQuestion(playerId: string, playerNickname: string, npcId: string, text: string): Promise<void> {
  const id = threadId(playerId, npcId);
  const now = Date.now();

  if (isFirebaseConfigured && db) {
    const batch = writeBatch(db);
    batch.set(doc(messagesRef(id)), { sender: 'player', text, createdAt: serverTimestamp() });
    batch.set(
      threadDocRef(id),
      {
        playerId,
        playerNickname,
        npcId,
        status: 'WAITING',
        lastMessageAt: now,
        lastMessageText: text,
        lastSender: 'player',
        playerUnread: false,
      },
      { merge: true },
    );
    await batch.commit();
    return;
  }

  const messages = readDemoMessages(id);
  messages.push({ id: crypto.randomUUID(), sender: 'player', text, createdAt: now });
  writeDemoMessages(id, messages);

  const threads = readDemoThreads();
  const idx = threads.findIndex((t) => t.id === id);
  const updated: InterrogationThread = {
    id,
    playerId,
    playerNickname,
    npcId,
    status: 'WAITING',
    lastMessageAt: now,
    lastMessageText: text,
    lastSender: 'player',
    playerUnread: false,
  };
  if (idx >= 0) threads[idx] = updated;
  else threads.push(updated);
  writeDemoThreads(threads);
}

export async function sendAnswer(thread: InterrogationThread, text: string): Promise<void> {
  const now = Date.now();

  if (isFirebaseConfigured && db) {
    const batch = writeBatch(db);
    batch.set(doc(messagesRef(thread.id)), { sender: 'admin', text, createdAt: serverTimestamp() });
    batch.set(
      threadDocRef(thread.id),
      { status: 'ANSWERED', lastMessageAt: now, lastMessageText: text, lastSender: 'admin', playerUnread: true },
      { merge: true },
    );
    await batch.commit();
    return;
  }

  const messages = readDemoMessages(thread.id);
  messages.push({ id: crypto.randomUUID(), sender: 'admin', text, createdAt: now });
  writeDemoMessages(thread.id, messages);

  const threads = readDemoThreads();
  const idx = threads.findIndex((t) => t.id === thread.id);
  if (idx >= 0) {
    threads[idx] = { ...threads[idx], status: 'ANSWERED', lastMessageAt: now, lastMessageText: text, lastSender: 'admin', playerUnread: true };
    writeDemoThreads(threads);
  }
}

export async function markThreadRead(playerId: string, npcId: string): Promise<void> {
  const id = threadId(playerId, npcId);

  if (isFirebaseConfigured && db) {
    await setDoc(threadDocRef(id), { playerUnread: false }, { merge: true });
    return;
  }

  const threads = readDemoThreads();
  const idx = threads.findIndex((t) => t.id === id);
  if (idx >= 0 && threads[idx].playerUnread) {
    threads[idx] = { ...threads[idx], playerUnread: false };
    writeDemoThreads(threads);
  }
}
