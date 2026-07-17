import { guardrDarkTheme } from '../theme/guardrBaseTheme';
import { withGuardrBreakpoints } from '../components/baseui/layout/shellStyles';

/** Design-preview theme — Guardr sage accent with Base layout breakpoints. */
export const darkTheme = withGuardrBreakpoints(guardrDarkTheme);

export const BREAKPOINTS = darkTheme.breakpoints;
export const MEDIA_QUERY = darkTheme.mediaQuery;
