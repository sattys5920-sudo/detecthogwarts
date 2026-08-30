import { useEffect, useState } from 'react';
import { FINAL_SURVEY_QUESTIONS } from '../data/investigation/finalSurvey';
import { DEFAULT_KILLER_NAME, listenKillerName, setKillerName } from '../firebase/finalDeduction';
import { sendAdlib } from '../firebase/session';

const SPEAKER = '조사관';
/** Index of "엘리오를 죽인 사람은 누구인가요?" — the question whose real answer drives FinalDeduction's accuse button. */
const KILLER_QUESTION_INDEX = FINAL_SURVEY_QUESTIONS.findIndex((q) => q.id === 'killer-elio');

export default function AdminFinalSurvey({ day }: { day: number }) {
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [killerName, setKillerNameDraft] = useState(DEFAULT_KILLER_NAME);

  useEffect(() => listenKillerName(setKillerNameDraft), []);

  async function send(question: (typeof FINAL_SURVEY_QUESTIONS)[number]) {
    setSendingId(question.id);
    try {
      await sendAdlib(day, SPEAKER, question.prompt);
      setSentIds((prev) => new Set(prev).add(question.id));
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-seal-500/40 bg-paper-100 p-3.5">
      <p className="font-mono text-[11px] font-bold tracking-wide text-seal-600">최종 설문 — 사건 정리</p>
      <p className="text-xs text-ink-700/70">
        사건이 마무리된 뒤, 아래 질문을 순서대로 조사실 채팅에 보내 플레이어들과 함께 사건을 정리해 보세요. 플레이어는 아래 &lsquo;최종 설문 답변&rsquo;란에 자유롭게 답을 적어 제출하고, 정답 · 오답 채점은 관리자 전용 &lsquo;답변 채점&rsquo;란에서 할 수 있습니다.
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
                  onClick={() => send(q)}
                  disabled={sendingId === q.id}
                  className={`flex-none rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-40 ${
                    sent ? 'bg-paper-200 text-ink-700/60' : 'bg-ink-black text-paper-50'
                  }`}
                >
                  {sendingId === q.id ? '전송 중…' : sent ? '다시 보내기' : '보내기'}
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
      <p className="text-[11px] text-ink-500/60">
        여기서 지정한 이름이 아래 &lsquo;최종 지목&rsquo;란의 지목 버튼에 그대로 쓰입니다.
      </p>
    </div>
  );
}
