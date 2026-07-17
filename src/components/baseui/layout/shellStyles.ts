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

export const shellNavOverrides = {
  Root: {
    style: {
      paddingTop: '4px',
      paddingBottom: '4px',
    },
  },
  NavItem: {
    style: ({ $active }: { $active: boolean }) => ({
      borderRadius: '10px',
      marginLeft: '8px',
      marginRight: '8px',
      marginBottom: '2px',
      paddingLeft: '12px',
      paddingRight: '12px',
      backgroundColor: $active ? 'accent50' : 'transparent',
      border: $active ? '1px solid' : '1px solid transparent',
      borderColor: $active ? 'accent200' : 'transparent',
      borderLeft: $active ? '3px solid' : '3px solid transparent',
      borderLeftColor: $active ? 'accent' : 'transparent',
      transition: 'background-color 120ms ease, border-color 120ms ease',
      ':hover': {
        backgroundColor: $active ? 'accent50' : 'backgroundSecondary',
      },
    }),
  },
  NavLink: {
    style: ({ $active }: { $active: boolean }) => ({
      fontWeight: $active ? 700 : 500,
      fontSize: '14px',
      lineHeight: '20px',
      paddingTop: '10px',
      paddingBottom: '10px',
      minHeight: '44px',
      display: 'flex',
      alignItems: 'center',
      color: $active ? 'accent' : 'contentSecondary',
      transition: 'color 120ms ease',
    }),
  },
};

export function iconRailItemStyle(theme: Theme, active: boolean) {
  return {
    width: '48px',
    height: '48px',
    minWidth: '48px',
    minHeight: '48px',
    borderRadius: '12px',
    border: active ? `1px solid ${theme.colors.accent200 ?? theme.colors.accent}` : '1px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    backgroundColor: active ? theme.colors.accent50 : 'transparent',
    color: active ? theme.colors.accent : theme.colors.contentSecondary,
    transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease, transform 120ms ease',
    ':hover': {
      backgroundColor: active ? theme.colors.accent50 : theme.colors.backgroundSecondary,
      color: active ? theme.colors.accent : theme.colors.contentPrimary,
    },
    ':active': { transform: 'scale(0.94)' },
  };
}
