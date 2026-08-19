import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

export interface DormMessage {
  id: string;
  authorPlayerId: string;
  authorNickname: string;
  authorAvatar: string | null;
  text: string;
  createdAt: number;
}

const DEMO_PREFIX = 'arcanum-dormchat-demo-';
const DEMO_EVENT = 'arcanum-dormchat-demo-changed';

function demoKey(houseId: string) {
  return `${DEMO_PREFIX}${houseId}`;
}

function readDemo(houseId: string): DormMessage[] {
  try {
    const raw = localStorage.getItem(demoKey(houseId));
    return raw ? (JSON.parse(raw) as DormMessage[]) : [];
  } catch {
    return [];
  }
}

function writeDemo(houseId: string, messages: DormMessage[]) {
  try {
    localStorage.setItem(demoKey(houseId), JSON.stringify(messages));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

function messagesRef(houseId: string) {
  return collection(db!, 'dormChats', houseId, 'messages');
}

export function listenDormMessages(houseId: string, callback: (messages: DormMessage[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(messagesRef(houseId), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      callback(
        snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            authorPlayerId: data.authorPlayerId,
            authorNickname: data.authorNickname,
            authorAvatar: data.authorAvatar ?? null,
            text: data.text,
            createdAt: data.createdAt?.toMillis?.() ?? 0,
          } satisfies DormMessage;
        }),
      );
    });
  }
  const read = () => callback(readDemo(houseId));
  read();
  window.addEventListener(DEMO_EVENT, read);
  return () => window.removeEventListener(DEMO_EVENT, read);
}

export async function sendDormMessage(houseId: string, input: Omit<DormMessage, 'id' | 'createdAt'>): Promise<void> {
  if (isFirebaseConfigured && db) {
    await addDoc(messagesRef(houseId), { ...input, createdAt: serverTimestamp() });
    return;
  }
  const messages = readDemo(houseId);
  messages.push({ ...input, id: crypto.randomUUID(), createdAt: Date.now() });
  writeDemo(houseId, messages);
}
