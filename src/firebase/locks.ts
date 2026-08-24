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

function listenLock(collectionName: string, key: string, callback: (locked: boolean) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(doc(db, collectionName, key), (snap) => {
      callback(snap.exists() ? Boolean(snap.data().locked) : false);
    });
  }
  const read = () => callback(readDemoLock(`${collectionName}-${key}`));
  read();
  window.addEventListener(DEMO_EVENT, read);
  return () => window.removeEventListener(DEMO_EVENT, read);
}

async function setLock(collectionName: string, key: string, locked: boolean): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, collectionName, key), { locked });
    return;
  }
  writeDemoLock(`${collectionName}-${key}`, locked);
}

export function listenDayLock(day: number, callback: (locked: boolean) => void): () => void {
  return listenLock('sessions', `day${day}`, callback);
}

export function setDayLock(day: number, locked: boolean): Promise<void> {
  return setLock('sessions', `day${day}`, locked);
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
