import { getCertCatalogEntry } from './certCatalog';
import {
  PTA_UOF_UPLOAD_GUIDANCE,
  THIRTY_TWO_HOUR_COURSE_IDS,
} from './guardQualification';

/** Official California BSIS guard training regulation page. */
export const BSIS_OFFICIAL_TRAINING_URL = 'https://www.bsis.ca.gov/industries/g_train.shtml';

export const GUARD_ACTIVATION_REQUIREMENT_COUNT = 5;

export interface GuardActivationRequirement {
  key: string;
  label: string;
  detail: string;
}

/** The five credentials Guardr verifies before a guard account activates. */
export const GUARD_ACTIVATION_REQUIREMENTS: GuardActivationRequirement[] = [
  {
    key: 'gov-id',
    label: 'Government ID',
    detail: 'Front, back, selfie, state, number, and expiration — staff verify before you can work.',
  },
  {
    key: 'coi',
    label: 'Certificate of Insurance (COI)',
    detail: 'General liability insurance — required for profile approval and marketplace work.',
  },
  {
    key: 'guard-card',
    label: 'BSIS Guard Card',
    detail: 'California guard registration card — document photo on file, staff-verified.',
  },
  {
    key: 'mandatory-training',
    label: 'Mandatory training (PTA / UOF)',
    detail: `Initial 8-hour BSIS training: Power to Arrest (3 hr) and Appropriate Use of Force (5 hr). ${PTA_UOF_UPLOAD_GUIDANCE}`,
  },
  {
    key: 'ce',
    label: 'Continuing Education (32-hour BSIS CE package)',
    detail:
      'All 9 course certificates from your school’s 32-hour first-year package — after PTA/UOF. Turn certificates in to your employer; BSIS does not collect them.',
  },
];

export interface CePackageCourse {
  catalogId: string;
  name: string;
  hoursLabel: string;
}

/** Nine courses in the Guardr Continuing Education (32-hour) activation package. */
export function getContinuingEducationPackageCourses(): CePackageCourse[] {
  return THIRTY_TWO_HOUR_COURSE_IDS.map((catalogId) => {
    const entry = getCertCatalogEntry(catalogId);
    const name = entry?.name ?? catalogId;
    const hoursMatch = name.match(/\((\d+)\s*hr\)/i);
    return {
      catalogId,
      name: name.replace(/\s*\(\d+\s*hr\)/i, '').trim(),
      hoursLabel: hoursMatch ? `${hoursMatch[1]} hr` : '',
    };
  });
}

export const BSIS_TERMINOLOGY_NOTE =
  'On the official BSIS site, “Mandatory Courses” and “Elective Courses” are the skills block schools package into a 32-hour first-year course. BSIS labels the annual 8-hour renewal as “Continuing Education.” On Guardr, Continuing Education means that full 32-hour first-year package — the annual 8-hour refresher is separate and not required to activate.';

export const BSIS_EMPLOYER_CERT_NOTE =
  'Course completion certificates are kept by your employer on file — not submitted to BSIS. Upload each certificate here so Guardr staff can verify marketplace eligibility.';
