import { useCallback, useEffect, useState } from 'react';

const PREFIX = 'arcanum-day-progress-';

function load(day: number): Set<string> {
  try {
    const raw = localStorage.getItem(PREFIX + day);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function useDayProgress(day: number) {
  const [seen, setSeen] = useState<Set<string>>(() => load(day));

  useEffect(() => {
    setSeen(load(day));
  }, [day]);

  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + day, JSON.stringify(Array.from(seen)));
    } catch {
      // localStorage unavailable — silently skip persistence.
    }
  }, [day, seen]);

  const markSeen = useCallback((id: string) => {
    setSeen((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  return { seen, markSeen };
}
