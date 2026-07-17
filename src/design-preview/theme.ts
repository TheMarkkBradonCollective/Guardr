import { DarkThemeMove } from 'baseui';

export const BREAKPOINTS = {
  small: 400,
  medium: 800,
  large: 1200,
};

export const MEDIA_QUERY = {
  small: `@media screen and (min-width: ${BREAKPOINTS.small}px)`,
  medium: `@media screen and (min-width: ${BREAKPOINTS.medium}px)`,
  large: `@media screen and (min-width: ${BREAKPOINTS.large}px)`,
};

export const darkTheme = {
  ...DarkThemeMove,
  breakpoints: BREAKPOINTS,
  mediaQuery: MEDIA_QUERY,
};
