export default function InkBlot({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 70" className={className} aria-hidden="true">
      <path
        d="M15 42 C8 28 22 14 38 17 C48 8 68 9 77 20 C90 17 97 33 88 44 C96 51 84 63 70 58 C62 66 46 66 39 57 C27 63 12 56 15 42 Z"
        fill="currentColor"
        opacity="0.4"
        filter="url(#inkBleed)"
      />
      <path
        d="M15 42 C8 28 22 14 38 17 C48 8 68 9 77 20 C90 17 97 33 88 44 C96 51 84 63 70 58 C62 66 46 66 39 57 C27 63 12 56 15 42 Z"
        fill="currentColor"
        filter="url(#inkRough)"
      />
      <path d="M32 16 C34 10 40 6 43 9 C45 12 40 17 34 19 Z" fill="currentColor" filter="url(#inkRough)" />
      <path d="M78 46 C86 48 92 54 89 58 C86 61 79 56 76 50 Z" fill="currentColor" filter="url(#inkRough)" />
      <g filter="url(#inkRough)">
        <circle cx="9" cy="16" r="2.4" fill="currentColor" />
        <circle cx="4" cy="24" r="1.1" fill="currentColor" />
        <circle cx="94" cy="8" r="1.7" fill="currentColor" />
        <circle cx="88" cy="4" r="0.9" fill="currentColor" />
        <circle cx="6" cy="53" r="1.9" fill="currentColor" />
        <circle cx="2" cy="46" r="0.8" fill="currentColor" />
        <circle cx="96" cy="60" r="2.5" fill="currentColor" />
        <circle cx="91" cy="66" r="1.2" fill="currentColor" />
      </g>
      <ellipse cx="33" cy="26" rx="8" ry="4" fill="#fff" opacity="0.1" />
    </svg>
  );
}
