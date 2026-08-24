export type FinalSurveyQuestion =
  | { id: string; kind: 'options'; prompt: string; options: string[] }
  | { id: string; kind: 'open'; prompt: string };

/** Preset closing debrief for Day 5 — sent one at a time by the admin into the investigation chat. */
export const FINAL_SURVEY_QUESTIONS: FinalSurveyQuestion[] = [
  {
    id: 'killer-elio',
    kind: 'options',
    prompt: '엘리오를 목 졸라 살해한 진범은 누구인가요?',
    options: ['파울', '타치바나', '미고', '아네스', '셰인'],
  },
  {
    id: 'killer-aiwei',
    kind: 'options',
    prompt: '아이웨이는 누구 때문에 사망했나요?',
    options: ['타치바나', '파울', '미고', '셀레나', '아네스'],
  },
  {
    id: 'mastermind',
    kind: 'options',
    prompt: '아르카디아 부흥을 계획하며 문서 탈취를 지시한 사람은 누구인가요?',
    options: ['미고', '파울', '타치바나', '조사관', '교수'],
  },
  {
    id: 'sacrifice-count',
    kind: 'open',
    prompt: '미고가 아르카디아 부흥을 위해 계획한 희생자는 몇 명인가요?',
  },
  {
    id: 'paul-motive',
    kind: 'open',
    prompt: '파울이 엘리오를 살해하게 된 결정적인 이유는 무엇이었나요?',
  },
  {
    id: 'arcadia-meaning',
    kind: 'open',
    prompt: '"아르카디아"라는 이름은 당신에게 어떤 의미로 다가왔나요?',
  },
  {
    id: 'memorable-moment',
    kind: 'open',
    prompt: '5일간의 탐사 활동 중 가장 기억에 남는 순간은 무엇인가요?',
  },
];
