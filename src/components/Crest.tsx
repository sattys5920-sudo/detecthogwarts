import { HOUSES } from '../data/school';

export default function Crest({ size = 88 }: { size?: number }) {
  const [flame, moonlight, earth, wind] = HOUSES.map((h) => h.color);

  return (
    <svg width={size} height={size * 1.08} viewBox="0 0 100 108" aria-hidden="true">
      <defs>
        <clipPath id="crest-shield">
          <path d="M50 4 L92 16 V50 C92 78 74 96 50 104 C26 96 8 78 8 50 V16 Z" />
        </clipPath>
      </defs>

      <g clipPath="url(#crest-shield)">
        <rect x="0" y="0" width="50" height="56" fill={flame} />
        <rect x="50" y="0" width="50" height="56" fill={moonlight} />
        <rect x="0" y="56" width="50" height="52" fill={earth} />
        <rect x="50" y="56" width="50" height="52" fill={wind} />
        <path
          d="M50 4 C 56 24, 44 34, 50 54 C 56 74, 44 88, 50 104"
          stroke="#2a1c12"
          strokeOpacity="0.25"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M8 54 C 30 48, 40 60, 50 54 C 60 48, 70 60, 92 54"
          stroke="#2a1c12"
          strokeOpacity="0.25"
          strokeWidth="2"
          fill="none"
        />
      </g>

      <path
        d="M50 4 L92 16 V50 C92 78 74 96 50 104 C26 96 8 78 8 50 V16 Z"
        fill="none"
        stroke="#9c7530"
        strokeWidth="2.5"
      />

      <g transform="translate(50 54)">
        <path
          d="M0 -13 L3.2 -3.6 L13 -3.6 L5.2 2.4 L8 12 L0 6 L-8 12 L-5.2 2.4 L-13 -3.6 L-3.2 -3.6 Z"
          fill="#faf3e0"
          stroke="#2a1c12"
          strokeWidth="1"
        />
      </g>
    </svg>
  );
}
