import type { AnimationEventHandler } from 'react';

interface OwlSilhouetteProps {
  className?: string;
  onAnimationEnd?: AnimationEventHandler<SVGSVGElement>;
}

function WingFeathers() {
  return (
    <>
      <path d="M52 44 C 36 24 16 17 5 28" fill="none" />
      <path d="M5 28 C 15 42 28 47 37 51 C 45 55 50 53 52 50 Z" fill="var(--color-paper-50)" fillOpacity="0.5" />
      <path d="M17 27 L12 42" />
      <path d="M23 22 L20 44" />
      <path d="M31 20 L30 47" />
      <path d="M40 20 L41 49" />
    </>
  );
}

export default function OwlSilhouette({ className = '', onAnimationEnd }: OwlSilhouetteProps) {
  return (
    <svg
      viewBox="0 0 140 100"
      className={className}
      onAnimationEnd={onAnimationEnd}
      fill="none"
      stroke="var(--color-ink-black)"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <g className="wing-anim">
        <WingFeathers />
      </g>
      <g className="wing-anim" transform="translate(140 0) scale(-1 1)">
        <WingFeathers />
      </g>

      <path d="M56 42 C 60 68 60 78 70 88 C 80 78 80 68 84 42" fill="var(--color-paper-50)" fillOpacity="0.5" />
      <path d="M62 58 C 66 62 74 62 78 58" strokeWidth="0.9" opacity="0.6" />
      <path d="M60 68 C 65 72 75 72 80 68" strokeWidth="0.9" opacity="0.6" />

      <circle cx="70" cy="32" r="15" fill="var(--color-paper-50)" fillOpacity="0.6" />
      <path d="M59 21 C 57 14 61 10 65 15" strokeWidth="1.1" />
      <path d="M81 21 C 83 14 79 10 75 15" strokeWidth="1.1" />

      <circle cx="63" cy="31" r="5.5" fill="var(--color-paper-50)" />
      <circle cx="77" cy="31" r="5.5" fill="var(--color-paper-50)" />
      <circle cx="63" cy="31" r="5.5" strokeWidth="1.1" />
      <circle cx="77" cy="31" r="5.5" strokeWidth="1.1" />
      <circle cx="63" cy="31" r="2" fill="var(--color-ink-black)" stroke="none" />
      <circle cx="77" cy="31" r="2" fill="var(--color-ink-black)" stroke="none" />

      <path d="M67 37 Q70 42 73 37" fill="var(--color-ink-red)" strokeWidth="0.8" />

      <path d="M64 88 L70 98 M70 88 L70 98 M76 88 L70 98" strokeWidth="1" opacity="0.7" />
    </svg>
  );
}
