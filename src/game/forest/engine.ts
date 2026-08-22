import { BOSS_TEMPLATES, bossPhaseIndex, spawnBoss, templateByBossId } from './bosses';
import { MONSTER_TEMPLATES, randomTemplateForStage, spawnMonster, templateById } from './creatures';
import { eventById, FOREST_EVENTS } from './events';
import { SPELLS, spellDcAtLevel, spellPowerAtLevel } from './spells';
import {
  createPlayer,
  emptyBuffs,
  type CombatState,
  type EventCategory,
  type ForestEvent,
  type ForestParty,
  type LogEntry,
  type Monster,
  type Player,
  type StatusType,
} from './types';

export const TOTAL_STAGES = 10;
export const MAX_SEATS = 4;

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

export function joinSeat(party: ForestParty, playerId: string, nickname: string): ForestParty {
  if (seatedPlayer(party, playerId)) return party;
  if (party.status !== 'lobby') throw new ForestFullError();
  const idx = party.seats.findIndex((s) => s === null);
  if (idx === -1) throw new ForestFullError();
  const seats = [...party.seats];
  seats[idx] = createPlayer(playerId, nickname || '이름 없음');
  return { ...party, seats, hostId: party.hostId ?? playerId, updatedAt: now() };
}

export function leaveSeat(party: ForestParty, playerId: string): ForestParty {
  if (party.status !== 'lobby') return party;
  const seats = party.seats.map((s) => (s?.id === playerId ? null : s)) as ForestParty['seats'];
  const stillHost = seats.some((s) => s?.id === party.hostId);
  return { ...party, seats, hostId: stillHost ? party.hostId : (seats.find((s) => s)?.id ?? null), updatedAt: now() };
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
  const goodCategories: EventCategory[] = ['heal', 'spellPower', 'defense', 'buff', 'item', 'special'];
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

const CATEGORY_LABEL: Record<EventCategory, string> = {
  heal: '회복', spellPower: '주문력 강화', defense: '방어력 강화', buff: '일시적 강화', item: '아이템',
  hint: '단서', monster: '몬스터 조우', eliteMonster: '강력한 몬스터', trap: '함정', penalty: '위험',
  partyChoice: '동료 관련', riskyChoice: '위험한 선택', special: '특별한 발견', neutral: '평범한 길',
};

export function generatePaths(party: ForestParty): ForestParty {
  const events = pickWeightedEvents(party, 3);
  const usedFlavors = new Set<number>();
  const reveal = party.seats.some((p) => p?.buffs.revealNextPaths);
  const paths = events.map((e) => {
    let fi = Math.floor(Math.random() * PATH_FLAVORS.length);
    while (usedFlavors.has(fi)) fi = Math.floor(Math.random() * PATH_FLAVORS.length);
    usedFlavors.add(fi);
    return { label: PATH_FLAVORS[fi], eventId: e.id, revealedCategory: reveal ? CATEGORY_LABEL[e.category] : undefined };
  });
  let next: ForestParty = { ...party, status: 'exploring', paths, currentEventId: null, updatedAt: now() };
  if (reveal) {
    next = applyToAllSeats(next, (p) => ({ ...p, buffs: { ...p.buffs, revealNextPaths: false } }));
    next = pushLog(next, '단서 덕분에 갈림길의 정체를 미리 엿보았다.');
  }
  return next;
}

export function startExpedition(party: ForestParty): ForestParty {
  if (party.status !== 'lobby') return party;
  if (partySize(party) < 2) throw new Error('최소 2명이 필요합니다.');
  const seats = party.seats.map((s) => (s ? { ...s, hp: s.maxHp, statusEffects: [], shield: 0, buffs: emptyBuffs(), downed: false } : s)) as ForestParty['seats'];
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

  let next: ForestParty = {
    ...party,
    status: 'event',
    currentEventId: event.id,
    usedEventIds: [...party.usedEventIds, event.id],
    recentCategories: [...party.recentCategories, event.category].slice(-6),
    paths: null,
  };
  next = pushLog(next, `[${party.stage}단계] ${choice.label} → ${event.title}`);

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
    const bestDefense = Math.max(0, ...next.seats.filter((p): p is Player => !!p && !p.downed).map((p) => p.defense));
    const res = check(bestDefense, eff.triggersTrap.dc);
    if (!res.success) {
      next = applyHpDelta(next, -eff.triggersTrap.failHp, false);
      next = pushLog(next, `함정에 걸렸다! 파티 전체 HP -${eff.triggersTrap.failHp} (D20 ${res.roll} + ${bestDefense} / DC ${res.dc})`);
    } else {
      next = pushLog(next, `함정을 무사히 피했다! (D20 ${res.roll} + ${bestDefense} / DC ${res.dc})`);
    }
    return next;
  }

  if (eff.triggersMonster) {
    const template = randomTemplateForStage(next.stage, false);
    return beginCombat(next, [template], false);
  }
  if (eff.triggersEliteMonster) {
    const template = randomTemplateForStage(next.stage, true);
    return beginCombat(next, [template], false);
  }

  return applyPlainEffect(next, eff);
}

