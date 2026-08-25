import { useState } from 'react';
import { CHARACTERS } from '../data/investigation/characters';
import { sendAdlib, sendOptionsMessage } from '../firebase/session';

const NARRATOR = { id: 'narrator', name: '상황 설명' };
const CUSTOM = { id: 'custom', name: '직접 입력' };
const MAX_OPTIONS = 5;

export default function AdminGmConsole({ day }: { day: number }) {
  const [speakerId, setSpeakerId] = useState(NARRATOR.id);
  const [customName, setCustomName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [optionsMode, setOptionsMode] = useState(false);
  const [options, setOptions] = useState(['', '']);

  function resolveSpeaker() {
    if (speakerId === NARRATOR.id) return '';
    if (speakerId === CUSTOM.id) return customName.trim();
    return CHARACTERS.find((c) => c.id === speakerId)?.name ?? '';
  }

  function updateOption(i: number, value: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  }

  function addOption() {
    setOptions((prev) => (prev.length >= MAX_OPTIONS ? prev : [...prev, '']));
  }

  function removeOption(i: number) {
    setOptions((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);
  const canSend = optionsMode
    ? trimmedOptions.length > 0 && !sending
    : message.trim().length > 0 && !sending;

  async function send() {
    const speaker = resolveSpeaker();
    setSending(true);
    try {
      if (optionsMode) {
        await sendOptionsMessage(day, speaker, message.trim(), trimmedOptions);
        setOptions(['', '']);
      } else {
        await sendAdlib(day, speaker, message.trim());
      }
      setMessage('');
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
          <option value={CUSTOM.id}>{CUSTOM.name}</option>
        </select>

        {speakerId === CUSTOM.id && (
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="발화자 이름을 입력하세요"
            maxLength={30}
            className="rounded-lg border border-ink-700/20 bg-paper-50 px-2.5 py-1.5 text-sm text-ink-900 outline-none placeholder:text-ink-500/40 focus:border-seal-500"
          />
        )}

        <div className="flex items-center gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !optionsMode && canSend && send()}
            placeholder={optionsMode ? '선택지 위에 표시할 질문 (선택 사항)' : '대사나 상황 설명을 입력하세요'}
            className="min-w-0 flex-1 rounded-lg border border-ink-700/20 bg-paper-50 px-2.5 py-1.5 text-sm text-ink-900 outline-none placeholder:text-ink-500/40 focus:border-seal-500"
          />
          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            className="flex-none rounded-lg bg-ink-black px-3 py-1.5 text-xs font-bold text-paper-50 disabled:opacity-40"
          >
            {sending ? '전송 중…' : '보내기'}
          </button>
        </div>

        <label className="flex items-center gap-1.5 text-xs text-ink-700/70">
          <input type="checkbox" checked={optionsMode} onChange={(e) => setOptionsMode(e.target.checked)} />
          선택지 보내기 (최대 {MAX_OPTIONS} 개, 플레이어가 눌러서 바로 답합니다)
        </label>

        {optionsMode && (
          <div className="flex flex-col gap-1.5">
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={o}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`선택지 ${i + 1}`}
                  maxLength={60}
                  className="min-w-0 flex-1 rounded-lg border border-ink-700/20 bg-paper-50 px-2.5 py-1.5 text-sm text-ink-900 outline-none placeholder:text-ink-500/40 focus:border-seal-500"
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  disabled={options.length <= 1}
                  className="flex-none text-xs text-ink-500/50 hover:text-seal-600 disabled:opacity-30"
                >
                  삭제
                </button>
              </div>
            ))}
            {options.length < MAX_OPTIONS && (
              <button
                type="button"
                onClick={addOption}
                className="self-start text-xs font-bold text-ink-700/70 underline-offset-2 hover:text-ink-900 hover:underline"
              >
                + 선택지 추가
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
