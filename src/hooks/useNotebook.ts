import { useCallback, useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  registerEntry,
  removeEntry,
  setEntryInk,
  setEntryMemo,
  subscribeNotebook,
  type NotebookEntry,
} from '../firebase/notebook';

export type { NotebookEntry };

export function useNotebook() {
  const { playerId } = useGame();
  const [entries, setEntries] = useState<NotebookEntry[]>([]);

  useEffect(() => {
    if (!playerId) return;
    return subscribeNotebook(playerId, (state) => setEntries(state.entries));
  }, [playerId]);

  const register = useCallback(
    (entry: Omit<NotebookEntry, 'id' | 'registeredAt'>) => {
      if (playerId) registerEntry(playerId, entry);
    },
    [playerId],
  );

  const remove = useCallback(
    (id: string) => {
      if (playerId) removeEntry(playerId, id);
    },
    [playerId],
  );

  const setInk = useCallback(
    (id: string, ink: NotebookEntry['ink']) => {
      if (playerId) setEntryInk(playerId, id, ink);
    },
    [playerId],
  );

  const setMemo = useCallback(
    (id: string, memo: string) => {
      if (playerId) setEntryMemo(playerId, id, memo);
    },
    [playerId],
  );

  return { entries, register, remove, setInk, setMemo };
}
