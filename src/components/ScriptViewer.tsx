import { useEffect, useRef, useState } from 'react';
import { eligibleBeats } from '../data/investigation/scriptUtils';
import type { ClueDef, ScriptBeat } from '../data/investigation/types';
import { type AdlibMessage, listenAdlibs, listenSessionState, presentEvidence } from '../firebase/session';
import type { NotebookEntry } from '../hooks/useNotebook';

const INK_DOT: Record<NotebookEntry['ink'], string> = {
  black: 'bg-ink-black',
  red: 'bg-ink-red',
  indigo: 'bg-ink-indigo',
};

interface ScriptViewerProps {
  day: number;
  beats: ScriptBeat[];
  notebookEntries: NotebookEntry[];
  presenterNickname: string;
  onClue: (clue: ClueDef) => void;
  onComplete: () => void;
}

export default function ScriptViewer({ day, beats, notebookEntries, presenterNickname, onClue, onComplete }: ScriptViewerProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [adlibs, setAdlibs] = useState<AdlibMessage[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const registeredRef = useRef<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => listenSessionState(day, (s) => {
    setRevealedCount(s.revealedCount);
    setChoices(s.choices);
  }), [day]);

  useEffect(() => listenAdlibs(day, setAdlibs), [day]);

  const eligible = eligibleBeats(beats, choices);
  const revealed = eligible.slice(0, revealedCount);
  const lastRevealed = revealed[revealed.length - 1];
  const pendingChoice = lastRevealed?.type === 'choice' && !choices[lastRevealed.id] ? lastRevealed : null;

  useEffect(() => {
    for (const beat of revealed) {
      if (beat.clue && !registeredRef.current.has(beat.id)) {
        registeredRef.current.add(beat.id);
        onClue(beat.clue);
      }
    }
    if (revealedCount >= eligible.length && eligible.length > 0) {
      onComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealedCount, choices]);

  useEffect(() => {
    for (const m of adlibs) {
      if (m.clue && !registeredRef.current.has(m.id)) {
        registeredRef.current.add(m.id);
        onClue(m.clue);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adlibs]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [revealed.length, adlibs.length]);

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
      <div ref={listRef} className="flex max-h-96 flex-col gap-2.5 overflow-y-auto rounded-sm border border-ink-700/15 bg-paper-50 p-3.5">
        {revealed.length === 0 && adlibs.length === 0 && (
          <p className="py-6 text-center text-xs text-ink-500/50">관리자가 이야기를 시작하기를 기다리는 중…</p>
        )}
        {revealed.map((beat) => {
          if (beat.type === 'choice') {
            const picked = choices[beat.id];
            if (!picked) return null;
            const label = beat.options?.find((o) => o.id === picked)?.text ?? picked;
            return (
              <div key={beat.id} className="ml-auto max-w-[85%] rounded-lg bg-paper-200 px-3 py-1.5 text-sm text-ink-900">
                {label}
              </div>
            );
          }
          if (beat.speaker) {
            return (
              <div key={beat.id} className="flex max-w-[90%] items-start gap-1.5 rounded-lg border border-ink-700/15 bg-paper-100/60 px-3 py-1.5 text-sm text-ink-900">
                <span className="flex-none">{beat.icon}</span>
                <span>
                  <span className="mr-1 font-bold text-ink-700/70">{beat.speaker}</span>
                  {beat.text}
                </span>
              </div>
            );
          }
          return (
            <p key={beat.id} className="text-center font-serif-kr text-sm italic leading-relaxed text-ink-900">
              {beat.text}
              {beat.clue && <span className="mt-1 block font-mono text-[10px] not-italic text-seal-600">🗒️ 조사수첩에 등록됨 — {beat.clue.title}</span>}
            </p>
          );
        })}

        {adlibs.map((m) => {
          if (m.kind === 'evidence') {
            return (
              <div key={m.id} className="mx-auto flex max-w-[85%] items-center gap-1.5 rounded-lg border border-seal-600/50 bg-seal-600/10 px-3 py-1.5 text-xs text-seal-600">
                <span>🔍</span>
                <span>
                  <b>{m.speaker}</b>이(가) {m.text}
                </span>
              </div>
            );
          }
          return m.speaker ? (
            <div key={m.id} className="flex max-w-[90%] items-start gap-1.5 rounded-lg border border-seal-500/30 bg-paper-100/60 px-3 py-1.5 text-sm text-ink-900">
              <span className="flex-none">{m.icon}</span>
              <span>
                <span className="mr-1 font-bold text-seal-600">{m.speaker}</span>
                {m.text}
                {m.clue && <span className="mt-1 block font-mono text-[10px] text-seal-600">🗒️ 조사수첩에 등록됨 — {m.clue.title}</span>}
              </span>
            </div>
          ) : (
            <p key={m.id} className="text-center font-serif-kr text-sm italic leading-relaxed text-ink-900">
              {m.text}
              {m.clue && <span className="mt-1 block font-mono text-[10px] not-italic text-seal-600">🗒️ 조사수첩에 등록됨 — {m.clue.title}</span>}
            </p>
          );
        })}
      </div>

      {pendingChoice && (
        <p className="text-center text-xs text-ink-500/50">관리자가 다음 전개를 고르는 중…</p>
      )}

      {!pendingChoice && revealedCount < eligible.length && (
        <p className="text-center text-xs text-ink-500/50">···</p>
      )}

      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="tablet-btn tablet-btn-ghost self-center rounded-lg px-4 py-1.5 text-xs font-bold"
        >
          🔍 증거 제시{pickerOpen ? ' 닫기' : ''}
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
