import type { ReactNode } from 'react';

const SIZES = {
  md: 'px-7 py-2.5 text-xl',
  lg: 'px-6 py-2 text-lg',
} as const;

interface RibbonBannerProps {
  children: ReactNode;
  size?: keyof typeof SIZES;
  className?: string;
}

export default function RibbonBanner({ children, size = 'md', className = '' }: RibbonBannerProps) {
  return (
    <div className={`tablet-btn tablet-btn-dark relative inline-block ${SIZES[size]} ${className}`}>
      <span
        className="font-hand block whitespace-nowrap leading-none text-paper-50"
        style={{ textShadow: '0 1px 0 rgba(0,0,0,0.35)' }}
      >
        {children}
      </span>
    </div>
  );
}
