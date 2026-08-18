import { useEffect, useRef, useState } from 'react';
import type { ClueDef, NpcScript, Topic } from '../data/investigation/types';

interface LogEntry {
  who: 'npc' | 'me';
  text: string;
}

interface NpcDialogueProps {
  npcIcon: string;
  script: NpcScript;
  nickname: string;
  unlockedClueTitles: Set<string>;
  onClue: (clue: ClueDef) => void;
}

function fill(text: string, nickname: string) {
  return text.replaceAll('{name}', nickname || '당신');
}

function isUnlocked(topic: Topic, unlockedClueTitles: Set<string>) {
  return (topic.requiresClueTitles ?? []).every((title) => unlockedClueTitles.has(title));
}

export default function NpcDialogue({ npcIcon, script, nickname, unlockedClueTitles, onClue }: NpcDialogueProps) {
  const [log, setLog] = useState<LogEntry[]>([{ who: 'npc', text: fill(script.greeting, nickname) }]);
  const [asked, setAsked] = useState<Record<string, boolean>>({});
  const [askedFollowUp, setAskedFollowUp] = useState<Record<string, boolean>>({});
  const registeredRef = useRef<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [log.length]);

  function registerOnce(key: string, clue?: ClueDef) {
    if (!clue || registeredRef.current.has(key)) return;
    registeredRef.current.add(key);
    onClue(clue);
  }

  function ask(topic: Topic) {
    if (!isUnlocked(topic, unlockedClueTitles)) return;
    setLog((l) => [...l, { who: 'me', text: topic.prompt }, { who: 'npc', text: fill(topic.response, nickname) }]);
    setAsked((a) => ({ ...a, [topic.id]: true }));
    registerOnce(topic.id, topic.clue);
  }

  function askFollowUp(topic: Topic) {
    if (!topic.followUp) return;
    setLog((l) => [
      ...l,
      { who: 'me', text: topic.followUp!.prompt },
      { who: 'npc', text: fill(topic.followUp!.response, nickname) },
    ]);
    setAskedFollowUp((u) => ({ ...u, [topic.id]: true }));
    registerOnce(`${topic.id}-follow`, topic.followUp.clue);
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={listRef} className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-sm border border-ink-700/15 bg-paper-50 p-3">
        {log.map((m, i) => (
          <div
            key={i}
            className={
              m.who === 'me'
                ? 'ml-auto max-w-[85%] rounded-lg bg-paper-200 px-3 py-1.5 text-sm text-ink-900'
                : 'flex max-w-[85%] items-start gap-1.5 rounded-lg border border-ink-700/15 bg-paper-100/60 px-3 py-1.5 text-sm text-ink-900'
            }
          >
            {m.who === 'npc' && <span className="flex-none">{npcIcon}</span>}
            <span>{m.text}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {script.topics.map((t) => {
          const unlocked = isUnlocked(t, unlockedClueTitles);
          return (
            <div key={t.id} className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => ask(t)}
                disabled={!unlocked}
                className="tablet-tab rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {unlocked ? t.prompt : '🔒 아직 물어볼 근거가 부족하다'} {asked[t.id] && <span className="text-ink-500/40">✓</span>}
              </button>
              {t.followUp && asked[t.id] && !askedFollowUp[t.id] && (
                <button
                  type="button"
                  onClick={() => askFollowUp(t)}
                  className="ml-3 rounded-lg border border-seal-500/40 bg-paper-50 px-3 py-1.5 text-left text-xs font-medium text-seal-600"
                >
                  ↳ {t.followUp.prompt}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
