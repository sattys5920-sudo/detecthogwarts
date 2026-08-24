import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { HouseId } from '../data/sortingTest';
import type { PatronusId } from '../game/forest/types';
import { db, isFirebaseConfigured } from './config';

export interface AssignmentBroadcast {
  id: string;
  kind: 'house' | 'patronus';
  playerId: string;
  nickname: string;
  house: HouseId | null;
  patronus: PatronusId | null;
  sentAt: number;
}

const DEMO_KEY = 'arcanum-assignment-broadcast-demo';
const DEMO_EVENT = 'arcanum-assignment-broadcast-demo-changed';

function readDemo(): AssignmentBroadcast | null {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? (JSON.parse(raw) as AssignmentBroadcast) : null;
  } catch {
    return null;
  }
}

function writeDemo(a: AssignmentBroadcast) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(a));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable (private mode, etc.) — silently skip persistence.
  }
}

/** Announces a house/patronus assignment to every connected player, not just the one it's about. */
export async function broadcastAssignment(input: Omit<AssignmentBroadcast, 'id' | 'sentAt'>): Promise<void> {
  const event: AssignmentBroadcast = { ...input, id: crypto.randomUUID(), sentAt: Date.now() };
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, 'assignmentBroadcasts', 'latest'), event);
    return;
  }
  writeDemo(event);
}

export function listenAssignmentBroadcast(callback: (a: AssignmentBroadcast | null) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(doc(db, 'assignmentBroadcasts', 'latest'), (snap) => {
      callback(snap.exists() ? (snap.data() as AssignmentBroadcast) : null);
    });
  }

  const read = () => callback(readDemo());
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}
