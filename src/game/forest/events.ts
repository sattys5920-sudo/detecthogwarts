import type { EventCategory, ForestEvent, PlayerBuffs, StatusType } from './types';

function seedFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}
function rand01(id: string, salt: number): number {
  return (seedFor(`${id}:${salt}`) % 1000) / 1000;
}
function randInt(id: string, salt: number, min: number, max: number): number {
  return min + Math.floor(rand01(id, salt) * (max - min + 1));
}

const HEAL_TITLES = [
  '달빛 버섯 발견', '마법의 샘 발견', '따뜻한 빛이 감싼다', '작은 요정의 축복', '황금 열매 발견',
  '마법의 이끼 발견', '오래된 치료용 약초 발견', '숲의 정령이 HP를 회복시킨다', '맑은 물을 발견', '새벽빛이 몸을 감싼다',
  '회복의 나무', '치유의 꽃밭', '달빛 열매', '따뜻한 동굴', '수호 정령의 축복',
  '마법의 꿀 발견', '상처를 치료하는 버섯', '회복의 돌', '생명의 나뭇가지', '숲의 축복',
];
const MAX_HP_INDICES = new Set([1, 9, 19]);

const SPELLPOWER_TITLES = [
  '마법의 룬 발견', '고대 마법진 발견', '지팡이가 빛난다', '신비한 수정 발견', '마력의 샘',
  '고대 주문서 한 페이지', '마법 생물의 깃털', '별빛이 지팡이에 깃든다', '숲의 마력이 폭발한다', '고대 마법의 잔향',
  '마력의 열매', '수상한 보라색 수정', '마법의 나무 심장', '오래된 마법사의 유품', '별똥별 조각',
];

const DEFENSE_TITLES = [
  '나무껍질 갑옷', '돌의 축복', '수호 부적 발견', '거대한 나무의 보호', '방어의 룬',
  '은빛 잎사귀', '마법 장벽 발견', '오래된 수호석', '숲의 수호자 축복', '단단한 나무의 힘',
];

const BUFF_TITLES: [string, keyof PlayerBuffs, number][] = [
  ['다음 공격 강화', 'nextAttackBoost', 0],
  ['다음 치유 강화', 'nextHealBoost', 0],
  ['다음 방어 마법 강화', 'nextDefenseBoost', 0],
  ['다음 판정 Advantage', 'nextAdvantage', 0],
  ['다음 전투 주문력 +5', 'combatSpellPowerBonus', 5],
  ['다음 전투 피해 25% 증가', 'combatDamageBonusPct', 25],
  ['다음 전투 받는 피해 25% 감소', 'combatDamageReductionPct', 25],
  ['다음 마법 크리티컬 확률 증가', 'combatCritThresholdBonus', 1],
  ['다음 몬스터의 첫 공격 무효화', 'nextAttackNullified', 0],
  ['다음 주문의 DC -3', 'nextDcReduction', 3],
  ['다음 치유량 50% 증가', 'nextHealBoost', 0],
  ['다음 공격 전체 적에게 추가 피해', 'nextAttackHitsAll', 0],
  ['다음 방어막 2배', 'nextShieldDouble', 0],
  ['다음 전투 선공', 'firstStrikeNextCombat', 0],
  ['다음 이벤트 선택지 미리 공개', 'revealNextPaths', 0],
];

const NEUTRAL_TITLES = [
  '이상한 발자국', '오래된 캠프 발견', '부서진 지팡이 발견', '정체불명의 망토', '빈 상자',
  '이상한 울음소리', '숲속의 종소리', '움직이는 나무', '갑자기 비가 내린다', '안개가 걷힌다',
  '오래된 동상', '마법사의 흔적', '정체불명의 편지', '빛나는 나뭇잎', '길을 표시하는 돌',
  '수상한 발자국', '누군가의 지팡이', '오래된 횃불', '버려진 캠프파이어', '정체불명의 목소리',
];

const PENALTY_TITLES = [
  '독성 안개', '미끄러운 뿌리', '갑작스러운 낙석', '마법 폭풍', '검은 덩굴',
  '지면 붕괴', '환각의 꽃가루', '기억을 흐리는 안개', '지팡이가 일시적으로 불안정해짐', '마력 흡수 나무',
  '발목을 잡는 뿌리', '방향 감각 상실', '갑작스러운 냉기', '저주받은 나뭇가지', '독성 꽃',
  '마력 폭발', '이상한 속삭임', '그림자 함정', '마법 반사', '숲의 분노',
];
const PENALTY_STATUS: StatusType[] = ['weaken', 'vulnerable', 'slow', 'burn', 'bleed'];

