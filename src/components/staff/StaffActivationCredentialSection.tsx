import React from 'react';
import { BookOpen, Shield } from 'lucide-react';
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
import { CredentialRowAction, CredentialRowHeader } from '../credentials/CredentialStatusLabels';

const ROLLUP_COMPLETION_CATALOG_ID = 'bsis-32-hour-completed';

const ACTIVATION_SECTION_CONFIG: Record<
  ActivationCredentialKey,
  {
    title: React.ReactNode;
    emptyMessage: string;
    sectionStatus: (guard: SecurityGuard) => ReturnType<typeof getGuardCardSectionStatus>;
    uploadStatus: (guard: SecurityGuard) => ReturnType<typeof getCourseUploadStatus>;
  }
> = {
  'guard-card': {
    title: (
      <p className="uber-label flex items-center gap-2 flex-wrap">
        <Shield className="w-4 h-4 text-brand-primary shrink-0" />
        BSIS Guard Card
      </p>
    ),
    emptyMessage: 'No guard card on file.',
    sectionStatus: (guard) => getGuardCardSectionStatus(guard, true),
    uploadStatus: (guard) => getCourseUploadStatus(guard, 'bsis-guard-card'),
  },
  'mandatory-training': {
    title: (
      <p className="uber-label flex items-center gap-2 flex-wrap">
        <BookOpen className="w-4 h-4 text-brand-primary shrink-0" />
        Mandatory training
      </p>
    ),
    emptyMessage: 'No mandatory training on file (PTA/UOF + 4 mandatory courses).',
    sectionStatus: (guard) => getMandatoryTrainingSectionStatus(guard, true),
    uploadStatus: (guard) => getCourseUploadStatus(guard, LEGACY_PTA_ID),
  },
  ce: {
    title: (
      <p className="uber-label flex items-center gap-2 flex-wrap">
        <BookOpen className="w-4 h-4 text-brand-primary shrink-0" />
        Continuing Education
      </p>
    ),
    emptyMessage: 'No Continuing Education on file.',
    sectionStatus: (guard) => getContinuingEducationSectionStatus(guard),
    uploadStatus: (guard) => getCourseUploadStatus(guard, BSIS_REFRESHER_CATALOG_ID),
  },
  'pta-uof': {
    title: (
      <p className="uber-label flex items-center gap-2 flex-wrap">
        <BookOpen className="w-4 h-4 text-brand-primary shrink-0" />
        Mandatory training
      </p>
    ),
    emptyMessage: 'No PTA/UOF training on file.',
    sectionStatus: (guard) => getPtaUofSectionStatus(guard, true),
    uploadStatus: (guard) => getCourseUploadStatus(guard, LEGACY_PTA_ID),
  },
  '32-hour': {
    title: (
      <p className="uber-label flex items-center gap-2 flex-wrap">
        <BookOpen className="w-4 h-4 text-brand-primary shrink-0" />
        Mandatory Courses
      </p>
    ),
    emptyMessage: 'No mandatory courses on file.',
    sectionStatus: (guard) => getThirtyTwoHourSectionStatus(guard, true),
    uploadStatus: (guard) => getCourseUploadStatus(guard, ROLLUP_COMPLETION_CATALOG_ID),
  },
};

interface StaffActivationCredentialSectionProps {
  guard: SecurityGuard;
  stepKey: ActivationCredentialKey;
}

/** Staff credentials detail — matches Government ID section layout for pending uploads. */
export function StaffActivationCredentialSection({
  guard,
  stepKey,
}: StaffActivationCredentialSectionProps) {
  const config = ACTIVATION_SECTION_CONFIG[stepKey];

  return (
    <section className="app-form-section space-y-3">
      <CredentialRowHeader
        rawTitle
        title={config.title}
        action={
          <CredentialRowAction
            staffMode
            uploadStatus={config.uploadStatus(guard)}
            sectionStatus={config.sectionStatus(guard)}
            canUpload={false}
            onAdd={() => {}}
          />
        }
      />
      <p className="text-xs text-brand-text-muted py-3 border-t border-brand-border">
        {config.emptyMessage}
      </p>
    </section>
  );
}
