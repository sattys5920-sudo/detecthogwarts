import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

const DEMO_PREFIX = 'arcanum-lock-';
const DEMO_EVENT = 'arcanum-lock-demo-changed';

function demoKey(key: string) {
  return `${DEMO_PREFIX}${key}`;
}

function readDemoLock(key: string): boolean {
  return localStorage.getItem(demoKey(key)) === 'true';
}

function writeDemoLock(key: string, locked: boolean) {
  try {
    localStorage.setItem(demoKey(key), String(locked));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

function listenLock(collectionName: string, key: string, callback: (value: boolean) => void, field = 'locked'): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(doc(db, collectionName, key), (snap) => {
      callback(snap.exists() ? Boolean(snap.data()[field]) : false);
    });
  }
  const read = () => callback(readDemoLock(`${collectionName}-${key}-${field}`));
  read();
  window.addEventListener(DEMO_EVENT, read);
  return () => window.removeEventListener(DEMO_EVENT, read);
}

async function setLock(collectionName: string, key: string, value: boolean, field = 'locked'): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, collectionName, key), { [field]: value });
    return;
  }
  writeDemoLock(`${collectionName}-${key}-${field}`, value);
}

export function listenDayLock(day: number, callback: (locked: boolean) => void): () => void {
  return listenLock('sessions', `day${day}`, callback);
}

export function setDayLock(day: number, locked: boolean): Promise<void> {
  return setLock('sessions', `day${day}`, locked);
}

/**
 * Whether Day N's tab is open to non-admin players at all — separate from listenDayLock/setDayLock
 * above, which only pauses/hides a day's chat content once it's already open. Stored in its own
 * collection (default false = closed when no doc exists yet) so days 2-5 start closed until the
 * admin explicitly opens them; Day 1 is always open and never consults this.
 */
export function listenDayOpen(day: number, callback: (open: boolean) => void): () => void {
  return listenLock('dayOpen', String(day), callback, 'open');
}

export function setDayOpen(day: number, open: boolean): Promise<void> {
  return setLock('dayOpen', String(day), open, 'open');
}

export function listenRoomLock(roomId: string, callback: (locked: boolean) => void): () => void {
  return listenLock('recessLocks', roomId, callback);
}

export function setRoomLock(roomId: string, locked: boolean): Promise<void> {
  return setLock('recessLocks', roomId, locked);
}

export function listenRecessLock(callback: (locked: boolean) => void): () => void {
  return listenLock('sessions', 'recess', callback);
}

export function setRecessLock(locked: boolean): Promise<void> {
  return setLock('sessions', 'recess', locked);
}

export function listenInterrogationLock(callback: (locked: boolean) => void): () => void {
  return listenLock('sessions', 'interrogation', callback);
}

export function setInterrogationLock(locked: boolean): Promise<void> {
  return setLock('sessions', 'interrogation', locked);
}
