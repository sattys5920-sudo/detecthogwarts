import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

export interface ForestChatMessage {
  id: string;
  authorPlayerId: string;
  authorNickname: string;
  text: string;
  createdAt: number;
}

const DEMO_PREFIX = 'arcanum-forestchat-demo-';
const DEMO_EVENT = 'arcanum-forestchat-demo-changed';

function demoKey(roomId: string) {
  return `${DEMO_PREFIX}${roomId}`;
}

function readDemo(roomId: string): ForestChatMessage[] {
  try {
    const raw = localStorage.getItem(demoKey(roomId));
    return raw ? (JSON.parse(raw) as ForestChatMessage[]) : [];
  } catch {
    return [];
  }
}

function writeDemo(roomId: string, messages: ForestChatMessage[]) {
  try {
    localStorage.setItem(demoKey(roomId), JSON.stringify(messages));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

function messagesRef(roomId: string) {
  return collection(db!, 'forest', roomId, 'messages');
}

export function listenForestChat(roomId: string, callback: (messages: ForestChatMessage[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(messagesRef(roomId), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      callback(
        snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            authorPlayerId: data.authorPlayerId,
            authorNickname: data.authorNickname,
            text: data.text,
            createdAt: data.createdAt?.toMillis?.() ?? 0,
          } satisfies ForestChatMessage;
        }),
      );
    });
  }
  const read = () => callback(readDemo(roomId));
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}

export async function sendForestChatMessage(roomId: string, authorPlayerId: string, authorNickname: string, text: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await addDoc(messagesRef(roomId), { authorPlayerId, authorNickname, text, createdAt: serverTimestamp() });
    return;
  }
  const messages = readDemo(roomId);
  messages.push({ id: crypto.randomUUID(), authorPlayerId, authorNickname, text, createdAt: Date.now() });
  writeDemo(roomId, messages);
}
