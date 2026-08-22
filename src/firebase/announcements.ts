import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

export interface Announcement {
  id: string;
  text: string;
  sentAt: number;
}

const DEMO_KEY = 'arcanum-announcement-demo';
const DEMO_EVENT = 'arcanum-announcement-demo-changed';

function readDemo(): Announcement | null {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? (JSON.parse(raw) as Announcement) : null;
  } catch {
    return null;
  }
}

function writeDemo(a: Announcement) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(a));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable (private mode, etc.) — silently skip persistence.
  }
}

export async function sendAnnouncement(text: string): Promise<void> {
  const announcement: Announcement = { id: crypto.randomUUID(), text, sentAt: Date.now() };
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, 'announcements', 'latest'), announcement);
    return;
  }
  writeDemo(announcement);
}

export function listenAnnouncement(callback: (a: Announcement | null) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(doc(db, 'announcements', 'latest'), (snap) => {
      callback(snap.exists() ? (snap.data() as Announcement) : null);
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
