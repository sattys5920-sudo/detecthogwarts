import { BOSS_TEMPLATES, bossPhaseIndex, spawnBoss, templateByBossId } from './bosses';
import { MONSTER_TEMPLATES, randomTemplateForStage, spawnMonster, templateById } from './creatures';
import { eventById, FOREST_EVENTS } from './events';
import { patronusById } from './patronus';
import { maxMpFor, MP_PER_INTELLIGENCE, skillById, skillMpCostAtLevel, skillValueAtLevel, SKILLS } from './skills';
import {
  createPlayer,
  emptyBuffs,
  type CombatState,
  type EventCategory,
  type ForestEvent,
  type ForestParty,
  type LogEntry,
  type Monster,
  type MonsterTemplate,
  type PatronusId,
  type Player,
  type SkillId,
  type StatusType,
} from './types';

export const TOTAL_STAGES = 10;
export const MAX_SEATS = 4;
export const VOTE_DURATION_MS = 3 * 60_000;

function now() {
  return Date.now();
}

function mkLog(stage: number, text: string): LogEntry {
  return { stage, text, at: now() };
}

function pushLog(party: ForestParty, text: string): ForestParty {
  return { ...party, log: [...party.log, mkLog(party.stage, text)].slice(-60) };
}

// ---------- dice ----------

export interface CheckResult {
  roll: number;
  total: number;
  dc: number;
  success: boolean;
  crit: boolean;
  fumble: boolean;
}

function d20(): number {
  return 1 + Math.floor(Math.random() * 20);
}

export function check(bonus: number, dc: number, advantage = false, critThresholdBonus = 0): CheckResult {
  const r1 = d20();
  const roll = advantage ? Math.max(r1, d20()) : r1;
  const total = roll + bonus;
  const critAt = 20 - critThresholdBonus;
  return { roll, total, dc, success: total >= dc || roll >= critAt, crit: roll >= critAt, fumble: roll === 1 };
}

// ---------- party / lobby ----------

export function createParty(): ForestParty {
  return {
    status: 'lobby',
    seats: [null, null, null, null],
    hostId: null,
    stage: 1,
    usedEventIds: [],
    usedBossIds: [],
    recentCategories: [],
    paths: null,
    votes: {},
    votingEndsAt: null,
    voteTieOptions: null,
    lastVoteResult: null,
    currentEventId: null,
    combat: null,
    log: [],
    result: null,
    stats: { monstersDefeated: 0, spellsCast: 0, healingDone: 0, damageTaken: 0, bonusesGained: 0 },
    updatedAt: now(),
  };
}

export function seatedPlayer(party: ForestParty, playerId: string): Player | null {
  return party.seats.find((p) => p?.id === playerId) ?? null;
}

export function partySize(party: ForestParty): number {
  return party.seats.filter((p): p is Player => p !== null).length;
}

export class ForestFullError extends Error {
  constructor() {
    super('탐사 인원이 가득 찼습니다.');
  }
}

export function joinSeat(party: ForestParty, playerId: string, nickname: string, patronus: PatronusId | null = null): ForestParty {
  if (seatedPlayer(party, playerId)) return party;
  if (party.status !== 'lobby') throw new ForestFullError();
  const idx = party.seats.findIndex((s) => s === null);
  if (idx === -1) throw new ForestFullError();
  const seats = [...party.seats];
  seats[idx] = createPlayer(playerId, nickname || '이름 없음', patronus);
  return { ...party, seats, hostId: party.hostId ?? playerId, updatedAt: now() };
}

export function leaveSeat(party: ForestParty, playerId: string): ForestParty {
  if (party.status !== 'lobby') return party;
  const seats = party.seats.map((s) => (s?.id === playerId ? null : s)) as ForestParty['seats'];
  const stillHost = seats.some((s) => s?.id === party.hostId);
  return { ...party, seats, hostId: stillHost ? party.hostId : (seats.find((s) => s)?.id ?? null), updatedAt: now() };
}

export function setReady(party: ForestParty, playerId: string, ready: boolean): ForestParty {
  if (party.status !== 'lobby') return party;
  const seats = party.seats.map((s) => (s?.id === playerId ? { ...s, ready } : s)) as ForestParty['seats'];
  return { ...party, seats, updatedAt: now() };
}

export function allSeatsReady(party: ForestParty): boolean {
  return partySize(party) >= 2 && party.seats.every((s) => !s || s.ready);
}

export function resetParty(): ForestParty {
  return createParty();
}

// ---------- path / event generation ----------

const PATH_FLAVORS = [
  '달빛이 비치는 길', '안개가 깔린 길', '부러진 나무가 있는 길', '희미한 푸른빛이 보이는 길', '나무가 빽빽한 길',
  '물소리가 들리는 길', '은빛 꽃이 피어 있는 길', '무언가 긁힌 흔적이 있는 길', '검은 안개가 흐르는 길', '거미줄이 늘어진 길',
  '이끼로 뒤덮인 길', '오래된 발자국이 이어진 길', '희미하게 노랫소리가 들리는 길', '뒤틀린 나무뿌리가 뒤엉킨 길', '반딧불이 떠다니는 길',
  '차가운 바람이 부는 길', '낙엽이 두껍게 쌓인 길', '갈라진 바위 사이의 길', '별빛이 새어드는 길', '유난히 조용한 길',
];

function partyAverageHpPct(party: ForestParty): number {
  const alive = party.seats.filter((p): p is Player => p !== null);
  if (alive.length === 0) return 1;
  return alive.reduce((sum, p) => sum + p.hp / p.maxHp, 0) / alive.length;
}

function categoryWeight(category: EventCategory, hpPct: number, recentCategories: EventCategory[]): number {
  let w = 1;
  const goodCategories: EventCategory[] = ['heal', 'spellPower', 'intelligence', 'agility', 'buff', 'special'];
  const dangerCategories: EventCategory[] = ['monster', 'eliteMonster', 'trap', 'penalty', 'riskyChoice'];

  if (hpPct <= 0.3) {
    if (category === 'heal') w *= 3;
    if (category === 'eliteMonster') w *= 0.2;
    if (category === 'penalty' || category === 'trap') w *= 0.5;
  } else if (hpPct >= 0.9) {
    if (category === 'heal') w *= 0.3;
    if (category === 'monster' || category === 'eliteMonster') w *= 1.5;
  }

  const recentSameStreak = recentCategories.slice(-2).filter((c) => c === category).length;
  if (recentSameStreak >= 2) w *= 0.25;

  void goodCategories;
  void dangerCategories;
  return Math.max(0.02, w);
}

function pickWeightedEvents(party: ForestParty, count: number): ForestEvent[] {
  const hpPct = partyAverageHpPct(party);
  const usedSet = new Set(party.usedEventIds);
  let pool = FOREST_EVENTS.filter((e) => !usedSet.has(e.id) && party.stage >= e.minStage && party.stage <= e.maxStage);
  if (pool.length < count) {
    // event pool running low — allow reuse of the least-recently-used events rather than blocking progress
    pool = FOREST_EVENTS.filter((e) => party.stage >= e.minStage && party.stage <= e.maxStage);
  }

  const picked: ForestEvent[] = [];
  const localRecent = [...party.recentCategories];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const weights = pool.map((e) => categoryWeight(e.category, hpPct, localRecent));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < weights.length; idx++) {
      r -= weights[idx];
      if (r <= 0) break;
    }
    idx = Math.min(idx, pool.length - 1);
    const chosen = pool[idx];
    picked.push(chosen);
    localRecent.push(chosen.category);
    pool = pool.filter((_, i2) => i2 !== idx);
  }
  return picked;
}

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  heal: '회복', spellPower: '주문력 강화', intelligence: '지능 강화', agility: '민첩 강화', buff: '일시적 강화',
  hint: '단서', monster: '몬스터 조우', eliteMonster: '강력한 몬스터', trap: '함정', penalty: '위험',
  partyChoice: '동료 관련', riskyChoice: '위험한 선택', special: '특별한 발견', neutral: '평범한 길',
};

