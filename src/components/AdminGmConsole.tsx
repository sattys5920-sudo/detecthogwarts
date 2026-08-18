import { useEffect, useState } from 'react';
import { CHARACTERS } from '../data/investigation/characters';
import { eligibleBeats } from '../data/investigation/scriptUtils';
import type { ScriptBeat } from '../data/investigation/types';
import { advanceSession, listenSessionState, resetSession, sendAdlib, type SessionState } from '../firebase/session';

const NARRATOR = { id: 'narrator', name: '상황 설명', icon: '' };

export default function AdminGmConsole({ day, beats }: { day: number; beats: ScriptBeat[] }) {
  const [state, setState] = useState<SessionState>({ revealedCount: 0, choices: {} });
  const [speakerId, setSpeakerId] = useState(NARRATOR.id);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => listenSessionState(day, setState), [day]);

  const eligible = eligibleBeats(beats, state.choices);
  const revealed = eligible.slice(0, state.revealedCount);
  const lastRevealed = revealed[revealed.length - 1];
  const pendingChoice = lastRevealed?.type === 'choice' && !state.choices[lastRevealed.id];
  const done = state.revealedCount >= eligible.length && eligible.length > 0;
  const next = !pendingChoice && !done ? eligible[state.revealedCount] : null;

  async function send() {
    const text = message.trim();
    if (!text) return;
    setSending(true);
    try {
      const speaker = speakerId === NARRATOR.id ? '' : (CHARACTERS.find((c) => c.id === speakerId)?.name ?? '');
      const icon = speakerId === NARRATOR.id ? '' : (CHARACTERS.find((c) => c.id === speakerId)?.icon ?? '');
      await sendAdlib(day, speaker, icon, text);
      setMessage('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-seal-500/40 bg-paper-100 p-3.5">
      <p className="font-mono text-[11px] font-bold tracking-wide text-seal-600">🎲 관리자 진행 콘솔</p>

      <div>
        <p className="text-xs text-ink-700/70">
          진행: {state.revealedCount} / {eligible.length}
          {pendingChoice && <span className="ml-1 text-seal-600">(선택 대기 중)</span>}
          {done && <span className="ml-1 text-seal-600">(대본 완료)</span>}
        </p>
        {next && (
          <p className="mt-1 text-[11px] text-ink-500/60">
            다음: {next.type === 'choice' ? `[선택지] ${next.options?.map((o) => o.text).join(' / ')}` : next.text}
          </p>
        )}
        <div className="mt-1.5 flex gap-2">
          <button
            type="button"
            onClick={() => advanceSession(day, state.revealedCount + 1)}
            disabled={!!pendingChoice || done}
            className="tablet-btn tablet-btn-dark flex-1 rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-40"
          >
            다음 →
          </button>
          <button
            type="button"
            onClick={() => resetSession(day)}
            className="tablet-btn tablet-btn-ghost flex-none rounded-lg px-3 py-1.5 text-xs font-bold"
          >
            초기화
          </button>
        </div>
      </div>

      <div className="h-px bg-ink-700/10" />

      <div>
        <p className="mb-1.5 text-xs font-bold text-ink-700/70">직접 대사 보내기 (Roll20 스타일)</p>
        <div className="flex flex-col gap-1.5">
          <select
            value={speakerId}
            onChange={(e) => setSpeakerId(e.target.value)}
            className="rounded-lg border border-ink-700/20 bg-paper-50 px-2.5 py-1.5 text-sm text-ink-900 outline-none focus:border-seal-500"
          >
            <option value={NARRATOR.id}>{NARRATOR.name}</option>
            {CHARACTERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="대사나 상황 설명을 입력하세요"
              className="flex-1 rounded-lg border border-ink-700/20 bg-paper-50 px-2.5 py-1.5 text-sm text-ink-900 outline-none placeholder:text-ink-500/40 focus:border-seal-500"
            />
            <button
              type="button"
              onClick={send}
              disabled={!message.trim() || sending}
              className="flex-none rounded-lg bg-ink-black px-3 py-1.5 text-xs font-bold text-paper-50 disabled:opacity-40"
            >
              {sending ? '전송 중…' : '보내기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
