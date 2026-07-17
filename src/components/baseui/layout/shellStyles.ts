import type { Theme } from 'baseui';

export const GUARDR_BREAKPOINTS = {
  small: 400,
  medium: 768,
  large: 1024,
  xlarge: 1280,
} as const;

export const GUARDR_MEDIA_QUERY = {
  small: `@media screen and (min-width: ${GUARDR_BREAKPOINTS.small}px)`,
  medium: `@media screen and (min-width: ${GUARDR_BREAKPOINTS.medium}px)`,
  large: `@media screen and (min-width: ${GUARDR_BREAKPOINTS.large}px)`,
  xlarge: `@media screen and (min-width: ${GUARDR_BREAKPOINTS.xlarge}px)`,
};

/** Attach responsive breakpoints used by layout shells and design preview. */
export function withGuardrBreakpoints<T extends Theme>(theme: T): T {
  return {
    ...theme,
    breakpoints: GUARDR_BREAKPOINTS,
    mediaQuery: GUARDR_MEDIA_QUERY,
  };
}

export const shellNavOverrides = {
  Root: {
    style: {
      paddingTop: '8px',
      paddingBottom: '8px',
    },
  },
  NavItem: {
    style: ({ $active }: { $active: boolean }) => ({
      borderRadius: '10px',
      marginLeft: '8px',
      marginRight: '8px',
      paddingLeft: '12px',
      paddingRight: '12px',
      backgroundColor: $active ? 'rgba(94, 123, 97, 0.14)' : 'transparent',
      borderLeft: $active ? '3px solid' : '3px solid transparent',
      borderColor: $active ? 'accent' : 'transparent',
      ':hover': {
        backgroundColor: $active ? 'rgba(94, 123, 97, 0.18)' : 'backgroundSecondary',
      },
    }),
  },
  NavLink: {
    style: {
      fontWeight: 600,
      fontSize: '14px',
      lineHeight: '20px',
      paddingTop: '10px',
      paddingBottom: '10px',
      minHeight: '44px',
      display: 'flex',
      alignItems: 'center',
    },
  },
};

export const iconRailItemStyle = (active: boolean) => ({
  width: '48px',
  height: '48px',
  minWidth: '48px',
  minHeight: '48px',
  borderRadius: '12px',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative' as const,
  backgroundColor: active ? 'rgba(94, 123, 97, 0.18)' : 'transparent',
  color: active ? 'var(--brand-primary)' : 'var(--brand-text-muted)',
  transition: 'background-color 150ms ease, color 150ms ease, transform 150ms ease',
  ':active': { transform: 'scale(0.96)' },
});
