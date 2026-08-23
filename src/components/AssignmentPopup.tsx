import CornerFlourish from './CornerFlourish';
import { useGame } from '../context/GameContext';
import { HOUSES } from '../data/school';
import { patronusById } from '../game/forest/patronus';

function PopupShell({ label, lines, onConfirm }: { label: string; lines: string[]; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/60 px-6" role="alertdialog" aria-modal="true">
      <div className="deckle-edge relative flex max-h-[85vh] w-full max-w-xs flex-col border border-seal-500/40 bg-paper-50 p-5 text-center shadow-[0_4px_20px_rgba(23,19,15,0.35)]">
        <CornerFlourish corner="tl" className="pointer-events-none absolute -top-1.5 -left-1.5 h-5 w-5 text-gold-600/70" />
        <CornerFlourish corner="tr" className="pointer-events-none absolute -top-1.5 -right-1.5 h-5 w-5 text-gold-600/70" />
        <CornerFlourish corner="bl" className="pointer-events-none absolute -bottom-1.5 -left-1.5 h-5 w-5 text-gold-600/70" />
        <CornerFlourish corner="br" className="pointer-events-none absolute -bottom-1.5 -right-1.5 h-5 w-5 text-gold-600/70" />
        <p className="flex-none font-mono text-[10px] font-bold tracking-widest text-seal-600">{label}</p>
        <div className="mt-3 flex-1 overflow-y-auto">
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