/** Buff/debuff/neutral classification for each event category, for a quick at-a-glance tag on reveal. */
export const EVENT_TONE: Record<EventCategory, 'good' | 'bad' | 'risk' | 'neutral'> = {
  heal: 'good', spellPower: 'good', intelligence: 'good', agility: 'good', buff: 'good', special: 'good', partyChoice: 'good',
  penalty: 'bad', trap: 'bad', monster: 'bad', eliteMonster: 'bad',
  riskyChoice: 'risk',
  hint: 'neutral', neutral: 'neutral',
};

export function generatePaths(party: ForestParty): ForestParty {
  const events = pickWeightedEvents(party, 3);
  const usedFlavors = new Set<number>();
  const reveal = party.seats.some((p) => p?.buffs.revealNextPaths);
  const paths = events.map((e) => {
    let fi = Math.floor(Math.random() * PATH_FLAVORS.length);
    while (usedFlavors.has(fi)) fi = Math.floor(Math.random() * PATH_FLAVORS.length);
    usedFlavors.add(fi);
    return { label: PATH_FLAVORS[fi], eventId: e.id, ...(reveal ? { revealedCategory: CATEGORY_LABEL[e.category] } : {}) };
  });
  let next: ForestParty = {
    ...party,
    status: 'exploring',
    paths,
    votes: {},
    votingEndsAt: now() + VOTE_DURATION_MS,
    voteTieOptions: null,
    lastVoteResult: null,
    currentEventId: null,
    updatedAt: now(),
  };
  if (reveal) {
    next = applyToAllSeats(next, (p) => ({ ...p, buffs: { ...p.buffs, revealNextPaths: false } }));
    next = pushLog(next, '단서 덕분에 갈림길의 정체를 미리 엿보았다.');
  }
  return next;
}

export function startExpedition(party: ForestParty): ForestParty {
  if (party.status !== 'lobby') return party;
  if (partySize(party) < 2) throw new Error('최소 2 명이 필요합니다.');
  if (!allSeatsReady(party)) throw new Error('모든 인원이 준비를 완료해야 합니다.');
  const seats = party.seats.map((s) =>
    s ? { ...s, hp: s.maxHp, mp: maxMpFor(s.intelligence), statusEffects: [], shield: 0, buffs: emptyBuffs(), downed: false, ready: false } : s,
  ) as ForestParty['seats'];
  let next: ForestParty = {
    ...party,
    seats,
    status: 'exploring',
    stage: 1,
    usedEventIds: [],
    recentCategories: [],
    combat: null,
    result: null,
    log: [],
    stats: { monstersDefeated: 0, spellsCast: 0, healingDone: 0, damageTaken: 0, bonusesGained: 0 },
    updatedAt: now(),
  };
  next = pushLog(next, '금지된 숲에 발을 들였다...');
  next = generatePaths(next);
  return next;
}

// ---------- applying event effects ----------

function clampHp(p: Player): Player {
  return { ...p, hp: Math.max(0, Math.min(p.maxHp, p.hp)) };
}

function applyHpDelta(party: ForestParty, delta: number, targetLowestHp: boolean): ForestParty {
  const alive = party.seats.filter((p): p is Player => p !== null && !p.downed);
  if (alive.length === 0) return party;
  let targets: Player[];
  if (targetLowestHp) {
    const lowest = alive.reduce((a, b) => (a.hp / a.maxHp <= b.hp / b.maxHp ? a : b));
    targets = [lowest];
  } else {
    targets = delta < 0 ? alive : alive; // both heal & damage from exploration events hit the whole active party
  }
  const targetIds = new Set(targets.map((t) => t.id));
  const seats = party.seats.map((p) => {
    if (!p || !targetIds.has(p.id)) return p;
    return clampHp({ ...p, hp: p.hp + delta });
  }) as ForestParty['seats'];
  const stats = delta < 0 ? { ...party.stats, damageTaken: party.stats.damageTaken - delta } : { ...party.stats, healingDone: party.stats.healingDone + delta, bonusesGained: party.stats.bonusesGained };
  return { ...party, seats, stats };
}

function applyToAllSeats(party: ForestParty, fn: (p: Player) => Player): ForestParty {
  const seats = party.seats.map((p) => (p ? fn(p) : p)) as ForestParty['seats'];
  return { ...party, seats };
}

function applyBuffToAll(party: ForestParty, buff: keyof Player['buffs'], value: number): ForestParty {
  return applyToAllSeats(party, (p) => {
    const buffs = { ...p.buffs };
    if (typeof buffs[buff] === 'boolean') (buffs[buff] as unknown as boolean) = true;
    else (buffs[buff] as unknown as number) = value;
    return { ...p, buffs };
  });
}

function applyStatusToAll(party: ForestParty, type: StatusType, value: number, turns: number): ForestParty {
  return applyToAllSeats(party, (p) => ({ ...p, statusEffects: [...p.statusEffects, { type, value, turnsLeft: turns }] }));
}

export function resolveCurrentPath(party: ForestParty, choiceIndex: number): ForestParty {
  if (party.status !== 'exploring' || !party.paths) return party;
  const choice = party.paths[choiceIndex];
  if (!choice) return party;
  const event = eventById(choice.eventId);

  const seatedIds = party.seats.filter((p): p is Player => p !== null).map((p) => p.id);
  const tally = party.paths.map((p, i) => ({ label: p.label, count: seatedIds.filter((id) => party.votes[id] === i).length }));

  let next: ForestParty = {
    ...party,
    status: 'event',
    currentEventId: event.id,
    usedEventIds: [...party.usedEventIds, event.id],
    recentCategories: [...party.recentCategories, event.category].slice(-6),
    paths: null,
    votes: {},
    votingEndsAt: null,
    lastVoteResult: { pathLabel: choice.label, tally, chosenIndex: choiceIndex },
    voteTieOptions: null,
  };
  next = pushLog(next, `[${party.stage} 단계] ${choice.label} → ${event.title}`);

  const eff = event.effect;

  if (eff.riskyCheck) {
    const bestSpellPower = Math.max(0, ...next.seats.filter((p): p is Player => !!p && !p.downed).map((p) => p.spellPower));
    const res = check(bestSpellPower, eff.riskyCheck.dc);
    if (res.success) {
      next = applyPlainEffect(next, eff.riskyCheck.successBonus);
      next = pushLog(next, `위험을 감수한 판정 성공! (D20 ${res.roll} + ${bestSpellPower} = ${res.total} / DC ${res.dc})`);
    } else {
      next = applyPlainEffect(next, eff.riskyCheck.failPenalty);
      next = pushLog(next, `판정 실패... (D20 ${res.roll} + ${bestSpellPower} = ${res.total} / DC ${res.dc})`);
    }
    return next;
  }

  if (eff.triggersTrap) {
    const bestAgility = Math.max(0, ...next.seats.filter((p): p is Player => !!p && !p.downed).map((p) => p.agility));
    const res = check(bestAgility, eff.triggersTrap.dc);
    if (!res.success) {
      next = applyHpDelta(next, -eff.triggersTrap.failHp, false);
      next = pushLog(next, `함정에 걸렸다! 파티 전체 HP -${eff.triggersTrap.failHp} (D20 ${res.roll} + 민첩 ${bestAgility} / DC ${res.dc})`);
    } else {
      next = pushLog(next, `함정을 무사히 피했다! (D20 ${res.roll} + 민첩 ${bestAgility} / DC ${res.dc})`);
    }
    return next;
  }

  if (eff.triggersMonster) {
    const count = pickEnemyCount(partySize(next));
    const templates = Array.from({ length: count }, () => randomTemplateForStage(next.stage, false));
    return beginCombat(next, templates, false);
  }
  if (eff.triggersEliteMonster) {
    const template = randomTemplateForStage(next.stage, true);
    return beginCombat(next, [template], false);
  }

  return applyPlainEffect(next, eff);
}

