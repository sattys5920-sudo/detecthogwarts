export interface FinalSurveyQuestion {
  id: string;
  prompt: string;
}

/** Preset closing debrief for Day 5 — sent one at a time by the admin into the investigation chat, and answered by each player as a graded free-text response. */
export const FINAL_SURVEY_QUESTIONS: FinalSurveyQuestion[] = [
  { id: 'killer-aiwei', prompt: '아이웨이를 죽인 사람은 누구인가요?' },
  { id: 'who-fainted-elio', prompt: '엘리오를 기절시킨 사람은 누구인가요?' },
  { id: 'who-took-document', prompt: '엘리오의 비밀 문서를 가져간 사람은 누구인가요?' },
  { id: 'what-is-arcadia', prompt: '아르카디아란 무엇인가요?' },
  { id: 'killer-elio', prompt: '엘리오를 죽인 사람은 누구인가요?' },
];