function applyPlainEffect(party: ForestParty, eff: ForestEvent['effect']): ForestParty {
  let next = party;
  if (eff.hp) next = applyHpDelta(next, eff.hp, Boolean(eff.targetLowestHp));
  if (eff.maxHp) {
    next = applyToAllSeats(next, (p) => ({ ...p, maxHp: p.maxHp + eff.maxHp!, hp: p.hp + eff.maxHp! }));
  }
  if (eff.spellPower) next = applyToAllSeats(next, (p) => ({ ...p, spellPower: Math.max(1, p.spellPower + eff.spellPower!) }));
  if (eff.defense) next = applyToAllSeats(next, (p) => ({ ...p, defense: Math.max(0, p.defense + eff.defense!) }));
  if (eff.skillPoints) {
    next = applyToAllSeats(next, (p) => ({ ...p, skillPoints: p.skillPoints + eff.skillPoints! }));
    next = { ...next, stats: { ...next.stats, bonusesGained: next.stats.bonusesGained + 1 } };
  }
  if (eff.item) {
    const alive = next.seats.filter((p): p is Player => !!p);
    if (alive.length > 0) {
      const pick = alive[Math.floor(Math.random() * alive.length)];
      next = { ...next, seats: next.seats.map((p) => (p?.id === pick.id ? { ...p, items: [...p.items, eff.item!] } : p)) as ForestParty['seats'] };
    }
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

function beginCombat(party: ForestParty, templates: ReturnType<typeof randomTemplateForStage>[], isBoss: boolean, bossId?: string): ForestParty {
  const size = partySize(party);
  const hpScale = size === 2 ? 1 : size === 3 ? 1.35 : 1.7;
  const atkScale = size === 2 ? 1 : size === 3 ? 1.15 : 1.3;
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
    bossId,
    phaseIndex: isBoss ? 0 : undefined,
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
  next = pushLog(next, `10단계를 넘어서자 강력한 기운이 느껴진다... ${template.name}이(가) 나타났다!`);
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

function tickStatusStart(statusEffects: { type: StatusType; value: number; turnsLeft: number }[], hpDelta: (n: number) => void): { effects: typeof statusEffects; stunned: boolean } {
  let stunned = false;
  const effects: typeof statusEffects = [];
  for (const s of statusEffects) {
    if (s.type === 'burn' || s.type === 'bleed') hpDelta(-s.value);
    if (s.type === 'stun') stunned = true;
    const turnsLeft = s.turnsLeft - 1;
    if (turnsLeft > 0) effects.push({ ...s, turnsLeft });
  }
  return { effects, stunned };
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
      const { effects, stunned } = tickStatusStart(player.statusEffects, (d) => (dmgAcc += d));
      next = updatePlayer(next, player.id, (p) => clampHp({ ...p, statusEffects: effects, hp: p.hp + dmgAcc }));
      if (dmgAcc < 0) next = pushLog(next, `${player.nickname}이(가) 상태이상으로 ${-dmgAcc} 피해를 입었다.`);
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
  kind: 'spell' | 'item' | 'pass';
  spellId?: string;
  targetMonsterIndex?: number;
  targetPlayerId?: string;
  itemName?: string;
}

function monsterDamageToPlayer(party: ForestParty, playerId: string, rawDmg: number): ForestParty {
  const player = party.seats.find((p) => p?.id === playerId);
  if (!player) return party;
  const statusMult = dmgModifierFromStatus(player.statusEffects, 'taken');
  const buffMult = 1 - player.buffs.combatDamageReductionPct / 100;
  let dmg = Math.max(1, Math.round(rawDmg * statusMult * buffMult) - Math.floor(player.defense / 2));
  dmg = Math.max(1, dmg);
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

  // default: basic attack — priority target (lowest HP% > lowest defense > random)
  const target = pickMonsterTarget(alivePlayers);
  const dmg = liveMonster.attackMin + Math.floor(Math.random() * (liveMonster.attackMax - liveMonster.attackMin + 1));
  next = monsterDamageToPlayer(next, target.id, dmg);
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
      next = monsterDamageToPlayer(next, target.id, dmg);
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
      for (const p of alivePlayers) next = monsterDamageToPlayer(next, p.id, ability.value);
      next = pushLog(next, `${monster.name}의 ${ability.label}! 파티 전체가 ${ability.value} 피해를 입었다.`);
      break;
    }
    case 'drainHp': {
      const target = pickMonsterTarget(alivePlayers);
      next = monsterDamageToPlayer(next, target.id, ability.value);
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

  if (action.kind === 'item') {
    const idx = player.items.findIndex((i) => i === action.itemName);
    if (idx === -1) return party;
    next = updatePlayer(next, playerId, (p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
    if (action.itemName === '치유 물약') {
      next = healPlayer(next, playerId, 25, false);
      next = pushLog(next, `${player.nickname}이(가) 치유 물약을 사용했다. (+25 HP)`);
    } else if (action.itemName === '기력의 부적') {
      next = updatePlayer(next, playerId, (p) => ({ ...p, buffs: { ...p.buffs, combatSpellPowerBonus: p.buffs.combatSpellPowerBonus + 5 } }));
      next = pushLog(next, `${player.nickname}이(가) 기력의 부적을 사용했다. (주문력 +5)`);
    } else if (action.itemName === '민첩의 깃털') {
      next = updatePlayer(next, playerId, (p) => ({ ...p, buffs: { ...p.buffs, nextAdvantage: true } }));
      next = pushLog(next, `${player.nickname}이(가) 민첩의 깃털을 사용했다. (다음 판정 Advantage)`);
    } else if (action.itemName === '수호의 돌') {
      next = updatePlayer(next, playerId, (p) => ({ ...p, shield: p.shield + 30 }));
      next = pushLog(next, `${player.nickname}이(가) 수호의 돌을 사용했다. (보호막 +30)`);
    } else if (action.itemName === '행운의 클로버') {
      next = updatePlayer(next, playerId, (p) => ({ ...p, buffs: { ...p.buffs, combatCritThresholdBonus: p.buffs.combatCritThresholdBonus + 2 } }));
      next = pushLog(next, `${player.nickname}이(가) 행운의 클로버를 사용했다. (크리티컬 확률 증가)`);
    }
    next = advanceTurnIndex(next);
    return advanceToActionableTurn(next);
  }

  if (action.kind === 'spell' && action.spellId) {
    next = castSpell(next, playerId, action);
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

function castSpell(party: ForestParty, playerId: string, action: CombatAction): ForestParty {
  let next = party;
  const player = next.seats.find((p) => p?.id === playerId)!;
  const spell = SPELLS.find((s) => s.id === action.spellId)!;
  const level = player.spellLevels[spell.id] ?? 0;
  const power = spellPowerAtLevel(spell, level) + player.buffs.combatSpellPowerBonus;
  let dc = spellDcAtLevel(spell, level) - player.buffs.nextDcReduction;
  const advantage = player.buffs.nextAdvantage;

  next = { ...next, stats: { ...next.stats, spellsCast: next.stats.spellsCast + 1 } };
  next = updatePlayer(next, playerId, (p) => ({
    ...p,
    buffs: { ...p.buffs, nextDcReduction: 0, nextAdvantage: false },
  }));

  const res = check(player.spellPower, Math.max(5, dc), advantage, player.buffs.combatCritThresholdBonus);
  const critMult = res.crit ? 1.5 : 1;

  if (spell.category === 'attack' || spell.category === 'aoeAttack') {
    if (!res.success) {
      next = pushLog(next, `${player.nickname}의 ${spell.name} 실패... (D20 ${res.roll} + ${player.spellPower} / DC ${res.dc})`);
      if (res.fumble) next = updatePlayer(next, playerId, (p) => ({ ...p, statusEffects: [...p.statusEffects, { type: 'weaken', value: 15, turnsLeft: 1 }] }));
      return next;
    }
    let boost = player.buffs.nextAttackBoost ? 1.5 : 1;
    boost *= 1 + player.buffs.combatDamageBonusPct / 100;
    const dmgBase = Math.round((power + player.spellPower) * critMult * boost);

    if (spell.category === 'aoeAttack' || (spell.category === 'attack' && player.buffs.nextAttackHitsAll)) {
      const perTarget = spell.category === 'attack' ? Math.round(dmgBase * 0.5) : dmgBase;
      next.combat!.monsters.forEach((m, i) => {
        if (m.hp <= 0) return;
        if (evadeCheck(m)) {
          next = pushLog(next, `${m.name}이(가) 공격을 회피했다!`);
          return;
        }
        next = damageMonster(next, i, perTarget, spell);
      });
      next = pushLog(next, `${player.nickname}의 ${spell.name}! 모든 적에게 ${perTarget} 피해.${res.crit ? ' 대성공!' : ''}`);
    } else {
      const idx = action.targetMonsterIndex ?? next.combat!.monsters.findIndex((m) => m.hp > 0);
      const m = next.combat!.monsters[idx];
      if (!m || m.hp <= 0) return next;
      if (evadeCheck(m)) {
        next = pushLog(next, `${m.name}이(가) ${player.nickname}의 공격을 회피했다!`);
        return next;
      }
      next = damageMonster(next, idx, dmgBase, spell);
      next = pushLog(next, `${player.nickname}의 ${spell.name}! ${m.name}에게 ${dmgBase} 피해.${res.crit ? ' 대성공!' : ''}`);
    }
    if (player.buffs.nextAttackBoost || player.buffs.nextAttackHitsAll || player.buffs.combatDamageBonusPct) {
      next = updatePlayer(next, playerId, (p) => ({ ...p, buffs: { ...p.buffs, nextAttackBoost: false, nextAttackHitsAll: false } }));
    }
    return next;
  }

  if (spell.category === 'heal' || spell.category === 'aoeHeal') {
    if (!res.success) {
      next = pushLog(next, `${player.nickname}의 ${spell.name} 실패... (D20 ${res.roll} + ${player.spellPower} / DC ${res.dc})`);
      return next;
    }
    let boost = player.buffs.nextHealBoost ? 1.5 : 1;
    const healBase = Math.round((power + player.spellPower) * critMult * boost);
    if (spell.category === 'aoeHeal') {
      const targets = next.seats.filter((p): p is Player => !!p);
      for (const t of targets) {
        const revive = spell.id === 'rennervate' && t.downed;
        next = healPlayer(next, t.id, spell.id === 'rennervate' ? Math.round(healBase * 0.6) : healBase, revive);
      }
      next = pushLog(next, `${player.nickname}의 ${spell.name}! 파티 전체 ${healBase} 회복.${res.crit ? ' 대성공!' : ''}`);
    } else {
      const targetId = action.targetPlayerId ?? playerId;
      const revive = false;
      next = healPlayer(next, targetId, healBase, revive);
      if (spell.id === 'vulnera-sanentur') {
        next = updatePlayer(next, targetId, (p) => ({ ...p, statusEffects: p.statusEffects.filter((s) => s.type !== 'bleed') }));
      }
      const targetName = next.seats.find((p) => p?.id === targetId)?.nickname ?? '동료';
      next = pushLog(next, `${player.nickname}의 ${spell.name}! ${targetName}이(가) ${healBase} 회복.${res.crit ? ' 대성공!' : ''}`);
    }
    if (player.buffs.nextHealBoost) next = updatePlayer(next, playerId, (p) => ({ ...p, buffs: { ...p.buffs, nextHealBoost: false } }));
    return next;
  }

  // defense / aoeDefense
  if (!res.success) {
    next = pushLog(next, `${player.nickname}의 ${spell.name} 실패... 방어 마법이 발동하지 않았다.`);
    return next;
  }
  let boost = player.buffs.nextDefenseBoost ? 1.5 : 1;
  if (player.buffs.nextShieldDouble) boost *= 2;
  const amount = Math.round(power * critMult * boost);

  if (spell.category === 'defense') {
    if (spell.id === 'salvio-hexia') {
      next = updatePlayer(next, playerId, (p) => ({ ...p, statusEffects: [...p.statusEffects, { type: 'vulnerable', value: -amount, turnsLeft: 2 }] }));
    } else {
      next = updatePlayer(next, playerId, (p) => ({ ...p, shield: p.shield + amount }));
    }
    next = pushLog(next, `${player.nickname}의 ${spell.name}! 방어막 +${amount}.${res.crit ? ' 대성공!' : ''}`);
  } else {
    next = applyToAllSeats(next, (p) => (p ? { ...p, shield: p.shield + Math.round(amount * 0.6) } : p));
    next = pushLog(next, `${player.nickname}의 ${spell.name}! 파티 전체 방어막 +${Math.round(amount * 0.6)}.${res.crit ? ' 대성공!' : ''}`);
  }
  if (player.buffs.nextDefenseBoost || player.buffs.nextShieldDouble) {
    next = updatePlayer(next, playerId, (p) => ({ ...p, buffs: { ...p.buffs, nextDefenseBoost: false, nextShieldDouble: false } }));
  }
  return next;
}

function damageMonster(party: ForestParty, index: number, dmg: number, _spell: ReturnType<typeof SPELLS.find>): ForestParty {
  let next = party;
  const monster = next.combat!.monsters[index];
  const { shield, dmg: afterShield } = absorbShield(monster.shield, dmg);
  next = updateMonster(next, index, (m) => ({ ...m, hp: Math.max(0, m.hp - afterShield), shield }));
  return next;
}

// ---------- skill points ----------

export function upgradeSpell(party: ForestParty, playerId: string, spellId: string): ForestParty {
  const player = party.seats.find((p) => p?.id === playerId);
  if (!player || player.skillPoints <= 0) return party;
  if (!SPELLS.some((s) => s.id === spellId)) return party;
  const level = player.spellLevels[spellId] ?? 0;
  if (level >= 5) return party;
  return updatePlayer(party, playerId, (p) => ({
    ...p,
    skillPoints: p.skillPoints - 1,
    spellLevels: { ...p.spellLevels, [spellId]: level + 1 },
  }));
}

export function currentActingPlayerId(party: ForestParty): string | null {
  const cur = currentCombatant(party);
  return cur?.kind === 'player' ? (cur.player?.id ?? null) : null;
}

export { MONSTER_TEMPLATES, templateById };
