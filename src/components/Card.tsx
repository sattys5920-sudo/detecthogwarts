import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-gold-500/20 bg-arcane-900/70 p-5 shadow-[0_4px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
