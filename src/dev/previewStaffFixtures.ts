import type { SecurityGuard } from '../types';

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
