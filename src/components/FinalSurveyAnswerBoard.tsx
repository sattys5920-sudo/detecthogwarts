import { useEffect, useRef, useState } from 'react';
import { FINAL_SURVEY_QUESTIONS } from '../data/investigation/finalSurvey';
import { listenAnswersForPlayer, submitAnswer, type FinalSurveyAnswer } from '../firebase/finalSurveyAnswers';
import { sendChatMessage } from '../firebase/session';

/** questionId for "엘리오를 죽인 사람은 누구인가요?" — this player's own answer to it becomes the name in their accuse button below. */
const KILLER_QUESTION_ID = 'killer-elio';

const GRADE_LABEL: Record<'correct' | 'incorrect', string> = {
  correct: '정답',
  incorrect: '오답',
};

function QuestionRow({
  index,
  prompt,
  answer,
  onSubmit,
}: {
  index: number;
  prompt: string;
  answer: FinalSurveyAnswer | undefined;
  onSubmit: (text: string, isEdit: boolean) => Promise<void>;
}) {
  const [draft, setDraft] = useState(answer?.text ?? '');
  const [editing, setEditing] = useState(!answer);
  const [submitting, setSubmitting] = useState(false);
  const hydratedRef = useRef(Boolean(answer));

  useEffect(() => {
    if (answer && !editing) setDraft(answer.text);
  }, [answer, editing]);

  // The answer for a question can arrive asynchronously (after the listener resolves),
  // later than this component's first render. Only the first time an answer shows up do we
  // force out of editing mode — afterwards, leave `editing` alone so a manually opened edit
  // (via 수정) isn't fought by this effect.
  useEffect(() => {
    if (!hydratedRef.current && answer) {
      hydratedRef.current = true;
      setEditing(false);
    }
  }, [answer]);

  async function submit() {
    if (!draft.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(draft, Boolean(answer));
      setEditing(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-ink-700/15 bg-paper-50 p-2.5">
      <p className="text-sm font-semibold text-ink-900">
        {index + 1}. {prompt}
      </p>

      {editing ? (
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="답을 입력하세요"
            maxLength={200}
            className="min-w-0 flex-1 rounded-lg border border-ink-700/20 bg-paper-100/60 px-2.5 py-1.5 text-sm text-ink-900 outline-none placeholder:text-ink-500/40 focus:border-seal-500"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim() || submitting}
            className="flex-none rounded-lg bg-ink-black px-3 py-1.5 text-xs font-bold text-paper-50 disabled:opacity-40"
          >
            {submitting ? '제출 중…' : '제출'}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-ink-700/80">
            내 답변: <span className="font-semibold text-ink-900">{answer?.text}</span>
          </p>
          <div className="flex flex-none items-center gap-2">
            {answer?.grade && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  answer.grade === 'correct' ? 'bg-seal-600 text-paper-50' : 'bg-ink-700/20 text-ink-700'
                }`}
              >
                {GRADE_LABEL[answer.grade]}
              </span>
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs font-bold text-ink-500/60 underline-offset-2 hover:text-ink-900 hover:underline"
            >
              수정
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FinalSurveyAnswerBoard({
  day,
  playerId,
  nickname,
  avatar,
}: {
  day: number;
  playerId: string;
  nickname: string;
  avatar: string | null;
}) {
  const [answers, setAnswers] = useState<FinalSurveyAnswer[]>([]);
  const [accusing, setAccusing] = useState(false);
  const [accused, setAccused] = useState(false);

  useEffect(() => listenAnswersForPlayer(playerId, setAnswers), [playerId]);

  async function handleSubmit(questionId: string, text: string, isEdit: boolean) {
    await submitAnswer(playerId, nickname, questionId, text, isEdit);
  }

  const killerAnswer = answers.find((a) => a.questionId === KILLER_QUESTION_ID)?.text.trim();

  async function accuse() {
    if (!killerAnswer || accusing) return;
    setAccusing(true);
    try {
      await sendChatMessage(day, nickname, `${killerAnswer}을(를) 범인으로 지목합니다.`, avatar);
      setAccused(true);
    } finally {
      setAccusing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-ink-700/15 bg-paper-100 p-3.5">
      <p className="font-serif-kr text-sm font-semibold text-ink-900">최종 설문 답변</p>
      <p className="text-xs text-ink-700/70">조사관의 마지막 질문에 답해 보세요. 관리자가 정답 여부를 확인합니다.</p>

      <div className="flex flex-col gap-2">
        {FINAL_SURVEY_QUESTIONS.map((q, i) => (
          <QuestionRow
            key={`${q.id}-${i}`}
            index={i}
            prompt={q.prompt}
            answer={answers.find((a) => a.questionId === q.id)}
            onSubmit={(text, isEdit) => handleSubmit(q.id, text, isEdit)}
          />
        ))}
      </div>

      {killerAnswer && (
        <div className="flex flex-col gap-1.5 border-t border-ink-700/15 pt-3">
          <p className="text-xs text-ink-700/70">위 5번 답변을 바탕으로, 최종 지목을 조사실 채팅에 보낼 수 있어요.</p>
          <button
            type="button"
            onClick={accuse}
            disabled={accusing}
            className="tablet-btn tablet-btn-dark self-start px-4 py-2 text-sm font-bold disabled:opacity-40"
          >
            {accusing ? '전송 중…' : accused ? '다시 지목하기' : `${killerAnswer}을(를) 범인으로 지목한다`}
          </button>
        </div>
      )}
    </div>
  );
}
