import type { HTMLAttributes, ReactNode } from 'react';
import CornerFlourish from './CornerFlourish';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Adds small corner flourishes — reserve for the page's featured card(s), not every list row. */
  ornate?: boolean;
}

export default function Card({ children, className = '', ornate = false, ...props }: CardProps) {
  return (
    <div
      className={`paper-frame relative bg-paper-50 p-5 shadow-[0_1px_4px_rgba(42,28,18,0.12)] ${className}`}
      {...props}
    >
      {ornate && (
        <>
          <CornerFlourish corner="tl" className="pointer-events-none absolute -top-1 -left-1 h-4 w-4 text-gold-600/70" />
          <CornerFlourish corner="tr" className="pointer-events-none absolute -top-1 -right-1 h-4 w-4 text-gold-600/70" />
          <CornerFlourish corner="bl" className="pointer-events-none absolute -bottom-1 -left-1 h-4 w-4 text-gold-600/70" />
          <CornerFlourish corner="br" className="pointer-events-none absolute -bottom-1 -right-1 h-4 w-4 text-gold-600/70" />
        </>
      )}
      {children}
    </div>
  );
}
