import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createAccount, verifyAccount } from '../firebase/accounts';
import { createPlayerRecord, getPlayerOnce, listenPlayer, submitProfile, submitTestResult } from '../firebase/players';
import type { HouseId } from '../data/sortingTest';

export interface PlayerStats {
  hp: number;
  intelligence: number;
  stamina: number;
  spellPower: number;
}

interface PlayerState {
  username: string;
  nickname: string;
  grade: number | null;
  avatarDataUrl: string | null;
  houseId: string | null;
  joinedAt: number | null;
  playerId: string | null;
  testScores: Record<HouseId, number> | null;
  computedHouse: HouseId | null;
  stats: PlayerStats;
  currentDay: number;
  deductionSolved: boolean;
}

const STORAGE_KEY = 'arcanum-player';
const SEEN_ASSIGNMENT_PREFIX = 'arcanum-assignment-seen-';
const ADMIN_KEY = 'arcanum-admin-unlocked';
const ADMIN_USERNAME = 'admin';
const ADMIN_NICKNAME = '호그와트';
const ADMIN_ZERO_SCORES: Record<HouseId, number> = { flame: 0, moonlight: 0, earth: 0, wind: 0 };

const defaultStats: PlayerStats = { hp: 100, intelligence: 50, stamina: 50, spellPower: 50 };

const emptyState: PlayerState = {
  username: '',
  nickname: '',
  grade: null,
  avatarDataUrl: null,
  houseId: null,
  joinedAt: null,
  playerId: null,
  testScores: null,
  computedHouse: null,
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

export type OnboardingStage = 'account' | 'test' | 'profile' | 'done';

interface GameContextValue extends PlayerState {
  hasEntered: boolean;
  stage: OnboardingStage;
  assignedHouse: HouseId | null;
  justAssigned: boolean;
  isAdmin: boolean;
  unlockAdmin: () => void;
  clearJustAssigned: () => void;
  signUp: (username: string, password: string) => Promise<'ok' | 'taken'>;
  logIn: (username: string, password: string) => Promise<'ok' | 'not-found' | 'wrong-password'>;
  submitTest: (testScores: Record<HouseId, number>, computedHouse: HouseId) => Promise<void>;
  completeProfile: (nickname: string, grade: number) => Promise<void>;
  adminEnter: () => Promise<void>;
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
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(ADMIN_KEY) === 'true');
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

  const stage: OnboardingStage = !state.playerId ? 'account' : !state.testScores ? 'test' : !state.nickname ? 'profile' : 'done';

  const signUp = useCallback(async (username: string, password: string) => {
    const playerId = crypto.randomUUID();
    const result = await createAccount(username, password, playerId);
    if (!result.ok) return 'taken' as const;
    await createPlayerRecord(playerId, username.trim());
    setState((prev) => ({ ...prev, username: username.trim(), playerId, joinedAt: prev.joinedAt ?? Date.now() }));
    return 'ok' as const;
  }, []);

  const logIn = useCallback(async (username: string, password: string) => {
    const result = await verifyAccount(username, password);
    if (!result.ok) return result.reason;
    const player = await getPlayerOnce(result.playerId);
    setState((prev) => ({
      ...prev,
      username: username.trim(),
      playerId: result.playerId,
      nickname: player?.nickname ?? '',
      grade: player?.grade ?? null,
      testScores: player?.testScores ?? null,
      computedHouse: player?.computedHouse ?? null,
      houseId: player?.assignedHouse ?? prev.houseId,
      joinedAt: prev.joinedAt ?? Date.now(),
    }));
    return 'ok' as const;
  }, []);

  const submitTest = useCallback(async (testScores: Record<HouseId, number>, computedHouse: HouseId) => {
    const playerId = playerIdRef.current;
    if (!playerId) return;
    await submitTestResult(playerId, testScores, computedHouse);
    setState((prev) => ({ ...prev, testScores, computedHouse }));
  }, []);

  const completeProfile = useCallback(async (nickname: string, grade: number) => {
    const playerId = playerIdRef.current;
    if (!playerId) return;
    await submitProfile(playerId, nickname, grade);
    setState((prev) => ({ ...prev, nickname, grade }));
  }, []);

  const adminEnter = useCallback(async () => {
    const playerId = crypto.randomUUID();
    await createPlayerRecord(playerId, ADMIN_USERNAME);
    await submitTestResult(playerId, ADMIN_ZERO_SCORES, 'moonlight');
    await submitProfile(playerId, ADMIN_NICKNAME, 12);
    setState((prev) => ({
      ...prev,
      username: ADMIN_USERNAME,
      playerId,
      nickname: ADMIN_NICKNAME,
      testScores: ADMIN_ZERO_SCORES,
      computedHouse: 'moonlight',
      grade: 12,
      joinedAt: prev.joinedAt ?? Date.now(),
    }));
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

  const unlockAdmin = useCallback(() => {
    sessionStorage.setItem(ADMIN_KEY, 'true');
    setIsAdmin(true);
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
    stage,
    assignedHouse,
    justAssigned,
    isAdmin,
    unlockAdmin,
    clearJustAssigned,
    signUp,
    logIn,
    submitTest,
    completeProfile,
    adminEnter,
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
