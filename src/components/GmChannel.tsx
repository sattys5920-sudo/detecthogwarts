import { useEffect, useRef, useState } from 'react';
import { type AdlibMessage, listenAdlibs, presentEvidence } from '../firebase/session';
import type { NotebookEntry } from '../hooks/useNotebook';

const INK_DOT: Record<NotebookEntry['ink'], string> = {
  black: 'bg-ink-black',
  red: 'bg-ink-red',
  indigo: 'bg-ink-indigo',
};

interface GmChannelProps {
  day: number;
  notebookEntries: NotebookEntry[];
  presenterNickname: string;
  onRegisterClue: (sourceId: string, clue: NonNullable<AdlibMessage['clue']>) => void;
}

export default function GmChannel({ day, notebookEntries, presenterNickname, onRegisterClue }: GmChannelProps) {
  const [adlibs, setAdlibs] = useState<AdlibMessage[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => listenAdlibs(day, setAdlibs), [day]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [adlibs.length]);

  const registeredIds = new Set(notebookEntries.map((e) => e.sourceId).filter(Boolean));

  async function handlePresent(entry: NotebookEntry) {
    setPresenting(true);
    try {
      await presentEvidence(day, presenterNickname, { title: entry.title, ink: entry.ink });
      setPickerOpen(false);
    } finally {
      setPresenting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold text-ink-700/70">GM 채널 — 관리자의 즉흥 서술과 제시된 증거</p>

      <div ref={listRef} className="flex max-h-72 flex-col gap-2.5 overflow-y-auto rounded-sm border border-ink-700/15 bg-paper-50 p-3.5">
        {adlibs.length === 0 && (
          <p className="py-6 text-center text-xs text-ink-500/50">아직 관리자의 메시지가 없습니다.</p>
        )}
        {adlibs.map((m) => {
          if (m.kind === 'evidence') {
            return (
              <div key={m.id} className="mx-auto flex max-w-[85%] items-center gap-1.5 rounded-lg border border-seal-600/50 bg-seal-600/10 px-3 py-1.5 text-xs text-seal-600">
                <span>
                  <b>{m.speaker}</b>이(가) {m.text}
                </span>
              </div>
            );
          }
          return m.speaker ? (
            <div key={m.id} className="flex max-w-[90%] flex-col items-start rounded-lg border border-seal-500/30 bg-paper-100/60 px-3 py-1.5 text-sm text-ink-900">
              <span>
                <span className="mr-1 font-bold text-seal-600">{m.speaker}</span>
                {m.text}
              </span>
              {m.clue && (
                <button
                  type="button"
                  disabled={registeredIds.has(m.id)}
                  onClick={() => onRegisterClue(m.id, m.clue!)}
                  className="mt-1 text-[10px] font-bold text-ink-500/40 underline-offset-2 hover:text-seal-600 hover:underline disabled:text-seal-600 disabled:no-underline"
                >
                  {registeredIds.has(m.id) ? '수첩에 등록됨' : '수첩에 등록'}
                </button>
              )}
            </div>
          ) : (
            <div key={m.id} className="flex flex-col items-center">
              <p className="text-center font-serif-kr text-sm italic leading-relaxed text-ink-900">{m.text}</p>
              {m.clue && (
                <button
                  type="button"
                  disabled={registeredIds.has(m.id)}
                  onClick={() => onRegisterClue(m.id, m.clue!)}
                  className="mt-1 text-[10px] font-bold text-ink-500/40 underline-offset-2 hover:text-seal-600 hover:underline disabled:text-seal-600 disabled:no-underline"
                >
                  {registeredIds.has(m.id) ? '수첩에 등록됨' : '수첩에 등록'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="tablet-btn tablet-btn-ghost self-center rounded-lg px-4 py-1.5 text-xs font-bold"
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
    </div>
  );
}