const SPECIAL_TITLES = [
  '고대 마법진', '숲의 수호 정령', '금빛 사슴', '죽은 나무의 속삭임', '사라진 마법사의 연구실',
  '봉인된 상자', '금지된 주문서', '마법의 거울', '시간의 균열', '다른 장소로 이어지는 문',
  '고대 유물', '숲의 심장', '거대한 알', '정체불명의 검은 수정', '오래된 제단',
  '별빛으로 된 문', '마법 생물의 둥지', '숲의 기억', '과거의 환영', '숨겨진 보물',
];

function buildHeal(): ForestEvent[] {
  return HEAL_TITLES.map((title, i) => {
    const id = `E${String(i + 1).padStart(3, '0')}`;
    const effect = MAX_HP_INDICES.has(i)
      ? { maxHp: randInt(id, 1, 3, 7), hp: randInt(id, 2, 10, 20) }
      : { hp: randInt(id, 1, 12, 25) };
    return {
      id,
      title,
      description: `${title}. 파티가 활기를 되찾는다.`,
      category: 'heal' as EventCategory,
      rarity: 'common' as const,
      minStage: 1,
      maxStage: 10,
      effect,
    };
  });
}

function buildSpellPower(): ForestEvent[] {
  return SPELLPOWER_TITLES.map((title, i) => {
    const id = `E${String(i + 21).padStart(3, '0')}`;
    return {
      id,
      title,
      description: `${title}. 몸속 마력이 진해지는 것이 느껴진다.`,
      category: 'spellPower' as EventCategory,
      rarity: 'common' as const,
      minStage: 1,
      maxStage: 10,
      effect: { spellPower: randInt(id, 1, 1, 3) },
    };
  });
}

function buildDefense(): ForestEvent[] {
  return DEFENSE_TITLES.map((title, i) => {
    const id = `E${String(i + 36).padStart(3, '0')}`;
    return {
      id,
      title,
      description: `${title}. 몸이 한결 단단해진 느낌이다.`,
      category: 'defense' as EventCategory,
      rarity: 'common' as const,
      minStage: 1,
      maxStage: 10,
      effect: { defense: randInt(id, 1, 1, 3) },
    };
  });
}

function buildBuff(): ForestEvent[] {
  return BUFF_TITLES.map(([title, buff, value], i) => {
    const id = `E${String(i + 46).padStart(3, '0')}`;
    return {
      id,
      title,
      description: `${title}. 다음 행동에 힘을 실어준다.`,
      category: 'buff' as EventCategory,
      rarity: 'uncommon' as const,
      minStage: 1,
      maxStage: 10,
      effect: { buff, buffValue: value },
    };
  });
}

function buildNeutral(): ForestEvent[] {
  return NEUTRAL_TITLES.map((title, i) => {
    const id = `E${String(i + 61).padStart(3, '0')}`;
    const kind = i % 5;
    if (kind === 0) {
      return {
        id, title, description: `${title}. 배운 것이 있는 느낌이다.`,
        category: 'buff' as EventCategory, rarity: 'common' as const, minStage: 1, maxStage: 10,
        effect: { skillPoints: 1 },
      };
    }
    if (kind === 1) {
      return {
        id, title, description: `${title}. 앞으로 나아갈 방향에 대한 실마리를 얻었다.`,
        category: 'hint' as EventCategory, rarity: 'common' as const, minStage: 1, maxStage: 10,
        effect: { hint: true, buff: 'revealNextPaths' as const },
      };
    }
    if (kind === 2) {
      return {
        id, title, description: `${title}. 무언가가 다가오는 기척이 느껴진다.`,
        category: 'monster' as EventCategory, rarity: 'common' as const, minStage: 1, maxStage: 10,
        effect: { triggersMonster: true },
      };
    }
    if (kind === 3) {
      const delta = randInt(id, 1, -5, 5);
      return {
        id, title, description: `${title}. 별다른 일 없이 지나간다.`,
        category: 'neutral' as EventCategory, rarity: 'common' as const, minStage: 1, maxStage: 10,
        effect: delta === 0 ? {} : { hp: delta },
      };
    }
    return {
      id, title, description: `${title}. 조용히 지나쳐 간다.`,
      category: 'neutral' as EventCategory, rarity: 'common' as const, minStage: 1, maxStage: 10,
      effect: {},
    };
  });
}

