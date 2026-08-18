import type { AnimationEventHandler } from 'react';

interface EnvelopeProps {
  open: boolean;
  className?: string;
  onAnimationEnd?: AnimationEventHandler<HTMLDivElement>;
}

export default function Envelope({ open, className = '', onAnimationEnd }: EnvelopeProps) {
  return (
    <div className={`relative ${className}`} style={{ perspective: '400px' }} onAnimationEnd={onAnimationEnd}>
      <svg viewBox="0 0 100 70" className="block w-full">
        <rect x="2" y="8" width="96" height="60" rx="3" fill="var(--color-paper-100)" stroke="var(--color-ink-700)" strokeWidth="1.5" />
        <path d="M2 10 L50 46 L98 10" fill="none" stroke="var(--color-ink-700)" strokeWidth="1.3" opacity="0.6" />
        {!open && <circle cx="50" cy="38" r="8" fill="var(--color-ink-red)" />}
      </svg>
      <svg
        viewBox="0 0 100 44"
        className="absolute inset-x-0 top-[11%] w-full transition-transform duration-700 ease-out"
        style={{
          transformOrigin: 'top center',
          transform: open ? 'rotateX(150deg)' : 'rotateX(0deg)',
        }}
      >
        <path d="M2 2 L50 34 L98 2 Z" fill="var(--color-paper-200)" stroke="var(--color-ink-700)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
