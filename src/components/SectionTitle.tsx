function Sparkle({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 2 13.4 9.6 21 12 13.4 14.4 12 22 10.6 14.4 3 12 10.6 9.6Z" fill="currentColor" />
    </svg>
  );
}

export default function SectionTitle({ children, className = '' }: { children: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="section-rule h-px flex-1" />
      <Sparkle className="h-2.5 w-2.5 flex-none text-gold-500" />
      <span className="flex-none font-gothic text-[11px] tracking-[0.15em] text-ink-700 whitespace-nowrap">{children}</span>
      <Sparkle className="h-2.5 w-2.5 flex-none text-gold-500" />
      <span className="section-rule section-rule-end h-px flex-1" />
    </div>
  );
}
