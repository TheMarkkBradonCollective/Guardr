import type { ModalOverrides } from 'baseui/modal';
import type { DrawerOverrides } from 'baseui/drawer';

const dimBackdropStyle = {
  backgroundColor: 'rgba(0, 0, 0, 0.52)',
} as const;

const sheetPanelStyle = {
  backgroundColor: 'var(--uber-bg, #ffffff)',
  boxShadow: '0 -8px 48px rgba(0, 0, 0, 0.16)',
} as const;

export function modalOverrides(options: {
  zIndex?: number;
  panelClassName?: string;
  centered?: boolean;
}): ModalOverrides {
  const { zIndex = 1100, panelClassName = '', centered = false } = options;
  return {
    Root: {
      style: {
        zIndex,
        backgroundColor: 'rgba(0, 0, 0, 0.52)',
      },
    },
    Dialog: {
      style: {
        borderRadius: centered ? '14px' : '22px 22px 0 0',
        border: '1px solid var(--uber-border, #eeeeee)',
        backgroundColor: 'var(--uber-bg, #ffffff)',
        color: 'var(--uber-text, #000000)',
        opacity: 1,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.22)',
      },
      props: panelClassName ? { className: panelClassName } : {},
    },
    Close: {
      style: {
        display: 'none',
      },
    },
  };
}

export function sheetOverrides(options: {
  zIndex?: number;
  panelClassName?: string;
}): DrawerOverrides {
  const { zIndex = 2100, panelClassName = '' } = options;
  return {
    Root: {
      style: { zIndex },
    },
    Backdrop: {
      style: dimBackdropStyle,
    },
    DrawerContainer: {
      style: {
        borderTopLeftRadius: '22px',
        borderTopRightRadius: '22px',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        border: '1px solid var(--uber-border, #eeeeee)',
        borderBottom: 'none',
        ...sheetPanelStyle,
        color: 'var(--uber-text, #000000)',
        opacity: 1,
        width: '100%',
        maxWidth: '100%',
        left: 0,
        right: 0,
        maxHeight: 'min(94dvh, calc(100dvh - env(safe-area-inset-top, 0px)))',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      },
      props: panelClassName ? { className: panelClassName } : {},
    },
    DrawerBody: {
      style: {
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        flex: '1 1 auto',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      },
    },
    Close: {
      style: { display: 'none' },
    },
  };
}

export function drawerOverrides(options: { zIndex?: number; width?: string }): DrawerOverrides {
  const { zIndex = 2100, width = 'min(22rem, 90vw)' } = options;
  return {
    Root: {
      style: { zIndex },
    },
    Backdrop: {
      style: dimBackdropStyle,
    },
    DrawerContainer: {
      style: {
        width,
        maxWidth: '90vw',
        backgroundColor: 'var(--uber-bg, #ffffff)',
        color: 'var(--uber-text, #000000)',
        opacity: 1,
        borderRight: '1px solid var(--uber-border, #eeeeee)',
      },
    },
    Close: {
      style: { display: 'none' },
    },
  };
}

/** Opaque toast surface — use real CSS colors (Styletron does not resolve theme token strings). */
export const snackbarOverrides = {
  PlacementContainer: {
    style: {
      zIndex: 3200,
    },
  },
  Root: {
    style: {
      borderRadius: '14px',
      border: '1px solid var(--uber-border, #eeeeee)',
      backgroundColor: 'var(--uber-bg, #ffffff)',
      color: 'var(--uber-text, #000000)',
      opacity: 1,
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.28)',
      maxWidth: 'min(calc(100vw - 2rem), 28rem)',
    },
  },
  Content: {
    style: {
      paddingTop: '12px',
      paddingBottom: '12px',
      paddingLeft: '16px',
      paddingRight: '16px',
    },
  },
  Message: {
    style: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 600,
      color: 'var(--uber-text, #000000)',
    },
  },
};
