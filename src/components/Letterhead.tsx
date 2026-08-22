import RibbonBanner from './RibbonBanner';
import StarBurst from './StarBurst';

interface LetterheadProps {
  label: string;
  context: string;
  meta: string;
  tag?: string;
}

export default function Letterhead({ label, context, meta, tag }: LetterheadProps) {
  return (
    <div className="flex flex-col items-center border-b border-ink-700/15 pb-4 text-center">
      <StarBurst className="-mb-5 h-16 w-16 text-gold-500/70" />
      <RibbonBanner size="lg">{label}</RibbonBanner>
      <p className="mt-2.5 text-sm font-bold text-ink-700">{context}</p>
      <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-ink-500">
        <span>{meta}</span>
      </div>
      {tag && (
        <span className="mt-2 inline-block rounded-sm bg-ink-black px-2.5 py-1 text-[11px] font-bold text-paper-50">
          {tag}
        </span>
      )}
    </div>
  );
}
