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
import { LEGACY_PTA_ID, THIRTY_TWO_HOUR_COURSE_IDS } from '../../lib/guardQualification';
import type { ApprovalFeedItem } from '../../lib/staffApprovalsFeed';
import { StaffCredentialReviewDetail } from './StaffCredentialReviewDetail';

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
    title: 'Mandatory training (PTA/UOF)',
    emptyMessage: 'No PTA/UOF mandatory training on file.',
    sectionStatus: (guard) => getMandatoryTrainingSectionStatus(guard, true),
    uploadStatus: (guard) => getCourseUploadStatus(guard, LEGACY_PTA_ID),
  },
  ce: {
    title: 'Continued Education',
    emptyMessage: 'No Continued Education courses on file (32-hour BSIS CE package).',
    sectionStatus: (guard) => getContinuingEducationSectionStatus(guard),
    uploadStatus: (guard) => getCourseUploadStatus(guard, THIRTY_TWO_HOUR_COURSE_IDS[0]),
  },
  'pta-uof': {
    title: 'Mandatory training (PTA/UOF)',
    emptyMessage: 'No PTA/UOF training on file.',
    sectionStatus: (guard) => getPtaUofSectionStatus(guard, true),
    uploadStatus: (guard) => getCourseUploadStatus(guard, LEGACY_PTA_ID),
  },
  '32-hour': {
    title: 'Continued Education',
    emptyMessage: 'No Continued Education courses on file.',
    sectionStatus: (guard) => getThirtyTwoHourSectionStatus(guard, true),
    uploadStatus: (guard) => getCourseUploadStatus(guard, THIRTY_TWO_HOUR_COURSE_IDS[0]),
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
