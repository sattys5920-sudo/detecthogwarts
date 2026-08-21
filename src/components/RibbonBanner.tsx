import type { ReactNode } from 'react';

export default function RibbonBanner({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`ribbon inline-block bg-gradient-to-b from-seal-500 to-seal-700 px-7 py-2.5 shadow-[0_3px_8px_rgba(42,28,18,0.35)] ${className}`}
    >
      <span
        className="font-gothic block whitespace-nowrap text-xl leading-none tracking-wide text-paper-50"
        style={{ textShadow: '0 1px 0 rgba(0,0,0,0.35)' }}
      >
        {children}
      </span>
    </div>
  );
}
