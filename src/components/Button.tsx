import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'tablet-btn tablet-btn-dark hover:brightness-110',
  secondary: 'tablet-btn text-ink-900 hover:brightness-105',
  ghost: 'tablet-btn tablet-btn-ghost text-ink-700 hover:text-seal-600',
};

export default function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 font-serif-kr text-sm font-bold tracking-wide transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
