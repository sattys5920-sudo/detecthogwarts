import { useEffect, useState } from 'react';
import { PUZZLE_RANK_POINTS } from '../data/logicPuzzles';
import {
  listenMissionAnswer,
  MISSION_MAX_ATTEMPTS,
  submitMissionAnswer,
  type MissionAnswerDoc,
  type SurpriseMissionState,
} from '../firebase/surpriseMission';

interface SurpriseMissionCardProps {
  mission: SurpriseMissionState;
  houseId: string;
}

/** Player-facing question + answer box for the currently broadcast surprise mission — used both inside the popup and embedded in the dorm room. */
export default function SurpriseMissionCard({ mission, houseId }: SurpriseMissionCardProps) {
  const [answerDoc, setAnswerDoc] = useState<MissionAnswerDoc | null>(null);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);

  useEffect(() => listenMissionAnswer(mission.id ?? '', houseId, setAnswerDoc), [mission.id, houseId]);

  const rank = mission.solvedOrder.indexOf(houseId);
  const solved = rank >= 0;
  const attempts = answerDoc?.missionId === mission.id ? (answerDoc.attempts ?? 0) : 0;
  const outOfAttempts = !solved && attempts >= MISSION_MAX_ATTEMPTS;
  const canAnswer = mission.active && !solved && !outOfAttempts;

  async function handleSubmit() {
    if (!draft.trim() || submitting || !mission.id) return;
    setSubmitting(true);
    try {
      const result = await submitMissionAnswer(mission.id, houseId, draft.trim(), mission.answerHash);
      setDraft('');
      if (!result.correct) {
        setWrongFlash(true);
        setTimeout(() => setWrongFlash(false), 900);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-sm border border-seal-500/30 bg-paper-100/60 p-3.5">
      <p className="font-mono text-[10px] font-bold tracking-widest text-seal-600">⚡ 돌발 미션</p>
      <p className="whitespace-pre-wrap text-sm font-bold leading-relaxed text-ink-900">{mission.question}</p>

      {solved ? (
        <p className="text-sm font-bold text-seal-600">
          정답입니다! {rank + 1} 등 · +{PUZZLE_RANK_POINTS[rank] ?? 0} 점 획득
        </p>
      ) : outOfAttempts ? (
        <p className="text-sm font-bold text-ink-700">
          기회를 모두 사용했습니다. ({attempts}/{MISSION_MAX_ATTEMPTS})
        </p>
      ) : !mission.active ? (
        <p className="text-sm text-ink-500/60">미션이 종료되었습니다.</p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="정답을 입력하세요"
              disabled={!canAnswer || submitting}
              className={`min-w-0 flex-1 rounded-sm border px-3 py-2 text-sm text-ink-900 outline-none focus:border-seal-500 ${
                wrongFlash ? 'border-ink-red' : 'border-ink-700/30'
              }`}
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!draft.trim() || !canAnswer || submitting}
              className="tablet-btn tablet-btn-dark px-3 py-2 text-xs font-bold disabled:opacity-40"
            >
              제출
            </button>
          </div>
          <p className="text-right font-mono text-[10px] text-ink-500/50">
            남은 기회 {MISSION_MAX_ATTEMPTS - attempts} / {MISSION_MAX_ATTEMPTS}
          </p>
        </>
      )}
    </div>
  );
}
