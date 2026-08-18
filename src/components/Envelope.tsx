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
        <defs>
          <linearGradient id="envelopeBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-paper-100)" />
            <stop offset="100%" stopColor="var(--color-paper-200)" />
          </linearGradient>
          <radialGradient id="waxSeal" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="var(--color-seal-500)" />
            <stop offset="55%" stopColor="var(--color-seal-600)" />
            <stop offset="100%" stopColor="var(--color-seal-700)" />
          </radialGradient>
        </defs>

        <rect x="2" y="8" width="96" height="60" rx="2" fill="url(#envelopeBody)" stroke="var(--color-gold-500)" strokeWidth="1.2" />
        <rect x="4.5" y="10.5" width="91" height="55" rx="1.5" fill="none" stroke="var(--color-gold-400)" strokeWidth="0.5" opacity="0.55" />

        <path d="M4 8 L4 14 M4 8 L10 8" stroke="var(--color-gold-500)" strokeWidth="1" fill="none" opacity="0.8" />
        <path d="M96 8 L96 14 M96 8 L90 8" stroke="var(--color-gold-500)" strokeWidth="1" fill="none" opacity="0.8" />
        <path d="M4 68 L4 62 M4 68 L10 68" stroke="var(--color-gold-500)" strokeWidth="1" fill="none" opacity="0.8" />
        <path d="M96 68 L96 62 M96 68 L90 68" stroke="var(--color-gold-500)" strokeWidth="1" fill="none" opacity="0.8" />

        <path d="M2 10 L50 46 L98 10" fill="none" stroke="var(--color-gold-500)" strokeWidth="0.9" opacity="0.5" />

        {!open && (
          <g>
            <circle cx="50" cy="38" r="9.5" fill="var(--color-seal-700)" opacity="0.35" />
            <circle cx="50" cy="38" r="9" fill="url(#waxSeal)" stroke="var(--color-seal-700)" strokeWidth="0.6" />
            <circle cx="50" cy="38" r="9" fill="none" stroke="var(--color-gold-300)" strokeWidth="0.4" opacity="0.6" />
            <text
              x="50"
              y="41.5"
              textAnchor="middle"
              fontFamily="var(--font-gothic)"
              fontSize="10"
              fill="var(--color-gold-300)"
              opacity="0.9"
            >
              H
            </text>
          </g>
        )}
      </svg>
      <svg
        viewBox="0 0 100 44"
        className="absolute inset-x-0 top-[11%] w-full transition-transform duration-700 ease-out"
        style={{
          transformOrigin: 'top center',
          transform: open ? 'rotateX(150deg)' : 'rotateX(0deg)',
        }}
      >
        <defs>
          <linearGradient id="envelopeFlap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-paper-200)" />
            <stop offset="100%" stopColor="var(--color-paper-300)" />
          </linearGradient>
        </defs>
        <path d="M2 2 L50 34 L98 2 Z" fill="url(#envelopeFlap)" stroke="var(--color-gold-500)" strokeWidth="1.2" />
        <path d="M6 4 L50 30 L94 4" fill="none" stroke="var(--color-gold-400)" strokeWidth="0.5" opacity="0.55" />
      </svg>
    </div>
  );
}
