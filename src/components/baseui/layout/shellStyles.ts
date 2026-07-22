import type { Theme } from 'baseui';

export const APP_BREAKPOINTS = {
  small: 400,
  medium: 768,
  large: 1024,
  xlarge: 1280,
} as const;

/** @deprecated Use `APP_BREAKPOINTS` */
export const GUARDR_BREAKPOINTS = APP_BREAKPOINTS;

export const APP_MEDIA_QUERY = {
  small: `@media screen and (min-width: ${APP_BREAKPOINTS.small}px)`,
  medium: `@media screen and (min-width: ${APP_BREAKPOINTS.medium}px)`,
  large: `@media screen and (min-width: ${APP_BREAKPOINTS.large}px)`,
  xlarge: `@media screen and (min-width: ${APP_BREAKPOINTS.xlarge}px)`,
};

/** @deprecated Use `APP_MEDIA_QUERY` */
export const GUARDR_MEDIA_QUERY = APP_MEDIA_QUERY;

/** Attach responsive breakpoints used by layout shells and design preview. */
export function withAppBreakpoints<T extends Theme>(theme: T): T {
  return {
    ...theme,
    breakpoints: APP_BREAKPOINTS,
    mediaQuery: APP_MEDIA_QUERY,
  };
}

/** @deprecated Use `withAppBreakpoints` */
export const withGuardrBreakpoints = withAppBreakpoints;

function isDarkShellTheme(theme: Theme): boolean {
  const bg = String(theme.colors.backgroundPrimary || '').toLowerCase();
  return bg === '#000' || bg === '#000000' || bg === 'black';
}

export const shellNavOverrides = {
  Root: {
    style: {
      paddingTop: '4px',
      paddingBottom: '4px',
      paddingLeft: '4px',
      paddingRight: '4px',
    },
  },
  NavItem: {
    style: ({
      $active,
      $disabled,
      $theme,
    }: {
      $active: boolean;
      $disabled?: boolean;
      $theme: Theme;
    }) => {
      const dark = isDarkShellTheme($theme);
      if ($disabled) {
        return {
          borderRadius: 0,
          marginLeft: '0',
          marginRight: '0',
          marginBottom: '0',
          paddingLeft: '0',
          paddingRight: '0',
          backgroundColor: 'transparent',
          backgroundImage: 'none',
          border: 'none',
          borderLeftWidth: 0,
          borderLeftStyle: 'none',
          borderLeftColor: 'transparent',
          ':hover': {
            backgroundColor: 'transparent',
          },
        };
      }
      return {
        borderRadius: '8px',
        marginLeft: '0',
        marginRight: '0',
        marginBottom: '2px',
        paddingLeft: '0',
        paddingRight: '0',
        // Highlight lives on the link (aria-current) via CSS / NavLink styles.
        backgroundColor: 'transparent',
        backgroundImage: 'none',
        color: $active ? (dark ? '#000000' : '#ffffff') : undefined,
        border: 'none',
        borderLeftWidth: 0,
        borderLeftStyle: 'none',
        borderLeftColor: 'transparent',
        transition: 'background-color 120ms ease, color 120ms ease',
        ':hover': {
          backgroundColor: 'transparent',
        },
      };
    },
  },
  NavLink: {
    style: ({
      $active,
      $disabled,
      $theme,
    }: {
      $active: boolean;
      $disabled?: boolean;
      $theme: Theme;
    }) => {
      const dark = isDarkShellTheme($theme);
      if ($disabled) {
        return {
          fontWeight: 700,
          fontSize: '10px',
          lineHeight: '14px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          paddingTop: '14px',
          paddingBottom: '4px',
          paddingLeft: '16px',
          paddingRight: '16px',
          minHeight: 'auto',
          display: 'flex',
          alignItems: 'center',
          borderRadius: 0,
          backgroundColor: 'transparent',
          color: dark ? 'rgba(255,255,255,0.45)' : '#6b6b6b',
          pointerEvents: 'none' as const,
          cursor: 'default',
          opacity: 1,
        };
      }
      return {
        fontWeight: $active ? 700 : 500,
        fontSize: '14px',
        lineHeight: '20px',
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingLeft: '16px',
        paddingRight: '16px',
        minHeight: '44px',
        display: 'flex',
        alignItems: 'center',
        borderRadius: '8px',
        backgroundColor: $active ? (dark ? '#ffffff' : '#000000') : 'transparent',
        color: $active ? (dark ? '#000000' : '#ffffff') : 'contentSecondary',
        transition: 'background-color 120ms ease, color 120ms ease',
      };
    },
  },
};

export function iconRailItemStyle(theme: Theme, active: boolean) {
  return {
    width: '48px',
    height: '48px',
    minWidth: '48px',
    minHeight: '48px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    backgroundColor: active ? theme.colors.backgroundSecondary : 'transparent',
    color: active ? theme.colors.contentPrimary : theme.colors.contentSecondary,
    transition: 'background-color 120ms ease, color 120ms ease, transform 100ms ease',
    ':hover': {
      backgroundColor: theme.colors.backgroundSecondary,
      color: theme.colors.contentPrimary,
    },
    ':active': { transform: 'scale(0.94)' },
  };
}
