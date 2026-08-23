export type SpellCategory = 'attack' | 'aoeAttack' | 'defense' | 'aoeDefense' | 'heal' | 'aoeHeal';

export interface Spell {
  id: string;
  name: string;
  category: SpellCategory;
  dc: number;
  power: number;
  description: string;
  statusOnHit?: StatusType;
  statusChance?: number;
  statusValue?: number;
  statusTurns?: number;
}

export type StatusType = 'burn' | 'bleed' | 'stun' | 'weaken' | 'vulnerable' | 'slow';

export interface StatusEffect {
  type: StatusType;
  turnsLeft: number;
  value: number;
}

export interface PlayerBuffs {
  nextAttackBoost: boolean;
  nextHealBoost: boolean;
  nextDefenseBoost: boolean;
  nextAdvantage: boolean;
  combatSpellPowerBonus: number;
  combatDamageBonusPct: number;
  combatDamageReductionPct: number;
  combatCritThresholdBonus: number;
  nextAttackNullified: boolean;
  nextDcReduction: number;
  nextAttackHitsAll: boolean;
  nextShieldDouble: boolean;
  firstStrikeNextCombat: boolean;
  revealNextPaths: boolean;
}

export function emptyBuffs(): PlayerBuffs {
  return {
    nextAttackBoost: false,
    nextHealBoost: false,
    nextDefenseBoost: false,
    nextAdvantage: false,
    combatSpellPowerBonus: 0,
    combatDamageBonusPct: 0,
    combatDamageReductionPct: 0,
    combatCritThresholdBonus: 0,
    nextAttackNullified: false,
    nextDcReduction: 0,
    nextAttackHitsAll: false,
    nextShieldDouble: false,
    firstStrikeNextCombat: false,
    revealNextPaths: false,
  };
}

export interface Player {
  id: string;
  nickname: string;
  hp: number;
  maxHp: number;
  /** Drives spell damage — see spellDamageBonus() in spells.ts. */
  spellPower: number;
  defense: number;
  /** Drives spell accuracy and max MP — see maxMpFor()/spellHitBonus() in spells.ts. */
  intelligence: number;
  /** Current MP pool; persists across the whole expedition like HP, spent per spell cast. */
  mp: number;
  skillPoints: number;
  spellLevels: Record<string, number>;
  statusEffects: StatusEffect[];
  shield: number;
  buffs: PlayerBuffs;
  downed: boolean;
  ready: boolean;
}

export function createPlayer(id: string, nickname: string): Player {
  return {
    id,
    nickname,
    hp: 100,
    maxHp: 100,
    spellPower: 5,
    defense: 5,
    intelligence: 5,
    mp: 30, // baseline intelligence(5) via maxMpFor() in spells.ts — reset properly once the expedition starts
    skillPoints: 0,
    spellLevels: {},
    statusEffects: [],
    shield: 0,
    buffs: emptyBuffs(),
    downed: false,
    ready: false,
  };
}

export type AbilityEffect = 'extraDamage' | 'poison' | 'stun' | 'healSelf' | 'buffSelf' | 'aoeDamage' | 'summon' | 'drainHp' | 'fear' | 'weakenParty' | 'shieldSelf' | 'evade';

export interface MonsterAbility {
  effect: AbilityEffect;
  value: number;
  label: string;
}

export interface MonsterTemplate {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 'elite';
  hpMin: number;
  hpMax: number;
  defenseDcMin: number;
  defenseDcMax: number;
  attackMin: number;
  attackMax: number;
  abilities: MonsterAbility[];
}

export interface Monster {
  templateId: string;
  name: string;
  hp: number;
  maxHp: number;
  defenseDC: number;
  attackMin: number;
  attackMax: number;
  abilities: MonsterAbility[];
  statusEffects: StatusEffect[];
  shield: number;
}

export interface BossPhaseAbility {
  effect: AbilityEffect;
  value: number;
  label: string;
}

export interface BossPhase {
  name: string;
  abilities: BossPhaseAbility[];
  abilityChance: number;
}

export interface BossTemplate {
  id: string;
  name: string;
  description: string;
  phases: [BossPhase, BossPhase, BossPhase];
}

export type EventCategory = 'heal' | 'spellPower' | 'intelligence' | 'defense' | 'buff' | 'hint' | 'monster' | 'eliteMonster' | 'trap' | 'penalty' | 'partyChoice' | 'riskyChoice' | 'special' | 'neutral';

export interface ForestEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  rarity: 'common' | 'uncommon' | 'rare';
  minStage: number;
  maxStage: number;
  effect: EventEffect;
}

export interface EventEffect {
  hp?: number;
  maxHp?: number;
  spellPower?: number;
  defense?: number;
  skillPoints?: number;
  intelligence?: number;
  buff?: keyof PlayerBuffs;
  buffValue?: number;
  status?: { type: StatusType; value: number; turns: number };
  triggersMonster?: boolean;
  triggersEliteMonster?: boolean;
  triggersTrap?: { dc: number; failHp: number; failStatus?: StatusType };
  hint?: boolean;
  targetLowestHp?: boolean;
  riskyCheck?: { dc: number; successBonus: EventEffect; failPenalty: EventEffect };
}

export type PartyStatus = 'lobby' | 'exploring' | 'event' | 'combat' | 'cleared' | 'failed';

export interface PathChoice {
  label: string;
  eventId: string;
  revealedCategory?: string;
}

export interface LogEntry {
  stage: number;
  text: string;
  at: number;
}

export interface CombatantRef {
  kind: 'monster';
  index: number;
}

export interface CombatState {
  isBoss: boolean;
  bossId?: string;
  phaseIndex?: number;
  monsters: Monster[];
  turnOrder: string[];
  turnIndex: number;
  round: number;
  log: LogEntry[];
}

export interface ExpeditionResult {
  outcome: 'clear' | 'failed';
  bossName: string | null;
  stagesCleared: number;
  monstersDefeated: number;
  spellsCast: number;
  healingDone: number;
  damageTaken: number;
  bonusesGained: number;
}

export interface ForestParty {
  status: PartyStatus;
  seats: (Player | null)[];
  hostId: string | null;
  stage: number;
  usedEventIds: string[];
  usedBossIds: string[];
  recentCategories: EventCategory[];
  paths: PathChoice[] | null;
  votes: Record<string, number>;
  votingEndsAt: number | null;
  voteTieOptions: number[] | null;
  lastVoteResult: { pathLabel: string; tally: { label: string; count: number }[]; chosenIndex: number } | null;
  currentEventId: string | null;
  combat: CombatState | null;
  log: LogEntry[];
  result: ExpeditionResult | null;
  stats: { monstersDefeated: number; spellsCast: number; healingDone: number; damageTaken: number; bonusesGained: number };
  updatedAt: number;
}
