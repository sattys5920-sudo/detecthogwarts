import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`paper-frame bg-paper-50 p-5 shadow-[0_1px_4px_rgba(42,28,18,0.12)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
