import type { JobType, SecurityGuard } from '../types';

export interface JobTypeOnboardingContent {
  title: string;
  summary: string;
  expectations: string[];
  beforeAccepting: string[];
  acknowledgment: string;
}

/** Expanded copy on the preferences hero (Read more). */
export const GENERAL_ONBOARDING_INTRO =
  'Before accepting any assignment, carefully review the onboarding information for the specific type of security post. Every client, location, and assignment may have unique requirements, but all officers are expected to maintain the highest level of professionalism, integrity, and customer service while representing both the company and our clients.';

/** Words per minute used to estimate how long a guard must remain on the briefing. */
export const ONBOARDING_READ_WPM = 130;

/** Minimum time on the briefing before completion is allowed. */
export const ONBOARDING_MIN_READ_SECONDS = 35;

export const JOB_TYPE_ONBOARDING: Record<JobType, JobTypeOnboardingContent> = {
  'nightclub-bar': {
    title: 'Nightclub & bar',
    summary:
      'Light-touch hospitality security for bars, lounges, breweries, casinos, and nightlife venues. Officers maintain a safe environment while balancing customer service with security responsibilities. These assignments often involve high guest interaction, loud environments, alcohol service, and rapidly changing situations.',
    expectations: [
      'Maintain a calm and professional attitude when interacting with intoxicated, disruptive, or emotional patrons.',
      'Assist with ID checks, entry screening, occupancy limits, line management, and access control as directed by the client.',
      'Monitor for fights, disorderly conduct, theft, vandalism, drug activity, and other safety concerns.',
      'Use verbal communication and de-escalation techniques whenever possible before requesting additional assistance.',
      'Work closely with bartenders, managers, event staff, law enforcement, and emergency personnel when necessary.',
      'Complete detailed incident reports whenever enforcement action or significant incidents occur.',
      'Remain visible and approachable at entry points while enforcing venue policies consistently.',
    ],
    beforeAccepting: [
      'Review the client\'s dress code, uniform requirements, and equipment list.',
      'Be prepared to stand for extended periods and work in loud, crowded environments.',
      'Understand that evening, weekend, and holiday assignments are common.',
      'Confirm you are comfortable working around alcohol service and late-night crowds.',
    ],
    acknowledgment:
      'I understand nightlife posts require calm communication, de-escalation skills, and strict adherence to venue-specific rules.',
  },
  'event-wedding': {
    title: 'Event venue — wedding',
    summary:
      'Provide professional security for wedding ceremonies, receptions, and private celebrations while maintaining a discreet, respectful, and welcoming presence. Officers protect guests and property without disrupting the atmosphere of the event.',
    expectations: [
      'Assist with guest check-in, vendor access, parking coordination, and private property protection.',
      'Monitor entrances, exits, gift tables, alcohol service areas, and other assigned locations.',
      'Handle disturbances professionally while minimizing disruption to the ceremony or reception.',
      'Assist with emergency situations, medical incidents, or unauthorized guests when necessary.',
      'Maintain excellent customer service and represent the company professionally.',
      'Follow all instructions provided by the client or event coordinator.',
      'Coordinate quietly with photographers, caterers, and venue staff throughout the event timeline.',
    ],
    beforeAccepting: [
      'Review the event schedule and assignment details carefully.',
      'Dress professionally according to the client\'s requirements.',
      'Maintain a discreet presence while remaining approachable and observant.',
      'Arrive early enough for a briefing on the timeline, parking plan, and emergency contacts.',
    ],
    acknowledgment:
      'I understand wedding posts require discretion, guest-focused service, and close coordination with venue staff.',
  },
  'event-concert': {
    title: 'Event venue — concert',
    summary:
      'Provide security for concerts and live entertainment events where public safety, crowd management, and access control are the primary responsibilities. These assignments can involve large crowds, high noise levels, and fast-paced environments.',
    expectations: [
      'Assist with ticket verification, entry screening, crowd flow, and restricted access points.',
      'Monitor audience behavior and report suspicious activity or unsafe conditions immediately.',
      'Protect performer areas, backstage access, VIP sections, and equipment when assigned.',
      'Assist with emergency evacuations, lost persons, or medical incidents when necessary.',
      'Remain alert throughout the event and communicate effectively with supervisors and fellow officers.',
      'Document incidents accurately before the end of your shift.',
      'Support medical and law enforcement personnel without escalating situations unnecessarily.',
    ],
    beforeAccepting: [
      'Expect extended periods of standing and walking.',
      'Review emergency evacuation routes and venue procedures.',
      'Wear the required uniform or event attire specified for the assignment.',
      'Be prepared for high noise levels and large, dense crowds near the stage and entry points.',
    ],
    acknowledgment:
      'I understand concert posts may involve large crowds, venue-specific safety plans, and sustained alertness.',
  },
  'event-festival': {
    title: 'Event venue — festival',
    summary:
      'Provide security for outdoor festivals, fairs, community celebrations, and multi-zone events. Officers help maintain a safe environment for attendees while supporting event staff and emergency personnel.',
    expectations: [
      'Patrol assigned zones including entrances, vendor areas, parking lots, and entertainment sections.',
      'Assist with crowd management, lost children, missing persons, and public safety concerns.',
      'Monitor for suspicious activity, medical emergencies, fire hazards, and safety issues.',
      'Provide directions and assist attendees with general questions when appropriate.',
      'Complete patrols as assigned and report all incidents promptly.',
      'Work professionally alongside event organizers, vendors, police, fire, and EMS personnel.',
      'Adapt to changing weather, crowd density, and schedule shifts between performance areas.',
    ],
    beforeAccepting: [
      'Be prepared for outdoor weather conditions and long walking distances.',
      'Bring any required equipment listed in the assignment.',
      'Review your assigned patrol area before beginning your shift.',
      'Plan for extended hours and limited shade or shelter on outdoor sites.',
    ],
    acknowledgment:
      'I understand festival posts can span large sites, long operating hours, and changing outdoor conditions.',
  },
  'event-corporate': {
    title: 'Event venue — corporate',
    summary:
      'Provide professional security for conferences, conventions, business meetings, trade shows, and executive functions. These assignments place a strong emphasis on professionalism, discretion, and customer service.',
    expectations: [
      'Verify credentials and control access to restricted areas.',
      'Assist guests, employees, executives, and vendors with directions or security concerns.',
      'Protect company assets, equipment, and confidential meeting areas.',
      'Maintain a polished appearance and courteous demeanor throughout the event.',
      'Observe and report suspicious activity without disrupting business operations.',
      'Complete reports for any incidents or policy violations.',
      'Handle VIP arrivals and loading dock access according to client protocols.',
    ],
    beforeAccepting: [
      'Business attire or client-specific uniforms may be required.',
      'Review access control procedures before your shift.',
      'Maintain confidentiality regarding the client\'s operations.',
      'Confirm badge-check or guest-list procedures with the event lead before doors open.',
    ],
    acknowledgment:
      'I understand corporate events require a polished, professional demeanor and strict confidentiality.',
  },
  'event-private': {
    title: 'Event venue — private party',
    summary:
      'Provide security for private residences, estates, and invitation-only events where discretion, professionalism, and client privacy are essential.',
    expectations: [
      'Verify guest access according to the client\'s instructions.',
      'Monitor entrances, exits, parking areas, and private property.',
      'Protect guests, hosts, and personal property throughout the event.',
      'Handle disturbances respectfully while minimizing disruptions.',
      'Report incidents immediately to the client representative and dispatch.',
      'Remain courteous and professional throughout the assignment.',
      'Respect homeowner rules regarding interior access, photography, and noise.',
    ],
    beforeAccepting: [
      'Review all client instructions before arrival.',
      'Respect the privacy of guests at all times.',
      'Follow the required dress code listed in the assignment.',
      'Confirm parking, vendor, and delivery procedures with the host or coordinator.',
    ],
    acknowledgment:
      'I understand private events require discretion, strict access control, and respect for client privacy.',
  },
  event: {
    title: 'Other events',
    summary:
      'General event security assignments for venues or functions that do not fall into another category. Duties vary depending on the client\'s specific needs.',
    expectations: [
      'Review the assignment details carefully before accepting.',
      'Duties may include access control, crowd management, patrols, customer service, or asset protection.',
      'Adapt to changing conditions and follow supervisor instructions.',
      'Observe, document, and report incidents accurately.',
      'Maintain professionalism throughout the assignment.',
      'Represent Signature Security Specialist positively at all times.',
      'Ask clarifying questions in job chat if venue scope or post orders are unclear.',
    ],
    beforeAccepting: [
      'Read all post orders before arriving.',
      'Verify equipment and uniform requirements.',
      'Contact dispatch if any assignment information is unclear.',
      'Confirm start time, entry point, and on-site contact before travel.',
    ],
    acknowledgment:
      'I understand general event posts require careful review of each listing and clear communication before acceptance.',
  },
  'foot-patrol': {
    title: 'Foot patrol',
    summary:
      'Provide highly visible on-foot patrol services designed to deter crime, identify hazards, and protect client property through regular walking inspections and documentation.',
    expectations: [
      'Complete scheduled foot patrols according to post orders.',
      'Inspect buildings, parking lots, gates, fences, and other designated areas on foot.',
      'Report suspicious activity, maintenance issues, safety hazards, or criminal activity immediately.',
      'Complete electronic checkpoints and patrol reports as required.',
      'Maintain communication with dispatch throughout your shift.',
      'Remain alert and vary patrol routines whenever practical.',
      'Secure doors, gates, and windows according to client closing procedures.',
    ],
    beforeAccepting: [
      'Ensure you understand the patrol route and reporting requirements.',
      'Confirm whether the assignment is foot patrol only or includes interior rounds.',
      'Inspect all assigned equipment before beginning your shift.',
      'Confirm checkpoint locations and required photo or scan procedures.',
    ],
    acknowledgment:
      'I understand foot patrol posts require timely rounds, reliable reporting, and consistent communication with dispatch.',
  },
  'vehicle-patrol': {
    title: 'Vehicle patrol',
    summary:
      'Provide mobile patrol services using an approved guard vehicle to deter crime, cover larger sites, and protect client property through scheduled route inspections and documentation.',
    expectations: [
      'Complete scheduled vehicle patrols according to post orders.',
      'Drive assigned routes safely while inspecting perimeters, lots, gates, and other designated areas.',
      'Report suspicious activity, maintenance issues, safety hazards, or criminal activity immediately.',
      'Complete electronic checkpoints and patrol reports as required.',
      'Maintain communication with dispatch throughout your shift.',
      'Keep your approved vehicle roadworthy and follow all traffic laws.',
      'Secure doors, gates, and windows according to client closing procedures.',
    ],
    beforeAccepting: [
      'Ensure you understand the patrol route and reporting requirements.',
      'Confirm your approved vehicle is available and meets post requirements.',
      'Inspect all assigned equipment and vehicle condition before beginning your shift.',
      'Factor in traffic, parking, and fuel when planning your route.',
    ],
    acknowledgment:
      'I understand vehicle patrol posts require a staff-approved vehicle, timely rounds, and consistent communication with dispatch.',
  },
  patrol: {
    title: 'Patrol',
    summary:
      'Provide highly visible mobile or foot patrol services designed to deter crime, identify hazards, and protect client property through regular inspections and documentation.',
    expectations: [
      'Complete scheduled patrols according to post orders.',
      'Inspect buildings, parking lots, gates, fences, and other designated areas.',
      'Report suspicious activity, maintenance issues, safety hazards, or criminal activity immediately.',
      'Complete electronic checkpoints and patrol reports as required.',
      'Maintain communication with dispatch throughout your shift.',
      'Remain alert and vary patrol routines whenever practical.',
      'Secure doors, gates, and windows according to client closing procedures.',
    ],
    beforeAccepting: [
      'Ensure you understand the patrol route and reporting requirements.',
      'Verify whether the assignment is vehicle, bicycle, or foot patrol.',
      'Inspect all assigned equipment before beginning your shift.',
      'Confirm checkpoint locations and required photo or scan procedures.',
    ],
    acknowledgment:
      'I understand patrol posts require timely rounds, reliable reporting, and consistent communication with dispatch.',
  },
  construction: {
    title: 'Construction site',
    summary:
      'Provide security services for active and inactive construction sites to help prevent theft, vandalism, trespassing, and unauthorized access. Construction environments change frequently, requiring officers to remain alert and aware of new hazards throughout every shift.',
    expectations: [
      'Monitor assigned entrances, gates, fencing, and restricted work areas.',
      'Verify that only authorized personnel, contractors, and vendors enter the property.',
      'Conduct routine patrols of buildings, equipment storage areas, vehicles, and material yards.',
      'Watch for theft, vandalism, suspicious activity, fire hazards, and unsafe conditions.',
      'Document unusual activity and report incidents immediately.',
      'Follow all site-specific safety rules while remaining aware of heavy equipment and changing work conditions.',
      'Log contractor sign-in and sign-out when required by post orders.',
    ],
    beforeAccepting: [
      'Review the site map, patrol schedule, and access procedures.',
      'Wear all required safety equipment and the approved uniform.',
      'Be prepared to patrol uneven terrain and work outdoors.',
      'Confirm whether hot work, fire watch, or after-hours access rules apply.',
    ],
    acknowledgment:
      'I understand construction posts focus on access control, hazard awareness, and asset protection.',
  },
  'fire-watch': {
    title: 'Fire watch',
    summary:
      'Provide continuous fire watch services when fire protection systems are impaired, under maintenance, or when required during welding, cutting, or other hot work operations. These assignments require constant attention and accurate documentation.',
    expectations: [
      'Continuously monitor assigned areas for smoke, fire, sparks, or hazardous conditions.',
      'Maintain required fire watch logs throughout the assignment.',
      'Immediately report any signs of fire or emergency to emergency services, dispatch, and the client.',
      'Conduct patrols as required without leaving your assigned coverage area unattended.',
      'Understand evacuation routes and emergency procedures before beginning your shift.',
      'Remain attentive throughout the assignment without unnecessary distractions.',
      'Know extinguisher locations and alarm activation procedures for your assigned area.',
    ],
    beforeAccepting: [
      'Review fire watch procedures provided for the assignment.',
      'Understand the emergency notification process.',
      'Be prepared for continuous observation throughout the entire shift.',
      'Confirm whether the post is stationary, roving, or tied to specific hot work activity.',
    ],
    acknowledgment:
      'I understand fire watch posts require continuous attention, documented logs, and immediate emergency reporting.',
  },
  'standing-guard': {
    title: 'Standing guard',
    summary:
      'Provide fixed-post security at entrances, reception areas, office buildings, residential communities, schools, healthcare facilities, and other controlled access locations. Standing guard assignments emphasize visibility, professionalism, and customer service.',
    expectations: [
      'Remain at your assigned post unless relieved or instructed otherwise.',
      'Verify visitors, employees, vendors, and deliveries according to site procedures.',
      'Monitor entrances, exits, cameras, and surrounding activity when assigned.',
      'Observe and report suspicious behavior, policy violations, and safety concerns.',
      'Assist visitors while maintaining professional customer service.',
      'Complete visitor logs, access records, and incident reports accurately.',
      'Conduct periodic checks of adjacent areas when permitted without abandoning your post.',
    ],
    beforeAccepting: [
      'Review all post orders and site procedures.',
      'Maintain a clean, professional appearance.',
      'Expect extended periods of standing with limited movement.',
      'Confirm relief schedule and escalation contacts before your shift begins.',
    ],
    acknowledgment:
      'I understand standing posts require sustained focus at a fixed location and consistent access control.',
  },
  bodyguard: {
    title: 'Executive protection',
    summary:
      'Provide executive protection support for executives, VIPs, celebrities, government officials, or other protected individuals. These assignments require exceptional professionalism, confidentiality, and situational awareness.',
    expectations: [
      'Assist with access control, perimeter security, route observation, and protective movements.',
      'Maintain awareness of your surroundings and identify potential threats early.',
      'Follow instructions from the lead protection officer or supervisor.',
      'Maintain strict confidentiality regarding clients, schedules, locations, and assignments.',
      'Communicate professionally with team members while avoiding unnecessary attention.',
      'Immediately report any concerns or incidents through the proper chain of command.',
      'Dress and conduct yourself to blend with the environment when requested by the client.',
    ],
    beforeAccepting: [
      'Verify that you possess any required certifications or specialized training.',
      'Review the assignment itinerary and client expectations.',
      'Understand that discretion and confidentiality are essential.',
      'Confirm team roles, communication channels, and emergency protocols before the detail.',
    ],
    acknowledgment:
      'I understand executive protection requires discretion, advance coordination, and strict confidentiality.',
  },
  'armed-escort': {
    title: 'Armed escort',
    summary:
      'Provide armed security for the transportation of high-value property, sensitive materials, or protected individuals where an increased level of security is required. Officers assigned to these details must meet all legal and company qualification requirements.',
    expectations: [
      'Follow established escort routes, communication plans, and operational procedures.',
      'Maintain continuous situational awareness throughout the assignment.',
      'Protect assigned assets while minimizing unnecessary attention.',
      'Coordinate with dispatch, supervisors, and escort team members.',
      'Follow all company policies, California laws, and use-of-force requirements.',
      'Complete all required reports following the assignment.',
      'Maintain valid BSIS exposed firearm permit and carry credentials on shift.',
    ],
    beforeAccepting: [
      'Only accept if you possess all required permits, certifications, and company approvals.',
      'Verify your assigned equipment before reporting.',
      'Review all assignment instructions and emergency procedures.',
      'Decline posts that exceed your training, equipment, or legal authorization.',
    ],
    acknowledgment:
      'I understand armed escort posts require current firearm credentials, route briefings, and strict compliance with law and policy.',
  },
  'asset-protection': {
    title: 'Property security',
    summary:
      'Provide security services for office buildings, retail centers, apartment communities, industrial facilities, warehouses, commercial properties, and other private locations. Officers serve as a visible deterrent while protecting people, property, and client assets.',
    expectations: [
      'Conduct routine patrols of buildings, parking lots, common areas, and perimeter locations.',
      'Monitor entrances, exits, and restricted areas for unauthorized access.',
      'Observe and report suspicious activity, maintenance concerns, safety hazards, and criminal behavior.',
      'Assist tenants, employees, customers, visitors, and contractors professionally.',
      'Respond to alarms, disturbances, and client requests according to post orders.',
      'Complete patrol logs, incident reports, and required documentation accurately.',
      'Follow opening and closing procedures and alarm handling instructions exactly.',
    ],
    beforeAccepting: [
      'Review the property\'s post orders and patrol requirements.',
      'Understand access control procedures and emergency contacts.',
      'Maintain a visible and professional presence throughout the assignment.',
      'Confirm whether the post includes vehicle patrol, foot patrol, or a fixed access point.',
    ],
    acknowledgment:
      'I understand property posts require consistent access control, patrol discipline, and accurate reporting.',
  },
  other: {
    title: 'Custom request',
    summary:
      'Some clients require specialized security services that fall outside our standard assignment categories. These assignments may involve unique responsibilities, specialized equipment, additional certifications, or customized client procedures. Every custom assignment should be reviewed carefully before acceptance.',
    expectations: [
      'Carefully review all assignment details, post orders, and client instructions.',
      'Duties may include access control, executive support, inspections, escorts, event security, or other specialized responsibilities.',
      'Additional licenses, certifications, uniforms, or equipment may be required.',
      'Follow all company policies while adapting to client-specific operational requirements.',
      'Maintain clear communication with dispatch and supervisors.',
      'Document all incidents and activities according to company reporting standards.',
      'Ask questions in job chat before accepting if scope, pay, or equipment is unclear.',
    ],
    beforeAccepting: [
      'Confirm that you meet every listed requirement for the assignment.',
      'Contact dispatch or management if any instructions are unclear.',
      'Only accept the assignment if you fully understand your responsibilities and possess the required qualifications.',
      'Decline posts that do not match your training, licensing, or comfort level.',
    ],
    acknowledgment:
      'I understand custom posts require extra review, clear communication, and confirmation of all requirements before acceptance.',
  },
};

