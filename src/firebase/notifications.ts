import { collection, doc, onSnapshot, query, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

export type NotificationType = 'POPUP' | 'FEED' | 'CHAT' | 'MENTION';

export interface AppNotification {
  id: string;
  playerId: string;
  type: NotificationType;
  title: string;
  body: string;
  targetUrl: string;
  targetId: string;
  isRead: boolean;
  createdAt: number;
}

const COLLECTION = 'notifications';
const DEMO_PREFIX = 'arcanum-notifications-demo-';
const DEMO_EVENT = 'arcanum-notifications-demo-changed';
const MAX_LIST = 100;

function demoKey(playerId: string) {
  return DEMO_PREFIX + playerId;
}

function readDemo(playerId: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(demoKey(playerId));
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function writeDemo(playerId: string, items: AppNotification[]) {
  try {
    localStorage.setItem(demoKey(playerId), JSON.stringify(items));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

function notifId(playerId: string, type: NotificationType, targetId: string) {
  return `${playerId}__${type}__${targetId}`;
}

type NewNotification = Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>;

/** Creates a notification only if one doesn't already exist for this (player, type, target) triple — the id itself is the dedupe key, so re-detecting the same event (e.g. from a second device) is a harmless no-op instead of a duplicate or a read-state reset. */
export async function createNotificationIfAbsent(input: NewNotification): Promise<void> {
  const id = notifId(input.playerId, input.type, input.targetId);
  if (isFirebaseConfigured && db) {
    const ref = doc(db, COLLECTION, id);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) return;
      tx.set(ref, { ...input, isRead: false, createdAt: serverTimestamp() });
    });
    return;
  }
  const items = readDemo(input.playerId);
  if (items.some((n) => n.id === id)) return;
  items.unshift({ ...input, id, isRead: false, createdAt: Date.now() });
  writeDemo(input.playerId, items);
}

export function subscribeNotifications(playerId: string, callback: (items: AppNotification[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, COLLECTION), where('playerId', '==', playerId));
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          playerId: data.playerId,
          type: data.type,
          title: data.title,
          body: data.body,
          targetUrl: data.targetUrl,
          targetId: data.targetId,
          isRead: Boolean(data.isRead),
          createdAt: data.createdAt?.toMillis?.() ?? 0,
        } satisfies AppNotification;
      });
      callback(items.sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_LIST));
    });
  }
  const read = () => callback(readDemo(playerId).slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_LIST));
  read();
  window.addEventListener(DEMO_EVENT, read);
  window.addEventListener('storage', read);
  return () => {
    window.removeEventListener(DEMO_EVENT, read);
    window.removeEventListener('storage', read);
  };
}

export async function markRead(playerId: string, id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, COLLECTION, id), { isRead: true });
    return;
  }
  const items = readDemo(playerId);
  const idx = items.findIndex((n) => n.id === id);
  if (idx >= 0 && !items[idx].isRead) {
    items[idx] = { ...items[idx], isRead: true };
    writeDemo(playerId, items);
  }
}

export async function markAllRead(playerId: string, ids: string[]): Promise<void> {
  if (isFirebaseConfigured && db) {
    await Promise.all(ids.map((id) => updateDoc(doc(db!, COLLECTION, id), { isRead: true })));
    return;
  }
  const items = readDemo(playerId);
  writeDemo(
    playerId,
    items.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n)),
  );
}
