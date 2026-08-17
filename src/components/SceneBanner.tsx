import CastleLine from './CastleLine';
import Flourish from './Flourish';

interface SceneBannerProps {
  title: string;
  subtitle?: string;
  accent: string;
  icon?: string;
}

export default function SceneBanner({ title, subtitle, accent, icon }: SceneBannerProps) {
  return (
    <div
      className="deckle-edge relative overflow-hidden border border-ink-700/15 px-4 pb-5 pt-3 text-center shadow-[0_2px_10px_rgba(42,28,18,0.12)]"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${accent}33, transparent 70%), var(--color-paper-50)`,
      }}
    >
      <CastleLine
        className="absolute inset-x-0 bottom-0 h-16 w-full opacity-[0.16]"
        style={{ color: accent }}
      />

      <div className="relative flex items-center justify-between text-ink-500/50">
        <Flourish className="h-6 w-14" />
        <Flourish className="h-6 w-14" flip />
      </div>

      {icon && <span className="relative mt-1 block text-3xl">{icon}</span>}

      <div className="relative mt-2 inline-flex">
        <span
          className="ribbon inline-block px-6 py-2 font-display text-2xl text-paper-50"
          style={{ backgroundColor: accent }}
        >
          {title}
        </span>
      </div>

      {subtitle && <p className="relative mt-2 font-serif-kr text-xs text-ink-700/80">{subtitle}</p>}
    </div>
  );
}
