import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { HouseId } from '../data/sortingTest';
import { createPlayerRecord, listenPlayer } from '../firebase/players';

export interface PlayerStats {
  hp: number;
  intelligence: number;
  stamina: number;
  spellPower: number;
}

interface PlayerState {
  nickname: string;
  avatarDataUrl: string | null;
  houseId: string | null;
  joinedAt: number | null;
  playerId: string | null;
  stats: PlayerStats;
  currentDay: number;
  deductionSolved: boolean;
}

const STORAGE_KEY = 'arcanum-player';
const SEEN_ASSIGNMENT_PREFIX = 'arcanum-assignment-seen-';

const defaultStats: PlayerStats = { hp: 100, intelligence: 50, stamina: 50, spellPower: 50 };

const emptyState: PlayerState = {
  nickname: '',
  avatarDataUrl: null,
  houseId: null,
  joinedAt: null,
  playerId: null,
  stats: defaultStats,
  currentDay: 1,
  deductionSolved: false,
};

function loadState(): PlayerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Partial<PlayerState>;
    return { ...emptyState, ...parsed, stats: { ...defaultStats, ...parsed.stats } };
  } catch {
    return emptyState;
  }
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

interface GameContextValue extends PlayerState {
  hasEntered: boolean;
  assignedHouse: HouseId | null;
  justAssigned: boolean;
  clearJustAssigned: () => void;
  completeSignup: (nickname: string, testScores: Record<HouseId, number>, computedHouse: HouseId) => Promise<void>;
  setHouse: (houseId: string) => void;
  setNickname: (nickname: string) => void;
  setAvatar: (dataUrl: string | null) => void;
  adjustStat: (key: keyof PlayerStats, delta: number) => void;
  advanceDay: () => void;
  setDeductionSolved: (solved: boolean) => void;
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

  const setNickname = useCallback((nickname: string) => {
    setState((prev) => ({ ...prev, nickname }));
  }, []);

  const setAvatar = useCallback((dataUrl: string | null) => {
    setState((prev) => ({ ...prev, avatarDataUrl: dataUrl }));
  }, []);

  const adjustStat = useCallback((key: keyof PlayerStats, delta: number) => {
    setState((prev) => ({ ...prev, stats: { ...prev.stats, [key]: clamp(prev.stats[key] + delta) } }));
  }, []);

  const advanceDay = useCallback(() => {
    setState((prev) => ({ ...prev, currentDay: Math.min(5, prev.currentDay + 1) }));
  }, []);

  const setDeductionSolved = useCallback((solved: boolean) => {
    setState((prev) => ({ ...prev, deductionSolved: solved }));
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
    setNickname,
    setAvatar,
    adjustStat,
    advanceDay,
    setDeductionSolved,
    resetPlayer,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
