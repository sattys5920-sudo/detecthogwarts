interface Step {
  top: string;
  left: string;
  rotate: number;
  flip: boolean;
  scale: number;
}

const STEPS: Step[] = [
  { top: '6%', left: '10%', rotate: -8, flip: false, scale: 1 },
  { top: '13%', left: '18%', rotate: -4, flip: true, scale: 0.95 },
  { top: '21%', left: '11%', rotate: -10, flip: false, scale: 1.05 },
  { top: '29%', left: '19%', rotate: -6, flip: true, scale: 0.9 },
  { top: '78%', left: '82%', rotate: 172, flip: false, scale: 1 },
  { top: '86%', left: '74%', rotate: 176, flip: true, scale: 0.95 },
  { top: '93%', left: '81%', rotate: 170, flip: false, scale: 1.05 },
];

function Footprint({ flip }: { flip: boolean }) {
  return (
    <svg
      viewBox="0 0 24 40"
      width="18"
      height="30"
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="26" rx="8" ry="13" fill="currentColor" />
      <ellipse cx="10" cy="7" rx="4.5" ry="6" fill="currentColor" />
    </svg>
  );
}

export default function Footprints() {
  return (
    <div className="pointer-events-none absolute inset-0 text-ink-700/15" aria-hidden="true">
      {STEPS.map((step, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: step.top,
            left: step.left,
            transform: `rotate(${step.rotate}deg) scale(${step.scale})`,
          }}
        >
          <Footprint flip={step.flip} />
        </div>
      ))}
    </div>
  );
}
