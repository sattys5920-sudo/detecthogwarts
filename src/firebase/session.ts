import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

export interface SessionState {
  revealedCount: number;
  choices: Record<string, string>;
}

const emptyState: SessionState = { revealedCount: 0, choices: {} };
const DEMO_PREFIX = 'arcanum-session-demo-';
const DEMO_EVENT = 'arcanum-session-demo-changed';

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

function docRef(day: number) {
  return doc(db!, 'sessions', `day${day}`);
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
