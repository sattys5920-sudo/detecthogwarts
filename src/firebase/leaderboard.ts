import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  house: string;
  elapsedSeconds: number;
  solved: boolean;
  createdAt: number;
}

const COLLECTION_NAME = 'leaderboard';
const DEMO_STORAGE_KEY = 'arcanum-mystery-leaderboard-demo';

type NewEntry = Omit<LeaderboardEntry, 'id' | 'createdAt'>;

function readDemoEntries(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
  } catch {
    return [];
  }
}

function writeDemoEntries(entries: LeaderboardEntry[]) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage unavailable (private mode, etc.) — silently skip persistence.
  }
}

export async function submitResult(entry: NewEntry): Promise<void> {
  if (isFirebaseConfigured && db) {
    await addDoc(collection(db, COLLECTION_NAME), {
      ...entry,
      createdAt: serverTimestamp(),
    });
    return;
  }

  const entries = readDemoEntries();
  entries.push({ ...entry, id: crypto.randomUUID(), createdAt: Date.now() });
  writeDemoEntries(entries);
}

export async function fetchLeaderboard(topN = 10): Promise<LeaderboardEntry[]> {
  if (isFirebaseConfigured && db) {
    // Only solved runs are ever written (see submitResult), so a plain
    // orderBy is enough here and avoids needing a composite index.
    const q = query(collection(db, COLLECTION_NAME), orderBy('elapsedSeconds', 'asc'), limit(topN));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        nickname: data.nickname,
        house: data.house,
        elapsedSeconds: data.elapsedSeconds,
        solved: data.solved,
        createdAt: data.createdAt?.toMillis?.() ?? 0,
      } satisfies LeaderboardEntry;
    });
  }

  return readDemoEntries()
    .filter((e) => e.solved)
    .sort((a, b) => a.elapsedSeconds - b.elapsedSeconds)
    .slice(0, topN);
}
