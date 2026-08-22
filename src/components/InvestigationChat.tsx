import { useEffect, useRef, useState } from 'react';
import ClueRegisterModal from './ClueRegisterModal';
import Composer from './Composer';
import { CHARACTERS } from '../data/investigation/characters';
import { type AdlibMessage, listenAdlibs, presentEvidence, sendChatMessage } from '../firebase/session';
import type { NotebookEntry } from '../hooks/useNotebook';

function avatarFor(speaker: string) {
  return CHARACTERS.find((c) => c.name === speaker)?.avatar;
}

function formatTime(ms: number) {
  if (!ms) return '';
  return new Date(ms).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
}

const INK_DOT: Record<NotebookEntry['ink'], string> = {
  black: 'bg-ink-black',
  red: 'bg-ink-red',
  indigo: 'bg-ink-indigo',
};

function RegisterDots({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="단서로 등록"
      className="flex-none rounded-full px-1.5 py-0.5 text-xs font-bold leading-none text-ink-500/40 hover:bg-paper-200 hover:text-seal-600"
    >
      ⋯
    </button>
  );
}

interface NarrationBubbleProps {
  m: AdlibMessage;
  onRegister: (m: AdlibMessage) => void;
}

/** Any admin-sent narration line (suspect dialogue or plain situation text) — tap the ⋯ to register it as a clue. */
function NarrationBubble({ m, onRegister }: NarrationBubbleProps) {
  const avatarSrc = m.speaker ? avatarFor(m.speaker) : undefined;

  if (!m.speaker) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <p className="text-center font-serif-kr text-sm italic leading-relaxed text-ink-900">{m.text}</p>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] text-ink-500/40">{formatTime(m.at)}</span>
          <RegisterDots onClick={() => onRegister(m)} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-w-[90%] items-start gap-2">
      {avatarSrc ? (
        <img src={avatarSrc} alt="" className="h-8 w-8 flex-none rounded-full border border-ink-700/20 object-cover" />
      ) : (
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-ink-black text-[11px] font-bold text-paper-50">
          {m.speaker[0]}
        </span>
      )}
      <div className="flex flex-col items-start gap-1 rounded-lg border border-seal-500/30 bg-paper-100/60 px-3 py-1.5 text-sm text-ink-900">
        <span>
          <span className="mr-1 font-bold text-seal-600">{m.speaker}</span>
          {m.text}
        </span>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] text-ink-500/50">{formatTime(m.at)}</span>
          <RegisterDots onClick={() => onRegister(m)} />
        </div>
      </div>
    </div>
  );
}

interface OptionsBubbleProps {
  m: AdlibMessage;
  onRegister: (m: AdlibMessage) => void;
  onPick: (text: string) => void;
}

