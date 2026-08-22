import type { JSX } from 'react';

export type VintageIconName = 'feather' | 'seal' | 'book' | 'star';

const COMMON = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function FeatherGlyph() {
  return (
    <>
      <path {...COMMON} d="M19 5c-7.5 0-13 5.5-13 13" />
      <path {...COMMON} d="M19 5 6 18" />
      <path {...COMMON} d="M9 15l2-2M12 12l2-2M15 9l2-2" />
      <path {...COMMON} d="M6 18 4 22" />
    </>
  );
}

function SealGlyph() {
  return (
    <>
      <circle {...COMMON} cx="12" cy="10" r="6" />
      <path {...COMMON} d="M9 15.5 8 22l4-2 4 2-1-6.5" />
      <circle cx="12" cy="10" r="2" fill="currentColor" />
    </>
  );
}

function BookGlyph() {
  return (
    <>
      <path {...COMMON} d="M4 5.5c2-1 5-1 8 .5 3-1.5 6-1.5 8-.5v13c-2-1-5-1-8 .5-3-1.5-6-1.5-8-.5Z" />
      <path {...COMMON} d="M12 6v13" />
    </>
  );
}

function StarGlyph() {
  return <path {...COMMON} d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l4 4M14 14l4 4M18 6l-4 4M10 14l-4 4" />;
}

const GLYPHS: Record<VintageIconName, () => JSX.Element> = {
  feather: FeatherGlyph,
  seal: SealGlyph,
  book: BookGlyph,
  star: StarGlyph,
};

export default function VintageIcon({ name, className = '' }: { name: VintageIconName; className?: string }) {
  const Glyph = GLYPHS[name];
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <Glyph />
    </svg>
  );
}
