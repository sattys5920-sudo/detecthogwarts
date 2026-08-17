interface FlourishProps {
  className?: string;
  flip?: boolean;
}

export default function Flourish({ className = '', flip = false }: FlourishProps) {
  return (
    <svg
      viewBox="0 0 60 32"
      className={className}
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M2 28 C 14 30, 20 20, 14 14 C 9 9, 14 4, 20 6 C 26 8, 24 15, 30 15" />
      <path d="M30 15 C 36 15, 40 10, 46 11 C 51 12, 50 18, 55 18" />
      <circle cx="14" cy="14" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="55" cy="18" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
