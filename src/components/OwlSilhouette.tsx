import type { AnimationEventHandler } from 'react';

interface OwlSilhouetteProps {
  className?: string;
  onAnimationEnd?: AnimationEventHandler<SVGSVGElement>;
}

function Wing() {
  return (
    <>
      <path d="M40 60 C 20 44 4 50 7 68 C 10 87 30 89 43 72 Z" />
      <path d="M16 56 L20 61 L16 66" strokeWidth="1.6" />
      <path d="M13 65 L17 70 L13 75" strokeWidth="1.6" />
      <path d="M22 50 L26 55 L22 60" strokeWidth="1.6" />
    </>
  );
}

export default function OwlSilhouette({ className = '', onAnimationEnd }: OwlSilhouetteProps) {
  return (
    <svg
      viewBox="0 0 140 130"
      className={className}
      onAnimationEnd={onAnimationEnd}
      fill="none"
      stroke="var(--color-ink-black)"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <g className="wing-anim">
        <Wing />
      </g>
      <g className="wing-anim" transform="translate(140 0) scale(-1 1)">
        <Wing />
      </g>

      <path d="M70 30 C 100 30 104 60 100 78 C 96 98 44 98 40 78 C 36 60 40 30 70 30 Z" />

      <path d="M52 30 C 48 21 46 13 50 8 C 54 13 57 21 58 28" />
      <path d="M88 30 C 92 21 94 13 90 8 C 86 13 83 21 82 28" />

      <path d="M44 42 C 50 30 66 30 70 41 C 74 30 90 30 96 42" strokeWidth="2" />

      <circle cx="58" cy="53" r="13" />
      <circle cx="83" cy="53" r="12.5" />
      <circle cx="56" cy="55" r="7" fill="var(--color-ink-black)" stroke="none" />
      <circle cx="85" cy="55" r="6.6" fill="var(--color-ink-black)" stroke="none" />
      <circle cx="59" cy="51" r="2" fill="var(--color-paper-50)" stroke="none" />
      <circle cx="88" cy="51" r="2" fill="var(--color-paper-50)" stroke="none" />

      <path d="M67 63 L73 63 L70 70 Z" fill="var(--color-ink-red)" />

      <path d="M50 78 Q54 74 58 78 Q62 74 66 78 Q70 74 74 78 Q78 74 82 78 Q86 74 90 78" strokeWidth="2" />
      <path d="M52 88 Q56 84 60 88 Q64 84 68 88 Q72 84 76 88 Q80 84 84 88 Q88 84 88 88" strokeWidth="2" />
    </svg>
  );
}
