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

export function serviceListingDefaults(
  serviceId: ClientServiceId,
  context?: { siteName?: string; address?: string; serviceLabel?: string }
): JobListingFields {
  const site = context?.siteName || context?.address || 'the site';
  const label = context?.serviceLabel || 'Security';

  const base: JobListingFields = {
    description: `${label} coverage at ${site}. Professional appearance and clear communication with site leadership required.`,
    uniformRequirements:
      'Black tactical pants or slacks, black belt, black duty boots or dress shoes, company-issued or plain black polo/shirt. Name badge visible when on post.',
    equipmentRequirements:
      'Duty belt, flashlight, radio (if issued), notepad and pen. Client may issue additional gear on arrival.',
    siteInstructions:
      `Report to the site contact on arrival. Confirm post orders, patrol routes, and emergency procedures before beginning coverage.`,
    contactName: '',
    contactPhone: '',
    parkingInstructions: 'Confirm parking with site contact on arrival.',
    accessInstructions: 'Check in at the main entrance or security desk. Have government ID ready.',
  };

  switch (serviceId) {
    case 'executive-protection':
      return {
        ...base,
        description: `Executive protection detail at ${site}. Discreet, professional close-protection coverage for principals, executives, or VIP movement.`,
        uniformRequirements:
          'Low-profile executive attire: dark suit or business casual as directed. Concealed carry rig if armed. No visible tactical branding unless client requests.',
        equipmentRequirements:
          'Covert earpiece, radio, flashlight, notepad. Vehicle coordination may be required. Advance work and route planning per client briefing.',
        siteInstructions:
          `Advance coordination required. Confirm principal schedule, motorcade plan, venue access, and emergency rally points. Maintain confidentiality at all times.`,
        parkingInstructions: 'Valet, garage, or motorcade staging as directed by client or advance team.',
        accessInstructions: 'Coordinate entry through client POC or venue security. No social media or photos on detail.',
      };
    case 'event':
      return {
        ...base,
        description: `Event security at ${site}. Crowd management, access control, and VIP lane support.`,
        uniformRequirements:
          'Event-appropriate black uniform or client-branded attire. Visible credential and professional grooming.',
        equipmentRequirements: 'Radio, flashlight, crowd control barriers coordination, incident report forms.',
        siteInstructions:
          'Review event layout, credentialing levels, artist/VIP zones, and medical/emergency contacts before doors open.',
      };
    case 'fire-watch':
      return {
        ...base,
        description: `Fire watch compliance post at ${site}. Active patrol during hot work or system impairment.`,
        uniformRequirements: 'High-visibility vest over black uniform. Steel-toe boots if required by site.',
        equipmentRequirements: 'Flashlight, radio, fire extinguisher familiarity, hourly patrol log.',
        siteInstructions:
          'Document patrol rounds per fire marshal requirements. Know alarm pull stations and muster points.',
      };
    case 'construction':
      return {
        ...base,
        description: `Construction site security at ${site}. Equipment protection, access control, and after-hours patrol.`,
        uniformRequirements: 'ANSI-compliant vest when required, black boots, hard hat if mandated by GC.',
        equipmentRequirements: 'Flashlight, radio, gate log, vehicle inspection checklist if applicable.',
        siteInstructions:
          'Lock all gates after hours. Log all contractor vehicles. Report trespassers immediately.',
      };
    case 'patrol':
      return {
        ...base,
        description: `Mobile patrol coverage for ${site}. Perimeter checks and visible deterrence.`,
        uniformRequirements: 'Standard black security uniform with duty belt. Reflective gear for night patrol if needed.',
        equipmentRequirements: 'Radio, flashlight, keys/access cards as issued, patrol log.',
        siteInstructions: 'Complete all checkpoints each round. Note lighting outages, open doors, and hazards.',
      };
    default:
      return base;
  }
}

export function buildMarketplaceDescription(
  serviceLabel: string,
  address: string,
  customDescription?: string
): string {
  if (customDescription?.trim()) return customDescription.trim();
  return `Professional ${serviceLabel.toLowerCase()} coverage at ${address}.`;
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
