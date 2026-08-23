import CornerFlourish from './CornerFlourish';
import { useGame } from '../context/GameContext';
import { HOUSES } from '../data/school';
import { patronusById } from '../game/forest/patronus';
import gryffindorCrest from '../assets/crests/gryffindor.png';
import hufflepuffCrest from '../assets/crests/hufflepuff.png';
import ravenclawCrest from '../assets/crests/ravenclaw.png';
import slytherinCrest from '../assets/crests/slytherin.png';

const HOUSE_CRESTS: Record<string, string> = {
  flame: gryffindorCrest,
  moonlight: ravenclawCrest,
  earth: hufflepuffCrest,
  wind: slytherinCrest,
};

function PopupShell({ label, image, lines, onConfirm }: { label: string; image?: string; lines: string[]; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/60 px-6 py-8" role="alertdialog" aria-modal="true">
      <div className="relative w-full max-w-xs">
        <CornerFlourish corner="tl" className="pointer-events-none absolute -top-1.5 -left-1.5 z-10 h-5 w-5 text-gold-600/70" />
        <CornerFlourish corner="tr" className="pointer-events-none absolute -top-1.5 -right-1.5 z-10 h-5 w-5 text-gold-600/70" />
        <CornerFlourish corner="bl" className="pointer-events-none absolute -bottom-1.5 -left-1.5 z-10 h-5 w-5 text-gold-600/70" />
        <CornerFlourish corner="br" className="pointer-events-none absolute -bottom-1.5 -right-1.5 z-10 h-5 w-5 text-gold-600/70" />
        <div
          className="deckle-edge flex w-full flex-col overflow-y-auto border border-seal-500/40 bg-paper-50 p-5 text-center shadow-[0_4px_20px_rgba(23,19,15,0.35)]"
          style={{ maxHeight: 'calc(100dvh - 4rem)' }}
        >
          <p className="flex-none font-mono text-[10px] font-bold tracking-widest text-seal-600">{label}</p>
          {image && <img src={image} alt="" className="mx-auto mt-3 h-24 w-auto flex-none" />}
          <div className="mt-3">
            {lines.map((line, i) => (
              <p key={i} className={`font-serif-kr text-sm leading-relaxed text-ink-900 ${i > 0 ? 'mt-3' : ''}`}>
                {line}
              </p>
            ))}
          </div>
          <button
            type="button"
            onClick={onConfirm}
            className="tablet-btn tablet-btn-dark mt-5 w-full flex-none px-4 py-2 text-xs font-bold"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

/** Full-screen narrated popups shown once when a house or patronus is newly assigned. */
export default function AssignmentPopup() {
  const game = useGame();

  if (game.justAssigned && game.assignedHouse) {
    const house = HOUSES.find((h) => h.id === game.assignedHouse);
    if (house) {
      return (
        <PopupShell
          label="기숙사 배정"
          image={HOUSE_CRESTS[house.id]}
          lines={['기숙사 배정 모자가 고민 끝에 입을 열었습니다.', `${game.nickname}, 당신은...... ${house.name}!`]}
          onConfirm={game.clearJustAssigned}
        />
      );
    }
  }

  if (game.justAssignedPatronus && game.patronus) {
    const patronus = patronusById(game.patronus);
    return (
      <PopupShell
        label="패트로누스 배정"
        lines={[
          `${game.nickname}, 당신의 지팡이 끝에서 빛이 모여 하나의 피사체를 만들어 냅니다. ${patronus.name}, 당신의 든든한 친구가 되어 줄 거예요.`,
        ]}
        onConfirm={game.clearJustAssignedPatronus}
      />
    );
  }

  return null;
}
