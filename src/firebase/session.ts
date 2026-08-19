import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import type { ClueDef } from '../data/investigation/types';
import { db, isFirebaseConfigured } from './config';

export interface SessionState {
  revealedCount: number;
  choices: Record<string, string>;
}

export interface AdlibMessage {
  id: string;
  kind: 'narration' | 'evidence';
  speaker: string;
  text: string;
  clue?: ClueDef;
  at: number;
}

const emptyState: SessionState = { revealedCount: 0, choices: {} };
const DEMO_PREFIX = 'arcanum-session-demo-';
const DEMO_EVENT = 'arcanum-session-demo-changed';
const DEMO_ADLIB_PREFIX = 'arcanum-session-adlib-demo-';
const DEMO_ADLIB_EVENT = 'arcanum-session-adlib-demo-changed';

function demoKey(day: number) {
  return `${DEMO_PREFIX}${day}`;
}

function readDemo(day: number): SessionState {
  try {
    const raw = localStorage.getItem(demoKey(day));
    return raw ? (JSON.parse(raw) as SessionState) : emptyState;
  } catch {
    return emptyState;
  }
}

function writeDemo(day: number, state: SessionState) {
  try {
    localStorage.setItem(demoKey(day), JSON.stringify(state));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

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

function docRef(day: number) {
  return doc(db!, 'sessions', `day${day}`);
}

function adlibCollectionRef(day: number) {
  return collection(db!, 'sessions', `day${day}`, 'adlibs');
}

export function listenSessionState(day: number, callback: (state: SessionState) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(docRef(day), (snap) => {
      const data = snap.data();
      callback(data ? { revealedCount: data.revealedCount ?? 0, choices: data.choices ?? {} } : emptyState);
    });
  }
  const read = () => callback(readDemo(day));
  read();
  window.addEventListener(DEMO_EVENT, read);
  return () => window.removeEventListener(DEMO_EVENT, read);
}

export async function advanceSession(day: number, revealedCount: number): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(docRef(day), { revealedCount }, { merge: true });
    return;
  }
  writeDemo(day, { ...readDemo(day), revealedCount });
}

export async function chooseOption(day: number, beatId: string, optionId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(docRef(day), { [`choices.${beatId}`]: optionId }, { merge: true });
    return;
  }
  const s = readDemo(day);
  writeDemo(day, { ...s, choices: { ...s.choices, [beatId]: optionId } });
}

export async function resetSession(day: number): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(docRef(day), emptyState);
    return;
  }
  writeDemo(day, emptyState);
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
            kind: data.kind === 'evidence' ? 'evidence' : 'narration',
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
