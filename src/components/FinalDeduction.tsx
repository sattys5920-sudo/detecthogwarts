import { useEffect, useState } from 'react';
import { FINAL_SURVEY_QUESTIONS } from '../data/investigation/finalSurvey';
import { DEFAULT_KILLER_NAME, listenKillerName, setKillerName } from '../firebase/finalDeduction';
import { sendAdlib } from '../firebase/session';

const SURVEY_SPEAKER = '조사관';
/** Index of "엘리오를 죽인 사람은 누구인가요?" — the question whose real answer drives the accuse button below. */
const KILLER_QUESTION_INDEX = FINAL_SURVEY_QUESTIONS.findIndex((q) => q.id === 'killer-elio');

const ENDING_A_TEXT = [
  'ENDING A — 진실을 밝힌다',
  '아르카디아는 사라진 것이 아니었다. 이름만 사라졌을 뿐이었다.',
  '60 년 전 은폐된 사건과 현재의 살인이 하나의 선으로 이어진다.',
  '교장: "이제 학교는 더 이상 침묵하지 않겠습니다."',
  '진실이 밝혀지는 순간, 아름다움이라는 이름으로 포장된 희생은 그 본래의 잔혹함을 드러낸다.',
].join('\n');

const ENDING_B_TEXT = [
  'ENDING B — 증거 부족',
  '범인은 특정했지만 모든 연결고리를 설명하지 못했다.',
  '사건은 끝나지 않았다. 아르카디아의 잔재가 아직 남아 있기 때문이다.',
].join('\n');

/**
 * Admin-only — the previous version rendered "{name}을 범인으로 지목한다" and its ending text
 * directly to every player, spoiling the mystery's answer outright. Now it's the single GM control
 * for the day-5 endgame: send each closing-debrief question into the shared chat (players answer via
 * FinalSurveyAnswerBoard, graded separately in AdminFinalSurveyGrading), set the real answer to the
 * "who killed Elio" question, then send the accusation and the fitting ending — all of it explicit
 * admin actions broadcast via sendAdlib, nothing auto-shown to players.
 */
export default function FinalDeduction({ day }: { day: number }) {
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [sendingQuestionId, setSendingQuestionId] = useState<string | null>(null);
  const [killerName, setKillerNameDraft] = useState(DEFAULT_KILLER_NAME);
  const [accused, setAccused] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => listenKillerName(setKillerNameDraft), []);

  async function sendQuestion(question: (typeof FINAL_SURVEY_QUESTIONS)[number]) {
    setSendingQuestionId(question.id);
    try {
      await sendAdlib(day, SURVEY_SPEAKER, question.prompt);
      setSentIds((prev) => new Set(prev).add(question.id));
    } finally {
      setSendingQuestionId(null);
    }
  }

  async function sendAccusation() {
    setSending(true);
    try {
      await sendAdlib(day, '', `${killerName}을(를) 범인으로 지목했다.`);
      setAccused(true);
    } finally {
      setSending(false);
    }
  }

  async function sendEnding(text: string) {
    setSending(true);
    try {
      await sendAdlib(day, '', text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-seal-500/40 bg-paper-100 p-3.5">
      <p className="font-mono text-[11px] font-bold tracking-wide text-seal-600">최종 지목 — 관리자 전용</p>
      <p className="text-xs text-ink-700/70">
        아래에서 보내는 질문과 지목·결말은 조사실 채팅에 즉시 표시되어 모든 플레이어에게 보입니다. 이 카드 자체는 관리자에게만 보입니다. 플레이어는 &lsquo;최종 설문 답변&rsquo;란에 답을 적어 제출하고, 정답 · 오답 채점은 &lsquo;답변 채점&rsquo;란에서 할 수 있습니다.
      </p>

      <div className="flex flex-col gap-2">
        {FINAL_SURVEY_QUESTIONS.map((q, i) => {
          const sent = sentIds.has(q.id);
          return (
            <div key={`${q.id}-${i}`} className="flex flex-col gap-2 rounded-lg border border-ink-700/15 bg-paper-50 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-ink-900">
                  {i + 1}. {q.prompt}
                </p>
                <button
                  type="button"
                  onClick={() => sendQuestion(q)}
                  disabled={sendingQuestionId === q.id}
                  className={`flex-none rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-40 ${
                    sent ? 'bg-paper-200 text-ink-700/60' : 'bg-ink-black text-paper-50'
                  }`}
                >
                  {sendingQuestionId === q.id ? '전송 중…' : sent ? '다시 보내기' : '보내기'}
                </button>
              </div>
              {i === KILLER_QUESTION_INDEX && (
                <div className="flex items-center gap-1.5 border-t border-ink-700/10 pt-2">
                  <label className="text-xs font-bold text-ink-700/70">정답(범인 이름)</label>
                  <input
                    value={killerName}
                    onChange={(e) => setKillerNameDraft(e.target.value)}
                    onBlur={() => setKillerName(killerName)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
                    maxLength={30}
                    className="min-w-0 flex-1 rounded-lg border border-ink-700/20 bg-paper-50 px-2 py-1 text-xs text-ink-900 outline-none focus:border-seal-500"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 border-t border-ink-700/15 pt-3">
        {!accused ? (
          <button
            type="button"
            onClick={sendAccusation}
            disabled={sending}
            className="tablet-btn tablet-btn-dark self-start px-4 py-2 text-sm font-bold disabled:opacity-40"
          >
            {sending ? '전송 중…' : `${killerName}을(를) 범인으로 지목한다`}
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-ink-700/70">지목을 보냈습니다. 이제 결말을 골라 보내세요.</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => sendEnding(ENDING_A_TEXT)}
                disabled={sending}
                className="tablet-btn tablet-btn-dark px-3 py-1.5 text-xs font-bold disabled:opacity-40"
              >
                ENDING A 보내기 (진실을 밝힌다)
              </button>
              <button
                type="button"
                onClick={() => sendEnding(ENDING_B_TEXT)}
                disabled={sending}
                className="tablet-btn tablet-btn-ghost px-3 py-1.5 text-xs font-bold disabled:opacity-40"
              >
                ENDING B 보내기 (증거 부족)
              </button>
              <button
                type="button"
                onClick={() => setAccused(false)}
                className="text-xs font-bold text-ink-500/60 hover:text-seal-600"
              >
                다시 지목하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
