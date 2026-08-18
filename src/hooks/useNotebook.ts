import { useCallback, useEffect, useState } from 'react';

export interface NotebookEntry {
  id: string;
  ink: 'black' | 'red' | 'indigo';
  title: string;
  desc: string;
  status: string;
  registeredAt: number;
}

const STORAGE_KEY = 'arcanum-notebook';

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

function load(): NotebookEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NotebookEntry[]) : SEED;
  } catch {
    return SEED;
  }
}

export function useNotebook() {
  const [entries, setEntries] = useState<NotebookEntry[]>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const register = useCallback((entry: Omit<NotebookEntry, 'id' | 'registeredAt'>) => {
    const created: NotebookEntry = { ...entry, id: crypto.randomUUID(), registeredAt: Date.now() };
    setEntries((prev) => [created, ...prev]);
    return created;
  }, []);

  return { entries, register };
}
