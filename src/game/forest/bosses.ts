import type { BossTemplate, Monster } from './types';

function phase1(name: string, ability: BossTemplate['phases'][0]['abilities'][0]): BossTemplate['phases'][0] {
  return { name, abilities: [ability], abilityChance: 0.3 };
}

export const BOSS_TEMPLATES: BossTemplate[] = [
  {
    id: 'B001',
    name: '숲의 고대 거미 여왕',
    description: '거미줄과 독으로 사냥감을 옭아매는 숲 깊은 곳의 지배자.',
    phases: [
      phase1('평온한 지배자', { effect: 'poison', value: 8, label: '거미줄' }),
      { name: '분노한 여왕', abilities: [{ effect: 'poison', value: 12, label: '맹독' }, { effect: 'summon', value: 1, label: '새끼 거미 소환' }], abilityChance: 0.5 },
      { name: '최후의 발악', abilities: [{ effect: 'aoeDamage', value: 20, label: '전체 독성 공격' }], abilityChance: 0.6 },
    ],
  },
  {
    id: 'B002',
    name: '타락한 켄타우로스 왕',
    description: '별자리의 힘을 오용하여 타락한 옛 켄타우로스족의 왕.',
    phases: [
      phase1('경계하는 왕', { effect: 'extraDamage', value: 15, label: '강력한 단일 공격' }),
      { name: '돌진하는 왕', abilities: [{ effect: 'extraDamage', value: 20, label: '돌진' }, { effect: 'weakenParty', value: 12, label: '별자리 마법' }], abilityChance: 0.5 },
      { name: '최후의 왕', abilities: [{ effect: 'extraDamage', value: 28, label: '예고된 일격' }], abilityChance: 0.6 },
    ],
  },
  {
    id: 'B003',
    name: '금지된 숲의 맨티코어',
    description: '사자의 몸과 전갈의 꼬리를 가진 위험한 포식자.',
    phases: [
      phase1('사냥하는 맨티코어', { effect: 'poison', value: 10, label: '꼬리 독침' }),
      { name: '흥분한 맨티코어', abilities: [{ effect: 'aoeDamage', value: 18, label: '광역 공격' }, { effect: 'extraDamage', value: 18, label: '돌진' }], abilityChance: 0.5 },
      { name: '광폭화된 맨티코어', abilities: [{ effect: 'shieldSelf', value: 40, label: '방어막' }, { effect: 'aoeDamage', value: 24, label: '전체 돌진' }], abilityChance: 0.6 },
    ],
  },
  {
    id: 'B004',
    name: '그림자 히포그리프',
    description: '그림자 속에 몸을 숨기고 급습하는 변이된 히포그리프.',
    phases: [
      phase1('경계 비행', { effect: 'extraDamage', value: 14, label: '공중 공격' }),
      { name: '그림자 이동', abilities: [{ effect: 'evade', value: 40, label: '그림자 이동' }, { effect: 'extraDamage', value: 18, label: '랜덤 공격' }], abilityChance: 0.5 },
      { name: '전력 비행', abilities: [{ effect: 'evade', value: 30, label: '회피' }, { effect: 'aoeDamage', value: 20, label: '급강하 공격' }], abilityChance: 0.6 },
    ],
  },
  {
    id: 'B005',
    name: '고대 마법 나무',
    description: '수백 년간 숲의 마력을 흡수해 살아 움직이게 된 거목.',
    phases: [
      phase1('뿌리내린 나무', { effect: 'stun', value: 1, label: '뿌리 속박' }),
      { name: '흡수하는 나무', abilities: [{ effect: 'drainHp', value: 18, label: 'HP 흡수' }, { effect: 'aoeDamage', value: 14, label: '광역 공격' }], abilityChance: 0.5 },
      { name: '각성한 나무', abilities: [{ effect: 'healSelf', value: 40, label: '자기 회복' }, { effect: 'aoeDamage', value: 22, label: '광역 공격' }], abilityChance: 0.6 },
    ],
  },
  {
    id: 'B006',
    name: '디멘터 군주',
    description: '숲을 배회하는 디멘터 무리를 이끄는 근원적인 존재.',
    phases: [
      phase1('배회하는 군주', { effect: 'fear', value: 15, label: '공포' }),
      { name: '흡수하는 군주', abilities: [{ effect: 'drainHp', value: 20, label: 'HP 흡수' }, { effect: 'weakenParty', value: 15, label: '전체 약화' }], abilityChance: 0.5 },
      { name: '절망의 군주', abilities: [{ effect: 'aoeDamage', value: 22, label: '전체 공격' }, { effect: 'weakenParty', value: 15, label: '주문력 감소' }], abilityChance: 0.6 },
    ],
  },
  {
    id: 'B007',
    name: '숲의 수호룡',
    description: '금지된 숲의 가장 깊은 곳을 지키는 늙은 용.',
    phases: [
      phase1('잠에서 깬 용', { effect: 'extraDamage', value: 18, label: '꼬리 공격' }),
      { name: '비행하는 용', abilities: [{ effect: 'evade', value: 25, label: '비행' }, { effect: 'aoeDamage', value: 20, label: '화염 브레스' }], abilityChance: 0.5 },
      { name: '분노한 용', abilities: [{ effect: 'aoeDamage', value: 28, label: '광역 화염' }], abilityChance: 0.65 },
    ],
  },
  {
    id: 'B008',
    name: '타락한 그래폰',
    description: '어둠의 마력에 물들어 흉포해진 그래폰.',
    phases: [
      phase1('경계하는 그래폰', { effect: 'extraDamage', value: 16, label: '발톱 공격' }),
      { name: '광폭화된 그래폰', abilities: [{ effect: 'buffSelf', value: 20, label: '포효' }, { effect: 'extraDamage', value: 20, label: '강타' }], abilityChance: 0.5 },
      { name: '최후의 그래폰', abilities: [{ effect: 'aoeDamage', value: 24, label: '전방위 공격' }], abilityChance: 0.6 },
    ],
  },
  {
    id: 'B009',
    name: '고대 마법 생물 키메라',
    description: '여러 생물의 특성이 뒤섞인 금지된 실험의 결과물.',
    phases: [
      phase1('사자의 머리', { effect: 'extraDamage', value: 16, label: '물리 공격' }),
      { name: '뱀의 머리', abilities: [{ effect: 'poison', value: 12, label: '독' }, { effect: 'extraDamage', value: 16, label: '물어뜯기' }], abilityChance: 0.5 },
      { name: '용의 머리', abilities: [{ effect: 'aoeDamage', value: 24, label: '화염' }], abilityChance: 0.65 },
    ],
  },
  {
    id: 'B010',
    name: '숲의 심장',
    description: '금지된 숲 그 자체의 의지가 형상화된 존재.',
    phases: [
      phase1('고요한 심장', { effect: 'healSelf', value: 20, label: '숲의 회복' }),
      { name: '요동치는 심장', abilities: [{ effect: 'summon', value: 1, label: '숲의 정령 소환' }, { effect: 'aoeDamage', value: 18, label: '광역 공격' }], abilityChance: 0.5 },
      { name: '폭주하는 심장', abilities: [{ effect: 'aoeDamage', value: 26, label: '강력한 광역기' }], abilityChance: 0.65 },
    ],
  },
];

