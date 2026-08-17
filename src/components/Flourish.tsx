interface FlourishProps {
  className?: string;
  flip?: boolean;
}

export default function Flourish({ className = '', flip = false }: FlourishProps) {
  return (
    <svg
      viewBox="0 0 70 36"
      className={className}
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M1 30 C 12 33, 20 24, 15 17 C 11 11, 16 5, 22 8 C 27 10, 25 17, 31 17" />
      <path d="M15 17 C 19 22, 27 22, 28 27 C 29 31, 22 33, 19 29" />
      <path d="M31 17 C 38 17, 42 11, 48 12 C 53 13, 51 20, 57 19" />
      <path d="M48 12 C 51 8, 58 8, 60 4" />
      <circle cx="15" cy="17" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="60" cy="4" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="29" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
