import React from 'react';
import { Logo } from '../../Logo';

/** Uber Direct white top bar — Guardr wordmark left, optional trailing actions right. */
export function UberDirectTopHeader({
  trailing,
  onBrandClick,
  className = '',
}: {
  trailing?: React.ReactNode;
  onBrandClick?: () => void;
  className?: string;
}) {
  const brand = (
    <>
      <Logo size={22} className="shrink-0" />
      <span className="uber-direct-top-header-wordmark">Guardr</span>
    </>
  );

  return (
    <header className={`uber-direct-top-header ${className}`.trim()}>
      <div className="uber-direct-top-header-inner">
        {onBrandClick ? (
          <button type="button" className="uber-direct-top-header-brand" onClick={onBrandClick}>
            {brand}
          </button>
        ) : (
          <a href="/" className="uber-direct-top-header-brand" aria-label="Guardr home">
            {brand}
          </a>
        )}
        {trailing ? <div className="uber-direct-top-header-trailing">{trailing}</div> : null}
      </div>
    </header>
  );
}
