export type HouseId = 'flame' | 'moonlight' | 'earth' | 'wind';

export interface SortingOption {
  key: string;
  text: string;
  primary: HouseId;
  secondary?: HouseId;
  reason?: string;
}

export interface SortingQuestion {
  id: number;
  group: 'situational' | 'preference' | 'abstract';
  prompt: string;
  options: SortingOption[];
}

export const SORTING_QUESTIONS: SortingQuestion[] = [
  {
    id: 1,
    group: 'situational',
    prompt: '탐사 중, 낯선 소리가 들리는 문 앞에 섰다. 당신의 선택은?',
    options: [
      { key: 'A', text: '문을 열어본다', primary: 'flame', secondary: 'wind' },
      { key: 'B', text: '주변을 살핀다', primary: 'wind', secondary: 'moonlight' },
      { key: 'C', text: '소리의 정체를 추측하고 준비한다', primary: 'moonlight', secondary: 'wind' },
      { key: 'D', text: '다른 사람을 부른다', primary: 'earth', secondary: 'flame' },
    ],
  },
  {
    id: 2,
    group: 'situational',
    prompt: '친구가 고민을 털어놓았다. 당신은?',
    options: [
      { key: 'A', text: '친구가 직접 해결하도록 설득한다', primary: 'earth', secondary: 'flame' },
      { key: 'B', text: '자세히 들어본다', primary: 'moonlight', secondary: 'earth' },
      { key: 'C', text: '사실대로 알린다', primary: 'flame', secondary: 'moonlight' },
      { key: 'D', text: '다른 방법을 찾는다', primary: 'wind', secondary: 'earth' },
    ],
  },
  {
    id: 3,
    group: 'situational',
    prompt: '복도에서 낯선 쪽지를 주웠다. 당신은?',
    options: [
      { key: 'A', text: '교수에게 가져간다', primary: 'flame', secondary: 'earth' },
      { key: 'B', text: '내용을 확인한다', primary: 'moonlight', secondary: 'wind' },
      { key: 'C', text: '친구들과 공유한다', primary: 'earth', secondary: 'flame' },
      { key: 'D', text: '보지 않고 지나간다', primary: 'flame', secondary: 'earth' },
    ],
  },
  {
    id: 4,
    group: 'situational',
    prompt: '어둠 속에서 낯선 목소리가 들려온다. 당신은?',
    options: [
      { key: 'A', text: '목소리 쪽으로 간다', primary: 'flame', secondary: 'earth' },
      { key: 'B', text: '움직이지 않고 파악한다', primary: 'wind', secondary: 'moonlight' },
      { key: 'C', text: '지나온 길을 되짚는다', primary: 'moonlight', secondary: 'wind' },
      { key: 'D', text: '조심스럽게 접근한다', primary: 'wind', secondary: 'moonlight' },
    ],
  },
  {
    id: 5,
    group: 'preference',
    prompt: '가장 끌리는 날씨는?',
    options: [
      { key: 'A', text: '비 · 흐림', primary: 'wind' },
      { key: 'B', text: '따뜻한 맑은 날', primary: 'earth' },
      { key: 'C', text: '차갑고 선명한 겨울', primary: 'moonlight' },
      { key: 'D', text: '선선한 바람', primary: 'flame' },
    ],
  },
  {
    id: 6,
    group: 'preference',
    prompt: '가장 좋아하는 계절은?',
    options: [
      { key: 'A', text: '봄', primary: 'earth' },
      { key: 'B', text: '여름', primary: 'flame' },
      { key: 'C', text: '가을', primary: 'wind' },
      { key: 'D', text: '겨울', primary: 'moonlight' },
    ],
  },
  {
    id: 7,
    group: 'preference',
    prompt: '가장 즐겨 마시는 음료는?',
    options: [
      { key: 'A', text: '따뜻한 홍차', primary: 'moonlight' },
      { key: 'B', text: '핫초코', primary: 'earth' },
      { key: 'C', text: '레몬에이드', primary: 'flame' },
      { key: 'D', text: '진한 커피', primary: 'wind' },
    ],
  },
  {
    id: 8,
    group: 'abstract',
    prompt: '가장 끌리는 단어는?',
    options: [
      { key: 'A', text: '별', primary: 'moonlight', reason: '지식 · 탐구 · 미지' },
      { key: 'B', text: '문', primary: 'wind', reason: '비밀 · 기회 · 경계' },
      { key: 'C', text: '불', primary: 'flame', reason: '용기 · 열정 · 행동' },
      { key: 'D', text: '숲', primary: 'earth', reason: '생명 · 안정 · 공존' },
    ],
  },
  {
    id: 9,
    group: 'abstract',
    prompt: '밤하늘을 올려다볼 때 가장 먼저 눈에 들어오는 것은?',
    options: [
      { key: 'A', text: '가장 밝은 별', primary: 'flame', reason: '눈에 띄는 것 · 목표' },
      { key: 'B', text: '별 사이의 빈 공간', primary: 'moonlight', reason: '관찰 · 사고 · 의문' },
      { key: 'C', text: '달과 구름', primary: 'earth', reason: '감성 · 관계 · 안정' },
      { key: 'D', text: '끝없는 어둠', primary: 'wind', reason: '미지 · 야망 · 깊이' },
    ],
  },
  {
    id: 10,
    group: 'abstract',
    prompt: '가장 마음에 와닿는 문장은?',
    options: [
      { key: 'A', text: '아무도 가지 않은 길', primary: 'flame', reason: '도전 · 용기' },
      { key: 'B', text: '누구와 함께 걷느냐', primary: 'earth', reason: '우정 · 충성' },
      { key: 'C', text: '모든 것에는 이유가 있다', primary: 'moonlight', reason: '지식 · 진실' },
      { key: 'D', text: '원하는 것에는 대가가 있다', primary: 'wind', reason: '욕망 · 야망 · 대가' },
    ],
  },
];

const GROUP_WEIGHT: Record<SortingQuestion['group'], { primary: number; secondary: number }> = {
  situational: { primary: 3, secondary: 1 },
  preference: { primary: 1, secondary: 0 },
  abstract: { primary: 3, secondary: 0 },
};

export interface SortingAnswer {
  question: SortingQuestion;
  option: SortingOption;
}

export function scoreSortingAnswers(answers: SortingAnswer[]): Record<HouseId, number> {
  const scores: Record<HouseId, number> = { flame: 0, moonlight: 0, earth: 0, wind: 0 };
  for (const { question, option } of answers) {
    const weight = GROUP_WEIGHT[question.group];
    scores[option.primary] += weight.primary;
    if (option.secondary && weight.secondary) {
      scores[option.secondary] += weight.secondary;
    }
  }
  return scores;
}

export function topHouse(scores: Record<HouseId, number>): HouseId {
  let best: HouseId = 'flame';
  let bestScore = -Infinity;
  (Object.keys(scores) as HouseId[]).forEach((house) => {
    if (scores[house] > bestScore) {
      bestScore = scores[house];
      best = house;
    }
  });
  return best;
}
