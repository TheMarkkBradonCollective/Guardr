import React from 'react';

interface AppHeaderToolbarProps {
  left?: React.ReactNode;
  title?: string;
  right?: React.ReactNode;
  showTitle?: boolean;
}

export function AppHeaderToolbar({
  left,
  title,
  right,
  showTitle = true,
}: AppHeaderToolbarProps) {
  return (
    <div className="app-screen-header-toolbar">
      <div className="app-screen-header-toolbar-side app-screen-header-toolbar-side--left">
        {left}
      </div>

      {showTitle && title ? (
        <h1 className="app-screen-header-title">{title}</h1>
      ) : (
        <span className="app-screen-header-title app-screen-header-title--spacer" aria-hidden />
      )}

      <div className="app-screen-header-toolbar-side app-screen-header-toolbar-side--right">
        {right}
      </div>
    </div>
  );
}
