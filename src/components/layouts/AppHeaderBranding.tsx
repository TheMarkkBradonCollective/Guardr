import React from 'react';
import { Logo } from '../Logo';

interface AppHeaderBrandingProps {
  className?: string;
  logoSize?: number;
  trailing?: React.ReactNode;
}

export function AppHeaderBranding({
  className = '',
  logoSize = 20,
  trailing,
}: AppHeaderBrandingProps) {
  return (
    <div className={`app-header-branding flex items-center gap-2 ${className}`}>
      <Logo size={logoSize} className="text-brand-primary shrink-0" />
      <span className="app-header-branding-name font-bold text-sm tracking-[-0.03em] leading-none text-brand-text select-none">
        Guard<span className="text-brand-primary">r</span>
      </span>
      {trailing}
    </div>
  );
}
