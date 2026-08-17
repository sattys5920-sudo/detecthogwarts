export default function InkBlot({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 -12 320 212" className={className} aria-hidden="true">
      <path
        d="M58 84 C 34 70, 30 38, 62 26 C 70 4, 108 -4, 128 14
           C 152 -6, 196 -2, 206 22 C 244 10, 282 32, 270 58
           C 306 66, 312 100, 282 116 C 296 140, 274 170, 244 162
           C 240 190, 196 200, 176 178 C 148 200, 108 194, 100 168
           C 68 178, 36 158, 44 130 C 14 122, 12 92, 58 84 Z"
        fill="var(--color-ink-900)"
      />
      <path d="M296 140 C 306 136, 316 144, 310 156 C 320 164, 310 180, 296 174 C 292 186, 274 184, 274 170 C 260 168, 262 150, 278 148 C 278 138, 292 134, 296 140 Z" fill="var(--color-ink-900)" />
      <circle cx="308" cy="182" r="4" fill="var(--color-ink-900)" />
      <circle cx="10" cy="60" r="3.5" fill="var(--color-ink-900)" />
      <circle cx="20" cy="46" r="2" fill="var(--color-ink-900)" />
    </svg>
  );
}
