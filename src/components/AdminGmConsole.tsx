import { useState } from 'react';
import { CHARACTERS } from '../data/investigation/characters';
import type { ClueDef } from '../data/investigation/types';
import { sendAdlib } from '../firebase/session';

const NARRATOR = { id: 'narrator', name: '상황 설명' };
const INK_OPTIONS: { id: ClueDef['ink']; label: string }[] = [
  { id: 'black', label: '검정' },
  { id: 'red', label: '빨강' },
  { id: 'indigo', label: '남색' },
];

export default function AdminGmConsole({ day }: { day: number }) {
  const [speakerId, setSpeakerId] = useState(NARRATOR.id);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [clueMode, setClueMode] = useState(false);
  const [clueTitle, setClueTitle] = useState('');
  const [clueInk, setClueInk] = useState<ClueDef['ink']>('black');

  async function send() {
    const text = message.trim();
    if (!text) return;
    if (clueMode && !clueTitle.trim()) return;
    setSending(true);
    try {
      const speaker = speakerId === NARRATOR.id ? '' : (CHARACTERS.find((c) => c.id === speakerId)?.name ?? '');
      const clue: ClueDef | undefined = clueMode
        ? { title: clueTitle.trim(), desc: text, ink: clueInk, status: '확인됨' }
        : undefined;
      await sendAdlib(day, speaker, text, clue);
      setMessage('');
      setClueMode(false);
      setClueTitle('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-seal-500/40 bg-paper-100 p-3.5">
      <p className="font-mono text-[11px] font-bold tracking-wide text-seal-600">관리자 콘솔 — 직접 대사 보내기 (Roll20 스타일)</p>
      <p className="text-xs text-ink-700/70">
        플레이어가 자유롭게 조사하는 동안, 상황 설명이나 특정 NPC의 대사를 직접 보내 즉흥으로 반응할 수 있습니다. 아래 조사실 채팅에 모두에게 즉시 표시됩니다.
      </p>

      <div className="flex flex-col gap-1.5">
        <select
          value={speakerId}
          onChange={(e) => setSpeakerId(e.target.value)}
          className="rounded-lg border border-ink-700/20 bg-paper-50 px-2.5 py-1.5 text-sm text-ink-900 outline-none focus:border-seal-500"
        >
          <option value={NARRATOR.id}>{NARRATOR.name}</option>
          {CHARACTERS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !clueMode && send()}
            placeholder="대사나 상황 설명을 입력하세요"
            className="flex-1 rounded-lg border border-ink-700/20 bg-paper-50 px-2.5 py-1.5 text-sm text-ink-900 outline-none placeholder:text-ink-500/40 focus:border-seal-500"
          />
          <button
            type="button"
            onClick={send}
            disabled={!message.trim() || sending || (clueMode && !clueTitle.trim())}
            className="flex-none rounded-lg bg-ink-black px-3 py-1.5 text-xs font-bold text-paper-50 disabled:opacity-40"
          >
            {sending ? '전송 중…' : '보내기'}
          </button>
        </div>

        <label className="flex items-center gap-1.5 text-xs text-ink-700/70">
          <input type="checkbox" checked={clueMode} onChange={(e) => setClueMode(e.target.checked)} />
          단서 제목 지정 (플레이어가 수첩에 등록할 때 사용됨)
        </label>

        {clueMode && (
          <div className="flex items-center gap-2">
            <input
              value={clueTitle}
              onChange={(e) => setClueTitle(e.target.value)}
              placeholder="단서 제목 (예: E01. 현장 사진)"
              className="flex-1 rounded-lg border border-seal-500/40 bg-paper-50 px-2.5 py-1.5 text-sm text-ink-900 outline-none placeholder:text-ink-500/40 focus:border-seal-500"
            />
            <select
              value={clueInk}
              onChange={(e) => setClueInk(e.target.value as ClueDef['ink'])}
              className="flex-none rounded-lg border border-ink-700/20 bg-paper-50 px-2 py-1.5 text-xs text-ink-900 outline-none focus:border-seal-500"
            >
              {INK_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
