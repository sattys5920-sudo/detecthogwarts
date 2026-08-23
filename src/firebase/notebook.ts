import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

export interface NotebookEntry {
  id: string;
  ink: 'black' | 'red' | 'indigo';
  title: string;
  desc: string;
  status: string;
  registeredAt: number;
  sourceId?: string;
  memo?: string;
}

export interface NotebookState {
  entries: NotebookEntry[];
}

const COLLECTION = 'notebooks';
const DEMO_PREFIX = 'arcanum-notebook-demo:';
const DEMO_EVENT = 'arcanum-notebook-demo-changed';

const SEED: NotebookEntry[] = [
  {
    id: 'c1',
    ink: 'indigo',
    title: '은빛 나침반',
    desc: '사무실에 분실물로 접수됨. 바늘이 늘 같은 방향을 가리킨다.',
    status: '확인됨',
    registeredAt: Date.now() - 3 * 86400000,
  },
  {
    id: 'c2',
    ink: 'red',
    title: '회랑의 차가운 바람',
    desc: '탐사 중 포착된 이상 현상. 출처를 알 수 없음.',
    status: '조사 중',
    registeredAt: Date.now() - 2 * 86400000,
  },
  {
    id: 'c3',
    ink: 'black',
    title: '낡은 편지 조각',
    desc: '누군가 흘리고 간 것으로 보임. 글씨가 반쯤 지워져 있다.',
    status: '미해결',
    registeredAt: Date.now() - 86400000,
  },
];

function initialState(): NotebookState {
  return { entries: SEED };
}

function readDemo(playerId: string): NotebookState {
  try {
    const raw = localStorage.getItem(DEMO_PREFIX + playerId);
    return raw ? (JSON.parse(raw) as NotebookState) : initialState();
  } catch {
    return initialState();
  }
}

function writeDemo(playerId: string, state: NotebookState) {
  try {
    localStorage.setItem(DEMO_PREFIX + playerId, JSON.stringify(state));
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // localStorage unavailable — silently skip persistence.
  }
}

async function transact(playerId: string, mutate: (current: NotebookState) => NotebookState): Promise<void> {
  if (isFirebaseConfigured && db) {
    const ref = doc(db, COLLECTION, playerId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists() ? (snap.data() as NotebookState) : initialState();
      tx.set(ref, mutate(current));
    });
    return;
  }
  writeDemo(playerId, mutate(readDemo(playerId)));
}

export function subscribeNotebook(playerId: string, callback: (state: NotebookState) => void): () => void {
  if (isFirebaseConfigured && db) {
    return onSnapshot(doc(db, COLLECTION, playerId), (snap) => {
      callback(snap.exists() ? (snap.data() as NotebookState) : initialState());
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

export async function registerEntry(playerId: string, entry: Omit<NotebookEntry, 'id' | 'registeredAt'>): Promise<void> {
  await transact(playerId, (current) => {
    if (entry.sourceId && current.entries.some((e) => e.sourceId === entry.sourceId)) return current;
    if (!entry.sourceId && current.entries.some((e) => e.title === entry.title)) return current;
    const created: NotebookEntry = { ...entry, id: crypto.randomUUID(), registeredAt: Date.now() };
    return { entries: [created, ...current.entries] };
  });
}

export async function removeEntry(playerId: string, id: string): Promise<void> {
  await transact(playerId, (current) => ({ entries: current.entries.filter((e) => e.id !== id) }));
}

export async function setEntryInk(playerId: string, id: string, ink: NotebookEntry['ink']): Promise<void> {
  await transact(playerId, (current) => ({ entries: current.entries.map((e) => (e.id === id ? { ...e, ink } : e)) }));
}

export async function setEntryMemo(playerId: string, id: string, memo: string): Promise<void> {
  await transact(playerId, (current) => ({ entries: current.entries.map((e) => (e.id === id ? { ...e, memo } : e)) }));
}
