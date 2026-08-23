import { HERBS_BY_RARITY, herbById } from './herbs';
import type { FarmSlot, HarvestResult, Herb, HerbFarmState, HerbRarity } from './types';

export const INITIAL_SLOTS = 4;

const EARLY_WEIGHTS: Record<HerbRarity, number> = { 1: 0.7, 2: 0.22, 3: 0.06, 4: 0.018, 5: 0.002 };
const LATE_WEIGHTS: Record<HerbRarity, number> = { 1: 0.5, 2: 0.3, 3: 0.13, 4: 0.05, 5: 0.02 };
const PROGRESS_DEX_COUNT = 40; // dex entries at which rarity odds fully shift to "late game"

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function rarityWeights(dexCount: number): Record<HerbRarity, number> {
  const t = Math.max(0, Math.min(1, dexCount / PROGRESS_DEX_COUNT));
  const weights = {} as Record<HerbRarity, number>;
  for (let r = 1; r <= 5; r++) {
    const rarity = r as HerbRarity;
    weights[rarity] = lerp(EARLY_WEIGHTS[rarity], LATE_WEIGHTS[rarity], t);
  }
  return weights;
}

export function pickRarity(dexCount: number, rng: () => number = Math.random): HerbRarity {
  const weights = rarityWeights(dexCount);
  const total = weights[1] + weights[2] + weights[3] + weights[4] + weights[5];
  let roll = rng() * total;
  for (let r = 1; r <= 5; r++) {
    const rarity = r as HerbRarity;
    roll -= weights[rarity];
    if (roll <= 0) return rarity;
  }
  return 5;
}

export function pickRandomHerb(dexCount: number, rng: () => number = Math.random): Herb {
  const pool = HERBS_BY_RARITY[pickRarity(dexCount, rng)];
  return pool[Math.floor(rng() * pool.length)];
}

export function createFarm(playerId: string): HerbFarmState {
  return {
    playerId,
    slots: Array.from({ length: INITIAL_SLOTS }, (_, i) => ({ slotId: i, herbId: null, plantedAt: null, harvestAt: null })),
    dex: {},
  };
}

export function dexCount(state: HerbFarmState): number {
  return Object.keys(state.dex).length;
}

export function isReady(slot: FarmSlot, now: number): boolean {
  return slot.herbId !== null && slot.harvestAt !== null && now >= slot.harvestAt;
}

export function growthProgress(slot: FarmSlot, now: number): number {
  if (!slot.herbId || slot.plantedAt === null || slot.harvestAt === null) return 0;
  const total = slot.harvestAt - slot.plantedAt;
  if (total <= 0) return 1;
  return Math.max(0, Math.min(1, (now - slot.plantedAt) / total));
}

export function remainingSeconds(slot: FarmSlot, now: number): number {
  if (!slot.harvestAt) return 0;
  return Math.max(0, Math.round((slot.harvestAt - now) / 1000));
}

export function plantSlot(state: HerbFarmState, slotId: number, now: number, rng: () => number = Math.random): HerbFarmState {
  const slot = state.slots.find((s) => s.slotId === slotId);
  if (!slot) throw new Error('존재하지 않는 슬롯입니다.');
  if (slot.herbId !== null) throw new Error('이미 무언가 자라고 있는 슬롯입니다.');

  const herb = pickRandomHerb(dexCount(state), rng);
  const nextSlot: FarmSlot = { slotId, herbId: herb.id, plantedAt: now, harvestAt: now + herb.growthTime * 1000 };
  return { ...state, slots: state.slots.map((s) => (s.slotId === slotId ? nextSlot : s)) };
}

export function harvestSlot(state: HerbFarmState, slotId: number, now: number): { state: HerbFarmState; result: HarvestResult } {
  const slot = state.slots.find((s) => s.slotId === slotId);
  if (!slot || !slot.herbId) throw new Error('수확할 약초가 없습니다.');
  if (!isReady(slot, now)) throw new Error('아직 다 자라지 않았습니다.');

  const herb = herbById(slot.herbId);
  if (!herb) throw new Error('알 수 없는 약초입니다.');

  const isNewDiscovery = !(herb.id in state.dex);
  const nextDex = isNewDiscovery ? { ...state.dex, [herb.id]: now } : state.dex;
  const nextState: HerbFarmState = {
    ...state,
    slots: state.slots.map((s) => (s.slotId === slotId ? { slotId, herbId: null, plantedAt: null, harvestAt: null } : s)),
    dex: nextDex,
  };

  return { state: nextState, result: { herb, healAmount: herb.healAmount, mpAmount: herb.mpAmount, staminaAmount: herb.staminaAmount, isNewDiscovery } };
}

export function harvestAllReady(state: HerbFarmState, now: number): { state: HerbFarmState; results: HarvestResult[] } {
  let current = state;
  const results: HarvestResult[] = [];
  for (const slot of state.slots) {
    if (isReady(slot, now)) {
      const { state: next, result } = harvestSlot(current, slot.slotId, now);
      current = next;
      results.push(result);
    }
  }
  return { state: current, results };
}
