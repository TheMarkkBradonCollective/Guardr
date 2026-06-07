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
  }
];

export const INITIAL_REQUESTS: SecurityRequest[] = [];

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
