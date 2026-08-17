interface Step {
  top: string;
  left: string;
  rotate: number;
  flip: boolean;
  scale: number;
}

function buildTrail(count: number, startTop: number, endTop: number, baseLeft: number, wave: number): Step[] {
  const steps: Step[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const top = startTop + (endTop - startTop) * t;
    const wobble = Math.sin(t * Math.PI * 2.4) * wave;
    const left = baseLeft + wobble + (i % 2 === 0 ? -4 : 4);
    const tangent = Math.cos(t * Math.PI * 2.4) * wave;
    steps.push({
      top: `${top}%`,
      left: `${left}%`,
      rotate: -78 + tangent * 1.4,
      flip: i % 2 === 0,
      scale: 0.85 + (i % 3) * 0.07,
    });
  }
  return steps;
}

const STEPS: Step[] = [
  ...buildTrail(6, 2, 32, 12, 6),
  ...buildTrail(6, 68, 98, 84, 6).map((s) => ({ ...s, rotate: s.rotate + 180 })),
];

function Footprint({ flip }: { flip: boolean }) {
  return (
    <svg
      viewBox="0 0 24 40"
      width="17"
      height="28"
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="26" rx="7.5" ry="12.5" fill="currentColor" />
      <ellipse cx="9.5" cy="7" rx="4.2" ry="5.6" fill="currentColor" />
      <ellipse cx="16" cy="9" rx="2" ry="2.6" fill="currentColor" />
    </svg>
  );
}

export default function Footprints() {
  return (
    <div className="pointer-events-none absolute inset-0 text-ink-700/[0.13]" aria-hidden="true">
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
