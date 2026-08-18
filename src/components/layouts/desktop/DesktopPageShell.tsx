import React from 'react';
import { AppScreen } from '../../ui/app/AppPrimitives';
import { useSurfaceKind } from '../../../surfaces';

/** Desktop admin page wrapper — replaces AppScreen inside adm-app on desktop. */
export function DesktopPage({
  children,
  className = '',
  'data-tour': dataTour,
}: {
  children: React.ReactNode;
  className?: string;
  'data-tour'?: string;
}) {
  return (
    <div className={`adm-page ${className}`.trim()} data-tour={dataTour}>
      {children}
    </div>
  );
}

/** Responsive shell: adm-page on desktop, AppScreen on mobile/tablet. */
export function ResponsivePage({
  children,
  className = '',
  screenClassName = '',
  'data-tour': dataTour,
}: {
  children: React.ReactNode;
  className?: string;
  screenClassName?: string;
  'data-tour'?: string;
}) {
  const surface = useSurfaceKind();
  if (surface === 'desktop') {
    return (
      <DesktopPage className={className} data-tour={dataTour}>
        {children}
      </DesktopPage>
    );
  }
  return (
    <AppScreen className={screenClassName} data-tour={dataTour}>
      {children}
    </AppScreen>
  );
}

/** Centered form card for settings, support, wizards on desktop. */
export function ResponsiveFormPage({
  children,
  title,
  subtitle,
  className = '',
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  const surface = useSurfaceKind();
  if (surface === 'desktop') {
    return (
      <div className={`adm-form-page ${className}`.trim()}>
        {title ? (
          <header className="adm-form-page-head">
            <h2 className="adm-card-title">{title}</h2>
            {subtitle ? <p className="uber-workbench-subtitle">{subtitle}</p> : null}
          </header>
        ) : null}
        <div className="adm-form-page-body">{children}</div>
      </div>
    );
  }
  return <>{children}</>;
}

/** Two-column profile / settings layout on desktop. */
export function ResponsiveProfilePage({
  sidebar,
  children,
  className = '',
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const surface = useSurfaceKind();
  if (surface === 'desktop') {
    return (
      <div className={`adm-profile-page ${className}`.trim()}>
        <aside className="adm-profile-sidebar">{sidebar}</aside>
        <div className="adm-profile-main">{children}</div>
      </div>
    );
  }
  return (
    <>
      {sidebar}
      {children}
    </>
  );
}
