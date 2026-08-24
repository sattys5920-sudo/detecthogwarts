import type { PatronusId } from '../game/forest/types';

export interface PatronusTestOption {
  key: string;
  text: string;
  patronus: PatronusId;
}

export interface PatronusTestQuestion {
  id: number;
  prompt: string;
  options: PatronusTestOption[];
}

export const PATRONUS_QUESTIONS: PatronusTestQuestion[] = [
  {
    id: 1,
    prompt: '당신에게 ‘자유’는 어떤 것에 가까운가?',
    options: [
      { key: 'A', text: '아무것에도 얽매이지 않는 것', patronus: 'lark' },
      { key: 'B', text: '스스로 선택할 수 있는 것', patronus: 'tiger' },
      { key: 'C', text: '원하는 곳에 머무를 수 있는 것', patronus: 'snail' },
      { key: 'D', text: '나 자신으로 존재할 수 있는 것', patronus: 'cat' },
    ],
  },
  {
    id: 2,
    prompt: '당신이 가장 끌리는 것은?',
    options: [
      { key: 'A', text: '고요함', patronus: 'giraffe' },
      { key: 'B', text: '변화', patronus: 'fox' },
      { key: 'C', text: '온기', patronus: 'cat' },
      { key: 'D', text: '미지', patronus: 'snake' },
    ],
  },
  {
    id: 3,
    prompt: '‘강하다’는 말과 가장 가까운 것은?',
    options: [
      { key: 'A', text: '흔들리지 않는 것', patronus: 'giraffe' },
      { key: 'B', text: '다시 일어나는 것', patronus: 'squirrel' },
      { key: 'C', text: '지켜낼 수 있는 것', patronus: 'panther' },
      { key: 'D', text: '두려워도 나아가는 것', patronus: 'tiger' },
    ],
  },
  {
    id: 4,
    prompt: '당신이 중요하게 여기는 감정은?',
    options: [
      { key: 'A', text: '평온', patronus: 'snail' },
      { key: 'B', text: '애정', patronus: 'cat' },
      { key: 'C', text: '경외', patronus: 'giraffe' },
      { key: 'D', text: '열정', patronus: 'tiger' },
    ],
  },
  {
    id: 5,
    prompt: '당신에게 ‘집’이란?',
    options: [
      { key: 'A', text: '돌아갈 수 있는 곳', patronus: 'cat' },
      { key: 'B', text: '함께하고 싶은 존재', patronus: 'squirrel' },
      { key: 'C', text: '온전히 나일 수 있는 곳', patronus: 'gecko' },
      { key: 'D', text: '언제든 떠날 수 있는 곳', patronus: 'fox' },
    ],
  },
  {
    id: 6,
    prompt: '당신이 가장 아름답다고 느끼는 것은?',
    options: [
      { key: 'A', text: '오래된 것', patronus: 'snail' },
      { key: 'B', text: '살아 움직이는 것', patronus: 'squirrel' },
      { key: 'C', text: '변해가는 것', patronus: 'gecko' },
      { key: 'D', text: '쉽게 닿을 수 없는 것', patronus: 'giraffe' },
    ],
  },
  {
    id: 7,
    prompt: '당신은 자신을 어떤 방향의 사람이라고 느끼는가?',
    options: [
      { key: 'A', text: '안으로 향하는 사람', patronus: 'snake' },
      { key: 'B', text: '앞으로 향하는 사람', patronus: 'tiger' },
      { key: 'C', text: '주변을 향하는 사람', patronus: 'lark' },
      { key: 'D', text: '위로 향하는 사람', patronus: 'giraffe' },
    ],
  },
  {
    id: 8,
    prompt: '당신에게 ‘기억’은 무엇에 가까운가?',
    options: [
      { key: 'A', text: '붙잡아 두고 싶은 것', patronus: 'squirrel' },
      { key: 'B', text: '언젠가 다시 돌아갈 곳', patronus: 'lark' },
      { key: 'C', text: '나를 만든 흔적', patronus: 'snail' },
      { key: 'D', text: '놓아야 하는 것', patronus: 'fox' },
    ],
  },
  {
    id: 9,
    prompt: '당신이 가장 원하는 것은?',
    options: [
      { key: 'A', text: '이해', patronus: 'gecko' },
      { key: 'B', text: '연결', patronus: 'cat' },
      { key: 'C', text: '평온', patronus: 'panther' },
      { key: 'D', text: '가능성', patronus: 'fox' },
    ],
  },
  {
    id: 10,
    prompt: '당신의 마음을 하나의 이미지로 표현한다면?',
    options: [
      { key: 'A', text: '깊은 밤', patronus: 'panther' },
      { key: 'B', text: '새벽빛', patronus: 'lark' },
      { key: 'C', text: '바람이 부는 들판', patronus: 'giraffe' },
      { key: 'D', text: '잔잔한 물결', patronus: 'snail' },
    ],
  },
];

export interface PatronusTestAnswer {
  question: PatronusTestQuestion;
  option: PatronusTestOption;
}

const EMPTY_SCORES: Record<PatronusId, number> = {
  snake: 0, tiger: 0, squirrel: 0, panther: 0, lark: 0,
  cat: 0, fox: 0, snail: 0, gecko: 0, giraffe: 0,
};

export function scorePatronusAnswers(answers: PatronusTestAnswer[]): Record<PatronusId, number> {
  const scores: Record<PatronusId, number> = { ...EMPTY_SCORES };
  for (const { option } of answers) {
    scores[option.patronus] += 1;
  }
  return scores;
}

export function topPatronus(scores: Record<PatronusId, number>): PatronusId {
  let best: PatronusId = 'snake';
  let bestScore = -Infinity;
  (Object.keys(scores) as PatronusId[]).forEach((p) => {
    if (scores[p] > bestScore) {
      bestScore = scores[p];
      best = p;
    }
  });
  return best;
}
