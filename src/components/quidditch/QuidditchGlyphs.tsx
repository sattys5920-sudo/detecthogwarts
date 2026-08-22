import type { JSX } from 'react';
import type { PieceType } from '../../game/quidditchEngine';

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function KeeperGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
      <path d="M12 3 19 6v6c0 5-3 8-7 9-4-1-7-4-7-9V6l7-3Z" {...stroke} />
      <path d="M12 8v7M9 11.5h6" {...stroke} strokeWidth={1.3} />
    </svg>
  );
}

function SeekerGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
      <path d="M2 12c3-4 6.5-5 10-5s7 1 10 5c-3 4-6.5 5-10 5s-7-1-10-5Z" {...stroke} />
      <circle cx="12" cy="12" r="2.3" {...stroke} />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ChaserGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
      <path d="M4 20 17 7" {...stroke} />
      <path d="M15 5 19 9" {...stroke} />
      <path d="M4 20c1.5-.3 3-1 4-2M4.9 19.1c1.3-.2 2.6-.9 3.6-1.8" {...stroke} strokeWidth={1.2} />
      <path d="M17 7c1.2-1 2.6-1.4 4-1.4-.1 1.4-.5 2.7-1.5 3.9" {...stroke} strokeWidth={1.2} />
    </svg>
  );
}

function BeaterGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
      <path d="M7 17 16 8a2.4 2.4 0 0 0-3-3L4 14z" {...stroke} />
      <path d="M4 14 3 20l6-1" {...stroke} strokeWidth={1.3} />
    </svg>
  );
}

const PIECE_GLYPHS: Record<PieceType, () => JSX.Element> = {
  keeper: KeeperGlyph,
  seeker: SeekerGlyph,
  chaser: ChaserGlyph,
  beater: BeaterGlyph,
};

export function PieceGlyph({ type }: { type: PieceType }) {
  const Glyph = PIECE_GLYPHS[type];
  return <Glyph />;
}

export function QuaffleGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="#9c3b28" stroke="#5a1f14" strokeWidth="1.2" />
      <path d="M6 9.5c3 1.6 9 1.6 12 0M5 14.5c3.5-1.4 10.5-1.4 14 0" fill="none" stroke="#5a1f14" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

export function SnitchGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M4 12c1.5-4 4.5-6 7-3-1.5-4 .5-7.5 3.5-7.5C13 4 12.5 7 12 9c2.5-3 6-3 7 .5-3-1-5.5.5-6 3.5 3-1.5 6 0 6.5 3.5-3.5-1.5-6.5 0-7 3 2.5.5 4 3 3 6-2-2-4.5-2.5-6-1 .5 3-1 5.5-3.5 5.5.5-3-.5-5.5-2.5-6.5-1.5 2-4 2.5-6.5 1 1.5-2.5 3.5-3.5 6-3-1-2.5-3.5-4-6.5-3 1-3 3.5-4.5 6-3-1-3-.5-6 2-8Z"
        fill="#c9963e"
        stroke="#7d5d26"
        strokeWidth="0.6"
        opacity="0.9"
      />
      <circle cx="12" cy="12" r="3" fill="#e8c66a" stroke="#7d5d26" strokeWidth="1" />
    </svg>
  );
}
