import { createContext } from 'react';
import type { PreviewPage, PreviewRole } from './pages';
import type { FrameSize } from './AppShell';
import type { ShellKind } from '../lib/platform/shellKind';

export type PreviewShellKind = ShellKind | 'browser';

export interface SiteMapSection {
  name: string;
  children: PreviewPage[];
}

export interface PreviewContextValue {
  siteMap: SiteMapSection[];
  activePageId: string;
  scrollToPage: (id: string) => void;
  openHelpModal: () => void;
  roleFilter: PreviewRole | 'all';
  setRoleFilter: (role: PreviewRole | 'all') => void;
  frameSize: FrameSize;
  setFrameSize: (size: FrameSize) => void;
  shellPreview: PreviewShellKind;
  setShellPreview: (shell: PreviewShellKind) => void;
}

export const PreviewContext = createContext<PreviewContextValue>({
  siteMap: [],
  activePageId: '',
  scrollToPage: () => undefined,
  openHelpModal: () => undefined,
  roleFilter: 'all',
  setRoleFilter: () => undefined,
  frameSize: 'desktop',
  setFrameSize: () => undefined,
  shellPreview: 'browser',
  setShellPreview: () => undefined,
});
