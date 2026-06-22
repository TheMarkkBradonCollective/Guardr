import { ClientServiceId } from './clientRequestFlow';
import { JOB_TYPE_LABELS } from './guardJobs';
import { JobOperationalDetails, SecurityRequest } from '../types';
import { operationalDetailsDbValue } from './jobOperationalDetails';

/** Shared professional listing fields captured at post time */
export interface JobListingFields {
  description: string;
  uniformRequirements: string;
  equipmentRequirements: string;
  siteInstructions: string;
  contactName: string;
  contactPhone: string;
  parkingInstructions: string;
  accessInstructions: string;
  latitude?: number;
  longitude?: number;
}

export type JobListingLike = Pick<
  SecurityRequest,
  | 'title'
  | 'description'
  | 'clientName'
  | 'clientLogo'
  | 'clientRating'
  | 'siteName'
  | 'address'
  | 'state'
  | 'location'
  | 'type'
  | 'armedRequired'
  | 'guardsNeeded'
  | 'uniformRequirements'
  | 'equipmentRequirements'
  | 'siteInstructions'
  | 'contactName'
  | 'contactPhone'
  | 'parkingInstructions'
  | 'accessInstructions'
  | 'latitude'
  | 'longitude'
  | 'operationalDetails'
  | 'startDate'
  | 'endDate'
  | 'durationHours'
  | 'minGuardQualification'
  | 'requiredCertifications'
  | 'requestType'
  | 'status'
>;

export const EMPTY_LISTING_FIELDS: JobListingFields = {
  description: '',
  uniformRequirements: '',
  equipmentRequirements: '',
  siteInstructions: '',
  contactName: '',
  contactPhone: '',
  parkingInstructions: '',
  accessInstructions: '',
};

export interface JobListingPlaceholders {
  description: string;
  uniformRequirements: string;
  equipmentRequirements: string;
  siteInstructions: string;
  parkingInstructions: string;
  accessInstructions: string;
}

const BASE_LISTING_PLACEHOLDERS: JobListingPlaceholders = {
  description: 'Describe the assignment, environment, and professional standards...',
  uniformRequirements: 'e.g. Black tactical pants, polo, duty belt, polished boots...',
  equipmentRequirements: 'e.g. Radio, flashlight, notepad, vehicle if applicable...',
  siteInstructions: 'Check-in procedure, patrol routes, reporting, emergency contacts...',
  parkingInstructions: 'Where guards park, load-in, or meet motorcade...',
  accessInstructions: 'Gate codes, entrance, ID requirements, escort procedure...',
};

/** Grey example text only — never written into form values. */
export function serviceListingPlaceholders(serviceId: ClientServiceId): JobListingPlaceholders {
  switch (serviceId) {
    case 'executive-protection':
      return {
        description:
          'e.g. Executive protection detail — discreet close coverage for principals or VIP movement',
        uniformRequirements:
          'e.g. Low-profile suit or business casual; concealed carry rig if armed',
        equipmentRequirements: 'e.g. Covert earpiece, radio, flashlight, notepad',
        siteInstructions:
          'e.g. Confirm principal schedule, motorcade plan, venue access, rally points',
        parkingInstructions: 'e.g. Valet, garage, or motorcade staging as directed',
        accessInstructions: 'e.g. Coordinate entry through client POC or venue security',
      };
    case 'event':
      return {
        description: 'e.g. Event security — crowd management, access control, VIP lane support',
        uniformRequirements: 'e.g. Event-appropriate black uniform or client-branded attire',
        equipmentRequirements: 'e.g. Radio, flashlight, crowd control coordination',
        siteInstructions:
          'e.g. Review event layout, credentialing levels, VIP zones, medical contacts',
        parkingInstructions: BASE_LISTING_PLACEHOLDERS.parkingInstructions,
        accessInstructions: BASE_LISTING_PLACEHOLDERS.accessInstructions,
      };
    case 'fire-watch':
      return {
        description: 'e.g. Fire watch during hot work or system impairment',
        uniformRequirements: 'e.g. High-visibility vest over black uniform; steel-toe if required',
        equipmentRequirements: 'e.g. Flashlight, radio, hourly patrol log',
        siteInstructions: 'e.g. Document patrol rounds; know alarm pulls and muster points',
        parkingInstructions: BASE_LISTING_PLACEHOLDERS.parkingInstructions,
        accessInstructions: BASE_LISTING_PLACEHOLDERS.accessInstructions,
      };
    case 'construction':
      return {
        description: 'e.g. Construction site — equipment protection, access control, after-hours patrol',
        uniformRequirements: 'e.g. ANSI vest when required, black boots, hard hat if mandated',
        equipmentRequirements: 'e.g. Flashlight, radio, gate log, vehicle checklist',
        siteInstructions: 'e.g. Lock gates after hours; log contractor vehicles',
        parkingInstructions: BASE_LISTING_PLACEHOLDERS.parkingInstructions,
        accessInstructions: BASE_LISTING_PLACEHOLDERS.accessInstructions,
      };
    case 'patrol':
      return {
        description: 'e.g. Mobile patrol — perimeter checks and visible deterrence',
        uniformRequirements: 'e.g. Standard black uniform with duty belt; reflective gear at night',
        equipmentRequirements: 'e.g. Radio, flashlight, keys/access cards, patrol log',
        siteInstructions: 'e.g. Complete all checkpoints each round; note hazards',
        parkingInstructions: BASE_LISTING_PLACEHOLDERS.parkingInstructions,
        accessInstructions: BASE_LISTING_PLACEHOLDERS.accessInstructions,
      };
    default:
      return BASE_LISTING_PLACEHOLDERS;
  }
}

