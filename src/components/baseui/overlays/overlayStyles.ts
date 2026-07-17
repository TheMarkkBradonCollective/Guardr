import type { ModalOverrides } from 'baseui/modal';
import type { DrawerOverrides } from 'baseui/drawer';

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
      },
    },
    Dialog: {
      style: {
        borderRadius: centered ? '14px' : '22px 22px 0 0',
        border: '1px solid',
        borderColor: 'borderOpaque',
        backgroundColor: 'backgroundPrimary',
        color: 'contentPrimary',
        maxHeight: '90vh',
        overflowY: 'auto',
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
    DrawerContainer: {
      style: {
        borderTopLeftRadius: '22px',
        borderTopRightRadius: '22px',
        border: '1px solid',
        borderColor: 'borderOpaque',
        borderBottom: 'none',
        backgroundColor: 'backgroundPrimary',
        color: 'contentPrimary',
        maxHeight: '85dvh',
        paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
      },
      props: panelClassName ? { className: panelClassName } : {},
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
    DrawerContainer: {
      style: {
        width,
        maxWidth: '90vw',
        backgroundColor: 'backgroundPrimary',
        color: 'contentPrimary',
        borderRight: '1px solid',
        borderColor: 'borderOpaque',
      },
    },
    Close: {
      style: { display: 'none' },
    },
  };
}

export const snackbarOverrides = {
  Root: {
    style: {
      borderRadius: '14px',
      border: '1px solid',
      borderColor: 'borderOpaque',
      backgroundColor: 'backgroundPrimary',
      color: 'contentPrimary',
      boxShadow: 'var(--shadow-float)',
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
    },
  },
};
