import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

/** The name FinalDeduction's accuse button shows — the story's actual killer, but admin-editable via AdminFinalSurvey's Q5 field instead of hardcoded, in case the cast ever changes. */
export const DEFAULT_KILLER_NAME = '파울';

const COLLECTION = 'finalDeduction';
const DOC_ID = 'current';
const DEMO_KEY = 'arcanum-final-deduction-killer-demo';
const DEMO_EVENT = 'arcanum-final-deduction-demo-changed';

function killerNameRef() {
  return doc(db!, COLLECTION, DOC_ID);
}

function readDemo(): string {
  try {
    return localStorage.getItem(DEMO_KEY) ?? DEFAULT_KILLER_NAME;
  } catch {
    return DEFAULT_KILLER_NAME;
  }
}

function writeDemo(name: string) {
  try {
    localStorage.setItem(DEMO_KEY, name);
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

export function listenKillerName(callback: (name: string) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(killerNameRef(), (snap) => {
      const name = snap.data()?.killerName;
      callback(typeof name === 'string' && name ? name : DEFAULT_KILLER_NAME);
    });
  }
  const read = () => callback(readDemo());
  read();
  window.addEventListener(DEMO_EVENT, read);
  return () => window.removeEventListener(DEMO_EVENT, read);
}

/** Admin-only: sets the name FinalDeduction's accuse button shows. */
export async function setKillerName(name: string): Promise<void> {
  const trimmed = name.trim() || DEFAULT_KILLER_NAME;
  if (isFirebaseConfigured && db) {
    await setDoc(killerNameRef(), { killerName: trimmed });
    return;
  }
  writeDemo(trimmed);
}
