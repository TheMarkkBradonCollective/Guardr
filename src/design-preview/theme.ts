import { uberThemeForMode } from '../theme/uberBaseTheme';
import { withAppBreakpoints } from '../components/baseui/layout/shellStyles';

/** Design-preview theme helpers — mirrors production `uberThemeForMode` + breakpoints. */
export const darkTheme = withAppBreakpoints(uberThemeForMode('dark'));
export const lightTheme = withAppBreakpoints(uberThemeForMode('light'));

export const BREAKPOINTS = darkTheme.breakpoints;
export const MEDIA_QUERY = darkTheme.mediaQuery;
