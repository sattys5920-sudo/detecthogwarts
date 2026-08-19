import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import type { ClueDef } from '../data/investigation/types';
import { db, isFirebaseConfigured } from './config';

export interface AdlibMessage {
  id: string;
  kind: 'narration' | 'evidence' | 'chat';
  speaker: string;
  text: string;
  clue?: ClueDef;
  at: number;
}

const DEMO_ADLIB_PREFIX = 'arcanum-session-adlib-demo-';
const DEMO_ADLIB_EVENT = 'arcanum-session-adlib-demo-changed';

function adlibDemoKey(day: number) {
  return `${DEMO_ADLIB_PREFIX}${day}`;
}

function readAdlibDemo(day: number): AdlibMessage[] {
  try {
    const raw = localStorage.getItem(adlibDemoKey(day));
    return raw ? (JSON.parse(raw) as AdlibMessage[]) : [];
  } catch {
    return [];
  }
}

function writeAdlibDemo(day: number, messages: AdlibMessage[]) {
  try {
    localStorage.setItem(adlibDemoKey(day), JSON.stringify(messages));
    window.dispatchEvent(new Event(DEMO_ADLIB_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

function adlibCollectionRef(day: number) {
  return collection(db!, 'sessions', `day${day}`, 'adlibs');
}

export function listenAdlibs(day: number, callback: (messages: AdlibMessage[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(adlibCollectionRef(day), orderBy('at', 'asc'));
    return onSnapshot(q, (snap) => {
      callback(
        snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            kind: data.kind === 'evidence' || data.kind === 'chat' ? data.kind : 'narration',
            speaker: data.speaker,
            text: data.text,
            clue: data.clue,
            at: data.at?.toMillis?.() ?? 0,
          } satisfies AdlibMessage;
        }),
      );
    });
  }
  const read = () => callback(readAdlibDemo(day));
  read();
  window.addEventListener(DEMO_ADLIB_EVENT, read);
  return () => window.removeEventListener(DEMO_ADLIB_EVENT, read);
}

export async function sendAdlib(day: number, speaker: string, text: string, clue?: ClueDef): Promise<void> {
  const payload = { kind: 'narration' as const, speaker, text, ...(clue ? { clue } : {}) };
  if (isFirebaseConfigured && db) {
    await addDoc(adlibCollectionRef(day), { ...payload, at: serverTimestamp() });
    return;
  }
  const messages = readAdlibDemo(day);
  messages.push({ ...payload, id: crypto.randomUUID(), at: Date.now() });
  writeAdlibDemo(day, messages);
}

export async function sendChatMessage(day: number, nickname: string, text: string): Promise<void> {
  const payload = { kind: 'chat' as const, speaker: nickname, text };
  if (isFirebaseConfigured && db) {
    await addDoc(adlibCollectionRef(day), { ...payload, at: serverTimestamp() });
    return;
  }
  const messages = readAdlibDemo(day);
  messages.push({ ...payload, id: crypto.randomUUID(), at: Date.now() });
  writeAdlibDemo(day, messages);
}

export async function presentEvidence(day: number, presenterNickname: string, clue: { title: string; ink: ClueDef['ink'] }): Promise<void> {
  const payload = {
    kind: 'evidence' as const,
    speaker: presenterNickname,
    text: `『${clue.title}』을(를) 제시했다.`,
  };
  if (isFirebaseConfigured && db) {
    await addDoc(adlibCollectionRef(day), { ...payload, at: serverTimestamp() });
    return;
  }
  const messages = readAdlibDemo(day);
  messages.push({ ...payload, id: crypto.randomUUID(), at: Date.now() });
  writeAdlibDemo(day, messages);
}
