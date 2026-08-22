export type Corner = 'tl' | 'tr' | 'bl' | 'br';

const TRANSFORM: Record<Corner, string> = {
  tl: '',
  tr: 'scaleX(-1)',
  bl: 'scaleY(-1)',
  br: 'scale(-1,-1)',
};

/** A small printer's-ornament flourish tucked into one corner of a frame. Drawn for the
 * top-left corner and mirrored via CSS transform for the other three. */
export default function CornerFlourish({ corner = 'tl', className = '' }: { corner?: Corner; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} style={{ transform: TRANSFORM[corner] }} aria-hidden="true">
      <path d="M4 20 Q4 4 20 4" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M4 4 L4 11 M4 4 L11 4" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M4 4 Q11 4.5 11 11.5" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <circle cx="4" cy="4" r="1.5" fill="currentColor" />
      <path d="M14 5.5c.9-1.6 2.6-2.2 4-1.5-.4 1.5-1.8 2.5-3.4 2.3" fill="currentColor" opacity="0.75" />
      <path d="M5.5 14c-1.6.9-2.2 2.6-1.5 4 1.5-.4 2.5-1.8 2.3-3.4" fill="currentColor" opacity="0.75" />
    </svg>
  );
}
