import { useCallback, useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';

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

const SYNC_EVENT = 'arcanum-notebook-sync';

function storageKey(playerId: string) {
  return `arcanum-notebook-${playerId}`;
}

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

function load(playerId: string): NotebookEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(playerId));
    return raw ? (JSON.parse(raw) as NotebookEntry[]) : SEED;
  } catch {
    return SEED;
  }
}

function persist(playerId: string, entries: NotebookEntry[]) {
  try {
    localStorage.setItem(storageKey(playerId), JSON.stringify(entries));
    window.dispatchEvent(new Event(SYNC_EVENT));
  } catch {
    // localStorage unavailable (private mode, etc.) — silently skip persistence.
  }
}

export function useNotebook() {
  const { playerId } = useGame();
  const key = playerId ?? 'guest';
  const [entries, setEntries] = useState<NotebookEntry[]>(() => load(key));

  // Re-reads whenever the logged-in account changes, so switching accounts on the same
  // device swaps to that account's own notebook instead of showing the previous one's.
  useEffect(() => {
    setEntries(load(key));
  }, [key]);

  useEffect(() => {
    const sync = () => setEntries(load(key));
    window.addEventListener(SYNC_EVENT, sync);
    return () => window.removeEventListener(SYNC_EVENT, sync);
  }, [key]);

  const register = useCallback((entry: Omit<NotebookEntry, 'id' | 'registeredAt'>) => {
    setEntries((prev) => {
      if (entry.sourceId && prev.some((e) => e.sourceId === entry.sourceId)) return prev;
      if (!entry.sourceId && prev.some((e) => e.title === entry.title)) return prev;
      const created: NotebookEntry = { ...entry, id: crypto.randomUUID(), registeredAt: Date.now() };
      const next = [created, ...prev];
      persist(key, next);
      return next;
    });
  }, [key]);

  const remove = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      persist(key, next);
      return next;
    });
  }, [key]);

  const setInk = useCallback((id: string, ink: NotebookEntry['ink']) => {
    setEntries((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ink } : e));
      persist(key, next);
      return next;
    });
  }, [key]);

  const setMemo = useCallback((id: string, memo: string) => {
    setEntries((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, memo } : e));
      persist(key, next);
      return next;
    });
  }, [key]);

  return { entries, register, remove, setInk, setMemo };
}
