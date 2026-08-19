import { useState } from 'react';
import AdminGmConsole from '../components/AdminGmConsole';
import DayExplorer from '../components/DayExplorer';
import FinalDeduction from '../components/FinalDeduction';
import GmChannel from '../components/GmChannel';
import Letterhead from '../components/Letterhead';
import { useGame } from '../context/GameContext';
import { DAYS } from '../data/investigation/days';
import type { ClueDef } from '../data/investigation/types';
import { useNotebook } from '../hooks/useNotebook';

export default function ExplorationPage() {
  const game = useGame();
  const { entries, register } = useNotebook();
  const [selectedDay, setSelectedDay] = useState(game.currentDay);
  const [showClosing, setShowClosing] = useState<Record<number, boolean>>({});

  const day = DAYS.find((d) => d.day === selectedDay) ?? DAYS[0];

  function handleRegister(sourceId: string, clue: ClueDef) {
    register({ ...clue, sourceId });
  }

  return (
    <div className="flex flex-col gap-4">
      <Letterhead label={`Day ${day.day} / 5`} context={day.title} meta={`${day.nodes.length}개 조사 항목`} />

      {game.isAdmin && (
        <p className="rounded-sm bg-ink-black px-2.5 py-1 text-center font-mono text-[11px] font-bold text-paper-50">
          관리자 모드
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
              Day {d.day}
              {locked ? ' (잠김)' : ''}
            </button>
          );
        })}
      </div>

      {day.objective && (
        <p className="rounded-sm border border-seal-500/30 bg-paper-100 px-3 py-2 text-xs font-bold text-seal-600">
          {day.objective}
        </p>
      )}

      <DayExplorer key={day.day} day={day} notebookEntries={entries} onRegister={handleRegister} />

      <div className="h-px bg-ink-700/10" />

      <GmChannel
        key={`gm-${day.day}`}
        day={day.day}
        notebookEntries={entries}
        presenterNickname={game.nickname}
        onRegisterClue={handleRegister}
      />

      {game.isAdmin && <AdminGmConsole key={`console-${day.day}`} day={day.day} />}

      {!showClosing[day.day] && (
        <button
          type="button"
          onClick={() => setShowClosing((s) => ({ ...s, [day.day]: true }))}
          className="tablet-btn tablet-btn-ghost self-center rounded-lg px-4 py-2 text-xs font-bold"
        >
          하루 마무리 보기
        </button>
      )}

      {showClosing[day.day] && (
        <>
          <div className="flex flex-col gap-1.5 rounded-sm border border-ink-700/15 bg-paper-100/60 p-3.5 text-sm leading-relaxed text-ink-900">
            {day.closing.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          {day.finalDay && <FinalDeduction notebookEntries={entries} onSolved={() => game.setDeductionSolved(true)} />}

          {!day.finalDay && selectedDay === game.currentDay && game.currentDay < 5 && (
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
