interface LetterheadProps {
  label: string;
  context?: string;
  meta?: string;
  tag?: string;
}

export default function Letterhead({ label, context, meta, tag }: LetterheadProps) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-ink-700/15 pb-2">
      <div className="flex min-w-0 items-baseline gap-2">
        <h1 className="font-gothic flex-none text-lg text-ink-black">{label}</h1>
        {context && <p className="truncate text-xs font-bold text-ink-700/80">{context}</p>}
      </div>
      <div className="flex flex-none items-center gap-1.5">
        {meta && <span className="font-mono text-[10px] text-ink-500">{meta}</span>}
        {tag && (
          <span className="inline-block rounded-sm bg-ink-black px-2 py-0.5 text-[10px] font-bold text-paper-50">
            {tag}
          </span>
        )}
      </div>
    </div>
  );
}
