import type { SkillDef, SkillId } from './types';

// MP is its own resource, decoupled from intelligence — it starts at the profile's real maxMp (base
// 100, grown only by forest-clear rewards, same as maxHp/maxStamina) and never scales with a stat.
// Intelligence drives a damage skill's success chance (1~800 roll vs. intelligence — see engine.ts's
// rollStatCheck), and on a hit its magnitude comes from a separate 1~500 roll (rollSpellPower), not
// the caster's own spellPower stat. spellPower still drives heal/MP-heal magnitude, and agility drives
// evasion (same 1~800-roll mechanic) plus defense-skill (shield) magnitude.

// ---------- skill leveling ----------
export const SKILL_MAX_LEVEL = 5;

export const SKILLS: SkillDef[] = [
  { id: 'personalAttack', name: '마법탄', description: '적 1 명을 공격한다.', targetType: 'enemy', effectType: 'damage', baseValue: 20, valuePerLevel: 6, baseMpCost: 5 },
  { id: 'aoeAttack', name: '마법 폭풍', description: '모든 적을 동시에 공격한다.', targetType: 'enemyAll', effectType: 'damage', baseValue: 10, valuePerLevel: 3, baseMpCost: 12 },
  { id: 'personalDefense', name: '프로테고', description: '아군 1 명을 방어한다.', targetType: 'ally', effectType: 'defense', baseValue: 30, valuePerLevel: 8, baseMpCost: 6 },
  { id: 'aoeDefense', name: '프로테고 막시마', description: '모든 아군에게 방어 효과를 부여한다.', targetType: 'allyAll', effectType: 'defense', baseValue: 15, valuePerLevel: 4, baseMpCost: 14 },
  { id: 'personalHeal', name: '에피스키', description: '아군 1 명의 HP를 회복한다.', targetType: 'ally', effectType: 'healHp', baseValue: 25, valuePerLevel: 7, baseMpCost: 7 },
  { id: 'aoeHeal', name: '레나르보', description: '모든 아군의 HP를 회복한다.', targetType: 'allyAll', effectType: 'healHp', baseValue: 12, valuePerLevel: 4, baseMpCost: 15 },
  { id: 'personalMpHeal', name: '마나 리스토', description: '아군 1 명의 MP를 회복한다.', targetType: 'ally', effectType: 'healMp', baseValue: 15, valuePerLevel: 4, baseMpCost: 5 },
  { id: 'aoeMpHeal', name: '마나 리스토 막시마', description: '모든 아군의 MP를 회복한다.', targetType: 'allyAll', effectType: 'healMp', baseValue: 8, valuePerLevel: 2, baseMpCost: 12 },
  { id: 'finiteIncantatem', name: '피니테 인칸타템', description: '아군 1 명에게 걸린 상태 이상을 해제한다.', targetType: 'ally', effectType: 'cleanse', baseValue: 0, valuePerLevel: 0, baseMpCost: 8 },
];

export function skillById(id: SkillId): SkillDef {
  const skill = SKILLS.find((s) => s.id === id);
  if (!skill) throw new Error(`unknown skill: ${id}`);
  return skill;
}

const TARGET_LABEL: Record<SkillDef['targetType'], string> = {
  enemy: '지정 1 인',
  enemyAll: '전체',
  ally: '아군 1 인',
  allyAll: '아군 전체',
};

const EFFECT_LABEL: Record<SkillDef['effectType'], string> = {
  damage: '공격',
  defense: '방어',
  healHp: 'HP 회복',
  healMp: 'MP 회복',
  cleanse: '상태 이상 해제',
};

/** Short "(전체 공격)" style tag summarizing who a skill hits and what it does, for display next to its name. */
export function skillTag(skill: SkillDef): string {
  return `${TARGET_LABEL[skill.targetType]} ${EFFECT_LABEL[skill.effectType]}`;
}

export function skillValueAtLevel(skill: SkillDef, level: number): number {
  return skill.baseValue + level * skill.valuePerLevel;
}

/** MP cost falls with level and can reach 0 once a skill is maxed out. */
export function skillMpCostAtLevel(skill: SkillDef, level: number): number {
  const reductionPerLevel = Math.ceil(skill.baseMpCost / SKILL_MAX_LEVEL);
  return Math.max(0, skill.baseMpCost - level * reductionPerLevel);
}
