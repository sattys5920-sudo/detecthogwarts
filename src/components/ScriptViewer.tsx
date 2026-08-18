import { useEffect, useRef, useState } from 'react';
import { chooseOption, listenSessionState } from '../firebase/session';
import { eligibleBeats } from '../data/investigation/scriptUtils';
import type { ClueDef, ScriptBeat } from '../data/investigation/types';

interface ScriptViewerProps {
  day: number;
  beats: ScriptBeat[];
  onClue: (clue: ClueDef) => void;
  onComplete: () => void;
}

export default function ScriptViewer({ day, beats, onClue, onComplete }: ScriptViewerProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const registeredRef = useRef<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => listenSessionState(day, (s) => {
    setRevealedCount(s.revealedCount);
    setChoices(s.choices);
  }), [day]);

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
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [revealed.length]);

  return (
    <div className="flex flex-col gap-3">
      <div ref={listRef} className="flex max-h-96 flex-col gap-2.5 overflow-y-auto rounded-sm border border-ink-700/15 bg-paper-50 p-3.5">
        {revealed.length === 0 && (
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
          return (
            <p key={beat.id} className="text-center font-serif-kr text-sm italic leading-relaxed text-ink-900">
              {beat.text}
              {beat.clue && <span className="ml-1 block font-mono text-[10px] not-italic text-seal-600">🗒️ 조사수첩에 등록됨 — {beat.clue.title}</span>}
            </p>
          );
        })}
      </div>

      {pendingChoice && (
        <div className="flex flex-col gap-1.5">
          {pendingChoice.options?.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => chooseOption(day, pendingChoice.id, o.id)}
              className="tablet-tab rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-900"
            >
              {o.text}
            </button>
          ))}
        </div>
      )}

      {!pendingChoice && revealedCount < eligible.length && (
        <p className="text-center text-xs text-ink-500/50">···</p>
      )}
    </div>
  );
}