/** Returns which choice index(es) currently have the most votes among the given voter ids. Multiple entries mean a tie. Empty means nobody voted. */
function voteLeaders(votes: Record<string, number>, voterIds: string[]): number[] {
  const counts = new Map<number, number>();
  for (const id of voterIds) {
    if (!(id in votes)) continue;
    counts.set(votes[id], (counts.get(votes[id]) ?? 0) + 1);
  }
  let topCount = 0;
  let leaders: number[] = [];
  for (const [idx, count] of counts) {
    if (count > topCount) {
      topCount = count;
      leaders = [idx];
    } else if (count === topCount) {
      leaders.push(idx);
    }
  }
  return leaders;
}

/**
 * Casts one seated player's vote for a path choice. Once everyone seated has voted, the
 * majority choice resolves automatically — unless it's a tie, in which case voting locks
 * and the party host is asked to break it (see resolveTie).
 */
export function castVote(party: ForestParty, playerId: string, choiceIndex: number): ForestParty {
  if (party.status !== 'exploring' || !party.paths || party.voteTieOptions) return party;
  if (!seatedPlayer(party, playerId)) return party;
  if (choiceIndex < 0 || choiceIndex >= party.paths.length) return party;

  const votes = { ...party.votes, [playerId]: choiceIndex };
  const seatedIds = party.seats.filter((p): p is Player => p !== null).map((p) => p.id);
  if (!seatedIds.every((id) => id in votes)) {
    return { ...party, votes, updatedAt: now() };
  }

  const leaders = voteLeaders(votes, seatedIds);
  if (leaders.length > 1) {
    return { ...party, votes, voteTieOptions: leaders, updatedAt: now() };
  }
  return resolveCurrentPath({ ...party, votes }, leaders[0]);
}

/** The party host breaks a tie left open by castVote. */
export function resolveTie(party: ForestParty, hostPlayerId: string, choiceIndex: number): ForestParty {
  if (party.status !== 'exploring' || !party.paths || !party.voteTieOptions) return party;
  if (party.hostId !== hostPlayerId) return party;
  if (!party.voteTieOptions.includes(choiceIndex)) return party;
  return resolveCurrentPath(party, choiceIndex);
}

/**
 * Called by any client once the vote countdown has elapsed: resolves whatever votes were
 * cast (majority, or the tie flow above), or defaults to the first path if nobody voted at all.
 */
export function forceResolveVoteTimeout(party: ForestParty): ForestParty {
  if (party.status !== 'exploring' || !party.paths || party.voteTieOptions) return party;
  if (!party.votingEndsAt || now() < party.votingEndsAt) return party;

  const seatedIds = party.seats.filter((p): p is Player => p !== null).map((p) => p.id);
  const leaders = voteLeaders(party.votes, seatedIds);
  if (leaders.length === 0) return resolveCurrentPath(party, 0);
  if (leaders.length > 1) {
    return { ...party, voteTieOptions: leaders, updatedAt: now() };
  }
  return resolveCurrentPath(party, leaders[0]);
}

function applyPlainEffect(party: ForestParty, eff: ForestEvent['effect']): ForestParty {
  let next = party;
  if (eff.hp) next = applyHpDelta(next, eff.hp, Boolean(eff.targetLowestHp));
  if (eff.maxHp) {
    next = applyToAllSeats(next, (p) => ({ ...p, maxHp: p.maxHp + eff.maxHp!, hp: p.hp + eff.maxHp! }));
  }
  if (eff.spellPower) next = applyToAllSeats(next, (p) => ({ ...p, spellPower: Math.max(1, p.spellPower + eff.spellPower!) }));
  if (eff.agility) next = applyToAllSeats(next, (p) => ({ ...p, agility: Math.max(0, p.agility + eff.agility!) }));
  if (eff.intelligence) {
    next = applyToAllSeats(next, (p) => ({
      ...p,
      intelligence: Math.max(1, p.intelligence + eff.intelligence!),
      mp: p.mp + eff.intelligence! * MP_PER_INTELLIGENCE,
    }));
  }
  if (eff.skillPoints) {
    next = applyToAllSeats(next, (p) => ({ ...p, skillPoints: p.skillPoints + eff.skillPoints! }));
    next = { ...next, stats: { ...next.stats, bonusesGained: next.stats.bonusesGained + 1 } };
  }
  if (eff.buff) next = applyBuffToAll(next, eff.buff, eff.buffValue ?? 0);
  if (eff.status) next = applyStatusToAll(next, eff.status.type, eff.status.value, eff.status.turns);
  return next;
}

export function confirmEvent(party: ForestParty): ForestParty {
  if (party.status !== 'event') return party;
  let next: ForestParty = { ...party, currentEventId: null };
  if (next.stage >= TOTAL_STAGES) {
    return beginBoss(next);
  }
  next = { ...next, stage: next.stage + 1 };
  return generatePaths(next);
}

// ---------- combat ----------

function combatantKey(kind: 'player' | 'monster', id: string | number) {
  return `${kind}:${id}`;
}

function rollInitiative(spellPower: number) {
  return d20() + Math.floor(spellPower / 2);
}

// ---------- enemy-count difficulty balancing ----------
// Core principle: "1 enemy = one strong individual" vs "4 enemies = several individually weak
// ones" — so the total encounter power stays in a bounded range no matter how many spawn.
// Weighted by party size per the design spec: bigger parties skew toward more (but each
// individually weaker) enemies rather than one very strong one.
const ENEMY_COUNT_WEIGHTS_BY_PARTY: Record<number, [count: number, weight: number][]> = {
  2: [[1, 3], [2, 4], [3, 2], [4, 0.5]],
  3: [[1, 2], [2, 3], [3, 3], [4, 2]],
  4: [[1, 1], [2, 3], [3, 3], [4, 3]],
};

/** Per-enemy share of the total encounter power budget, by how many enemies are in the fight. */
const ENEMY_COUNT_POWER_SHARE: Record<number, number> = { 1: 1, 2: 0.62, 3: 0.46, 4: 0.36 };

function pickEnemyCount(size: number): number {
  const table = ENEMY_COUNT_WEIGHTS_BY_PARTY[Math.min(4, Math.max(2, size))];
  const total = table.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [count, w] of table) {
    r -= w;
    if (r <= 0) return count;
  }
  return table[0][0];
}

function beginCombat(party: ForestParty, templates: MonsterTemplate[], isBoss: boolean, bossId?: string): ForestParty {
  const size = partySize(party);
  const partyHpScale = size === 2 ? 1 : size === 3 ? 1.35 : 1.7;
  const partyAtkScale = size === 2 ? 1 : size === 3 ? 1.15 : 1.3;
  const countShare = ENEMY_COUNT_POWER_SHARE[Math.min(4, Math.max(1, templates.length))] ?? 1;
  const hpScale = partyHpScale * countShare;
  const atkScale = partyAtkScale * countShare;
  const monsters = templates.map((t, i) => {
    const m = spawnMonster(t, hpScale, i);
    return { ...m, attackMin: Math.round(m.attackMin * atkScale), attackMax: Math.round(m.attackMax * atkScale) };
  });

  const alivePlayers = party.seats.filter((p): p is Player => !!p && !p.downed);
  const order: { key: string; init: number }[] = [];
  for (const p of alivePlayers) {
    const first = p.buffs.firstStrikeNextCombat;
    order.push({ key: combatantKey('player', p.id), init: first ? 999 : rollInitiative(p.spellPower) });
  }
  monsters.forEach((_, i) => order.push({ key: combatantKey('monster', i), init: d20() }));
  order.sort((a, b) => b.init - a.init);

  const combat: CombatState = {
    isBoss,
    ...(bossId !== undefined ? { bossId } : {}),
    ...(isBoss ? { phaseIndex: 0 } : {}),
    monsters,
    turnOrder: order.map((o) => o.key),
    turnIndex: 0,
    round: 1,
    log: [],
  };

  let next: ForestParty = { ...party, status: 'combat', combat, paths: null };
  next = applyToAllSeats(next, (p) => ({ ...p, buffs: { ...p.buffs, firstStrikeNextCombat: false } }));
  next = pushLog(next, isBoss ? `보스 전투 시작: ${monsters[0]?.name ?? ''}!` : `전투 발생: ${monsters.map((m) => m.name).join(', ')}`);
  return advanceToActionableTurn(next);
}

