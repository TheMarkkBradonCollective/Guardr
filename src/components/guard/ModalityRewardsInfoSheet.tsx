import React from 'react';
import { Shield, Truck } from 'lucide-react';
import type { WorkModality } from '../../lib/guardWorkModality';
import { workModalityLabel, workModalitySubtitle } from '../../lib/guardWorkModality';
import { modalityRewardsInfoCopy } from '../../lib/guardPremiumJobPriority';
import { AppModal } from '../ui/motion/AppMotion';

interface ModalityRewardsInfoSheetProps {
  modality: WorkModality;
  totalTargets: number;
  open: boolean;
  onClose: () => void;
}

const MODALITY_ICONS: Record<WorkModality, React.ComponentType<{ className?: string }>> = {
  standing: Shield,
  driving: Truck,
};

export function ModalityRewardsInfoSheet({
  modality,
  totalTargets,
  open,
  onClose,
}: ModalityRewardsInfoSheetProps) {
  const Icon = MODALITY_ICONS[modality];
  const copy = modalityRewardsInfoCopy(modality, totalTargets);

  return (
    <AppModal
      open={open}
      position="absolute"
      zIndex={1004}
      onClose={onClose}
      ariaLabelledBy={`${modality}-rewards-info-title`}
    >
      <div className="guard-premium-priority-sheet">
        <div className="guard-premium-priority-sheet-icon-wrap" aria-hidden>
          <Icon className="guard-premium-priority-sheet-icon" />
        </div>
        <h2 id={`${modality}-rewards-info-title`} className="guard-premium-priority-sheet-title">
          {copy.title}
        </h2>
        <p className="guard-premium-priority-sheet-body">{copy.body}</p>
        <button type="button" className="guard-premium-priority-sheet-cta" onClick={onClose}>
          {copy.ctaLabel}
        </button>
      </div>
    </AppModal>
  );
}
