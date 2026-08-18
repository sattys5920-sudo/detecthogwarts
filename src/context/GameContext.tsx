import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { HouseId } from '../data/sortingTest';
import { createPlayerRecord, listenPlayer } from '../firebase/players';

interface PlayerState {
  nickname: string;
  houseId: string | null;
  joinedAt: number | null;
  playerId: string | null;
}

const STORAGE_KEY = 'arcanum-player';
const SEEN_ASSIGNMENT_PREFIX = 'arcanum-assignment-seen-';

const emptyState: PlayerState = {
  nickname: '',
  houseId: null,
  joinedAt: null,
  playerId: null,
};

function loadState(): PlayerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    return { ...emptyState, ...(JSON.parse(raw) as Partial<PlayerState>) };
  } catch {
    return emptyState;
  }
}

interface GameContextValue extends PlayerState {
  hasEntered: boolean;
  assignedHouse: HouseId | null;
  justAssigned: boolean;
  clearJustAssigned: () => void;
  completeSignup: (nickname: string, testScores: Record<HouseId, number>, computedHouse: HouseId) => Promise<void>;
  setHouse: (houseId: string) => void;
  resetPlayer: () => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlayerState>(loadState);
  const [assignedHouse, setAssignedHouse] = useState<HouseId | null>(null);
  const [justAssigned, setJustAssigned] = useState(false);
  const playerIdRef = useRef(state.playerId);
  playerIdRef.current = state.playerId;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!state.playerId) return;
    const unsubscribe = listenPlayer(state.playerId, (record) => {
      if (!record || !record.assignedHouse) return;
      setAssignedHouse(record.assignedHouse);
      setState((prev) => (prev.houseId === record.assignedHouse ? prev : { ...prev, houseId: record.assignedHouse }));

      const seenKey = SEEN_ASSIGNMENT_PREFIX + record.id;
      if (localStorage.getItem(seenKey) !== record.assignedHouse) {
        setJustAssigned(true);
      }
    });
    return unsubscribe;
  }, [state.playerId]);

  const completeSignup = useCallback(
    async (nickname: string, testScores: Record<HouseId, number>, computedHouse: HouseId) => {
      const playerId = crypto.randomUUID();
      setState((prev) => ({ ...prev, nickname, joinedAt: prev.joinedAt ?? Date.now(), playerId }));
      await createPlayerRecord(playerId, nickname, testScores, computedHouse);
    },
    [],
  );

  const setHouse = useCallback((houseId: string) => {
    setState((prev) => ({ ...prev, houseId }));
  }, []);

  const clearJustAssigned = useCallback(() => {
    const playerId = playerIdRef.current;
    if (playerId && assignedHouse) {
      localStorage.setItem(SEEN_ASSIGNMENT_PREFIX + playerId, assignedHouse);
    }
    setJustAssigned(false);
  }, [assignedHouse]);

  const resetPlayer = useCallback(() => {
    setState(emptyState);
    setAssignedHouse(null);
    setJustAssigned(false);
  }, []);

  const value: GameContextValue = {
    ...state,
    hasEntered: state.nickname !== '',
    assignedHouse,
    justAssigned,
    clearJustAssigned,
    completeSignup,
    setHouse,
    resetPlayer,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
