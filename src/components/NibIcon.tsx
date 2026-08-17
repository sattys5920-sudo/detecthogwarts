export default function NibIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <polygon points="12,1 21,12 12,23 3,12" fill="currentColor" />
      <line x1="12" y1="9" x2="12" y2="23" stroke="var(--color-paper-50)" strokeWidth="1.3" />
    </svg>
  );
}