function beginBoss(party: ForestParty): ForestParty {
  const unused = BOSS_TEMPLATES.filter((b) => !party.usedBossIds.includes(b.id));
  const pool = unused.length > 0 ? unused : BOSS_TEMPLATES;
  const template = pool[Math.floor(Math.random() * pool.length)];
  const size = partySize(party);
  const boss = spawnBoss(template, size);

  const alivePlayers = party.seats.filter((p): p is Player => !!p && !p.downed);
  const order: { key: string; init: number }[] = [];
  for (const p of alivePlayers) order.push({ key: combatantKey('player', p.id), init: p.buffs.firstStrikeNextCombat ? 999 : rollInitiative(p.spellPower) });
  order.push({ key: combatantKey('monster', 0), init: d20() });
  order.sort((a, b) => b.init - a.init);

  const combat: CombatState = {
    isBoss: true,
    bossId: template.id,
    phaseIndex: 0,
    monsters: [boss],
    turnOrder: order.map((o) => o.key),
    turnIndex: 0,
    round: 1,
    log: [],
  };

  let next: ForestParty = {
    ...party,
    status: 'combat',
    combat,
    paths: null,
    usedBossIds: unused.length > 0 ? [...party.usedBossIds, template.id] : [template.id],
  };
  next = applyToAllSeats(next, (p) => ({ ...p, buffs: { ...p.buffs, firstStrikeNextCombat: false } }));
  next = pushLog(next, `10 단계를 넘어서자 강력한 기운이 느껴진다... ${template.name}이(가) 나타났다!`);
  return advanceToActionableTurn(next);
}

function currentCombatant(party: ForestParty): { kind: 'player' | 'monster'; player?: Player; monsterIndex?: number; monster?: Monster } | null {
  const combat = party.combat;
  if (!combat) return null;
  const key = combat.turnOrder[combat.turnIndex];
  if (!key) return null;
  const [kind, idRaw] = key.split(':');
  if (kind === 'player') {
    const player = party.seats.find((p) => p?.id === idRaw) ?? undefined;
    if (!player || player.hp <= 0) return null;
    return { kind: 'player', player };
  }
  const idx = Number(idRaw);
  const monster = combat.monsters[idx];
  if (!monster || monster.hp <= 0) return null;
  return { kind: 'monster', monsterIndex: idx, monster };
}

function tickStatusStart(
  statusEffects: { type: StatusType; value: number; turnsLeft: number }[],
  hpDelta: (n: number) => void,
  mpDelta: (n: number) => void = () => {},
): { effects: typeof statusEffects; stunned: boolean } {
  let stunned = false;
  const effects: typeof statusEffects = [];
  for (const s of statusEffects) {
    if (s.type === 'burn' || s.type === 'bleed' || s.type === 'poison') hpDelta(-s.value);
    if (s.type === 'regenHp') hpDelta(s.value);
    if (s.type === 'regenMp') mpDelta(s.value);
    if (s.type === 'stun' || s.type === 'daze') stunned = true;
    const turnsLeft = s.turnsLeft - 1;
    if (turnsLeft > 0) effects.push({ ...s, turnsLeft });
  }
  return { effects, stunned };
}

function statusValueSum(effects: { type: StatusType; value: number }[], type: StatusType): number {
  return effects.filter((e) => e.type === type).reduce((sum, e) => sum + e.value, 0);
}

/** Intelligence effective for the current combat, including active buffs (e.g. 다람쥐 Patronus). */
function effectiveIntelligence(p: Player): number {
  return p.intelligence + statusValueSum(p.statusEffects, 'intBoost');
}

/** Agility effective for the current combat, including active buffs/debuffs (e.g. 흑표범/달팽이 Patronus). */
function effectiveAgility(p: Player): number {
  return Math.max(0, p.agility + statusValueSum(p.statusEffects, 'agiBoost') - statusValueSum(p.statusEffects, 'agiDown'));
}

/** Crit threshold bonus effective for the current combat, including active buffs (e.g. 게코 Patronus). Every 5% crit chance ≈ +1 to the d20 crit threshold. */
function effectiveCritThresholdBonus(p: Player): number {
  return p.buffs.combatCritThresholdBonus + Math.round(statusValueSum(p.statusEffects, 'critBoost') / 5);
}

function dmgModifierFromStatus(effects: { type: StatusType; value: number }[], kind: 'dealt' | 'taken'): number {
  let mult = 1;
  for (const e of effects) {
    if (kind === 'dealt' && e.type === 'weaken') mult *= 1 - e.value / 100;
    if (kind === 'taken' && e.type === 'vulnerable') mult *= 1 + e.value / 100;
  }
  return mult;
}

function absorbShield(shield: number, dmg: number): { shield: number; dmg: number } {
  if (shield <= 0) return { shield, dmg };
  const absorbed = Math.min(shield, dmg);
  return { shield: shield - absorbed, dmg: dmg - absorbed };
}

function advanceToActionableTurn(party: ForestParty): ForestParty {
  let next = party;
  // safety cap to avoid any infinite loop
  for (let guard = 0; guard < 40; guard++) {
    if (next.status !== 'combat' || !next.combat) return next;
    const outcome = checkCombatOutcome(next);
    if (outcome) return outcome;

    const combat = next.combat;
    const key = combat.turnOrder[combat.turnIndex];
    const [kind, idRaw] = key.split(':');

    if (kind === 'player') {
      const player = next.seats.find((p) => p?.id === idRaw);
      if (!player || player.hp <= 0) {
        next = advanceTurnIndex(next);
        continue;
      }
      if (player.downed) {
        next = pushLog(next, `${player.nickname}은(는) 쓰러져 있어 행동할 수 없다.`);
        next = advanceTurnIndex(next);
        continue;
      }
      let dmgAcc = 0;
      let mpAcc = 0;
      const { effects, stunned } = tickStatusStart(player.statusEffects, (d) => (dmgAcc += d), (d) => (mpAcc += d));
      next = updatePlayer(next, player.id, (p) =>
        clampHp({ ...p, statusEffects: effects, hp: p.hp + dmgAcc, mp: Math.min(maxMpFor(p.intelligence), p.mp + mpAcc) }),
      );
      if (dmgAcc < 0) next = pushLog(next, `${player.nickname}이(가) 상태이상으로 ${-dmgAcc} 피해를 입었다.`);
      if (dmgAcc > 0) next = pushLog(next, `${player.nickname}이(가) 지속 효과로 HP ${dmgAcc} 회복했다.`);
      if (mpAcc > 0) next = pushLog(next, `${player.nickname}이(가) 지속 효과로 MP ${mpAcc} 회복했다.`);
      const revived = next.seats.find((p) => p?.id === player.id);
      if (revived && revived.hp <= 0) {
        next = updatePlayer(next, player.id, (p) => ({ ...p, downed: true }));
        next = pushLog(next, `${player.nickname}이(가) 쓰러졌다!`);
        next = advanceTurnIndex(next);
        continue;
      }
      if (stunned) {
        next = pushLog(next, `${player.nickname}은(는) 제압당해 행동할 수 없다.`);
        next = advanceTurnIndex(next);
        continue;
      }
      // waiting for this player's real action
      return next;
    } else {
      const idx = Number(idRaw);
      const monster = combat.monsters[idx];
      if (!monster || monster.hp <= 0) {
        next = advanceTurnIndex(next);
        continue;
      }
      next = resolveMonsterTurn(next, idx);
      const out = checkCombatOutcome(next);
      if (out) return out;
      next = advanceTurnIndex(next);
    }
  }
  return next;
}

