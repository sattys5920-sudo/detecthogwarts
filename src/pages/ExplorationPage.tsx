import { useState } from 'react';
import FinalDeduction from '../components/FinalDeduction';
import Letterhead from '../components/Letterhead';
import NpcDialogue from '../components/NpcDialogue';
import SceneExplorer from '../components/SceneExplorer';
import { useGame } from '../context/GameContext';
import { DAYS } from '../data/investigation/days';
import { NPCS } from '../data/investigation/npcs';
import type { ClueDef } from '../data/investigation/types';
import { useNotebook } from '../hooks/useNotebook';

export default function ExplorationPage() {
  const game = useGame();
  const { entries, register } = useNotebook();
  const [selectedDay, setSelectedDay] = useState(game.currentDay);
  const [openNpcId, setOpenNpcId] = useState<string | null>(null);
  const unlockedClueTitles = new Set(entries.map((e) => e.title));

  const day = DAYS.find((d) => d.day === selectedDay) ?? DAYS[0];
  const npcEntry = day.npcs?.find((n) => n.npcId === openNpcId);
  const npc = NPCS.find((n) => n.id === openNpcId);

  function handleClue(clue: ClueDef) {
    register(clue);
  }

  if (npcEntry && npc) {
    return (
      <div className="flex flex-col gap-4">
        <Letterhead label={`Day ${day.day}`} context={day.title} meta={`${npc.icon} ${npc.name} · ${npc.role}`} />
        <button
          type="button"
          onClick={() => setOpenNpcId(null)}
          className="self-start text-xs text-ink-500/60 underline-offset-2 hover:text-ink-700 hover:underline"
        >
          ← 목록으로
        </button>
        <NpcDialogue
          npcIcon={npc.icon}
          script={npcEntry.script}
          nickname={game.nickname}
          unlockedClueTitles={unlockedClueTitles}
          onClue={handleClue}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Letterhead label={`Day ${day.day} / 5`} context={day.title} meta={day.summary} />

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {DAYS.map((d) => {
          const locked = d.day > game.currentDay;
          const active = d.day === selectedDay;
          return (
            <button
              key={d.day}
              type="button"
              disabled={locked}
              onClick={() => setSelectedDay(d.day)}
              className={`tablet-tab flex-none rounded-lg px-3 py-2 text-xs font-bold ${
                active ? 'tablet-tab-active text-seal-600' : locked ? 'text-ink-500/40' : 'text-ink-700/70'
              }`}
            >
              {locked ? '🔒 ' : ''}Day {d.day}
            </button>
          );
        })}
      </div>

      {day.sceneItems && (
        <div>
          <p className="mb-2 text-xs font-bold text-ink-700/70">현장 조사</p>
          <SceneExplorer items={day.sceneItems} onClue={handleClue} />
        </div>
      )}

      {day.npcs && day.npcs.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold text-ink-700/70">대화 상대</p>
          <div className="flex flex-col gap-2">
            {day.npcs.map(({ npcId }) => {
              const n = NPCS.find((x) => x.id === npcId);
              if (!n) return null;
              return (
                <button
                  key={npcId}
                  type="button"
                  onClick={() => setOpenNpcId(npcId)}
                  className="flex items-center gap-3 rounded-sm border border-ink-700/15 bg-paper-50 p-3 text-left hover:border-ink-700/30"
                >
                  <span className="text-xl">{n.icon}</span>
                  <div>
                    <p className="font-serif-kr font-semibold text-ink-900">{n.name}</p>
                    <p className="text-xs text-ink-700/70">{n.role}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-sm border border-ink-700/15 bg-paper-100/60 p-3.5 text-sm leading-relaxed text-ink-900">
        {day.closing}
      </div>

      {day.finalDeduction && <FinalDeduction onSolved={() => game.setDeductionSolved(true)} />}

      {selectedDay === game.currentDay && game.currentDay < 5 && (
        <button
          type="button"
          onClick={() => {
            const next = day.day + 1;
            game.advanceDay();
            setSelectedDay(next);
          }}
          className="tablet-btn tablet-btn-dark self-center rounded-lg px-5 py-2.5 text-sm font-bold"
        >
          다음 날로 →
        </button>
      )}
    </div>
  );
}
