import type { CSSProperties } from 'react';

export default function CastleLine({
  className = '',
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 -10 300 100"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M0 90 V60 H14 V50 H26 V60 H40 V38 L47 28 L54 38 V60 H74 V44 H86 V60 H110 V20 L120 8 L130 20 V60 H150 V34 H160 V60 H190 V46 L200 34 L210 46 V60 H235 V26 H247 V60 H262 V50 H276 V60 H300 V90 Z" />
      <path d="M47 28 V16 M43 18 H51" />
      <path d="M120 8 V-2 M115 0 H125" />
      <path d="M200 34 V24 M196 26 H204" />
      <line x1="0" y1="60" x2="300" y2="60" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}
