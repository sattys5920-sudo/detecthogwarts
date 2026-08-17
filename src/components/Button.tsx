import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-gradient-to-b from-gold-400 to-gold-600 text-arcane-950 shadow-[0_0_20px_rgba(217,171,79,0.35)] hover:brightness-110',
  secondary:
    'bg-arcane-800 text-parchment-100 border border-gold-500/40 hover:border-gold-400 hover:bg-arcane-700',
  ghost: 'bg-transparent text-parchment-200 border border-white/10 hover:border-gold-400/60 hover:text-gold-300',
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
