interface SceneBannerProps {
  title: string;
  subtitle?: string;
  from: string;
  to: string;
  icon?: string;
}

export default function SceneBanner({ title, subtitle, from, to, icon }: SceneBannerProps) {
  return (
    <div
      className="relative h-36 w-full overflow-hidden rounded-3xl shadow-inner"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <svg
        className="absolute inset-x-0 bottom-0 h-20 w-full opacity-90"
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 100 V55 L30 40 V20 L45 10 L60 20 V40 L90 30 V15 L105 5 L120 15 V30 L150 40 V50 L180 25 V10 L195 0 L210 10 V25 L240 50 V35 L260 45 V60 L290 35 V20 L305 10 L320 20 V35 L350 50 V60 L400 45 V100 Z"
          fill="rgba(11,10,23,0.55)"
        />
        <path
          d="M0 100 V70 L40 60 V50 L60 55 V65 L100 75 L140 55 V45 L160 50 V60 L200 70 L230 50 V45 L250 55 V65 L290 75 L330 55 V50 L350 60 V70 L400 65 V100 Z"
          fill="rgba(11,10,23,0.35)"
        />
      </svg>

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {[...Array(10)].map((_, i) => (
          <span
            key={i}
            className="absolute h-0.5 w-0.5 rounded-full bg-gold-300/70"
            style={{
              top: `${8 + ((i * 37) % 45)}%`,
              left: `${(i * 53) % 100}%`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
        <div>
          <h2 className="font-display text-xl text-parchment-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 font-serif-kr text-xs text-parchment-200/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
              {subtitle}
            </p>
          )}
        </div>
        {icon && <span className="text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">{icon}</span>}
      </div>
    </div>
  );
}
