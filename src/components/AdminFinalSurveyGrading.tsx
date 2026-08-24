import { useEffect, useState } from 'react';
import { FINAL_SURVEY_QUESTIONS } from '../data/investigation/finalSurvey';
import { gradeAnswer, listenAllAnswers, type AnswerGrade, type FinalSurveyAnswer } from '../firebase/finalSurveyAnswers';

function GradeButtons({ answer }: { answer: FinalSurveyAnswer }) {
  function setGrade(grade: AnswerGrade) {
    gradeAnswer(answer.id, answer.grade === grade ? null : grade);
  }

  return (
    <div className="flex flex-none items-center gap-1.5">
      <button
        type="button"
        onClick={() => setGrade('correct')}
        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
          answer.grade === 'correct' ? 'bg-seal-600 text-paper-50' : 'border border-ink-700/20 text-ink-700/60'
        }`}
      >
        정답
      </button>
      <button
        type="button"
        onClick={() => setGrade('incorrect')}
        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
          answer.grade === 'incorrect' ? 'bg-ink-700 text-paper-50' : 'border border-ink-700/20 text-ink-700/60'
        }`}
      >
        오답
      </button>
    </div>
  );
}

export default function AdminFinalSurveyGrading() {
  const [answers, setAnswers] = useState<FinalSurveyAnswer[]>([]);

  useEffect(() => listenAllAnswers(setAnswers), []);

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-seal-500/40 bg-paper-100 p-3.5">
      <p className="font-mono text-[11px] font-bold tracking-wide text-seal-600">최종 설문 — 답변 채점</p>
      <p className="text-xs text-ink-700/70">플레이어가 제출한 답변에 정답 · 오답을 표시하세요. 다시 누르면 표시가 취소됩니다.</p>

      <div className="flex flex-col gap-3">
        {FINAL_SURVEY_QUESTIONS.map((q, i) => {
          const questionAnswers = answers.filter((a) => a.questionId === q.id).sort((a, b) => a.createdAt - b.createdAt);
          return (
            <div key={`${q.id}-${i}`} className="flex flex-col gap-1.5 rounded-lg border border-ink-700/15 bg-paper-50 p-2.5">
              <p className="text-sm font-semibold text-ink-900">
                {i + 1}. {q.prompt}
              </p>
              {questionAnswers.length === 0 ? (
                <p className="text-xs text-ink-500/50">아직 제출된 답변이 없습니다.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {questionAnswers.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-paper-100/60 px-2.5 py-1.5">
                      <p className="min-w-0 flex-1 text-sm text-ink-900">
                        <span className="font-bold text-seal-600">{a.nickname}</span>: {a.text}
                      </p>
                      <GradeButtons answer={a} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
