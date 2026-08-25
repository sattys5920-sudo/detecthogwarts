import { useEffect, useState } from 'react';
import CornerFlourish from './CornerFlourish';
import SurpriseMissionCard from './SurpriseMissionCard';
import { useGame } from '../context/GameContext';
import { listenSurpriseMission, type SurpriseMissionState } from '../firebase/surpriseMission';

const SEEN_KEY = 'arcanum-surprisemission-seen';

/** Full-screen interrupt shown to every player the moment admin broadcasts a new surprise mission — dismiss to keep playing normally; the same question stays answerable from the dorm room afterward. */
export default function SurpriseMissionPopup() {
  const game = useGame();
  const [mission, setMission] = useState<SurpriseMissionState | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(() => localStorage.getItem(SEEN_KEY));
  const [open, setOpen] = useState(false);

  useEffect(() => listenSurpriseMission(setMission), []);

  useEffect(() => {
    if (mission?.id && mission.active && mission.id !== dismissedId) setOpen(true);
  }, [mission?.id, mission?.active, dismissedId]);

  if (!open || !mission?.id || !game.houseId || game.isAdmin) return null;

  function dismiss() {
    if (mission?.id) {
      localStorage.setItem(SEEN_KEY, mission.id);
      setDismissedId(mission.id);
    }
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/60 px-6" role="alertdialog" aria-modal="true">
      <div className="deckle-edge relative flex max-h-[85vh] w-full max-w-xs flex-col gap-3 overflow-y-auto border border-seal-500/40 bg-paper-50 p-5 shadow-[0_4px_20px_rgba(23,19,15,0.35)]">
        <CornerFlourish corner="tl" className="pointer-events-none absolute -top-1.5 -left-1.5 h-5 w-5 text-gold-600/70" />
        <CornerFlourish corner="tr" className="pointer-events-none absolute -top-1.5 -right-1.5 h-5 w-5 text-gold-600/70" />
        <CornerFlourish corner="bl" className="pointer-events-none absolute -bottom-1.5 -left-1.5 h-5 w-5 text-gold-600/70" />
        <CornerFlourish corner="br" className="pointer-events-none absolute -bottom-1.5 -right-1.5 h-5 w-5 text-gold-600/70" />
        <SurpriseMissionCard mission={mission} houseId={game.houseId} />
        <button type="button" onClick={dismiss} className="tablet-btn tablet-btn-ghost w-full flex-none px-4 py-2 text-xs font-bold">
          닫기
        </button>
      </div>
    </div>
  );
}