function advanceTurnIndex(party: ForestParty): ForestParty {
  if (!party.combat) return party;
  const combat = party.combat;
  let turnIndex = combat.turnIndex + 1;
  let round = combat.round;
  if (turnIndex >= combat.turnOrder.length) {
    turnIndex = 0;
    round += 1;
  }
  return { ...party, combat: { ...combat, turnIndex, round } };
}

function updatePlayer(party: ForestParty, playerId: string, fn: (p: Player) => Player): ForestParty {
  const seats = party.seats.map((p) => (p?.id === playerId ? fn(p) : p)) as ForestParty['seats'];
  return { ...party, seats };
}

function updateMonster(party: ForestParty, index: number, fn: (m: Monster) => Monster): ForestParty {
  if (!party.combat) return party;
  const monsters = party.combat.monsters.map((m, i) => (i === index ? fn(m) : m));
  return { ...party, combat: { ...party.combat, monsters } };
}

function checkCombatOutcome(party: ForestParty): ForestParty | null {
  if (!party.combat) return null;
  const monstersAlive = party.combat.monsters.some((m) => m.hp > 0);
  const playersAlive = party.seats.some((p) => p && !p.downed && p.hp > 0);

  if (!monstersAlive) {
    return onCombatWon(party);
  }
  if (!playersAlive) {
    return onCombatLost(party);
  }
  return null;
}

function onCombatWon(party: ForestParty): ForestParty {
  const wasBoss = party.combat?.isBoss ?? false;
  let next: ForestParty = {
    ...party,
    combat: null,
    stats: { ...party.stats, monstersDefeated: party.stats.monstersDefeated + 1 },
  };
  next = applyToAllSeats(next, (p) => ({ ...p, buffs: emptyBuffs(), shield: 0 }));

  if (wasBoss) {
    next = applyToAllSeats(next, (p) => ({ ...p, maxHp: p.maxHp + 10, hp: p.hp + 10, skillPoints: p.skillPoints + 3 }));
    const bonusHp = 5 + Math.floor(Math.random() * 11);
    const bonusSp = 1 + Math.floor(Math.random() * 2);
    next = applyToAllSeats(next, (p) => ({ ...p, maxHp: p.maxHp + bonusHp, hp: p.hp + bonusHp, skillPoints: p.skillPoints + bonusSp }));
    const bossName = next.combat === null && party.combat?.bossId ? templateByBossId(party.combat.bossId).name : '보스';
    next = {
      ...next,
      status: 'cleared',
      result: {
        outcome: 'clear',
        bossName,
        stagesCleared: TOTAL_STAGES,
        monstersDefeated: next.stats.monstersDefeated,
        spellsCast: next.stats.spellsCast,
        healingDone: next.stats.healingDone,
        damageTaken: next.stats.damageTaken,
        bonusesGained: next.stats.bonusesGained,
      },
    };
    next = pushLog(next, `${bossName}를 물리쳤다! 탐사 클리어!`);
    return next;
  }

  next = pushLog(next, '전투에서 승리했다!');
  if (next.stage >= TOTAL_STAGES) {
    return beginBoss({ ...next, status: 'exploring' });
  }
  next = { ...next, status: 'exploring', stage: next.stage + 1 };
  return generatePaths(next);
}

function onCombatLost(party: ForestParty): ForestParty {
  let next: ForestParty = {
    ...party,
    status: 'failed',
    combat: null,
    result: {
      outcome: 'failed',
      bossName: null,
      stagesCleared: party.stage - 1,
      monstersDefeated: party.stats.monstersDefeated,
      spellsCast: party.stats.spellsCast,
      healingDone: party.stats.healingDone,
      damageTaken: party.stats.damageTaken,
      bonusesGained: party.stats.bonusesGained,
    },
  };
  next = pushLog(next, '파티 전원이 쓰러졌다... 탐사 실패.');
  return next;
}

// ---------- player combat actions ----------

export type ActionTargetType = 'monster' | 'self' | 'ally' | 'party' | 'allMonsters';

export interface CombatAction {
  kind: 'skill' | 'patronus' | 'pass';
  skillId?: SkillId;
  targetMonsterIndex?: number;
  targetPlayerId?: string;
}

/** Rolls the target's evasion (agility vs. the attacker's DC) before applying damage — a miss deals nothing. */
function monsterDamageToPlayer(party: ForestParty, playerId: string, rawDmg: number, sourceDC: number): ForestParty {
  const player = party.seats.find((p) => p?.id === playerId);
  if (!player) return party;
  const agi = effectiveAgility(player);
  const evasion = check(agi, sourceDC);
  if (evasion.success) {
    return pushLog(party, `${player.nickname}이(가) 공격을 회피했다! (D20 ${evasion.roll} + 민첩 ${agi} / DC ${sourceDC})`);
  }
  const statusMult = dmgModifierFromStatus(player.statusEffects, 'taken');
  const buffMult = 1 - player.buffs.combatDamageReductionPct / 100;
  const dmg = Math.max(1, Math.round(rawDmg * statusMult * buffMult));
  const { shield, dmg: afterShield } = absorbShield(player.shield, dmg);
  let next = updatePlayer(party, playerId, (p) => clampHp({ ...p, hp: p.hp - afterShield, shield }));
  next = { ...next, stats: { ...next.stats, damageTaken: next.stats.damageTaken + afterShield } };
  const updated = next.seats.find((p) => p?.id === playerId)!;
  if (updated.hp <= 0 && !updated.downed) {
    next = updatePlayer(next, playerId, (p) => ({ ...p, downed: true }));
    next = pushLog(next, `${player.nickname}이(가) 쓰러졌다!`);
  }
  return next;
}

