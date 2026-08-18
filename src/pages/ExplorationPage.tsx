import { useState } from 'react';
import DayChatRoom from '../components/DayChatRoom';
import FinalDeduction from '../components/FinalDeduction';
import Letterhead from '../components/Letterhead';
import SceneExplorer from '../components/SceneExplorer';
import { useGame } from '../context/GameContext';
import { DAYS } from '../data/investigation/days';
import type { ClueDef } from '../data/investigation/types';
import { useNotebook } from '../hooks/useNotebook';

export default function ExplorationPage() {
  const game = useGame();
  const { entries, register } = useNotebook();
  const [selectedDay, setSelectedDay] = useState(game.currentDay);
  const [roomDone, setRoomDone] = useState<Record<number, boolean>>({});
  const unlockedClueTitles = new Set(entries.map((e) => e.title));

  const day = DAYS.find((d) => d.day === selectedDay) ?? DAYS[0];
  const hasNpcs = (day.npcs?.length ?? 0) > 0;
  const showClosing = !hasNpcs || roomDone[day.day];

  function handleClue(clue: ClueDef) {
    register(clue);
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

      {day.objective && (
        <p className="rounded-sm border border-seal-500/30 bg-paper-100 px-3 py-2 text-xs font-bold text-seal-600">
          {day.objective}
        </p>
      )}

      {day.sceneItems && (
        <div>
          <p className="mb-2 text-xs font-bold text-ink-700/70">현장 조사</p>
          <SceneExplorer items={day.sceneItems} onClue={handleClue} />
        </div>
      )}

      {hasNpcs && (
        <div>
          <p className="mb-2 text-xs font-bold text-ink-700/70">조사실 채팅방</p>
          <DayChatRoom
            key={day.day}
            day={day}
            nickname={game.nickname}
            unlockedClueTitles={unlockedClueTitles}
            onClue={handleClue}
            onWrapUp={() => setRoomDone((r) => ({ ...r, [day.day]: true }))}
          />
        </div>
      )}

      {showClosing && (
        <>
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
        </>
      )}
    </div>
  );
}