function buildPenalty(): ForestEvent[] {
  return PENALTY_TITLES.map((title, i) => {
    const id = `E${String(i + 81).padStart(3, '0')}`;
    const kind = i % 4;
    if (kind === 0) {
      return {
        id, title, description: `${title}. 예상치 못한 피해를 입었다.`,
        category: 'penalty' as EventCategory, rarity: 'common' as const, minStage: 1, maxStage: 10,
        effect: { hp: -randInt(id, 1, 10, 25) },
      };
    }
    if (kind === 1) {
      const useDefense = i % 8 === 5;
      return {
        id, title, description: `${title}. 힘이 조금 빠져나가는 느낌이다.`,
        category: 'penalty' as EventCategory, rarity: 'common' as const, minStage: 1, maxStage: 10,
        effect: useDefense ? { defense: -randInt(id, 1, 1, 2) } : { spellPower: -randInt(id, 1, 1, 2) },
      };
    }
    if (kind === 2) {
      const status = PENALTY_STATUS[i % PENALTY_STATUS.length];
      return {
        id, title, description: `${title}. 몸에 이상한 기운이 스며든다.`,
        category: 'penalty' as EventCategory, rarity: 'common' as const, minStage: 1, maxStage: 10,
        effect: { status: { type: status, value: status === 'burn' || status === 'bleed' ? randInt(id, 2, 3, 6) : randInt(id, 2, 15, 30), turns: 2 } },
      };
    }
    return {
      id, title, description: `${title}. 함정에 걸릴 위험이 있다.`,
      category: 'trap' as EventCategory, rarity: 'common' as const, minStage: 1, maxStage: 10,
      effect: { triggersTrap: { dc: randInt(id, 1, 11, 16), failHp: randInt(id, 2, 15, 30) } },
    };
  });
}

function buildSpecial(): ForestEvent[] {
  return SPECIAL_TITLES.map((title, i) => {
    const id = `E${String(i + 101).padStart(3, '0')}`;
    const kind = i % 4;
    if (kind === 0) {
      return {
        id, title, description: `${title}. 강력한 기운을 내뿜는 존재와 마주쳤다.`,
        category: 'eliteMonster' as EventCategory, rarity: 'rare' as const, minStage: 4, maxStage: 10,
        effect: { triggersEliteMonster: true },
      };
    }
    if (kind === 1) {
      return {
        id, title, description: `${title}. 강한 마력이 느껴지지만 위험해 보인다.`,
        category: 'riskyChoice' as EventCategory, rarity: 'rare' as const, minStage: 3, maxStage: 10,
        effect: {
          riskyCheck: {
            dc: randInt(id, 1, 16, 19),
            successBonus: { maxHp: randInt(id, 2, 5, 10), spellPower: 1, skillPoints: 1 },
            failPenalty: { hp: -randInt(id, 3, 20, 35) },
          },
        },
      };
    }
    if (kind === 2) {
      return {
        id, title, description: `${title}. 귀중한 것을 발견했다.`,
        category: 'special' as EventCategory, rarity: 'rare' as const, minStage: 3, maxStage: 10,
        effect: { maxHp: randInt(id, 1, 5, 12), skillPoints: 1 },
      };
    }
    return {
      id, title, description: `${title}. 지친 동료를 살피기로 했다.`,
      category: 'partyChoice' as EventCategory, rarity: 'uncommon' as const, minStage: 1, maxStage: 10,
      effect: { hp: randInt(id, 1, 15, 30), targetLowestHp: true },
    };
  });
}

export const FOREST_EVENTS: ForestEvent[] = [
  ...buildHeal(),
  ...buildSpellPower(),
  ...buildDefense(),
  ...buildBuff(),
  ...buildNeutral(),
  ...buildPenalty(),
  ...buildSpecial(),
];

export function eventById(id: string): ForestEvent {
  const ev = FOREST_EVENTS.find((e) => e.id === id);
  if (!ev) throw new Error(`unknown event: ${id}`);
  return ev;
}