function resolveMonsterTurn(party: ForestParty, index: number): ForestParty {
  let next = party;
  const combat = next.combat!;
  const monster = combat.monsters[index];
  if (!monster || monster.hp <= 0) return next;

  // status tick on monster
  let dmgAcc = 0;
  const { effects, stunned } = tickStatusStart(monster.statusEffects, (d) => (dmgAcc += d));
  next = updateMonster(next, index, (m) => ({ ...m, statusEffects: effects, hp: Math.max(0, m.hp + dmgAcc) }));
  if (dmgAcc < 0) next = pushLog(next, `${monster.name}이(가) 상태이상으로 ${-dmgAcc} 피해를 입었다.`);
  if (next.combat!.monsters[index].hp <= 0) {
    next = pushLog(next, `${monster.name}이(가) 쓰러졌다.`);
    return next;
  }
  if (stunned) {
    next = pushLog(next, `${monster.name}은(는) 제압당해 행동할 수 없다.`);
    return next;
  }

  // boss phase update
  if (combat.isBoss) {
    const liveMonster = next.combat!.monsters[index];
    const phase = bossPhaseIndex(liveMonster);
    if (phase !== next.combat!.phaseIndex) {
      const template = templateByBossId(next.combat!.bossId!);
      next = { ...next, combat: { ...next.combat!, phaseIndex: phase, monsters: next.combat!.monsters.map((m, i) => (i === index ? { ...m, abilities: template.phases[phase].abilities } : m)) } };
      next = pushLog(next, `${monster.name}이(가) '${template.phases[phase].name}' 단계로 돌입한다!`);
      if (phase === 2) next = pushLog(next, `${monster.name}에게서 강력한 마법 에너지가 모인다! 방어 마법으로 대비하세요.`);
    }
  }

  const alivePlayers = next.seats.filter((p): p is Player => !!p && !p.downed && p.hp > 0);
  if (alivePlayers.length === 0) return next;

  const liveMonster = next.combat!.monsters[index];
  const abilityChance = combat.isBoss ? templateByBossId(combat.bossId!).phases[bossPhaseIndex(liveMonster)].abilityChance : 0.25;
  const useAbility = liveMonster.abilities.length > 0 && Math.random() < abilityChance;

  if (useAbility) {
    const ability = liveMonster.abilities[Math.floor(Math.random() * liveMonster.abilities.length)];
    next = applyMonsterAbility(next, index, ability);
    return next;
  }

  // default: basic attack — charmed monsters (여우 Patronus) or confused monsters (해달 Patronus) strike
  // another monster (or themselves, if alone) instead of a player.
  const dmg = liveMonster.attackMin + Math.floor(Math.random() * (liveMonster.attackMax - liveMonster.attackMin + 1));
  const charmed = liveMonster.statusEffects.some((s) => s.type === 'charm');
  const confused = liveMonster.statusEffects.some((s) => s.type === 'confuse');
  if (charmed || confused) {
    const others = next.combat!.monsters.map((m, i) => ({ m, i })).filter(({ m, i }) => i !== index && m.hp > 0);
    const victimIndex = others.length > 0 ? others[Math.floor(Math.random() * others.length)].i : index;
    const victim = next.combat!.monsters[victimIndex];
    next = damageMonster(next, victimIndex, dmg);
    const verb = confused ? '혼란' : '매혹';
    next = pushLog(next, `${verb}에 걸린 ${monster.name}이(가) ${victim.name}을(를) 공격했다! (${dmg} 피해)`);
    return next;
  }
  const target = pickMonsterTarget(alivePlayers);
  next = monsterDamageToPlayer(next, target.id, dmg, liveMonster.defenseDC);
  next = pushLog(next, `${monster.name}이(가) ${target.nickname}을(를) 공격했다! (${dmg} 피해)`);
  return next;
}

function pickMonsterTarget(alive: Player[]): Player {
  return alive.reduce((a, b) => (a.hp / a.maxHp <= b.hp / b.maxHp ? a : b));
}

function applyMonsterAbility(party: ForestParty, index: number, ability: Monster['abilities'][number]): ForestParty {
  let next = party;
  const monster = next.combat!.monsters[index];
  const alivePlayers = next.seats.filter((p): p is Player => !!p && !p.downed && p.hp > 0);
  if (alivePlayers.length === 0) return next;

  switch (ability.effect) {
    case 'extraDamage': {
      const target = pickMonsterTarget(alivePlayers);
      const dmg = monster.attackMin + ability.value;
      next = monsterDamageToPlayer(next, target.id, dmg, monster.defenseDC);
      next = pushLog(next, `${monster.name}의 ${ability.label}! ${target.nickname}에게 ${dmg} 피해.`);
      break;
    }
    case 'poison': {
      const target = pickMonsterTarget(alivePlayers);
      next = updatePlayer(next, target.id, (p) => ({ ...p, statusEffects: [...p.statusEffects, { type: 'bleed', value: ability.value, turnsLeft: 2 }] }));
      next = pushLog(next, `${monster.name}의 ${ability.label}! ${target.nickname}이(가) 중독되었다.`);
      break;
    }
    case 'stun': {
      const target = pickMonsterTarget(alivePlayers);
      next = updatePlayer(next, target.id, (p) => ({ ...p, statusEffects: [...p.statusEffects, { type: 'stun', value: 1, turnsLeft: 1 }] }));
      next = pushLog(next, `${monster.name}의 ${ability.label}! ${target.nickname}이(가) 제압되었다.`);
      break;
    }
    case 'fear': {
      const target = pickMonsterTarget(alivePlayers);
      next = updatePlayer(next, target.id, (p) => ({ ...p, statusEffects: [...p.statusEffects, { type: 'weaken', value: ability.value, turnsLeft: 2 }] }));
      next = pushLog(next, `${monster.name}의 ${ability.label}! ${target.nickname}이(가) 공포에 질렸다.`);
      break;
    }
    case 'weakenParty': {
      next = { ...next, seats: next.seats.map((p) => (p && !p.downed ? { ...p, statusEffects: [...p.statusEffects, { type: 'weaken' as StatusType, value: ability.value, turnsLeft: 2 }] } : p)) as ForestParty['seats'] };
      next = pushLog(next, `${monster.name}의 ${ability.label}! 파티 전체가 약화되었다.`);
      break;
    }
    case 'aoeDamage': {
      for (const p of alivePlayers) next = monsterDamageToPlayer(next, p.id, ability.value, monster.defenseDC);
      next = pushLog(next, `${monster.name}의 ${ability.label}! 파티 전체가 ${ability.value} 피해를 입었다.`);
      break;
    }
    case 'drainHp': {
      const target = pickMonsterTarget(alivePlayers);
      next = monsterDamageToPlayer(next, target.id, ability.value, monster.defenseDC);
      next = updateMonster(next, index, (m) => ({ ...m, hp: Math.min(m.maxHp, m.hp + ability.value) }));
      next = pushLog(next, `${monster.name}의 ${ability.label}! ${target.nickname}의 생명력을 흡수했다.`);
      break;
    }
    case 'healSelf': {
      next = updateMonster(next, index, (m) => ({ ...m, hp: Math.min(m.maxHp, m.hp + ability.value) }));
      next = pushLog(next, `${monster.name}이(가) ${ability.label}(으)로 ${ability.value} 회복했다.`);
      break;
    }
    case 'buffSelf': {
      next = updateMonster(next, index, (m) => ({ ...m, attackMin: m.attackMin + Math.round(ability.value * 0.2), attackMax: m.attackMax + Math.round(ability.value * 0.2) }));
      next = pushLog(next, `${monster.name}이(가) ${ability.label}(으)로 강해졌다!`);
      break;
    }
    case 'shieldSelf': {
      next = updateMonster(next, index, (m) => ({ ...m, shield: m.shield + ability.value }));
      next = pushLog(next, `${monster.name}이(가) ${ability.label}을(를) 둘렀다.`);
      break;
    }
    case 'summon': {
      const template = randomTemplateForStage(1, false);
      const spawn = spawnMonster(template, 0.5, next.combat!.monsters.length);
      const monsters = [...next.combat!.monsters, spawn];
      const turnOrder = [...next.combat!.turnOrder, combatantKey('monster', monsters.length - 1)];
      next = { ...next, combat: { ...next.combat!, monsters, turnOrder } };
      next = pushLog(next, `${monster.name}이(가) ${spawn.name}을(를) 소환했다!`);
      break;
    }
    case 'evade':
      break;
  }
  return next;
}

function evadeCheck(monster: Monster): boolean {
  const evadeAbility = monster.abilities.find((a) => a.effect === 'evade');
  if (!evadeAbility) return false;
  return Math.random() * 100 < evadeAbility.value;
}

export function playerCombatAction(party: ForestParty, playerId: string, action: CombatAction): ForestParty {
  if (party.status !== 'combat' || !party.combat) return party;
  const cur = currentCombatant(party);
  if (!cur || cur.kind !== 'player' || cur.player!.id !== playerId) return party;
  const player = cur.player!;

  let next = party;

  if (action.kind === 'pass') {
    next = pushLog(next, `${player.nickname}이(가) 이번 턴을 넘겼다.`);
    next = advanceTurnIndex(next);
    return advanceToActionableTurn(next);
  }

  if (action.kind === 'skill' && action.skillId) {
    next = castSkill(next, playerId, action.skillId, action);
  } else if (action.kind === 'patronus') {
    next = castPatronus(next, playerId, action);
  }

  next = advanceTurnIndex(next);
  return advanceToActionableTurn(next);
}

