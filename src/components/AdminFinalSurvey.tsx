import { useState } from 'react';
import { FINAL_SURVEY_QUESTIONS } from '../data/investigation/finalSurvey';
import { sendAdlib } from '../firebase/session';

const SPEAKER = '조사관';

export default function AdminFinalSurvey({ day }: { day: number }) {
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);

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
            <div key={`${q.id}-${i}`} className="flex items-start justify-between gap-2 rounded-lg border border-ink-700/15 bg-paper-50 p-2.5">
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
          );
        })}
      </div>
    </div>
  );
}
