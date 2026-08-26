export type StatusType =
  | 'burn'
  | 'bleed'
  | 'stun'
  | 'weaken'
  | 'vulnerable'
  | 'slow'
  | 'poison'
  | 'daze'
  | 'intBoost'
  | 'agiBoost'
  | 'agiDown'
  | 'critBoost'
  | 'followAttack'
  | 'regenHp'
  | 'regenMp'
  | 'charm'
  | 'confuse';

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

// ---------- skills ----------

/** The fixed combat skills every player has access to; only their level (via skill points) differs per player. */
export type SkillId =
  | 'personalAttack'
  | 'aoeAttack'
  | 'personalDefense'
  | 'aoeDefense'
  | 'personalHeal'
  | 'aoeHeal'
  | 'personalMpHeal'
  | 'aoeMpHeal'
  | 'finiteIncantatem';

export type SkillTargetType = 'enemy' | 'enemyAll' | 'ally' | 'allyAll';
export type SkillEffectType = 'damage' | 'defense' | 'healHp' | 'healMp' | 'cleanse';

export interface SkillDef {
  id: SkillId;
  name: string;
  description: string;
  targetType: SkillTargetType;
  effectType: SkillEffectType;
  /** Base damage/defense/heal amount at skill level 0 (unlearned/base). */
  baseValue: number;
  /** Added to baseValue per skill level. */
  valuePerLevel: number;
  /** MP cost at skill level 0; decreases per level (see skillMpCostAtLevel in skills.ts) down to a floor of 0. */
  baseMpCost: number;
}

export function emptySkillLevels(): Record<SkillId, number> {
  return {
    personalAttack: 0,
    aoeAttack: 0,
    personalDefense: 0,
    aoeDefense: 0,
    personalHeal: 0,
    aoeHeal: 0,
    personalMpHeal: 0,
    aoeMpHeal: 0,
    finiteIncantatem: 0,
  };
}

// ---------- patronus ----------

export type PatronusId = 'snake' | 'tiger' | 'squirrel' | 'panther' | 'lark' | 'cat' | 'fox' | 'snail' | 'gecko' | 'giraffe' | 'pony' | 'otter';

export interface PatronusDef {
  id: PatronusId;
  name: string;
  effectLabel: string;
  description: string;
  targetType: SkillTargetType;
  baseMpCost: number;
  /** Base damage/heal/buff magnitude — combined with the caster's spellPower like any other skill. */
  baseValue: number;
  statusType: StatusType | null;
  /** Duration in the affected target's own turns (see engine.ts's per-turn status ticking), not global rounds. */
  statusDuration: number;
}

// ---------- player ----------

export interface Player {
  id: string;
  nickname: string;
  hp: number;
  maxHp: number;
  /** Current MP pool; persists across the whole expedition like HP, spent per skill cast. */
  mp: number;
  /** Its own resource, decoupled from any stat — starts at the profile's real maxMp (base 100) and only grows from forest-clear rewards, same as maxHp/maxStamina. */
  maxMp: number;
  /** Drives skill accuracy (vs. the target's evasion/defense DC) — see skills.ts. */
  intelligence: number;
  /** Drives skill damage/heal/support magnitude. */
  spellPower: number;
  /** Drives evasion against enemy attacks and the effectiveness of defense skills. */
  agility: number;
  /** The player's real (non-forest) profile spell power at the moment they joined — a stable snapshot (never touched by in-run buffs/debuffs, unlike spellPower above) used together with profileIntelligence/profileAgility to scale monster strength in later stages. */
  profileSpellPower: number;
  /** Same idea as profileSpellPower, but for intelligence. */
  profileIntelligence: number;
  /** Same idea as profileSpellPower, but for agility. */
  profileAgility: number;
  skillPoints: number;
  skillLevels: Record<SkillId, number>;
  /** Admin-assigned Patronus species; null until an admin sets one. */
  patronus: PatronusId | null;
  statusEffects: StatusEffect[];
  shield: number;
  buffs: PlayerBuffs;
  downed: boolean;
  ready: boolean;
}

export function createPlayer(
  id: string,
  nickname: string,
  patronus: PatronusId | null = null,
  profileSpellPower = 0,
  profileIntelligence = 0,
  profileAgility = 0,
  savedSkillLevels: Record<SkillId, number> | null = null,
  savedSkillPoints = 0,
  profileMaxMp = 100,
): Player {
  // In-combat intelligence/spellPower/agility mirror the player's real profile stats at join time —
  // a player who built up 지능 300 on their profile fights the forest with 지능 300, not a fresh
  // baseline. Floored at 5 so a brand-new profile (or a device that hasn't synced stats yet) doesn't
  // start combat at 0.
  const intelligence = Math.max(5, profileIntelligence);
  const spellPower = Math.max(5, profileSpellPower);
  const agility = Math.max(5, profileAgility);
  const maxMp = Math.max(1, profileMaxMp);
  return {
    id,
    nickname,
    hp: 100,
    maxHp: 100,
    mp: maxMp,
    maxMp,
    intelligence,
    spellPower,
    agility,
    profileSpellPower,
    profileIntelligence,
    profileAgility,
    // Carried over from the player's profile so leveling a skill in one expedition keeps it leveled
    // in the next — the party doc these live in gets wiped once everyone leaves, so the profile is
    // the one place this survives (see syncForestSkills in firebase/players.ts).
    skillPoints: savedSkillPoints,
    skillLevels: savedSkillLevels ?? emptySkillLevels(),
    patronus,
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

export type EventCategory = 'heal' | 'spellPower' | 'intelligence' | 'agility' | 'buff' | 'hint' | 'monster' | 'eliteMonster' | 'trap' | 'penalty' | 'partyChoice' | 'riskyChoice' | 'special' | 'neutral';

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
  agility?: number;
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
  /** Set once, exactly when status first becomes 'cleared'/'failed' — unlike updatedAt (which changes
   * every time any one seated player leaves the result screen while others linger on it), this stays
   * fixed for the whole terminal state, so the one-time clear reward/stamina-cost effects in
   * ForestPage.tsx can key off it without re-firing on every teammate's departure. */
  resultAt: number | null;
}
