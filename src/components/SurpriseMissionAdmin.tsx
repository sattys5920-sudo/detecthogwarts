import { useEffect, useState } from 'react';
import { PUZZLE_RANK_POINTS } from '../data/logicPuzzles';
import { HOUSES } from '../data/school';
import type { House } from '../types/game';
import {
  activateSurpriseMission,
  endSurpriseMission,
  listenMissionAnswer,
  listenSurpriseMission,
  MISSION_MAX_ATTEMPTS,
  type MissionAnswerDoc,
  type SurpriseMissionState,
} from '../firebase/surpriseMission';

function MissionHouseStatusRow({ mission, house }: { mission: SurpriseMissionState; house: House }) {
  const [answer, setAnswer] = useState<MissionAnswerDoc | null>(null);

  useEffect(() => listenMissionAnswer(mission.id ?? '', house.id, setAnswer), [mission.id, house.id]);

  const rank = mission.solvedOrder.indexOf(house.id);
  const solved = rank >= 0;
  const attempts = answer?.missionId === mission.id ? (answer.attempts ?? 0) : 0;
  const outOfAttempts = !solved && attempts >= MISSION_MAX_ATTEMPTS;

  let statusLabel: string;
  let statusClass: string;
  if (solved) {
    statusLabel = `풀었음 · ${rank + 1} 등 · +${PUZZLE_RANK_POINTS[rank] ?? 0} 점`;
    statusClass = 'text-seal-600';
  } else if (outOfAttempts) {
    statusLabel = `실패 · 기회 소진 (${attempts}/${MISSION_MAX_ATTEMPTS})`;
    statusClass = 'text-ink-700';
  } else if (attempts > 0) {
    statusLabel = `시도 중 (${attempts}/${MISSION_MAX_ATTEMPTS})`;
    statusClass = 'text-gold-600';
  } else {
    statusLabel = '아직 시도 안 함';
    statusClass = 'text-ink-500/50';
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-sm border border-ink-700/10 bg-paper-50 px-2.5 py-1.5">
      <span className="flex items-center gap-1.5 text-xs font-bold text-ink-900">
        <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ backgroundColor: house.color }} />
        {house.name}
      </span>
      <span className={`font-mono text-[11px] font-bold ${statusClass}`}>{statusLabel}</span>
    </div>
  );
}

/** Admin-only control (dorm room): compose a free-text question + hidden answer and broadcast it to every house as a surprise mission, then track each house's status. */
export default function SurpriseMissionAdmin() {
  const [mission, setMission] = useState<SurpriseMissionState | null>(null);
  const [composing, setComposing] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => listenSurpriseMission(setMission), []);

  const hasMission = Boolean(mission?.id);
  const showComposer = !hasMission || composing;

  async function handleSend() {
    if (!question.trim() || !answer.trim() || sending) return;
    setSending(true);
    try {
      await activateSurpriseMission(question.trim(), answer.trim());
      setQuestion('');
      setAnswer('');
      setComposing(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-sm border border-seal-500/30 bg-paper-50 p-3.5">
      <p className="font-serif-kr text-sm font-bold text-seal-600">관리자 — 돌발 미션</p>

      {hasMission && !composing && mission && (
        <>
          <div className="flex flex-col gap-1.5 rounded-sm border border-ink-700/15 bg-paper-100/50 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-ink-900">{mission.active ? '진행 중' : '종료됨'}</p>
              {mission.active && (
                <button type="button" onClick={() => endSurpriseMission()} className="text-[11px] text-ink-500/60 underline-offset-2 hover:underline">
                  미션 종료
                </button>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm text-ink-900">{mission.question}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-[10px] font-bold text-ink-500/60">기숙사별 현황</p>
            {HOUSES.map((h) => (
              <MissionHouseStatusRow key={h.id} mission={mission} house={h} />
            ))}
          </div>
        </>
      )}

      {showComposer ? (
        <div className="flex flex-col gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="문제 (모든 기숙사에게 팝업으로 전송됩니다)"
            className="w-full rounded-lg border border-ink-700/20 bg-paper-100/60 px-2.5 py-2 text-sm text-ink-900 outline-none focus:border-seal-500"
          />
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="정답 (관리자만 확인 — 학생 화면엔 전송되지 않습니다)"
            className="w-full rounded-lg border border-ink-700/20 bg-paper-100/60 px-2.5 py-2 text-sm text-ink-900 outline-none focus:border-seal-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSend}
              disabled={!question.trim() || !answer.trim() || sending}
              className="tablet-btn tablet-btn-dark px-3 py-1.5 text-xs font-bold disabled:opacity-40"
            >
              {sending ? '보내는 중…' : '돌발 미션 보내기'}
            </button>
            {hasMission && (
              <button type="button" onClick={() => setComposing(false)} className="text-xs text-ink-500/60">
                취소
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="self-start text-[11px] font-bold text-seal-600 underline-offset-2 hover:underline"
        >
          + 새 돌발 미션 작성
        </button>
      )}
    </div>
  );
}
