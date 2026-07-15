import type { JobType, SecurityGuard } from '../types';

export interface JobTypeOnboardingContent {
  title: string;
  summary: string;
  expectations: string[];
  acknowledgment: string;
}

export const JOB_TYPE_ONBOARDING: Record<JobType, JobTypeOnboardingContent> = {
  'nightclub-bar': {
    title: 'Nightclub & bar security',
    summary: 'Light-touch hospitality security for nightlife venues with crowd management and de-escalation.',
    expectations: [
      'Remain professional with intoxicated patrons and de-escalate without force when possible.',
      'Follow venue access, ID-check, and last-call policies set by the client.',
      'Wear the uniform or dress code described in each post before accepting.',
    ],
    acknowledgment: 'I understand nightlife posts require calm communication and venue-specific rules.',
  },
  'event-wedding': {
    title: 'Wedding & private celebration security',
    summary: 'Discrete coverage for ceremonies, receptions, and VIP areas at wedding venues.',
    expectations: [
      'Prioritize guest experience — low-profile presence unless intervention is required.',
      'Coordinate with venue staff on vendor access, gift tables, and photography areas.',
      'Arrive early for briefing on timeline, parking, and emergency contacts.',
    ],
    acknowledgment: 'I understand wedding posts require discretion and coordination with venue staff.',
  },
  'event-concert': {
    title: 'Concert & live music security',
    summary: 'Crowd flow, stage perimeter, and patron safety at concerts and live music venues.',
    expectations: [
      'Monitor crowd density, entry lines, and restricted backstage or stage areas.',
      'Follow the client’s house policies for ejections, medical escalations, and bag checks.',
      'Be prepared for loud environments and extended standing shifts.',
    ],
    acknowledgment: 'I understand concert posts may involve large crowds and venue-specific safety plans.',
  },
  'event-festival': {
    title: 'Festival & fair security',
    summary: 'Multi-zone coverage for outdoor festivals, fairs, and large public gatherings.',
    expectations: [
      'Work assigned zones and radio check-ins as directed by the lead or client.',
      'Assist with perimeter control, vendor rows, and pedestrian flow between stages.',
      'Plan for weather, long shifts, and changing site conditions.',
    ],
    acknowledgment: 'I understand festival posts can span large sites and long operating hours.',
  },
  'event-corporate': {
    title: 'Corporate event security',
    summary: 'Professional coverage for conferences, galas, and corporate functions.',
    expectations: [
      'Maintain a business-appropriate presence at registration, VIP, and loading areas.',
      'Verify badges or guest lists when the client requires access control.',
      'Protect confidential areas and follow NDA or privacy instructions when provided.',
    ],
    acknowledgment: 'I understand corporate events require a polished, professional demeanor.',
  },
  'event-private': {
    title: 'Private party & residence event security',
    summary: 'Access control and guest safety for private homes, estates, and invite-only events.',
    expectations: [
      'Confirm guest list or access procedures with the client before the event starts.',
      'Respect homeowner privacy and property rules throughout the shift.',
      'Coordinate arrivals, parking, and vendor access without disrupting the event.',
    ],
    acknowledgment: 'I understand private events require discretion and strict access control.',
  },
  event: {
    title: 'General event security',
    summary: 'Flexible event coverage when the venue type is not listed separately.',
    expectations: [
      'Review the client’s site briefing for crowd size, access points, and emergency plans.',
      'Ask clarifying questions in job chat before accepting if venue details are unclear.',
      'Follow post orders for uniform, equipment, and escalation contacts.',
    ],
    acknowledgment: 'I understand general event posts require careful review of each listing.',
  },
  patrol: {
    title: 'Patrol services',
    summary: 'Mobile checks of perimeters, lots, and interior routes on a defined schedule.',
    expectations: [
      'Complete all required checkpoints and document exceptions in shift reports.',
      'Use the client’s reporting format for hazards, trespassers, and maintenance issues.',
      'Maintain reliable transportation between patrol stops when required.',
    ],
    acknowledgment: 'I understand patrol posts require timely rounds and clear written reports.',
  },
  construction: {
    title: 'Construction site security',
    summary: 'Theft deterrence, access control, and after-hours monitoring at active job sites.',
    expectations: [
      'Control contractor and vendor access according to site rules.',
      'Watch equipment yards, trailers, and material storage areas during your shift.',
      'Report safety hazards and unauthorized persons immediately.',
    ],
    acknowledgment: 'I understand construction posts focus on access control and asset protection.',
  },
  'fire-watch': {
    title: 'Fire watch',
    summary: 'Compliance posts during hot work, impaired fire systems, or other mandated watches.',
    expectations: [
      'Remain continuously alert and follow the client’s fire watch log procedures.',
      'Know extinguisher locations, alarm contacts, and evacuation routes before starting.',
      'Never leave the assigned post unattended without client approval.',
    ],
    acknowledgment: 'I understand fire watch posts require continuous attention and documented logs.',
  },
  'standing-guard': {
    title: 'Standing guard post',
    summary: 'Fixed-post coverage at doors, lobbies, desks, or other stationary assignments.',
    expectations: [
      'Stay at the assigned post unless relieved by the client or lead guard.',
      'Greet visitors professionally and enforce access rules consistently.',
      'Log visitors, incidents, and handoffs according to post orders.',
    ],
    acknowledgment: 'I understand standing posts require sustained focus at a fixed location.',
  },
  'armed-escort': {
    title: 'Armed escort',
    summary: 'Armed movement security for valuables, personnel, or high-risk transports.',
    expectations: [
      'Maintain a valid BSIS exposed firearm permit and carry credentials on shift.',
      'Follow route plans, communication protocols, and use-of-force policies provided by the client.',
      'Decline posts that exceed your training, equipment, or legal authorization.',
    ],
    acknowledgment: 'I understand armed escort posts require current firearm credentials and route briefings.',
  },
  bodyguard: {
    title: 'Executive protection',
    summary: 'Close protection and VIP security for executives, talent, and high-profile clients.',
    expectations: [
      'Maintain confidentiality about principal identity, schedule, and locations.',
      'Coordinate with the client’s advance team on arrivals, motorcade, and secure rooms.',
      'Dress and conduct yourself to blend with the environment when requested.',
    ],
    acknowledgment: 'I understand executive protection requires discretion and advance coordination.',
  },
  'asset-protection': {
    title: 'Property & asset protection',
    summary: 'Facility security for buildings, retail, warehouses, and other fixed assets.',
    expectations: [
      'Protect assigned areas from theft, vandalism, and unauthorized access.',
      'Follow opening/closing procedures and alarm handling instructions exactly.',
      'Document incidents, maintenance issues, and shift turnover clearly.',
    ],
    acknowledgment: 'I understand property posts require consistent access control and reporting.',
  },
  other: {
    title: 'Custom security request',
    summary: 'Non-standard assignments that need extra review before you accept.',
    expectations: [
      'Read the full listing, post orders, and site briefing before applying.',
      'Ask questions in job chat if scope, equipment, or pay is unclear.',
      'Decline posts that do not match your training, licensing, or comfort level.',
    ],
    acknowledgment: 'I understand custom posts require extra review before I accept.',
  },
};

export function normalizeJobTypeOnboarding(
  value: Partial<Record<string, string>> | null | undefined
): Partial<Record<JobType, string>> {
  if (!value || typeof value !== 'object') return {};
  const next: Partial<Record<JobType, string>> = {};
  for (const [key, completedAt] of Object.entries(value)) {
    if (typeof completedAt === 'string' && completedAt.trim()) {
      next[key as JobType] = completedAt;
    }
  }
  return next;
}

export function isJobTypeOnboarded(
  guard: Pick<SecurityGuard, 'jobTypeOnboarding'>,
  jobType: JobType
): boolean {
  return Boolean(guard.jobTypeOnboarding?.[jobType]);
}

export function jobTypeOnboardingContent(jobType: JobType): JobTypeOnboardingContent {
  return JOB_TYPE_ONBOARDING[jobType];
}
