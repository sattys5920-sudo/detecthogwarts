import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-gradient-to-b from-seal-500 to-seal-700 text-paper-50 shadow-[0_2px_8px_rgba(74,20,32,0.4)] border border-seal-700/60 hover:brightness-110',
  secondary:
    'bg-paper-50 text-ink-900 border border-ink-700/30 hover:border-gold-400 hover:bg-paper-100',
  ghost: 'bg-transparent text-ink-700 border border-ink-700/20 hover:border-seal-500/60 hover:text-seal-600',
};

export default function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-serif-kr text-sm font-medium tracking-wide transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
