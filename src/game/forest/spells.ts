import type { Spell } from './types';

export const SPELLS: Spell[] = [
  // 개인 공격
  { id: 'expelliarmus', name: 'Expelliarmus', category: 'attack', dc: 10, power: 15, description: '무장해제 주문. 적의 다음 공격 성공률을 낮춘다.' },
  { id: 'stupefy', name: 'Stupefy', category: 'attack', dc: 12, power: 20, description: '기절 주문. 일정 확률로 적의 행동을 중단시킨다.', statusOnHit: 'stun', statusChance: 0.3, statusTurns: 1 },
  { id: 'confringo', name: 'Confringo', category: 'attack', dc: 14, power: 28, description: '폭발 주문. 화상을 입힌다.', statusOnHit: 'burn', statusChance: 0.5, statusValue: 5, statusTurns: 2 },
  { id: 'diffindo', name: 'Diffindo', category: 'attack', dc: 11, power: 18, description: '절단 주문. 출혈을 유발한다.', statusOnHit: 'bleed', statusChance: 0.5, statusValue: 4, statusTurns: 2 },
  { id: 'reducto', name: 'Reducto', category: 'attack', dc: 16, power: 35, description: '분쇄 주문. 매우 높은 피해량.' },
  { id: 'bombarda', name: 'Bombarda', category: 'attack', dc: 15, power: 32, description: '폭파 주문. 방어막을 가진 적에게 추가 피해.' },
  // 전체 공격
  { id: 'incendio', name: 'Incendio', category: 'aoeAttack', dc: 12, power: 15, description: '화염 주문. 모든 적에게 화상을 입힐 수 있다.', statusOnHit: 'burn', statusChance: 0.35, statusValue: 4, statusTurns: 2 },
  { id: 'bombarda-maxima', name: 'Bombarda Maxima', category: 'aoeAttack', dc: 18, power: 30, description: '광역 폭파 주문. 모든 적에게 강력한 피해.' },
  { id: 'glacius', name: 'Glacius', category: 'aoeAttack', dc: 14, power: 18, description: '냉기 주문. 적을 둔화시킬 수 있다.', statusOnHit: 'slow', statusChance: 0.4, statusTurns: 2 },
  { id: 'depulso', name: 'Depulso', category: 'aoeAttack', dc: 13, power: 20, description: '가격 주문. 적의 공격력을 낮춘다.', statusOnHit: 'weaken', statusChance: 0.5, statusValue: 25, statusTurns: 2 },
  // 개인 방어
  { id: 'protego', name: 'Protego', category: 'defense', dc: 10, power: 25, description: '다음 피해를 25 흡수한다.' },
  { id: 'protego-maxima', name: 'Protego Maxima', category: 'defense', dc: 15, power: 40, description: '다음 피해를 40 흡수한다.' },
  { id: 'repello', name: 'Repello', category: 'defense', dc: 13, power: 50, description: '다음 공격의 피해를 50% 감소시킨다.' },
  { id: 'salvio-hexia', name: 'Salvio Hexia', category: 'defense', dc: 16, power: 25, description: '2턴 동안 받는 피해를 25% 감소시킨다.' },
  // 전체 방어
  { id: 'protego-totalum', name: 'Protego Totalum', category: 'aoeDefense', dc: 15, power: 25, description: '파티 전원, 다음 공격에서 받는 피해 25% 감소.' },
  { id: 'fianto-duri', name: 'Fianto Duri', category: 'aoeDefense', dc: 18, power: 30, description: '파티 전원, 2턴 동안 받는 피해 30% 감소.' },
  { id: 'cave-inimicum', name: 'Cave Inimicum', category: 'aoeDefense', dc: 16, power: 50, description: '다음 적의 전체 공격 피해를 크게 감소시킨다.' },
  // 개인 치유
  { id: 'episkey', name: 'Episkey', category: 'heal', dc: 10, power: 20, description: '기본 치유 주문.' },
  { id: 'ferula', name: 'Ferula', category: 'heal', dc: 12, power: 25, description: '붕대 주문. 다음 턴까지 소량 지속 회복.' },
  { id: 'vulnera-sanentur', name: 'Vulnera Sanentur', category: 'heal', dc: 17, power: 40, description: '심층 치유 주문. 출혈 상태를 제거한다.' },
  // 전체 치유
  { id: 'brackium-emendo', name: 'Brackium Emendo', category: 'aoeHeal', dc: 14, power: 20, description: '파티 전원 회복.' },
  { id: 'rennervate', name: 'Rennervate', category: 'aoeHeal', dc: 15, power: 15, description: '파티 전원 회복. 기절/다운 상태 해제.' },
  { id: 'episkey-maxima', name: 'Episkey Maxima', category: 'aoeHeal', dc: 18, power: 35, description: '파티 전원 대량 회복.' },
];

export function spellById(id: string): Spell {
  const spell = SPELLS.find((s) => s.id === id);
  if (!spell) throw new Error(`unknown spell: ${id}`);
  return spell;
}

export function spellPowerAtLevel(spell: Spell, level: number): number {
  return spell.power + level * Math.round(spell.power * 0.15);
}

export function spellDcAtLevel(spell: Spell, level: number): number {
  return Math.max(5, spell.dc - level);
}

// ---------- TRPG-style accuracy/damage split ----------
// Intelligence drives hit chance (the accuracy roll bonus) and max MP.
// SpellPower drives damage only (already the case — see castSpell in engine.ts).
// These are kept as named constants, not inlined, so they're easy to rebalance later.
export const BASE_MP = 20;
export const MP_PER_INTELLIGENCE = 2;
export const MP_COST_PER_DC = 0.5;

export function maxMpFor(intelligence: number): number {
  return BASE_MP + intelligence * MP_PER_INTELLIGENCE;
}

/** MP cost scales with the spell's current (post-level) DC — mastering a spell (lower DC) also makes it cheaper to cast. */
export function spellMpCost(spell: Spell, level: number): number {
  return Math.max(1, Math.round(spellDcAtLevel(spell, level) * MP_COST_PER_DC));
}
