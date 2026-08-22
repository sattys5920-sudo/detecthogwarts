import { useEffect, useState } from 'react';
import AdminGmConsole from '../components/AdminGmConsole';
import AdminScriptReference from '../components/AdminScriptReference';
import FinalDeduction from '../components/FinalDeduction';
import InvestigationChat from '../components/InvestigationChat';
import Letterhead from '../components/Letterhead';
import { useGame } from '../context/GameContext';
import { DAYS } from '../data/investigation/days';
import type { ClueDef } from '../data/investigation/types';
import { listenDayLock, setDayLock } from '../firebase/locks';
import { useNotebook } from '../hooks/useNotebook';

export default function ExplorationPage() {
  const game = useGame();
  const { entries, register } = useNotebook();
  const [selectedDay, setSelectedDay] = useState(game.currentDay);
  const [showClosing, setShowClosing] = useState<Record<number, boolean>>({});
  const [locked, setLocked] = useState(false);

  const day = DAYS.find((d) => d.day === selectedDay) ?? DAYS[0];

  useEffect(() => listenDayLock(selectedDay, setLocked), [selectedDay]);

  function handleRegister(sourceId: string, clue: ClueDef) {
    register({ ...clue, sourceId });
  }

  return (
    <div className="flex flex-col gap-4">
      <Letterhead label={`Day ${day.day} / 5`} context={day.title} meta="탐사 활동" />

      {game.isAdmin && (
        <div className="flex items-center justify-between gap-2 rounded-sm bg-ink-black px-2.5 py-1.5">
          <p className="font-mono text-[11px] font-bold text-paper-50">관리자 모드</p>
          <button
            type="button"
            onClick={() => setDayLock(selectedDay, !locked)}
            className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-bold ${
              locked ? 'bg-seal-600 text-paper-50' : 'bg-paper-100 text-ink-900'
            }`}
          >
            {locked ? '잠김 — 열기' : '열림 — 잠그기'}
          </button>
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {DAYS.map((d) => {
          const dayLocked = !game.isAdmin && d.day > game.currentDay;
          const active = d.day === selectedDay;
          return (
            <button
              key={d.day}
              type="button"
              disabled={dayLocked}
              onClick={() => setSelectedDay(d.day)}
              className={`tablet-tab flex-none rounded-lg px-3 py-2 text-xs font-bold ${
                active ? 'tablet-tab-active text-seal-600' : dayLocked ? 'text-ink-500/40' : 'text-ink-700/70'
              }`}
            >
              Day {d.day}
              {dayLocked ? ' (잠김)' : ''}
            </button>
          );
        })}
      </div>

      {locked && !game.isAdmin ? (
        <div className="rounded-sm border border-ink-700/15 bg-paper-100/60 py-10 text-center">
          <p className="text-sm font-bold text-ink-700/70">아직 조사창이 잠겨 있습니다.</p>
          <p className="mt-1 text-xs text-ink-500/60">관리자가 열어야 이 날의 조사실 채팅을 볼 수 있어요.</p>
        </div>
      ) : (
        <InvestigationChat
          key={`chat-${day.day}`}
          day={day.day}
          notebookEntries={entries}
          nickname={game.nickname}
          avatar={game.avatarDataUrl}
          onRegisterClue={handleRegister}
        />
      )}

      {game.isAdmin && (
        <>
          <AdminGmConsole key={`console-${day.day}`} day={day.day} />
          <AdminScriptReference key={`ref-${day.day}`} day={day} />
        </>
      )}

      {!showClosing[day.day] && (
        <button
          type="button"
          onClick={() => setShowClosing((s) => ({ ...s, [day.day]: true }))}
          className="tablet-btn tablet-btn-ghost self-center px-4 py-2 text-xs font-bold"
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

          {game.isAdmin && !day.finalDay && selectedDay === game.currentDay && game.currentDay < 5 && (
            <button
              type="button"
              onClick={() => {
                const next = day.day + 1;
                game.advanceDay();
                setSelectedDay(next);
              }}
              className="tablet-btn tablet-btn-dark self-center px-5 py-2.5 text-sm font-bold"
            >
              다음 날로 →
            </button>
          )}
        </>
      )}
    </div>
  );
}
