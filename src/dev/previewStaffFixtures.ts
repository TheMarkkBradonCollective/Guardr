import type { SecurityGuard, SecurityRequest } from '../types';

/** Static staff member for the surface preview harness. */
export const PREVIEW_STAFF_MEMBER: SecurityGuard = {
  id: 'staff-preview-1',
  name: 'Khalid Lovett',
  firstName: 'Khalid',
  lastName: 'Lovett',
  email: 'k.lovett@signaturesecurityspecialist.com',
  badgeNumber: 'MOD-00001',
  avatar: '',
  phone: '916-555-0142',
  bio: '',
  headline: 'Platform Administrator',
  summary: 'Approves guard and customer applications, monitors activity, and escalates issues.',
  about: 'Keeps the command center moving.',
  specialties: ['Guard verification', 'Job operations', 'Support desk'],
  isArmed: false,
  backgroundChecked: true,
  verified: true,
  rating: 0,
  jobsCompleted: 0,
  certifications: [],
  experience: [],
  isStaff: true,
  staffRole: 'Moderator',
  managedCities: ['Sacramento'],
  userStatus: 'approved',
};

export const PREVIEW_PENDING_STAFF_MEMBER: SecurityGuard = {
  ...PREVIEW_STAFF_MEMBER,
  id: 'staff-preview-pending',
  userStatus: 'pending',
  badgeNumber: 'MOD-00008',
  name: 'Amina Cole',
  firstName: 'Amina',
  lastName: 'Cole',
  email: 'a.cole@signaturesecurityspecialist.com',
};

/** Open job for surface preview of jobs / payments — not just staff profiles. */
export const PREVIEW_JOB = {
  id: 'JOB-2131256835',
  title: 'Portage Distribution — Dock A3',
  description: 'Gate coverage for inbound freight on the A3 dock.',
  clientId: 'client-preview-1',
  clientName: 'Portage Distribution',
  clientLogo: 'PD',
  location: 'Sacramento',
  address: '4100 Portage Rd, Sacramento, CA',
  type: 'standing-guard',
  armedRequired: false,
  startDate: '2026-09-03T15:00:00.000Z',
  endDate: '2026-09-03T23:00:00.000Z',
  durationHours: 8,
  guardsNeeded: 1,
  status: 'open',
  estimatedPayout: 224,
  requiredCertifications: [],
} as SecurityRequest;
