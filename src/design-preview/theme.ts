import { DarkTheme } from 'baseui';
import { withAppBreakpoints } from '../components/baseui/layout/shellStyles';

/** Design-preview theme — stock Uber Base Web dark theme + app breakpoints. */
export const darkTheme = withAppBreakpoints(DarkTheme);

export const BREAKPOINTS = darkTheme.breakpoints;
export const MEDIA_QUERY = darkTheme.mediaQuery;
