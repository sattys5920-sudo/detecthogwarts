import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { HOUSES } from '../data/story';

interface GameState {
  nickname: string;
  houseId: string;
  discoveredClueIds: string[];
  askedDialogueIds: string[];
  startedAt: number | null;
  finishedAt: number | null;
}

const STORAGE_KEY = 'arcanum-mystery-progress';

const emptyState: GameState = {
  nickname: '',
  houseId: HOUSES[0].id,
  discoveredClueIds: [],
  askedDialogueIds: [],
  startedAt: null,
  finishedAt: null,
};

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    return { ...emptyState, ...(JSON.parse(raw) as Partial<GameState>) };
  } catch {
    return emptyState;
  }
}

interface GameContextValue extends GameState {
  isStarted: boolean;
  startGame: (nickname: string, houseId: string) => void;
  discoverClue: (clueId: string) => void;
  markDialogueAsked: (dialogueId: string) => void;
  finishGame: () => void;
  resetGame: () => void;
  elapsedSeconds: number;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(loadState);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!state.startedAt || state.finishedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [state.startedAt, state.finishedAt]);

  const startGame = useCallback((nickname: string, houseId: string) => {
    setState({
      ...emptyState,
      nickname,
      houseId,
      startedAt: Date.now(),
    });
    setNow(Date.now());
  }, []);

  const discoverClue = useCallback((clueId: string) => {
    setState((prev) =>
      prev.discoveredClueIds.includes(clueId)
        ? prev
        : { ...prev, discoveredClueIds: [...prev.discoveredClueIds, clueId] },
    );
  }, []);

  const markDialogueAsked = useCallback((dialogueId: string) => {
    setState((prev) =>
      prev.askedDialogueIds.includes(dialogueId)
        ? prev
        : { ...prev, askedDialogueIds: [...prev.askedDialogueIds, dialogueId] },
    );
  }, []);

  const finishGame = useCallback(() => {
    setState((prev) => (prev.finishedAt ? prev : { ...prev, finishedAt: Date.now() }));
  }, []);

  const resetGame = useCallback(() => {
    setState(emptyState);
  }, []);

  const elapsedSeconds = useMemo(() => {
    if (!state.startedAt) return 0;
    const end = state.finishedAt ?? now;
    return Math.max(0, Math.floor((end - state.startedAt) / 1000));
  }, [state.startedAt, state.finishedAt, now]);

  const value: GameContextValue = {
    ...state,
    isStarted: state.startedAt !== null,
    startGame,
    discoverClue,
    markDialogueAsked,
    finishGame,
    resetGame,
    elapsedSeconds,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
