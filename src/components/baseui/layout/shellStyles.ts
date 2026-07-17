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
      borderRadius: '8px',
      marginLeft: '8px',
      marginRight: '8px',
      marginBottom: '2px',
      paddingLeft: '12px',
      paddingRight: '12px',
      backgroundColor: $active ? 'backgroundSecondary' : 'transparent',
      border: 'none',
      transition: 'background-color 120ms ease',
      ':hover': {
        backgroundColor: 'backgroundSecondary',
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
      color: $active ? 'contentPrimary' : 'contentSecondary',
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
