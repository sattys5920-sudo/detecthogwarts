import { useEffect, useRef, useState } from 'react';
import { NPCS } from '../data/investigation/npcs';
import type { ClueDef, DayContent, Topic } from '../data/investigation/types';

interface LogEntry {
  kind: 'team' | 'npc' | 'me' | 'system';
  speaker?: string;
  icon?: string;
  text: string;
}

interface DayChatRoomProps {
  day: DayContent;
  nickname: string;
  unlockedClueTitles: Set<string>;
  onClue: (clue: ClueDef) => void;
  onWrapUp: () => void;
}

function fill(text: string, nickname: string) {
  return text.replaceAll('{name}', nickname || '당신');
}

function meetsRequirements(requiresClueTitles: string[] | undefined, unlockedClueTitles: Set<string>) {
  return (requiresClueTitles ?? []).every((title) => unlockedClueTitles.has(title));
}

export default function DayChatRoom({ day, nickname, unlockedClueTitles, onClue, onWrapUp }: DayChatRoomProps) {
  const npcs = day.npcs ?? [];
  const [log, setLog] = useState<LogEntry[]>(
    (day.roomIntro ?? []).map((l) => ({ kind: 'team', speaker: l.speaker, icon: l.icon, text: l.text })),
  );
  const [greeted, setGreeted] = useState<Record<string, boolean>>({});
  const [activeNpcId, setActiveNpcId] = useState<string | null>(null);
  const [asked, setAsked] = useState<Record<string, Record<string, boolean>>>({});
  const [askedFollowUp, setAskedFollowUp] = useState<Record<string, Record<string, boolean>>>({});
  const [wrappedUp, setWrappedUp] = useState(false);
  const registeredRef = useRef<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [log.length]);

  function append(entries: LogEntry[]) {
    setLog((l) => [...l, ...entries]);
  }

  function registerOnce(key: string, clue: ClueDef | undefined, entries: LogEntry[]) {
    if (!clue || registeredRef.current.has(key)) return;
    registeredRef.current.add(key);
    onClue(clue);
    entries.push({ kind: 'system', text: `🗒️ 조사수첩에 등록됨 — ${clue.title}` });
  }

  function openNpc(npcId: string) {
    const entry = npcs.find((n) => n.npcId === npcId);
    if (!entry) return;
    const npc = NPCS.find((n) => n.id === npcId);
    if (!greeted[npcId]) {
      append([
        { kind: 'system', text: `— ${npc?.name ?? npcId}님이 채팅방에 들어왔습니다 —` },
        { kind: 'npc', speaker: npc?.name, icon: npc?.icon, text: fill(entry.script.greeting, nickname) },
      ]);
      setGreeted((g) => ({ ...g, [npcId]: true }));
    }
    setActiveNpcId(npcId);
  }

  function ask(npcId: string, topic: Topic) {
    if (!meetsRequirements(topic.requiresClueTitles, unlockedClueTitles)) return;
    const npc = NPCS.find((n) => n.id === npcId);
    const entries: LogEntry[] = [
      { kind: 'me', text: topic.prompt },
      { kind: 'npc', speaker: npc?.name, icon: npc?.icon, text: fill(topic.response, nickname) },
    ];
    registerOnce(`${npcId}:${topic.id}`, topic.clue, entries);
    append(entries);
    setAsked((a) => ({ ...a, [npcId]: { ...a[npcId], [topic.id]: true } }));
  }

  function askFollowUp(npcId: string, topic: Topic) {
    if (!topic.followUp) return;
    if (!meetsRequirements(topic.followUp.requiresClueTitles, unlockedClueTitles)) return;
    const npc = NPCS.find((n) => n.id === npcId);
    const entries: LogEntry[] = [
      { kind: 'me', text: topic.followUp.prompt },
      { kind: 'npc', speaker: npc?.name, icon: npc?.icon, text: fill(topic.followUp.response, nickname) },
    ];
    registerOnce(`${npcId}:${topic.id}-follow`, topic.followUp.clue, entries);
    append(entries);
    setAskedFollowUp((a) => ({ ...a, [npcId]: { ...a[npcId], [topic.id]: true } }));
  }

  function wrapUp() {
    append((day.roomOutro ?? []).map((l) => ({ kind: 'team' as const, speaker: l.speaker, icon: l.icon, text: l.text })));
    setWrappedUp(true);
    setActiveNpcId(null);
    onWrapUp();
  }

  const activeEntry = npcs.find((n) => n.npcId === activeNpcId);
  const anyoneGreeted = Object.values(greeted).some(Boolean);

  return (
    <div className="flex flex-col gap-3">
      <div ref={listRef} className="flex max-h-96 flex-col gap-2 overflow-y-auto rounded-sm border border-ink-700/15 bg-paper-50 p-3">
        {log.map((m, i) => {
          if (m.kind === 'system') {
            return (
              <p key={i} className="text-center font-mono text-[11px] text-seal-600">
                {m.text}
              </p>
            );
          }
          const isMe = m.kind === 'me';
          return (
            <div
              key={i}
              className={
                isMe
                  ? 'ml-auto max-w-[85%] rounded-lg bg-paper-200 px-3 py-1.5 text-sm text-ink-900'
                  : 'flex max-w-[85%] items-start gap-1.5 rounded-lg border border-ink-700/15 bg-paper-100/60 px-3 py-1.5 text-sm text-ink-900'
              }
            >
              {!isMe && <span className="flex-none">{m.icon}</span>}
              <span>
                {!isMe && <span className="mr-1 font-bold text-ink-700/70">{m.speaker}</span>}
                {m.text}
              </span>
            </div>
          );
        })}
      </div>

      {!wrappedUp && npcs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {npcs.map(({ npcId }) => {
            const npc = NPCS.find((n) => n.id === npcId);
            if (!npc) return null;
            const active = activeNpcId === npcId;
            return (
              <button
                key={npcId}
                type="button"
                onClick={() => openNpc(npcId)}
                className={`tablet-tab rounded-lg px-2.5 py-1.5 text-xs font-bold ${active ? 'tablet-tab-active text-seal-600' : 'text-ink-700/70'}`}
              >
                {npc.icon} {npc.name}
              </button>
            );
          })}
        </div>
      )}

      {!wrappedUp && activeEntry && (
        <div className="flex flex-col gap-1.5">
          {activeEntry.script.topics.map((t) => {
            const unlocked = meetsRequirements(t.requiresClueTitles, unlockedClueTitles);
            const wasAsked = asked[activeEntry.npcId]?.[t.id];
            const followUpUnlocked = t.followUp ? meetsRequirements(t.followUp.requiresClueTitles, unlockedClueTitles) : false;
            const followUpAsked = askedFollowUp[activeEntry.npcId]?.[t.id];
            return (
              <div key={t.id} className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => ask(activeEntry.npcId, t)}
                  disabled={!unlocked}
                  className="tablet-tab rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {unlocked ? t.prompt : '🔒 아직 물어볼 근거가 부족하다'} {wasAsked && <span className="text-ink-500/40">✓</span>}
                </button>
                {t.followUp && wasAsked && !followUpAsked && (
                  <button
                    type="button"
                    onClick={() => askFollowUp(activeEntry.npcId, t)}
                    disabled={!followUpUnlocked}
                    className="ml-3 rounded-lg border border-seal-500/40 bg-paper-50 px-3 py-1.5 text-left text-xs font-medium text-seal-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {followUpUnlocked ? `↳ ${t.followUp.prompt}` : '🔒 더 캐물을 근거가 부족하다'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!wrappedUp && anyoneGreeted && (
        <button
          type="button"
          onClick={wrapUp}
          className="tablet-btn tablet-btn-dark self-center rounded-lg px-5 py-2.5 text-sm font-bold"
        >
          대화 마치기 →
        </button>
      )}
    </div>
  );
}
