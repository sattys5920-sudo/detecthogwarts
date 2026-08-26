import { useEffect, useState } from 'react';
import SurpriseMissionCard from './SurpriseMissionCard';
import { useGame } from '../context/GameContext';
import { listenSurpriseMission, type SurpriseMissionState } from '../firebase/surpriseMission';

const SEEN_KEY = 'arcanum-surprisemission-seen';
const AUTO_DISMISS_MS = 1800;

/**
 * Non-blocking banner shown near the top of the screen the moment admin broadcasts a new surprise
 * mission — unlike the day's regular house-cup puzzle (a separate, unrelated system), this floats
 * on top of whatever the player is doing without hiding it, and closes itself automatically once
 * that house answers correctly. Players can also close it manually and keep answering from the
 * dorm room afterward.
 */
export default function SurpriseMissionPopup() {
  const game = useGame();
  const [mission, setMission] = useState<SurpriseMissionState | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(() => localStorage.getItem(SEEN_KEY));
  const [open, setOpen] = useState(false);

  useEffect(() => listenSurpriseMission(setMission), []);

  useEffect(() => {
    if (mission?.id && mission.active && mission.id !== dismissedId) setOpen(true);
  }, [mission?.id, mission?.active, dismissedId]);

  const solved = !!mission?.id && !!game.houseId && mission.solvedOrder.includes(game.houseId);

  function dismiss() {
    if (mission?.id) {
      localStorage.setItem(SEEN_KEY, mission.id);
      setDismissedId(mission.id);
    }
    setOpen(false);
  }

  useEffect(() => {
    if (!open || !solved) return;
    const t = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [open, solved, mission?.id]);

  if (!open || !mission?.id || !game.houseId || game.isAdmin) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4.75rem)' }}
    >
      <div className="pointer-events-auto flex w-full max-w-md flex-col gap-3 rounded-sm border border-seal-500/40 bg-paper-50 p-4 shadow-[0_8px_24px_rgba(23,19,15,0.35)]">
        <SurpriseMissionCard mission={mission} houseId={game.houseId} />
        <button type="button" onClick={dismiss} className="tablet-btn tablet-btn-ghost w-full flex-none px-4 py-1.5 text-xs font-bold">
          닫기
        </button>
      </div>
    </div>
  );
}