function OptionsBubble({ m, onRegister, onPick }: OptionsBubbleProps) {
  const avatarSrc = m.speaker ? avatarFor(m.speaker) : undefined;

  return (
    <div className="flex max-w-[90%] items-start gap-2">
      {m.speaker ? (
        avatarSrc ? (
          <img src={avatarSrc} alt="" className="h-8 w-8 flex-none rounded-full border border-ink-700/20 object-cover" />
        ) : (
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-ink-black text-[11px] font-bold text-paper-50">
            {m.speaker[0]}
          </span>
        )
      ) : null}
      <div className="flex flex-col items-start gap-1.5 rounded-lg border border-seal-500/30 bg-paper-100/60 px-3 py-2 text-sm text-ink-900">
        {m.text && (
          <span>
            {m.speaker && <span className="mr-1 font-bold text-seal-600">{m.speaker}</span>}
            {m.text}
          </span>
        )}
        <div className="flex flex-wrap gap-1.5">
          {(m.options ?? []).map((opt, i) => (
            <button key={i} type="button" onClick={() => onPick(opt)} className="tablet-btn px-2.5 py-1 text-xs font-bold">
              {opt}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] text-ink-500/50">{formatTime(m.at)}</span>
          <RegisterDots onClick={() => onRegister(m)} />
        </div>
      </div>
    </div>
  );
}

interface InvestigationChatProps {
  day: number;
  notebookEntries: NotebookEntry[];
  nickname: string;
  avatar: string | null;
  onRegisterClue: (sourceId: string, clue: NonNullable<AdlibMessage['clue']>) => void;
}

export default function InvestigationChat({ day, notebookEntries, nickname, avatar, onRegisterClue }: InvestigationChatProps) {
  const [adlibs, setAdlibs] = useState<AdlibMessage[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [registerTarget, setRegisterTarget] = useState<AdlibMessage | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => listenAdlibs(day, setAdlibs), [day]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [adlibs.length]);

  const registeredIds = new Set(notebookEntries.map((e) => e.sourceId).filter(Boolean));

  async function handlePresent(entry: NotebookEntry) {
    setPresenting(true);
    try {
      await presentEvidence(day, nickname, { title: entry.title, ink: entry.ink });
      setPickerOpen(false);
    } finally {
      setPresenting(false);
    }
  }

  function handleSendChat(text: string) {
    sendChatMessage(day, nickname, text, avatar);
  }

  function confirmRegister(title: string) {
    if (!registerTarget) return;
    onRegisterClue(registerTarget.id, { title, desc: registerTarget.text, ink: 'black', status: '확인됨' });
    setRegisterTarget(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold text-ink-700/70">
        조사실 채팅 — 다 함께 대화하고, 관리자의 서술과 제시된 증거도 여기 표시됩니다. 관리자가 보낸 말풍선 옆의 ⋯ 버튼을 누르면 단서로 등록할 수 있습니다.
      </p>

      <div ref={listRef} className="flex max-h-72 flex-col gap-2.5 overflow-x-hidden overflow-y-auto rounded-sm border border-ink-700/15 bg-paper-50 p-3.5">
        {adlibs.length === 0 && (
          <p className="py-6 text-center text-xs text-ink-500/50">아직 대화가 없습니다. 첫 메시지를 남겨보세요.</p>
        )}
        {adlibs.map((m) => {
          if (m.kind === 'evidence') {
            return (
              <div key={m.id} className="mx-auto flex max-w-[85%] items-center gap-1.5 rounded-lg border border-seal-600/50 bg-seal-600/10 px-3 py-1.5 text-xs text-seal-600">
                <span className="min-w-0 flex-1">
                  <b>{m.speaker}</b>이(가) {m.text}
                </span>
                <span className="flex-none font-mono text-[10px] text-seal-600/60">{formatTime(m.at)}</span>
              </div>
            );
          }

          if (m.kind === 'options') {
            return <OptionsBubble key={m.id} m={m} onRegister={setRegisterTarget} onPick={handleSendChat} />;
          }

          if (m.kind === 'chat') {
            const isMe = m.speaker === nickname;
            return (
              <div key={m.id} className={`flex max-w-[85%] items-end gap-2 ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                {m.authorAvatar ? (
                  <img src={m.authorAvatar} alt="" className="h-7 w-7 flex-none rounded-full border border-ink-700/20 object-cover" />
                ) : (
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-ink-black text-[10px] font-bold text-paper-50">
                    {m.speaker ? m.speaker[0] : '?'}
                  </span>
                )}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="mb-0.5 text-[10px] font-bold text-ink-700/60">{m.speaker}</span>
                  <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <p
                      className={`rounded-lg border px-3 py-1.5 text-sm text-ink-900 ${
                        isMe ? 'border-ink-700/25 bg-paper-200/60' : 'border-ink-700/15 bg-paper-100/60'
                      }`}
                    >
                      {m.text}
                    </p>
                    <span className="flex-none font-mono text-[10px] text-ink-500/50">{formatTime(m.at)}</span>
                  </div>
                </div>
              </div>
            );
          }

          return <NarrationBubble key={m.id} m={m} onRegister={setRegisterTarget} />;
        })}
      </div>

      <Composer onSubmit={handleSendChat} placeholder="다른 플레이어에게 메시지를 보내세요" submitLabel="전송" />

      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="tablet-btn tablet-btn-ghost self-center px-4 py-1.5 text-xs font-bold"
        >
          증거 제시{pickerOpen ? ' 닫기' : ''}
        </button>

        {pickerOpen && (
          <div className="flex flex-col gap-1 rounded-sm border border-ink-700/15 bg-paper-100/60 p-2.5">
            {notebookEntries.length === 0 ? (
              <p className="py-2 text-center text-xs text-ink-500/50">아직 제시할 수 있는 단서가 없습니다.</p>
            ) : (
              notebookEntries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  disabled={presenting}
                  onClick={() => handlePresent(entry)}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-ink-900 hover:bg-paper-200 disabled:opacity-40"
                >
                  <span className={`h-2 w-2 flex-none rounded-full ${INK_DOT[entry.ink]}`} />
                  {entry.title}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {registerTarget && (
        <ClueRegisterModal
          sourceText={registerTarget.text}
          alreadyRegistered={registeredIds.has(registerTarget.id)}
          onConfirm={confirmRegister}
          onClose={() => setRegisterTarget(null)}
        />
      )}
    </div>
  );
}
