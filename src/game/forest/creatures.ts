import type { Monster, MonsterAbility, MonsterTemplate } from './types';

const poison = (v = 5): MonsterAbility => ({ effect: 'poison', value: v, label: '중독' });
const stun = (): MonsterAbility => ({ effect: 'stun', value: 1, label: '제압' });
const extra = (v = 8): MonsterAbility => ({ effect: 'extraDamage', value: v, label: '강타' });
const healSelf = (v = 15): MonsterAbility => ({ effect: 'healSelf', value: v, label: '자기 치유' });
const buffSelf = (v = 20): MonsterAbility => ({ effect: 'buffSelf', value: v, label: '포효' });
const aoe = (v = 10): MonsterAbility => ({ effect: 'aoeDamage', value: v, label: '광역 공격' });
const drain = (v = 10): MonsterAbility => ({ effect: 'drainHp', value: v, label: '생명력 흡수' });
const fear = (v = 15): MonsterAbility => ({ effect: 'fear', value: v, label: '공포' });
const weakenParty = (v = 10): MonsterAbility => ({ effect: 'weakenParty', value: v, label: '전체 약화' });
const shieldSelf = (v = 30): MonsterAbility => ({ effect: 'shieldSelf', value: v, label: '보호막' });
const evade = (v = 40): MonsterAbility => ({ effect: 'evade', value: v, label: '회피' });

interface Row {
  id: string;
  name: string;
  tier: MonsterTemplate['tier'];
  abilities: MonsterAbility[];
}

const ROWS: Row[] = [
  { id: 'C001', name: '거대 거미', tier: 1, abilities: [poison()] },
  { id: 'C002', name: '아크로맨툴라', tier: 2, abilities: [poison(7), extra()] },
  { id: 'C003', name: '늑대인간', tier: 2, abilities: [extra(12)] },
  { id: 'C004', name: '디멘터', tier: 2, abilities: [fear(), drain(12)] },
  { id: 'C005', name: '보가트', tier: 1, abilities: [buffSelf()] },
  { id: 'C006', name: '켄타우로스', tier: 1, abilities: [extra()] },
  { id: 'C007', name: '그래폰', tier: 2, abilities: [evade()] },
  { id: 'C008', name: '히포그리프', tier: 1, abilities: [evade(30)] },
  { id: 'C009', name: '테레스트랄', tier: 1, abilities: [evade(30)] },
  { id: 'C010', name: '금빛 스니젯', tier: 1, abilities: [evade(50)] },
  { id: 'C011', name: '퍼프스캔', tier: 1, abilities: [evade(40)] },
  { id: 'C012', name: '플러피', tier: 3, abilities: [stun(), aoe(12)] },
  { id: 'C013', name: '맨티코어', tier: 3, abilities: [poison(8), aoe(14)] },
  { id: 'C014', name: '늪지 괴물', tier: 2, abilities: [drain(10)] },
  { id: 'C015', name: '흑표범형 마법 생물', tier: 2, abilities: [extra(10)] },
  { id: 'C016', name: '거대한 박쥐', tier: 1, abilities: [drain(8)] },
  { id: 'C017', name: '독성 뱀', tier: 1, abilities: [poison(6)] },
  { id: 'C018', name: '마법 늑대', tier: 2, abilities: [extra(10)] },
  { id: 'C019', name: '숲의 임프', tier: 1, abilities: [extra(6)] },
  { id: 'C020', name: '픽시 무리', tier: 1, abilities: [evade(35)] },
  { id: 'C021', name: '악마의 덫', tier: 2, abilities: [stun()] },
  { id: 'C022', name: '보우트러클 무리', tier: 1, abilities: [poison(4)] },
  { id: 'C023', name: '니플러 무리', tier: 1, abilities: [evade(30)] },
  { id: 'C024', name: '독성 식물', tier: 2, abilities: [poison(7)] },
  { id: 'C025', name: '폭발성 버섯', tier: 2, abilities: [aoe(12)] },
  { id: 'C026', name: '그림자 사슴', tier: 2, abilities: [evade(35), fear(10)] },
  { id: 'C027', name: '마력 흡수 거미', tier: 3, abilities: [drain(14), poison(6)] },
  { id: 'C028', name: '숲의 고블린', tier: 'elite', abilities: [extra(15), buffSelf()] },
  { id: 'C029', name: '흑마법에 오염된 켄타우로스', tier: 'elite', abilities: [weakenParty(), extra(18)] },
  { id: 'C030', name: '고대 마법 생물', tier: 'elite', abilities: [shieldSelf(40), aoe(16), healSelf(25)] },
];

const TIER_RANGES: Record<MonsterTemplate['tier'], { hp: [number, number]; dc: [number, number]; atk: [number, number] }> = {
  1: { hp: [40, 70], dc: [9, 12], atk: [8, 15] },
  2: { hp: [70, 110], dc: [12, 15], atk: [12, 22] },
  3: { hp: [110, 180], dc: [15, 18], atk: [18, 30] },
  elite: { hp: [180, 260], dc: [18, 21], atk: [25, 40] },
};

export const MONSTER_TEMPLATES: MonsterTemplate[] = ROWS.map((r) => {
  const range = TIER_RANGES[r.tier];
  return {
    id: r.id,
    name: r.name,
    tier: r.tier,
    hpMin: range.hp[0],
    hpMax: range.hp[1],
    defenseDcMin: range.dc[0],
    defenseDcMax: range.dc[1],
    attackMin: range.atk[0],
    attackMax: Math.round((range.atk[0] + range.atk[1]) / 2),
    abilities: r.abilities,
  };
});

function seedFor(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
function rand01(seed: number): number {
  return (seed % 1000) / 1000;
}
function randRange(seed: number, min: number, max: number): number {
  return min + Math.floor(rand01(seed) * (max - min + 1));
}

export function spawnMonster(template: MonsterTemplate, sizeScale: number, instanceSalt = 0): Monster {
  const seed = seedFor(`${template.id}:${instanceSalt}:${Date.now() % 100000}:${Math.random()}`);
  const hp = Math.round(randRange(seed, template.hpMin, template.hpMax) * sizeScale);
  return {
    templateId: template.id,
    name: template.name,
    hp,
    maxHp: hp,
    defenseDC: randRange(seed + 1, template.defenseDcMin, template.defenseDcMax),
    attackMin: Math.round(template.attackMin * sizeScale),
    attackMax: Math.round(template.attackMax * sizeScale),
    abilities: template.abilities,
    statusEffects: [],
    shield: 0,
  };
}

export function templateById(id: string): MonsterTemplate {
  const t = MONSTER_TEMPLATES.find((m) => m.id === id);
  if (!t) throw new Error(`unknown monster template: ${id}`);
  return t;
}

export function randomTemplateForStage(stage: number, wantElite: boolean): MonsterTemplate {
  let pool: MonsterTemplate[];
  if (wantElite) {
    pool = MONSTER_TEMPLATES.filter((m) => m.tier === 'elite' || m.tier === 3);
  } else if (stage <= 3) {
    pool = MONSTER_TEMPLATES.filter((m) => m.tier === 1);
  } else if (stage <= 6) {
    pool = MONSTER_TEMPLATES.filter((m) => m.tier === 1 || m.tier === 2);
  } else if (stage <= 9) {
    pool = MONSTER_TEMPLATES.filter((m) => m.tier === 2 || m.tier === 3);
  } else {
    pool = MONSTER_TEMPLATES.filter((m) => m.tier === 3 || m.tier === 'elite');
  }
  if (pool.length === 0) pool = MONSTER_TEMPLATES;
  return pool[Math.floor(Math.random() * pool.length)];
}