export function normalizeJobTypeOnboarding(
  value: Partial<Record<string, string | { completedAt?: string }>> | null | undefined
): Partial<Record<JobType, string>> {
  if (!value || typeof value !== 'object') return {};
  const next: Partial<Record<JobType, string>> = {};
  for (const [key, raw] of Object.entries(value)) {
    const completedAt =
      typeof raw === 'string'
        ? raw
        : raw && typeof raw === 'object' && typeof raw.completedAt === 'string'
          ? raw.completedAt
          : '';
    if (completedAt.trim()) {
      next[key as JobType] = completedAt.trim();
    }
  }
  return next;
}

export function isJobTypeOnboarded(
  guard: Pick<SecurityGuard, 'jobTypeOnboarding'>,
  jobType: JobType
): boolean {
  return onboardingKeysForJobType(jobType).some((key) => Boolean(guard.jobTypeOnboarding?.[key]));
}

function onboardingKeysForJobType(jobType: JobType): JobType[] {
  switch (jobType) {
    case 'vehicle-patrol':
    case 'patrol':
      return ['vehicle-patrol', 'patrol'];
    case 'foot-patrol':
      return ['foot-patrol'];
    default:
      return [jobType];
  }
}

export function jobTypeOnboardingContent(jobType: JobType): JobTypeOnboardingContent {
  return JOB_TYPE_ONBOARDING[jobType];
}

/** Full text read aloud for a job-type onboarding briefing. */
export function jobTypeOnboardingSpeechText(jobType: JobType): string {
  const content = JOB_TYPE_ONBOARDING[jobType];
  const sections = [
    content.title,
    content.summary,
    'What to expect.',
    ...content.expectations,
    'Before accepting.',
    ...content.beforeAccepting,
  ];
  return sections.join('. ').replace(/\.\s*\./g, '.');
}

export function countOnboardingWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Required dwell time before a guard may complete onboarding (ms). */
export function jobTypeOnboardingRequiredMs(jobType: JobType): number {
  const speechText = jobTypeOnboardingSpeechText(jobType);
  const wordCount = countOnboardingWords(speechText);
  const seconds = Math.max(ONBOARDING_MIN_READ_SECONDS, Math.ceil((wordCount / ONBOARDING_READ_WPM) * 60));
  return seconds * 1000;
}

export function formatOnboardingRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
