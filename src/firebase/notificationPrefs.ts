import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

export interface NotificationPrefs {
  master: boolean;
  event: boolean;
  chat: boolean;
  mention: boolean;
}

export const DEFAULT_PREFS: NotificationPrefs = { master: true, event: true, chat: true, mention: true };

const DEMO_PREFIX = 'arcanum-notifprefs-demo-';
const DEMO_EVENT = 'arcanum-notifprefs-demo-changed';

function demoKey(playerId: string) {
  return DEMO_PREFIX + playerId;
}

function readDemo(playerId: string): NotificationPrefs {
  try {
    const raw = localStorage.getItem(demoKey(playerId));
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<NotificationPrefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function writeDemo(playerId: string, prefs: NotificationPrefs) {
  try {
    localStorage.setItem(demoKey(playerId), JSON.stringify(prefs));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

export function subscribePrefs(playerId: string, callback: (prefs: NotificationPrefs) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(doc(db, 'notificationPrefs', playerId), (snap) => {
      callback(snap.exists() ? { ...DEFAULT_PREFS, ...(snap.data() as Partial<NotificationPrefs>) } : DEFAULT_PREFS);
    });
  }
  const read = () => callback(readDemo(playerId));
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}

export async function setPref(playerId: string, key: keyof NotificationPrefs, value: boolean): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, 'notificationPrefs', playerId), { [key]: value }, { merge: true });
    return;
  }
  writeDemo(playerId, { ...readDemo(playerId), [key]: value });
}
