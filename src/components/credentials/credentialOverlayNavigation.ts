export interface CertOverlayNavigation {
  onViewFull?: (certId: string) => void;
  viewFullLabel?: string;
  onEditFullPage?: () => void;
}

export function certOverlayProps(navigation: CertOverlayNavigation | undefined, certId: string) {
  if (!navigation) return {};
  return {
    onViewFull: navigation.onViewFull ? () => navigation.onViewFull!(certId) : undefined,
    viewFullLabel: navigation.viewFullLabel,
    onEditFullPage: navigation.onEditFullPage,
  };
}
