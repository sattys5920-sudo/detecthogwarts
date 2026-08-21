export default function StarBurst({ className = '' }: { className?: string }) {
  const rays = Array.from({ length: 16 }, (_, i) => {
    const angle = (i * 360) / 16;
    const long = i % 2 === 0;
    const r1 = long ? 13 : 20;
    const r2 = long ? 47 : 33;
    const rad = (angle * Math.PI) / 180;
    return {
      x1: 50 + r1 * Math.cos(rad),
      y1: 50 + r1 * Math.sin(rad),
      x2: 50 + r2 * Math.cos(rad),
      y2: 50 + r2 * Math.sin(rad),
    };
  });

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.85">
        {rays.map((r, i) => (
          <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />
        ))}
      </g>
      <circle cx="50" cy="50" r="5.5" fill="currentColor" />
    </svg>
  );
}
