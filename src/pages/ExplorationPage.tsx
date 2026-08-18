import { useState } from 'react';
import AdminGmConsole from '../components/AdminGmConsole';
import FinalDeduction from '../components/FinalDeduction';
import Letterhead from '../components/Letterhead';
import ScriptViewer from '../components/ScriptViewer';
import { useGame } from '../context/GameContext';
import { DAYS } from '../data/investigation/days';
import type { ClueDef } from '../data/investigation/types';
import { useNotebook } from '../hooks/useNotebook';

export default function ExplorationPage() {
  const game = useGame();
  const { register } = useNotebook();
  const [selectedDay, setSelectedDay] = useState(game.currentDay);
  const [scriptDone, setScriptDone] = useState<Record<number, boolean>>({});

  const day = DAYS.find((d) => d.day === selectedDay) ?? DAYS[0];
  const showClosing = scriptDone[day.day];

  function handleClue(clue: ClueDef) {
    register(clue);
  }

  return (
    <div className="flex flex-col gap-4">
      <Letterhead label={`Day ${day.day} / 5`} context={day.title} meta={day.summary} />

      {game.isAdmin && (
        <p className="rounded-sm bg-ink-black px-2.5 py-1 text-center font-mono text-[11px] font-bold text-paper-50">
          🎲 관리자 모드
        </p>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {DAYS.map((d) => {
          const locked = !game.isAdmin && d.day > game.currentDay;
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

      <ScriptViewer
        key={day.day}
        day={day.day}
        beats={day.script}
        onClue={handleClue}
        onComplete={() => setScriptDone((s) => (s[day.day] ? s : { ...s, [day.day]: true }))}
      />

      {game.isAdmin && <AdminGmConsole key={`gm-${day.day}`} day={day.day} beats={day.script} />}

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
