import React from 'react';
import type { SecurityGuard } from '../../types';
import type { ActivationCredentialKey } from '../../lib/guardCredentialSections';
import {
  getContinuingEducationSectionStatus,
  getGuardCardSectionStatus,
  getMandatoryTrainingSectionStatus,
  getPtaUofSectionStatus,
  getThirtyTwoHourSectionStatus,
} from '../../lib/credentialSectionStatus';
import { getCourseUploadStatus } from '../../lib/certStatus';
import { BSIS_REFRESHER_CATALOG_ID } from '../../lib/certCatalog';
import { LEGACY_PTA_ID } from '../../lib/guardQualification';
import type { ApprovalFeedItem } from '../../lib/staffApprovalsFeed';
import { StaffCredentialReviewDetail } from './StaffCredentialReviewDetail';

const ROLLUP_COMPLETION_CATALOG_ID = 'bsis-32-hour-completed';

const ACTIVATION_SECTION_CONFIG: Record<
  ActivationCredentialKey,
  {
    title: string;
    emptyMessage: string;
    sectionStatus: (guard: SecurityGuard) => ReturnType<typeof getGuardCardSectionStatus>;
    uploadStatus: (guard: SecurityGuard) => ReturnType<typeof getCourseUploadStatus>;
  }
> = {
  'guard-card': {
    title: 'BSIS Guard Card',
    emptyMessage: 'No guard card on file.',
    sectionStatus: (guard) => getGuardCardSectionStatus(guard, true),
    uploadStatus: (guard) => getCourseUploadStatus(guard, 'bsis-guard-card'),
  },
  'mandatory-training': {
    title: 'Mandatory training',
    emptyMessage: 'No mandatory training on file (PTA/UOF + 4 mandatory courses).',
    sectionStatus: (guard) => getMandatoryTrainingSectionStatus(guard, true),
    uploadStatus: (guard) => getCourseUploadStatus(guard, LEGACY_PTA_ID),
  },
  ce: {
    title: 'Continuing Education',
    emptyMessage: 'No Continuing Education on file.',
    sectionStatus: (guard) => getContinuingEducationSectionStatus(guard),
    uploadStatus: (guard) => getCourseUploadStatus(guard, BSIS_REFRESHER_CATALOG_ID),
  },
  'pta-uof': {
    title: 'Mandatory training',
    emptyMessage: 'No PTA/UOF training on file.',
    sectionStatus: (guard) => getPtaUofSectionStatus(guard, true),
    uploadStatus: (guard) => getCourseUploadStatus(guard, LEGACY_PTA_ID),
  },
  '32-hour': {
    title: 'Mandatory Courses',
    emptyMessage: 'No mandatory courses on file.',
    sectionStatus: (guard) => getThirtyTwoHourSectionStatus(guard, true),
    uploadStatus: (guard) => getCourseUploadStatus(guard, ROLLUP_COMPLETION_CATALOG_ID),
  },
};

interface StaffActivationReviewDetailProps {
  guard: SecurityGuard;
  stepKey: ActivationCredentialKey;
  feedItem?: ApprovalFeedItem;
  guardName?: string;
  onOpenGuardProfile?: () => void;
}

export function StaffActivationReviewDetail({
  guard,
  stepKey,
  feedItem,
  guardName,
  onOpenGuardProfile,
}: StaffActivationReviewDetailProps) {
  const config = ACTIVATION_SECTION_CONFIG[stepKey];

  return (
    <StaffCredentialReviewDetail
      guardName={guardName ?? guard.name}
      feedItem={feedItem}
      onOpenGuardProfile={onOpenGuardProfile}
      kicker="Awaiting upload"
      title={config.title}
      fields={[]}
      note={config.emptyMessage}
      ariaLabel={`${config.title} review`}
    />
  );
}