function healPlayer(party: ForestParty, playerId: string, amount: number, revive: boolean): ForestParty {
  let next = party;
  next = updatePlayer(next, playerId, (p) => {
    const wasDowned = p.downed;
    const hp = Math.min(p.maxHp, p.hp + amount);
    return clampHp({ ...p, hp, downed: revive ? false : wasDowned && hp <= 0 });
  });
  next = { ...next, stats: { ...next.stats, healingDone: next.stats.healingDone + amount } };
  return next;
}

function healMp(party: ForestParty, playerId: string, amount: number): ForestParty {
  return updatePlayer(party, playerId, (p) => ({ ...p, mp: Math.min(maxMpFor(p.intelligence), p.mp + amount) }));
}

/** 종달새 Patronus proc: if the caster has an active followAttack buff, it strikes the same target again. */
function triggerFollowAttack(party: ForestParty, player: Player, monsterIndex: number, monsterName: string): ForestParty {
  const bonus = statusValueSum(player.statusEffects, 'followAttack');
  if (bonus <= 0) return party;
  let next = party;
  const m = next.combat!.monsters[monsterIndex];
  if (!m || m.hp <= 0) return next;
  const dmg = Math.round(bonus + player.spellPower);
  next = damageMonster(next, monsterIndex, dmg);
  next = pushLog(next, `종달새가 ${player.nickname}과(와) 함께 ${monsterName}을(를) 공격했다! (${dmg} 추가 피해)`);
  return next;
}

function damageMonster(party: ForestParty, index: number, dmg: number): ForestParty {
  let next = party;
  const monster = next.combat!.monsters[index];
  const { shield, dmg: afterShield } = absorbShield(monster.shield, dmg);
  next = updateMonster(next, index, (m) => ({ ...m, hp: Math.max(0, m.hp - afterShield), shield }));
  return next;
}

/**
 * Resolves one of the 8 fixed skills. Attack skills roll the caster's (effective) intelligence
 * against the target's defenseDC — a miss deals nothing. Defense/heal/MP-heal skills always
 * land; their magnitude scales with spellPower (agility for defense skills instead, per the
 * design spec — agility drives evasion and defense-skill efficiency, not raw damage).
 */
function castSkill(party: ForestParty, playerId: string, skillId: SkillId, action: CombatAction): ForestParty {
  let next = party;
  const player = next.seats.find((p) => p?.id === playerId)!;
  const skill = skillById(skillId);
  const level = player.skillLevels[skillId] ?? 0;
  const mpCost = skillMpCostAtLevel(skill, level);
  if (player.mp < mpCost) {
    return pushLog(next, `${player.nickname}의 MP가 부족해 ${skill.name}을(를) 사용할 수 없다. (필요 MP ${mpCost} / 보유 ${player.mp})`);
  }
  const base = skillValueAtLevel(skill, level);
  const spellPower = player.spellPower + player.buffs.combatSpellPowerBonus;

  next = { ...next, stats: { ...next.stats, spellsCast: next.stats.spellsCast + 1 } };
  next = updatePlayer(next, playerId, (p) => ({ ...p, mp: p.mp - mpCost }));

  if (skill.effectType === 'damage') {
    const intel = effectiveIntelligence(player);
    const dcReduction = player.buffs.nextDcReduction;
    const critBonus = effectiveCritThresholdBonus(player);
    let dmgBoost = player.buffs.nextAttackBoost ? 1.5 : 1;
    dmgBoost *= 1 + player.buffs.combatDamageBonusPct / 100;
    next = updatePlayer(next, playerId, (p) => ({ ...p, buffs: { ...p.buffs, nextDcReduction: 0, nextAdvantage: false, nextAttackBoost: false, nextAttackHitsAll: false, combatDamageBonusPct: 0 } }));

    if (skill.targetType === 'enemyAll') {
      let hitAny = false;
      next.combat!.monsters.forEach((m, i) => {
        if (m.hp <= 0) return;
        const res = check(intel, Math.max(5, m.defenseDC - dcReduction), player.buffs.nextAdvantage, critBonus);
        if (!res.success) {
          next = pushLog(next, `${player.nickname}의 ${skill.name}이(가) ${m.name}에게 빗나갔다.`);
          return;
        }
        hitAny = true;
        if (evadeCheck(m)) {
          next = pushLog(next, `${m.name}이(가) 공격을 회피했다!`);
          return;
        }
        const dmg = Math.round((base + spellPower) * (res.crit ? 1.5 : 1) * dmgBoost);
        next = damageMonster(next, i, dmg);
        next = triggerFollowAttack(next, player, i, m.name);
      });
      next = pushLog(next, `${player.nickname}의 ${skill.name}! (MP -${mpCost})${hitAny ? '' : ' 전부 빗나갔다.'}`);
      return next;
    }

    const idx = action.targetMonsterIndex ?? next.combat!.monsters.findIndex((m) => m.hp > 0);
    const m = next.combat!.monsters[idx];
    if (!m || m.hp <= 0) return next;
    const res = check(intel, Math.max(5, m.defenseDC - dcReduction), player.buffs.nextAdvantage, critBonus);
    if (!res.success) {
      next = pushLog(next, `${player.nickname}의 ${skill.name} 빗나감... (D20 ${res.roll} + 지능 ${intel} / DC ${res.dc}, MP -${mpCost})`);
      return next;
    }
    if (evadeCheck(m)) {
      next = pushLog(next, `${m.name}이(가) ${player.nickname}의 공격을 회피했다!`);
      return next;
    }
    const dmg = Math.round((base + spellPower) * (res.crit ? 1.5 : 1) * dmgBoost);
    next = damageMonster(next, idx, dmg);
    next = pushLog(next, `${player.nickname}의 ${skill.name}! ${m.name}에게 ${dmg} 피해.${res.crit ? ' 대성공!' : ''} (MP -${mpCost})`);
    next = triggerFollowAttack(next, player, idx, m.name);
    return next;
  }

  if (skill.effectType === 'healHp') {
    const boost = player.buffs.nextHealBoost ? 1.5 : 1;
    const amount = Math.round((base + spellPower) * boost);
    if (player.buffs.nextHealBoost) next = updatePlayer(next, playerId, (p) => ({ ...p, buffs: { ...p.buffs, nextHealBoost: false } }));
    if (skill.targetType === 'allyAll') {
      const targets = next.seats.filter((p): p is Player => !!p);
      for (const t of targets) next = healPlayer(next, t.id, amount, false);
      next = pushLog(next, `${player.nickname}의 ${skill.name}! 파티 전체 ${amount} 회복. (MP -${mpCost})`);
    } else {
      const targetId = action.targetPlayerId ?? playerId;
      next = healPlayer(next, targetId, amount, false);
      const targetName = next.seats.find((p) => p?.id === targetId)?.nickname ?? '동료';
      next = pushLog(next, `${player.nickname}의 ${skill.name}! ${targetName}이(가) ${amount} 회복. (MP -${mpCost})`);
    }
    return next;
  }

  if (skill.effectType === 'healMp') {
    const amount = Math.round(base + spellPower);
    if (skill.targetType === 'allyAll') {
      const targets = next.seats.filter((p): p is Player => !!p);
      for (const t of targets) next = healMp(next, t.id, amount);
      next = pushLog(next, `${player.nickname}의 ${skill.name}! 파티 전체 MP ${amount} 회복. (MP -${mpCost})`);
    } else {
      const targetId = action.targetPlayerId ?? playerId;
      next = healMp(next, targetId, amount);
      const targetName = next.seats.find((p) => p?.id === targetId)?.nickname ?? '동료';
      next = pushLog(next, `${player.nickname}의 ${skill.name}! ${targetName}의 MP ${amount} 회복. (MP -${mpCost})`);
    }
    return next;
  }

  // defense — shield scales with agility (agility drives defense-skill efficacy, not a flat "defense" stat)
  let boost = player.buffs.nextDefenseBoost ? 1.5 : 1;
  if (player.buffs.nextShieldDouble) boost *= 2;
  const amount = Math.round((base + effectiveAgility(player)) * boost);
  if (player.buffs.nextDefenseBoost || player.buffs.nextShieldDouble) {
    next = updatePlayer(next, playerId, (p) => ({ ...p, buffs: { ...p.buffs, nextDefenseBoost: false, nextShieldDouble: false } }));
  }
  if (skill.targetType === 'allyAll') {
    next = applyToAllSeats(next, (p) => (p ? { ...p, shield: p.shield + amount } : p));
    next = pushLog(next, `${player.nickname}의 ${skill.name}! 파티 전체 방어막 +${amount}. (MP -${mpCost})`);
  } else {
    const targetId = action.targetPlayerId ?? playerId;
    next = updatePlayer(next, targetId, (p) => ({ ...p, shield: p.shield + amount }));
    const targetName = next.seats.find((p) => p?.id === targetId)?.nickname ?? '동료';
    next = pushLog(next, `${player.nickname}의 ${skill.name}! ${targetName}의 방어막 +${amount}. (MP -${mpCost})`);
  }
  return next;
}

