import type { JSX } from 'react';

export type TabIconName = 'hall' | 'exploration' | 'interrogation' | 'recess' | 'notebook' | 'profile';

const COMMON = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function HallGlyph() {
  return (
    <>
      <path {...COMMON} d="M4 20V9l8-5 8 5v11" />
      <path {...COMMON} d="M4 20h16" />
      <path {...COMMON} d="M9 20v-6h6v6" />
      <path {...COMMON} d="M12 4v3" />
    </>
  );
}

function ExplorationGlyph() {
  return (
    <>
      <circle {...COMMON} cx="10.5" cy="10.5" r="6.5" />
      <path {...COMMON} d="M15.2 15.2 20 20" />
    </>
  );
}

function InterrogationGlyph() {
  return (
    <>
      <path {...COMMON} d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9A1.5 1.5 0 0 1 18.5 16H9l-4 4v-4H5.5A1.5 1.5 0 0 1 4 14.5v-9Z" />
      <path {...COMMON} d="M8.3 8.6h7.4" />
      <path {...COMMON} d="M8.3 11.6h4.6" />
    </>
  );
}

function RecessGlyph() {
  return (
    <>
      <path {...COMMON} d="M6 3h12" />
      <path {...COMMON} d="M6 21h12" />
      <path {...COMMON} d="M7 3c0 5 5 6 5 9s-5 4-5 9" />
      <path {...COMMON} d="M17 3c0 5-5 6-5 9s5 4 5 9" />
    </>
  );
}

function NotebookGlyph() {
  return (
    <>
      <path {...COMMON} d="M6 3.5h11a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z" />
      <path {...COMMON} d="M4 17.5h13" />
      <path {...COMMON} d="M9 7.5h5" />
    </>
  );
}

function ProfileGlyph() {
  return (
    <>
      <circle {...COMMON} cx="12" cy="8" r="3.6" />
      <path {...COMMON} d="M4.8 20c1.2-3.8 4.2-5.8 7.2-5.8s6 2 7.2 5.8" />
    </>
  );
}

const GLYPHS: Record<TabIconName, () => JSX.Element> = {
  hall: HallGlyph,
  exploration: ExplorationGlyph,
  interrogation: InterrogationGlyph,
  recess: RecessGlyph,
  notebook: NotebookGlyph,
  profile: ProfileGlyph,
};

export default function TabIcon({ name, className = '' }: { name: TabIconName; className?: string }) {
  const Glyph = GLYPHS[name];
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <Glyph />
    </svg>
  );
}
