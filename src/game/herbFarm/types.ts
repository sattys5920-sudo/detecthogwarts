export type HerbRarity = 1 | 2 | 3 | 4 | 5;

export interface Herb {
  id: string;
  name: string;
  rarity: HerbRarity;
  growthTime: number; // seconds
  healAmount: number;
  mpAmount: number;
  staminaAmount: number;
  description: string;
}

export interface FarmSlot {
  slotId: number;
  herbId: string | null;
  plantedAt: number | null;
  harvestAt: number | null;
}

export interface DexEntry {
  herbId: string;
  discoveredAt: number;
}

export interface HerbFarmState {
  playerId: string;
  slots: FarmSlot[];
  dex: Record<string, number>; // herbId -> discoveredAt
}

export interface HarvestResult {
  herb: Herb;
  healAmount: number;
  mpAmount: number;
  staminaAmount: number;
  isNewDiscovery: boolean;
}
