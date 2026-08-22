import type { ReactNode } from 'react';

const SIZES = {
  md: 'px-7 py-2.5 text-xl',
  lg: 'px-8 py-3 text-2xl',
} as const;

interface RibbonBannerProps {
  children: ReactNode;
  size?: keyof typeof SIZES;
  className?: string;
}

export default function RibbonBanner({ children, size = 'md', className = '' }: RibbonBannerProps) {
  return (
    <div className={`ribbon inline-block bg-gradient-to-b from-seal-500 to-seal-700 shadow-[0_3px_8px_rgba(42,28,18,0.35)] ${SIZES[size]} ${className}`}>
      <span
        className="font-gothic block whitespace-nowrap leading-none tracking-wide text-paper-50"
        style={{ textShadow: '0 1px 0 rgba(0,0,0,0.35)' }}
      >
        {children}
      </span>
    </div>
  );
}
