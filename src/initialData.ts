import { SecurityGuard, SecurityRequest } from './types';

export const INITIAL_GUARDS: SecurityGuard[] = [
  {
    id: 'guard-1',
    name: 'Alex Mercer',
    email: 'alex.mercer@sigsec.com',
    badgeNumber: 'S-77291',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', // Actually modern cool portrait
    phone: '+1 (555) 432-8819',
    bio: 'Ex-Military Police Sergeant with 8+ years in private diplomatic escort services and close personal protection. Specialized in high-risk threat assessment and perimeter setup.',
    isArmed: true,
    backgroundChecked: true,
    verified: true,
    rating: 4.9,
    jobsCompleted: 34,
    certifications: [
      {
        id: 'cert-1-1',
        name: 'State Armed Security Officer Guard Card',
        issuer: 'Bureau of Security and Investigative Services',
        number: 'G-228192-A',
        status: 'verified',
        issueDate: '2024-01-15',
        expiryDate: '2027-01-15'
      },
      {
        id: 'cert-1-2',
        name: 'Tactical Combat Casualty Care (TCCC)',
        issuer: 'NAEMT Association',
        number: 'T-881-MS',
        status: 'verified',
        issueDate: '2025-05-10',
        expiryDate: '2028-05-10'
      }
    ],
    experience: [
      {
        id: 'exp-1-1',
        title: 'Tactical Team Lead',
        company: 'Vanguard Security Services',
        period: '2023 - Present',
        description: 'Lead armed vehicle transport team and VIP close protection details for visiting trade ministers.'
      },
      {
        id: 'exp-1-2',
        title: 'Security Operator',
        company: 'Blackwood Close Protection',
        period: '2020 - 2023',
        description: 'Monitored private safehouse perimeters and acted as responsive rapid driver for high-net-worth clients.'
      }
    ],
    hourlyRateRequirement: 45,
    isStaff: true,
    userStatus: 'active'
  },
  {
    id: 'guard-2',
    name: 'Sarah Jenkins',
    email: 's.jenkins@safety.io',
    badgeNumber: 'S-88102',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 198-4422',
    bio: 'Paramedic certified first responder and executive protection specialist. Focuses on tech-conference security and luxury retail safety logistics.',
    isArmed: false,
    backgroundChecked: true,
    verified: true,
    rating: 4.8,
    jobsCompleted: 19,
    certifications: [
      {
        id: 'cert-2-1',
        name: 'Vessel / Event Security Officer (VSO)',
        issuer: 'U.S. Maritime Guard Academy',
        number: 'V-990-21',
        status: 'verified',
        issueDate: '2023-08-12',
        expiryDate: '2026-08-12'
      },
      {
        id: 'cert-2-2',
        name: 'Advanced Cardiac Life Support (ACLS)',
        issuer: 'American Heart Association',
        number: 'AHA-9938210',
        status: 'verified',
        issueDate: '2025-02-01',
        expiryDate: '2027-02-01'
      }
    ],
    experience: [
      {
        id: 'exp-2-1',
        title: 'High-Value Patrol Agent',
        company: 'Securitas International',
        period: '2022 - 2024',
        description: 'Managed asset sweeps and executive escorts inside high-luxury department stores and museums.'
      }
    ],
    hourlyRateRequirement: 38,
    isStaff: false,
    userStatus: 'active'
  },
  {
    id: 'guard-3',
    name: 'Liam Vance',
    email: 'liam.vance@gmail.com',
    badgeNumber: 'S-22109',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 887-2104',
    bio: 'Freshly licensed security personnel with physical training in crowd control. Highly energetic and seeking patrols.',
    isArmed: false,
    backgroundChecked: true,
    verified: false, // Starts as NOT VERIFIED
    rating: 0.0,
    jobsCompleted: 0,
    certifications: [
      {
        id: 'cert-3-1',
        name: 'State Unarmed Guard Card License',
        issuer: 'Dept of Public Safety',
        number: 'U-77312-X',
        status: 'pending', // Pending verification
        issueDate: '2026-04-10',
        expiryDate: '2028-04-10'
      }
    ],
    experience: [
      {
        id: 'exp-3-1',
        title: 'Loss Prevention Specialist',
        company: 'Target Retail Group',
        period: '2025 - 2026',
        description: 'Identified shoplifting coordinates, filed incident reports, and conducted crowd guidance during seasonal sales.'
      }
    ],
    hourlyRateRequirement: 25,
    isStaff: false,
    userStatus: 'active'
  }
];

export const INITIAL_REQUESTS: SecurityRequest[] = [
  {
    id: 'req-1',
    title: 'High-Profile Luxury Fashion Gala Security Detail',
    description: 'Provide unarmed security specialists for access control, VIP arrivals, and red-carpet crowd logistics. Business professional suits required. Excellent posture and service communication are mandatory.',
    clientId: 'client-1',
    clientName: 'Sartorial Vanguard Group',
    clientLogo: 'SV',
    location: 'Metropolitan Art Pavilion, New York',
    type: 'event',
    armedRequired: false,
    startDate: '2026-06-15T18:00:00Z',
    endDate: '2026-06-16T01:00:00Z',
    durationHours: 7,
    hourlyRate: 50,
    estimatedPayout: 350,
    status: 'open',
    assignedGuardId: null,
    requiredCertifications: ['Vessel / Event Security Officer (VSO)', 'First Aid & CPR'],
    applicants: []
  },
  {
    id: 'req-2',
    title: 'Executive Armed Escort & Asset Protection',
    description: 'Armed escort needed to transport high-value jewelry artifacts from local vaults to auction house. Active concealed weapons permit, armed field certification, and military or high-risk private security background are strictly mandatory.',
    clientId: 'client-2',
    clientName: 'Aurelia Fine Gems',
    clientLogo: 'AG',
    location: 'Sotheby Vaults to Midtown Center',
    type: 'armed-escort',
    armedRequired: true,
    startDate: '2026-06-18T10:00:00Z',
    endDate: '2026-06-18T14:00:00Z',
    durationHours: 4,
    hourlyRate: 75,
    estimatedPayout: 300,
    status: 'open',
    assignedGuardId: null,
    requiredCertifications: ['State Armed Security Officer Guard Card', 'Tactical Combat Casualty Care (TCCC)'],
    applicants: []
  },
  {
    id: 'req-3',
    title: 'Tech Campus Overnight Asset Protection',
    description: 'Conduct vehicle and foot patrols for an offline data depot campus. Safeguard server assets, scan check-ins, and file digital incident sheets.',
    clientId: 'client-3',
    clientName: 'Lumina Systems Inc',
    clientLogo: 'LS',
    location: 'Industrial Park, Building B',
    type: 'patrol',
    armedRequired: false,
    startDate: '2026-06-20T22:00:00Z',
    endDate: '2026-06-21T06:00:00Z',
    durationHours: 8,
    hourlyRate: 35,
    estimatedPayout: 280,
    status: 'assigned',
    assignedGuardId: 'guard-1', // Alex Mercer is pre-assigned to this active job
    requiredCertifications: ['State Unarmed Guard Card License'],
    applicants: ['guard-1']
  }
];

export const PREFAB_CERT_LIST = [
  'State Unarmed Guard Card License',
  'State Armed Security Officer Guard Card',
  'First Aid & CPR / AED',
  'Vessel / Event Security Officer (VSO)',
  'Tactical Combat Casualty Care (TCCC)',
  'Executive Close Protection Certified (ECP)',
  'NRA Professional Range Safety Guard License',
  'Crisis De-escalation & Mental Health First Responder'
];
