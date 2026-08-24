import type { PatronusDef, PatronusId } from './types';

/**
 * The 12 Patronus species. Every player casts the same spell name — 익스펙토 패트로눔 — but
 * its effect is entirely determined by the species an admin assigned them after signup.
 * All duration values are in the affected target's own turns (see engine.ts's per-turn
 * status ticking), not global combat rounds — matching every other status effect already.
 */
export const PATRONUS_LIST: PatronusDef[] = [
  { id: 'snake', name: '보아뱀', effectLabel: '독', description: '적 1명에게 즉시 피해를 주고 독 상태를 부여한다.', targetType: 'enemy', baseMpCost: 12, baseValue: 15, statusType: 'poison', statusDuration: 3 },
  { id: 'tiger', name: '호랑이', effectLabel: '동요', description: '적 1명에게 피해를 주고 동요 상태(행동 불가)를 부여한다.', targetType: 'enemy', baseMpCost: 14, baseValue: 10, statusType: 'daze', statusDuration: 3 },
  { id: 'squirrel', name: '다람쥐', effectLabel: '명중 강화', description: '아군 1명의 지능을 일시적으로 높인다.', targetType: 'ally', baseMpCost: 10, baseValue: 10, statusType: 'intBoost', statusDuration: 3 },
  { id: 'panther', name: '흑표범', effectLabel: '회피 강화', description: '아군 1명의 민첩을 일시적으로 높인다.', targetType: 'ally', baseMpCost: 10, baseValue: 10, statusType: 'agiBoost', statusDuration: 3 },
  { id: 'lark', name: '종달새', effectLabel: '추가 공격', description: '아군 1명이 공격할 때마다 함께 추가 피해를 입힌다.', targetType: 'ally', baseMpCost: 12, baseValue: 8, statusType: 'followAttack', statusDuration: 3 },
  { id: 'cat', name: '고양이', effectLabel: '지속 회복', description: '아군 1명의 HP를 즉시 회복시키고, 이후 턴마다 추가로 회복시킨다.', targetType: 'ally', baseMpCost: 12, baseValue: 10, statusType: 'regenHp', statusDuration: 3 },
  { id: 'fox', name: '여우', effectLabel: '매혹', description: '적 1명을 매혹시켜 아군이 아닌 대상을 공격하게 한다.', targetType: 'enemy', baseMpCost: 14, baseValue: 0, statusType: 'charm', statusDuration: 3 },
  { id: 'snail', name: '달팽이', effectLabel: '회피 저하', description: '적 1명의 민첩을 일시적으로 낮춘다.', targetType: 'enemy', baseMpCost: 10, baseValue: 10, statusType: 'agiDown', statusDuration: 3 },
  { id: 'gecko', name: '게코', effectLabel: '크리티컬 강화', description: '아군 1명의 크리티컬 확률을 일시적으로 높인다.', targetType: 'ally', baseMpCost: 11, baseValue: 10, statusType: 'critBoost', statusDuration: 3 },
  { id: 'giraffe', name: '기린', effectLabel: '지속 MP 회복', description: '아군 1명의 MP를 즉시 회복시키고, 이후 턴마다 추가로 회복시킨다.', targetType: 'ally', baseMpCost: 12, baseValue: 8, statusType: 'regenMp', statusDuration: 3 },
  // statusDuration is 2, not 1: this engine ticks a status down at the START of the affected
  // unit's own turn (before it acts) — see tickStatusStart in engine.ts — so a duration of 1
  // always expires on that very first tick and never actually applies to anything. Duration 2
  // is what actually produces "active for exactly one of the target's own turns."
  { id: 'pony', name: '조랑말', effectLabel: '민첩 강화', description: '아군 전원의 민첩을 각자의 다음 한 턴 동안 높인다.', targetType: 'allyAll', baseMpCost: 18, baseValue: 10, statusType: 'agiBoost', statusDuration: 2 },
  { id: 'otter', name: '해달', effectLabel: '혼란', description: '적 전원을 각자의 다음 한 턴 동안 혼란시켜 서로를 공격하게 한다.', targetType: 'enemyAll', baseMpCost: 18, baseValue: 0, statusType: 'confuse', statusDuration: 2 },
];

export function patronusById(id: PatronusId): PatronusDef {
  const p = PATRONUS_LIST.find((x) => x.id === id);
  if (!p) throw new Error(`unknown patronus: ${id}`);
  return p;
}
