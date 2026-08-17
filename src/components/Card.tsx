import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`deckle-edge border border-ink-700/15 bg-paper-50 p-5 shadow-[0_2px_10px_rgba(42,28,18,0.12)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
