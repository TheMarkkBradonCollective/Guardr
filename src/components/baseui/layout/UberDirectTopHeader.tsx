import React from 'react';
import { Logo } from '../../Logo';

/**
 * desktop ops workspace global bar — product wordmark on the left, the active
 * workspace context centred, account/notification actions on the right.
 */
export function UberDirectTopHeader({
  trailing,
  onBrandClick,
  className = '',
  productLabel,
  contextLabel,
  leading,
}: {
  trailing?: React.ReactNode;
  onBrandClick?: () => void;
  className?: string;
  /** Secondary product word beside the wordmark, e.g. "Operations". */
  productLabel?: string;
  /** Centred workspace context, e.g. the signed-in org or role workspace. */
  contextLabel?: string;
  leading?: React.ReactNode;
}) {
  const brand = (
    <>
      <Logo size={22} className="shrink-0" />
      <span className="uber-direct-top-header-wordmark">Guardr</span>
      {productLabel ? (
        <span className="uber-direct-top-header-product">{productLabel}</span>
      ) : null}
    </>
  );

  return (
    <header className={`uber-direct-top-header ${className}`.trim()}>
      <div className="uber-direct-top-header-inner">
        <div className="uber-direct-top-header-leading">
          {leading}
          {onBrandClick ? (
            <button type="button" className="uber-direct-top-header-brand" onClick={onBrandClick}>
              {brand}
            </button>
          ) : (
            <a href="/" className="uber-direct-top-header-brand" aria-label="Guardr home">
              {brand}
            </a>
          )}
        </div>
        {contextLabel ? (
          <p className="uber-direct-top-header-context" title={contextLabel}>
            {contextLabel}
          </p>
        ) : null}
        {trailing ? <div className="uber-direct-top-header-trailing">{trailing}</div> : null}
      </div>
    </header>
  );
}