/** @deprecated Use EMPTY_LISTING_FIELDS + serviceListingPlaceholders */
export function serviceListingDefaults(
  serviceId: ClientServiceId,
  _context?: { siteName?: string; address?: string; serviceLabel?: string }
): JobListingFields {
  return { ...EMPTY_LISTING_FIELDS };
}

export function buildMarketplaceDescription(
  _serviceLabel: string,
  _address: string,
  customDescription?: string
): string {
  return customDescription?.trim() ?? '';
}

export function listingFieldsFromJob(job: Partial<SecurityRequest>): JobListingFields {
  return {
    description: job.description || '',
    uniformRequirements: job.uniformRequirements || '',
    equipmentRequirements: job.equipmentRequirements || '',
    siteInstructions: job.siteInstructions || '',
    contactName: job.contactName || '',
    contactPhone: job.contactPhone || '',
    parkingInstructions: job.parkingInstructions || '',
    accessInstructions: job.accessInstructions || '',
    latitude: job.latitude,
    longitude: job.longitude,
  };
}

export function jobTypeLabel(job: Pick<SecurityRequest, 'type'>): string {
  return JOB_TYPE_LABELS[job.type] || job.type;
}

/** Supabase column payload for listing detail fields */
export function listingDetailDbColumns(job: Partial<SecurityRequest>) {
  return {
    latitude: job.latitude ?? null,
    longitude: job.longitude ?? null,
    contact_name: job.contactName ?? null,
    contact_phone: job.contactPhone ?? null,
    parking_instructions: job.parkingInstructions ?? null,
    access_instructions: job.accessInstructions ?? null,
    uniform_requirements: job.uniformRequirements ?? '',
    equipment_requirements: job.equipmentRequirements ?? '',
    site_instructions: job.siteInstructions ?? '',
  };
}

/** Merge a partial edit onto an existing job without nulling fields that were not sent. */
export function mergeJobListingUpdates(
  existing: SecurityRequest,
  safe: Partial<SecurityRequest>,
  computed: {
    siteName: string;
    address: string;
    startDate: string;
    endDate: string;
    durationHours: number;
    hourlyRate: number;
    location: string;
    state?: string;
    status: SecurityRequest['status'];
  }
): SecurityRequest {
  const title = (safe.title ?? existing.title).trim() || existing.title;

  return {
    ...existing,
    ...safe,
    title,
    siteName: computed.siteName,
    address: computed.address,
    startDate: computed.startDate,
    endDate: computed.endDate,
    durationHours: computed.durationHours,
    hourlyRate: computed.hourlyRate,
    location: computed.location,
    state: computed.state ?? existing.state,
    description: safe.description ?? existing.description ?? '',
    uniformRequirements: safe.uniformRequirements ?? existing.uniformRequirements ?? '',
    equipmentRequirements: safe.equipmentRequirements ?? existing.equipmentRequirements ?? '',
    siteInstructions: safe.siteInstructions ?? existing.siteInstructions ?? '',
    contactName: safe.contactName ?? existing.contactName,
    contactPhone: safe.contactPhone ?? existing.contactPhone,
    parkingInstructions: safe.parkingInstructions ?? existing.parkingInstructions,
    accessInstructions: safe.accessInstructions ?? existing.accessInstructions,
    latitude: safe.latitude ?? existing.latitude,
    longitude: safe.longitude ?? existing.longitude,
    operationalDetails: safe.operationalDetails ?? existing.operationalDetails,
    type: safe.type ?? existing.type,
    armedRequired: safe.armedRequired ?? existing.armedRequired,
    guardsNeeded: safe.guardsNeeded ?? existing.guardsNeeded,
    guardPay: safe.guardPay ?? existing.guardPay,
    estimatedPayout: safe.estimatedPayout ?? existing.estimatedPayout,
    requiredCertifications: safe.requiredCertifications ?? existing.requiredCertifications,
    status: computed.status,
  };
}

export function buildJobListingDbPayload(job: SecurityRequest) {
  return {
    title: job.title,
    description: job.description ?? '',
    site_name: job.siteName ?? '',
    address: job.address ?? '',
    state: job.state ?? '',
    location: job.location,
    type: job.type,
    armed_required: job.armedRequired,
    guards_needed: job.guardsNeeded ?? 1,
    start_date: job.startDate,
    end_date: job.endDate,
    duration_hours: job.durationHours,
    hourly_rate: job.hourlyRate,
    guard_pay: job.guardPay,
    estimated_payout: job.estimatedPayout,
    required_certifications: job.requiredCertifications ?? [],
    status: job.status,
    operational_details: operationalDetailsDbValue(job.operationalDetails),
    ...listingDetailDbColumns(job),
  };
}

export function hasListingPostOrders(job: Partial<JobListingLike>): boolean {
  return Boolean(
    job.uniformRequirements?.trim() ||
      job.equipmentRequirements?.trim() ||
      job.siteInstructions?.trim() ||
      job.parkingInstructions?.trim() ||
      job.accessInstructions?.trim() ||
      job.contactName?.trim() ||
      job.contactPhone?.trim()
  );
}
