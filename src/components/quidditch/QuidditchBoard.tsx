import { useState } from 'react';
import { BOARD_SIZE, legalMoves, legalPassTargets, type QuidditchGame, type Team } from '../../game/quidditchEngine';
import { PieceGlyph, QuaffleGlyph, SnitchGlyph } from './QuidditchGlyphs';

const TEAM_TOKEN: Record<Team, string> = {
  A: 'bg-seal-600 border-seal-700 text-paper-50',
  B: 'bg-ink-indigo border-[#151a2c] text-paper-50',
};

function toVisual(row: number, col: number, mySeat: Team) {
  if (mySeat === 'A') return { row: BOARD_SIZE - 1 - row, col: BOARD_SIZE - 1 - col };
  return { row, col };
}

interface Props {
  game: QuidditchGame;
  mySeat: Team;
  onMove: (pieceId: string, dest: { row: number; col: number }) => void;
  onPass: (pieceId: string, targetId: string) => void;
  /** Spectator view (e.g. an admin watching without a seat) — pieces render but never respond to taps. */
  readOnly?: boolean;
}

export default function QuidditchBoard({ game, mySeat, onMove, onPass, readOnly }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canAct = !readOnly && game.status === 'playing' && game.currentTeam === mySeat;
  const dests = selectedId && canAct ? legalMoves(game, selectedId) : [];
  const passTargets = selectedId && canAct ? legalPassTargets(game, selectedId) : [];

  function handleTap(row: number, col: number) {
    if (!canAct) return;
    const piece = game.pieces.find((p) => p.row === row && p.col === col);

    if (selectedId && piece && passTargets.includes(piece.id)) {
      onPass(selectedId, piece.id);
      setSelectedId(null);
      return;
    }

    const dest = dests.find((d) => d.row === row && d.col === col);
    if (selectedId && dest) {
      onMove(selectedId, { row, col });
      setSelectedId(null);
      return;
    }

    if (piece && piece.team === mySeat) {
      setSelectedId((prev) => (prev === piece.id ? null : piece.id));
      return;
    }
    setSelectedId(null);
  }

  const cells = [];
  for (let vr = 0; vr < BOARD_SIZE; vr++) {
    for (let vc = 0; vc < BOARD_SIZE; vc++) {
      const { row, col } = toVisual(vr, vc, mySeat);
      const piece = game.pieces.find((p) => p.row === row && p.col === col);
      const isSnitch = game.snitch && game.snitch.row === row && game.snitch.col === col;
      const isQuaffle = game.quafflePos && game.quafflePos.row === row && game.quafflePos.col === col;
      const dest = dests.find((d) => d.row === row && d.col === col);
      const isPassTarget = Boolean(piece && passTargets.includes(piece.id));
      const isSelected = piece && piece.id === selectedId;
      const dark = (row + col) % 2 === 1;
      const goalRow = row === 0 ? 'A' : row === BOARD_SIZE - 1 ? 'B' : null;

      cells.push(
        <button
          key={`${vr}-${vc}`}
          type="button"
          onClick={() => handleTap(row, col)}
          className={`relative flex aspect-square items-center justify-center border border-ink-700/10 ${
            dark ? 'bg-paper-200/70' : 'bg-paper-50'
          } ${goalRow === 'A' ? 'bg-seal-600/10' : ''} ${goalRow === 'B' ? 'bg-ink-indigo/10' : ''}`}
        >
          {isQuaffle && !piece && <QuaffleGlyph className="h-[55%] w-[55%]" />}
          {isSnitch && !piece && <SnitchGlyph className="h-[60%] w-[60%] animate-pulse" />}

          {piece && (
            <span
              className={`relative flex h-[78%] w-[78%] items-center justify-center rounded-full border-2 p-1.5 transition-transform ${TEAM_TOKEN[piece.team]} ${
                isSelected ? 'scale-110 shadow-[0_0_0_3px_var(--color-paper-50),0_0_0_5px_var(--color-gold-400)]' : ''
              }`}
            >
              <PieceGlyph type={piece.type} />
              {piece.hasQuaffle && (
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-paper-50 bg-gold-400">
                  <QuaffleGlyph className="h-3 w-3" />
                </span>
              )}
              {isSnitch && (
                <span className="absolute -top-1.5 -left-1.5 h-3.5 w-3.5">
                  <SnitchGlyph className="h-full w-full" />
                </span>
              )}
            </span>
          )}

          {dest && !piece && (
            <span className={`absolute h-2.5 w-2.5 rounded-full ${dest.capture ? 'bg-seal-600' : 'bg-ink-700/40'}`} />
          )}
          {dest && piece && <span className="pointer-events-none absolute inset-0 rounded-none ring-2 ring-inset ring-seal-600" />}
          {isPassTarget && (
            <span className="pointer-events-none absolute inset-0.5 rounded-full border-2 border-dashed border-gold-400" />
          )}
        </button>,
      );
    }
  }

  return (
    <div className="paper-frame grid grid-cols-8 overflow-hidden bg-paper-50">
      {cells}
    </div>
  );
}
