import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface PlayerState {
  nickname: string;
  houseId: string | null;
  joinedAt: number | null;
}

const STORAGE_KEY = 'arcanum-player';

const emptyState: PlayerState = {
  nickname: '',
  houseId: null,
  joinedAt: null,
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
  enterApp: (nickname: string) => void;
  setHouse: (houseId: string) => void;
  resetPlayer: () => void;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlayerState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const enterApp = useCallback((nickname: string) => {
    setState((prev) => ({ ...prev, nickname, joinedAt: prev.joinedAt ?? Date.now() }));
  }, []);

  const setHouse = useCallback((houseId: string) => {
    setState((prev) => ({ ...prev, houseId }));
  }, []);

  const resetPlayer = useCallback(() => {
    setState(emptyState);
  }, []);

  const value: GameContextValue = {
    ...state,
    hasEntered: state.nickname !== '',
    enterApp,
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
