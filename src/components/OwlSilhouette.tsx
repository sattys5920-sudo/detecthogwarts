import type { AnimationEventHandler } from 'react';

interface OwlSilhouetteProps {
  className?: string;
  onAnimationEnd?: AnimationEventHandler<SVGSVGElement>;
}

export default function OwlSilhouette({ className = '', onAnimationEnd }: OwlSilhouetteProps) {
  return (
    <svg viewBox="0 0 120 100" className={className} onAnimationEnd={onAnimationEnd} aria-hidden="true">
      <g fill="var(--color-ink-black)">
        <path d="M58 42 C 30 22 6 12 0 36 C 20 44 38 52 53 57 Z" />
        <path d="M62 42 C 90 22 114 12 120 36 C 100 44 82 52 67 57 Z" />
        <path d="M46 33 L41 17 L55 31 Z" />
        <path d="M74 33 L79 17 L65 31 Z" />
        <ellipse cx="60" cy="56" rx="19" ry="25" />
        <path d="M49 79 L60 94 L71 79 Z" />
      </g>
      <circle cx="52" cy="51" r="5.4" fill="var(--color-paper-50)" />
      <circle cx="68" cy="51" r="5.4" fill="var(--color-paper-50)" />
      <circle cx="52" cy="51" r="2.1" fill="var(--color-ink-black)" />
      <circle cx="68" cy="51" r="2.1" fill="var(--color-ink-black)" />
      <path d="M58 57 L62 57 L60 62 Z" fill="var(--color-ink-red)" />
    </svg>
  );
}