/** Resolves 익스펙토 패트로눔 — the single ultimate every player has, whose effect depends on their admin-assigned species. */
function castPatronus(party: ForestParty, playerId: string, action: CombatAction): ForestParty {
  let next = party;
  const player = next.seats.find((p) => p?.id === playerId)!;
  if (!player.patronus) {
    return pushLog(next, `${player.nickname}에게는 아직 패트로누스가 지정되지 않았다.`);
  }
  const patronus = patronusById(player.patronus);
  if (player.mp < patronus.baseMpCost) {
    return pushLog(next, `${player.nickname}의 MP가 부족해 익스펙토 패트로눔을 사용할 수 없다. (필요 MP ${patronus.baseMpCost} / 보유 ${player.mp})`);
  }
  const spellPower = player.spellPower + player.buffs.combatSpellPowerBonus;
  const magnitude = Math.round(patronus.baseValue + spellPower * 0.4);

  next = { ...next, stats: { ...next.stats, spellsCast: next.stats.spellsCast + 1 } };
  next = updatePlayer(next, playerId, (p) => ({ ...p, mp: p.mp - patronus.baseMpCost }));

  const applyToEnemy = (): ForestParty => {
    const idx = action.targetMonsterIndex ?? next.combat!.monsters.findIndex((m) => m.hp > 0);
    const m = next.combat!.monsters[idx];
    if (!m || m.hp <= 0) return next;
    const res = check(effectiveIntelligence(player), m.defenseDC);
    if (!res.success) {
      return pushLog(next, `${player.nickname}의 익스펙토 패트로눔(${patronus.name})이(가) ${m.name}에게 빗나갔다. (MP -${patronus.baseMpCost})`);
    }
    if (magnitude > 0) next = damageMonster(next, idx, magnitude);
    if (patronus.statusType) {
      next = updateMonster(next, idx, (mo) => ({ ...mo, statusEffects: [...mo.statusEffects, { type: patronus.statusType!, value: magnitude, turnsLeft: patronus.statusDuration }] }));
    }
    next = pushLog(next, `${player.nickname}의 익스펙토 패트로눔(${patronus.name})! ${m.name}에게 ${patronus.effectLabel} 효과.${magnitude > 0 ? ` ${magnitude} 피해.` : ''} (MP -${patronus.baseMpCost})`);
    return next;
  };

  const applyToAlly = (): ForestParty => {
    const targetId = action.targetPlayerId ?? playerId;
    const targetName = next.seats.find((p) => p?.id === targetId)?.nickname ?? '동료';
    if (patronus.statusType === 'regenHp') {
      next = healPlayer(next, targetId, magnitude, false);
    } else if (patronus.statusType === 'regenMp') {
      next = healMp(next, targetId, magnitude);
    }
    if (patronus.statusType) {
      next = updatePlayer(next, targetId, (p) => ({ ...p, statusEffects: [...p.statusEffects, { type: patronus.statusType!, value: magnitude, turnsLeft: patronus.statusDuration }] }));
    }
    next = pushLog(next, `${player.nickname}의 익스펙토 패트로눔(${patronus.name})! ${targetName}에게 ${patronus.effectLabel} 효과. (MP -${patronus.baseMpCost})`);
    return next;
  };

  const applyToAllAllies = (): ForestParty => {
    const targets = next.seats.filter((p): p is Player => !!p && !p.downed && p.hp > 0);
    for (const t of targets) {
      if (patronus.statusType === 'regenHp') {
        next = healPlayer(next, t.id, magnitude, false);
      } else if (patronus.statusType === 'regenMp') {
        next = healMp(next, t.id, magnitude);
      }
      if (patronus.statusType) {
        next = updatePlayer(next, t.id, (p) => ({ ...p, statusEffects: [...p.statusEffects, { type: patronus.statusType!, value: magnitude, turnsLeft: patronus.statusDuration }] }));
      }
    }
    next = pushLog(next, `${player.nickname}의 익스펙토 패트로눔(${patronus.name})! 파티 전체에게 ${patronus.effectLabel} 효과. (MP -${patronus.baseMpCost})`);
    return next;
  };

  const applyToAllEnemies = (): ForestParty => {
    const liveIndexes = next.combat!.monsters.map((_, i) => i).filter((i) => next.combat!.monsters[i].hp > 0);
    let anyHit = false;
    for (const idx of liveIndexes) {
      const m = next.combat!.monsters[idx];
      const res = check(effectiveIntelligence(player), m.defenseDC);
      if (!res.success) continue;
      anyHit = true;
      if (magnitude > 0) next = damageMonster(next, idx, magnitude);
      if (patronus.statusType) {
        next = updateMonster(next, idx, (mo) => ({ ...mo, statusEffects: [...mo.statusEffects, { type: patronus.statusType!, value: magnitude, turnsLeft: patronus.statusDuration }] }));
      }
    }
    next = pushLog(
      next,
      anyHit
        ? `${player.nickname}의 익스펙토 패트로눔(${patronus.name})! 적 전체에게 ${patronus.effectLabel} 효과. (MP -${patronus.baseMpCost})`
        : `${player.nickname}의 익스펙토 패트로눔(${patronus.name})이(가) 모두 빗나갔다. (MP -${patronus.baseMpCost})`,
    );
    return next;
  };

  if (patronus.targetType === 'enemy') return applyToEnemy();
  if (patronus.targetType === 'enemyAll') return applyToAllEnemies();
  if (patronus.targetType === 'allyAll') return applyToAllAllies();
  return applyToAlly();
}

// ---------- skill points ----------

export function upgradeSkill(party: ForestParty, playerId: string, skillId: SkillId): ForestParty {
  const player = party.seats.find((p) => p?.id === playerId);
  if (!player || player.skillPoints <= 0) return party;
  if (!SKILLS.some((s) => s.id === skillId)) return party;
  const level = player.skillLevels[skillId] ?? 0;
  if (level >= 5) return party;
  return updatePlayer(party, playerId, (p) => ({
    ...p,
    skillPoints: p.skillPoints - 1,
    skillLevels: { ...p.skillLevels, [skillId]: level + 1 },
  }));
}

export function currentActingPlayerId(party: ForestParty): string | null {
  const cur = currentCombatant(party);
  return cur?.kind === 'player' ? (cur.player?.id ?? null) : null;
}

export { MONSTER_TEMPLATES, templateById };
