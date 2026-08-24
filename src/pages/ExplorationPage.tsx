import { useEffect, useState } from 'react';
import AdminFinalSurvey from '../components/AdminFinalSurvey';
import AdminFinalSurveyGrading from '../components/AdminFinalSurveyGrading';
import AdminGmConsole from '../components/AdminGmConsole';
import AdminScriptReference from '../components/AdminScriptReference';
import FinalDeduction from '../components/FinalDeduction';
import FinalSurveyAnswerBoard from '../components/FinalSurveyAnswerBoard';
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
  const [locked, setLocked] = useState(false);

  const day = DAYS.find((d) => d.day === selectedDay) ?? DAYS[0];

  useEffect(() => listenDayLock(selectedDay, setLocked), [selectedDay]);

  function handleRegister(sourceId: string, clue: ClueDef) {
    register({ ...clue, sourceId });
  }

  return (
    <div className="flex flex-col gap-4">
      <Letterhead label={`Day ${day.day} / 5`} meta="탐사 활동" />

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

      <div className="grid grid-cols-5 gap-1">
        {DAYS.map((d) => {
          const dayLocked = !game.isAdmin && d.day > game.currentDay;
          const active = d.day === selectedDay;
          return (
            <button
              key={d.day}
              type="button"
              disabled={dayLocked}
              onClick={() => setSelectedDay(d.day)}
              className={`tablet-tab flex flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-[11px] font-bold leading-none ${
                active ? 'tablet-tab-active text-seal-600' : dayLocked ? 'text-ink-500/40' : 'text-ink-700/70'
              }`}
            >
              <span>Day {d.day}</span>
              {dayLocked && <span className="text-[9px] font-normal">잠김</span>}
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
          playerId={game.playerId ?? ''}
          onRegisterClue={handleRegister}
        />
      )}

      {game.isAdmin && (
        <>
          <AdminGmConsole key={`console-${day.day}`} day={day.day} />
          {day.finalDay && <AdminFinalSurvey key={`survey-${day.day}`} day={day.day} />}
          {day.finalDay && <AdminFinalSurveyGrading key={`grading-${day.day}`} />}
          <AdminScriptReference key={`ref-${day.day}`} day={day} />
        </>
      )}

      {day.finalDay && !game.isAdmin && game.playerId && (
        <FinalSurveyAnswerBoard playerId={game.playerId} nickname={game.nickname} />
      )}

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
    </div>
  );
}