const SCALE_BY_SIZE: Record<number, { hp: number; atkMin: number; atkMax: number }> = {
  2: { hp: 500, atkMin: 35, atkMax: 50 },
  3: { hp: 700, atkMin: 40, atkMax: 55 },
  4: { hp: 900, atkMin: 45, atkMax: 60 },
};

/** Scales purely with party size — there's no monster-side defense stat any more (see creatures.ts's spawnMonster). */
export function spawnBoss(template: BossTemplate, partySize: number): Monster {
  const scale = SCALE_BY_SIZE[Math.min(4, Math.max(2, partySize))];
  return {
    templateId: template.id,
    name: template.name,
    hp: scale.hp,
    maxHp: scale.hp,
    attackMin: scale.atkMin,
    attackMax: scale.atkMax,
    abilities: template.phases[0].abilities,
    statusEffects: [],
    shield: 0,
  };
}

export function bossPhaseIndex(boss: Monster): 0 | 1 | 2 {
  const pct = boss.hp / boss.maxHp;
  if (pct > 0.7) return 0;
  if (pct > 0.4) return 1;
  return 2;
}

export function templateByBossId(id: string): BossTemplate {
  const t = BOSS_TEMPLATES.find((b) => b.id === id);
  if (!t) throw new Error(`unknown boss: ${id}`);
  return t;
}
