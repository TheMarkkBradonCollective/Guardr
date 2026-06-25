import {
  LEGAL_ENTITY_NAME,
  SITE_DOMAIN,
  SITE_NAME,
  SITE_URL,
} from './siteConfig';

export type LegalPageId =
  | 'terms'
  | 'privacy'
  | 'ica'
  | 'client-agreement'
  | 'guard-conduct';

/** Bump when document text changes materially — triggers re-acceptance. */
export const CURRENT_LEGAL_VERSIONS: Record<LegalPageId, string> = {
  terms: '2026-06-22',
  privacy: '2026-06-22',
  ica: '2026-06-25',
  'client-agreement': '2026-06-25',
  'guard-conduct': '2026-06-25',
};

export function requiredLegalDocumentsForRole(role: 'guard' | 'client' | 'staff'): LegalPageId[] {
  const shared: LegalPageId[] = ['terms', 'privacy'];
  if (role === 'guard') return [...shared, 'ica', 'guard-conduct'];
  if (role === 'client') return [...shared, 'client-agreement'];
  return shared;
}

export function legalDocumentLabel(documentId: LegalPageId): string {
  return LEGAL_DOCUMENTS[documentId]?.title ?? documentId;
}

export interface LegalSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalDocument {
  id: LegalPageId;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

const PLATFORM_ROLE = `${LEGAL_ENTITY_NAME} ("${SITE_NAME}," "we," "us," or "our")`;

export const LEGAL_DISCLAIMER_SHORT =
  `${SITE_NAME} is a technology marketplace operated by ${LEGAL_ENTITY_NAME}. We do not provide security services, employ guards, or act as a private patrol operator or staffing agency.`;

export const LEGAL_TERMS: LegalDocument = {
  id: 'terms',
  title: 'Terms of Service',
  updated: 'June 22, 2026',
  intro: `These Terms of Service ("Terms") govern access to and use of the ${SITE_NAME} websites, mobile applications, and related services (collectively, the "Platform") operated by ${PLATFORM_ROLE}. By creating an account or using the Platform, you agree to these Terms.`,
  sections: [
    {
      title: '1. Platform only — not a security company',
      paragraphs: [
        `${SITE_NAME} is an online technology marketplace and coordination layer. We help clients discover, request, message, and pay independent security professionals ("Guards") for specific jobs. We do not furnish guards, dispatch armed personnel, or perform security work ourselves.`,
        `We are not a private patrol operator (PPO), proprietary private security employer, security guard employer, detective agency, or staffing agency. Nothing on the Platform should be interpreted as us holding ourselves out as a licensed security services provider.`,
        `Security services are performed by independent Guards or, where applicable, by licensed security companies with which Guards are affiliated. Guards—not ${SITE_NAME}—are responsible for how services are performed on site.`,
      ],
    },
    {
      title: '2. Independent professionals and direct engagements',
      paragraphs: [
        `Guards using the Platform are independent businesses or contractors, not employees, agents, partners, or franchisees of ${LEGAL_ENTITY_NAME}. Clients who post jobs are not employers of ${LEGAL_ENTITY_NAME}.`,
        `When a Client and Guard agree to a job through the Platform, they enter into a direct service arrangement with each other. ${SITE_NAME} facilitates discovery, booking tools, messaging, payments, and recordkeeping, but is not a party to the underlying security services contract unless we expressly say otherwise in writing.`,
      ],
      bullets: [
        'Guards choose which jobs to accept or decline.',
        'Guards set or propose their rates and availability.',
        'Guards remain responsible for their own licensing, insurance, taxes, equipment, and legal compliance.',
        'Clients remain responsible for site access, instructions, lawful use of services, and payment for accepted work.',
      ],
    },
    {
      title: '3. Credential review — not a guarantee',
      paragraphs: [
        `The Platform may allow Guards to upload licenses, registrations, training certificates, and identity documents, and may allow platform staff to review those materials for account eligibility. Any review is administrative only.`,
        `We do not guarantee that any Guard is licensed, insured, qualified, background-checked to your standards, or suitable for a particular assignment. Clients must perform their own due diligence before relying on any Guard.`,
      ],
    },
    {
      title: '4. No outcome or safety guarantee',
      paragraphs: [
        `Security work involves inherent risk. ${SITE_NAME} does not guarantee crime prevention, injury prevention, property protection, response times, staffing coverage, or any particular result.`,
        `The Platform is provided on an "as is" and "as available" basis to the maximum extent permitted by law. We disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.`,
      ],
    },
    {
      title: '5. Payments and platform fees',
      paragraphs: [
        `Fees, rates, deposits, and payout timing are shown in the product before you confirm a transaction, subject to change with notice where required. We may collect payments as a limited payment agent or marketplace facilitator on behalf of Guards and charge a platform fee for use of the Platform.`,
        `Payment processing may be handled by third-party providers such as Stripe. Collection of payment through the Platform does not make a Guard an employee of ${LEGAL_ENTITY_NAME} or create an agency relationship between ${LEGAL_ENTITY_NAME} and any user.`,
      ],
    },
    {
      title: '6. Acceptable use',
      paragraphs: [
        `You may not use the Platform for unlawful surveillance, harassment, stalking, discrimination, off-books employment in violation of licensing law, weapons violations, or any purpose prohibited by applicable law. We may suspend or terminate accounts that create legal, safety, or fraud risk.`,
      ],
    },
    {
      title: '7. Limitation of liability',
      paragraphs: [
        `To the maximum extent permitted by law, ${LEGAL_ENTITY_NAME} and its officers, directors, members, employees, and contractors are not liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, revenue, data, or goodwill.`,
        `We are not liable for the acts, omissions, negligence, misconduct, or failure to perform of any Guard, Client, or third party. Our total aggregate liability arising out of or relating to the Platform will not exceed the greater of (a) one hundred U.S. dollars ($100) or (b) the platform fees you paid to us for the transaction giving rise to the claim during the twelve (12) months before the event.`,
      ],
    },
    {
      title: '8. Indemnification',
      paragraphs: [
        `You agree to defend, indemnify, and hold harmless ${LEGAL_ENTITY_NAME} from claims, damages, losses, and expenses (including reasonable attorneys' fees) arising out of your use of the Platform, your security services (if you are a Guard), your hiring decisions (if you are a Client), your violation of law, or your breach of these Terms.`,
      ],
    },
    {
      title: '9. Regulatory compliance',
      paragraphs: [
        `Private security is heavily regulated. Guards must maintain all licenses, registrations, permits, and insurance required in each jurisdiction where they work. Clients must use licensed personnel where required by law and may not use the Platform to evade licensing obligations.`,
        `Operating a marketplace that connects security personnel may itself be regulated in some jurisdictions. You are responsible for compliance with laws applicable to you. These Terms do not constitute legal advice.`,
      ],
    },
    {
      title: '10. Disputes, arbitration, and governing law',
      paragraphs: [
        `Except where prohibited by law, disputes arising out of these Terms or the Platform will be resolved by binding individual arbitration, and not in a class action. You may opt out of arbitration within thirty (30) days of account creation by emailing legal@${SITE_DOMAIN}.`,
        `These Terms are governed by the laws of the State of California, without regard to conflict-of-law rules, except that mandatory consumer protections in your home jurisdiction remain unaffected where applicable.`,
      ],
    },
    {
      title: '11. Changes and contact',
      paragraphs: [
        `We may update these Terms from time to time. Material changes will be posted on the Platform with an updated date. Continued use after changes become effective constitutes acceptance.`,
        `Questions about these Terms: legal@${SITE_DOMAIN}. Mailing address available on request for registered users and regulators.`,
        `Website: ${SITE_URL}`,
      ],
    },
  ],
};

export const LEGAL_PRIVACY: LegalDocument = {
  id: 'privacy',
  title: 'Privacy Policy',
  updated: 'June 22, 2026',
  intro: `This Privacy Policy explains how ${PLATFORM_ROLE} collects, uses, and shares information when you use the Platform.`,
  sections: [
    {
      title: '1. Information we collect',
      paragraphs: ['We may collect the following categories of information:'],
      bullets: [
        'Account information such as name, email, phone, company name, and role.',
        'Profile and credential information uploaded by Guards, including licenses, certifications, identity documents, and work history.',
        'Job, messaging, support, audit, and incident-report content created through the Platform.',
        'Location and device data when you enable maps, check-ins, patrol tools, or push notifications.',
        'Payment-related metadata processed by our payment partners. We do not store full card numbers.',
        'Technical logs such as IP address, browser type, app version, and security events.',
      ],
    },
    {
      title: '2. How we use information',
      paragraphs: ['We use information to operate the marketplace, including to:'],
      bullets: [
        'Create and secure accounts, authenticate users, and provide customer support.',
        'Display jobs, profiles, maps, messaging, approvals, and payment flows.',
        'Review uploaded credentials for platform eligibility where applicable.',
        'Send service, security, and transactional notifications, including push alerts you opt into.',
        'Detect fraud, abuse, and violations of our Terms.',
        'Comply with law, respond to lawful requests, and enforce our agreements.',
      ],
    },
    {
      title: '3. How we share information',
      paragraphs: [
        'We share information only as needed to run the Platform:',
      ],
      bullets: [
        'Between Clients and Guards when you request, accept, or perform a job.',
        'With service providers such as hosting, analytics, identity verification, and payment processors under contractual safeguards.',
        'With platform staff who need access to administer approvals, support, and safety processes.',
        'When required by law, subpoena, court order, or to protect rights, safety, and integrity of users.',
        'In connection with a merger, acquisition, financing, or asset sale, subject to continuing protections.',
      ],
    },
    {
      title: '4. Retention and security',
      paragraphs: [
        'We retain information for as long as your account is active and as needed to provide the Platform, resolve disputes, enforce agreements, and meet legal obligations. Credential images and job records may be retained according to state licensing and business record requirements.',
        'We use administrative, technical, and organizational safeguards appropriate to the sensitivity of the data. No method of transmission or storage is completely secure.',
      ],
    },
    {
      title: '5. Your choices',
      paragraphs: [
        'You may update much of your profile information in the app. You may disable push notifications in device or account settings where available.',
        'Depending on your jurisdiction, you may have rights to access, correct, delete, or export personal information, or to object to certain processing. Contact privacy@' +
          SITE_DOMAIN +
          ' to exercise those rights.',
      ],
    },
    {
      title: '6. Children and changes',
      paragraphs: [
        'The Platform is not directed to children under 18, and we do not knowingly collect their personal information.',
        'We may update this Privacy Policy from time to time. The "Updated" date above will change when we do. Material changes will be posted on the Platform.',
        'Privacy questions: privacy@' + SITE_DOMAIN,
      ],
    },
  ],
};

export const LEGAL_ICA: LegalDocument = {
  id: 'ica',
  title: 'Independent Contractor Agreement',
  updated: 'June 25, 2026',
  intro: `This Independent Contractor Agreement ("ICA") is between ${LEGAL_ENTITY_NAME} ("${SITE_NAME}") and you, an independent security professional using the Platform. This ICA supplements the Terms of Service and governs your relationship with ${SITE_NAME} only — not your relationship with Clients.`,
  sections: [
    {
      title: '1. Independent contractor status',
      paragraphs: [
        `You agree you are an independent contractor, not an employee, agent, joint venturer, or partner of ${LEGAL_ENTITY_NAME}. You are free to accept or decline jobs offered through the Platform, set your availability, and maintain other clients outside the Platform, subject to lawful scheduling commitments you accept.`,
        `Nothing in this ICA creates an employment relationship under California law, including the ABC test or any similar worker-classification standard. You are responsible for your own taxes, withholdings, benefits, business expenses, and insurance.`,
      ],
    },
    {
      title: '2. Your business responsibilities',
      bullets: [
        'Maintain all BSIS and other licenses, registrations, and training required for each assignment.',
        'Maintain general liability insurance and any other coverage required by law or the assignment.',
        'Supply your own equipment unless a Client agrees in writing to provide site-specific items.',
        'Perform services in a professional manner consistent with applicable law and the Guard Code of Conduct.',
        'Accurately represent your credentials and promptly update expired documents.',
      ],
      paragraphs: [],
    },
    {
      title: '3. Platform services',
      paragraphs: [
        `${SITE_NAME} provides technology tools only: profiles, job discovery, messaging, scheduling aids, credential upload, and payment facilitation. ${SITE_NAME} does not supervise how you perform security work on site and is not your security services employer.`,
      ],
    },
    {
      title: '4. Payments',
      paragraphs: [
        `You authorize ${SITE_NAME} to collect payments from Clients as a limited payment facilitator and to remit your share after applicable platform fees, chargebacks, or lawful holds. Payout timing is shown in the product before you accept work.`,
      ],
    },
    {
      title: '5. Term and termination',
      paragraphs: [
        `Either party may end Platform access as described in the Terms. Sections on contractor status, indemnification, and dispute resolution survive termination.`,
      ],
    },
  ],
};

export const LEGAL_CLIENT_AGREEMENT: LegalDocument = {
  id: 'client-agreement',
  title: 'Client Platform Agreement',
  updated: 'June 25, 2026',
  intro: `This Client Platform Agreement is between ${LEGAL_ENTITY_NAME} ("${SITE_NAME}") and you, a Client using the Platform to request security coverage from independent professionals.`,
  sections: [
    {
      title: '1. Direct engagements with guards',
      paragraphs: [
        `When you approve a Guard for a job, you enter into a direct service arrangement with that Guard for that assignment. ${SITE_NAME} is not the provider of security services and does not employ the Guard.`,
        `You are responsible for lawful site instructions, access, and payment for accepted work.`,
      ],
    },
    {
      title: '2. No staffing or outcome guarantee',
      paragraphs: [
        `${SITE_NAME} does not guarantee that any Guard will accept your job, arrive on time, or achieve a particular security outcome. Credential review on the Platform is administrative eligibility only, not a warranty of suitability.`,
      ],
    },
    {
      title: '3. Due diligence',
      bullets: [
        'Review Guard profiles, credentials, and ratings before approving an assignment.',
        'Confirm armed, medical, or specialty requirements match your site needs.',
        'Do not treat Guards as your employees or require unlawful off-platform arrangements that evade licensing law.',
      ],
      paragraphs: [],
    },
    {
      title: '4. Insurance and liability',
      paragraphs: [
        `Guards represent they maintain insurance required for their work. ${SITE_NAME}'s liability is limited as stated in the Terms. You remain responsible for your own property, operations, and hiring decisions.`,
      ],
    },
  ],
};

export const LEGAL_GUARD_CONDUCT: LegalDocument = {
  id: 'guard-conduct',
  title: 'Guard Code of Conduct',
  updated: 'June 25, 2026',
  intro: `This Code of Conduct applies to independent security professionals using ${SITE_NAME}. Violations may result in account suspension.`,
  sections: [
    {
      title: '1. Professional standards',
      bullets: [
        'Arrive on time, in appropriate attire, and prepared for the posted assignment.',
        'Follow lawful post orders and site instructions from the Client for the specific job.',
        'Use force only as permitted by law and your training.',
        'Do not work under the influence of alcohol or controlled substances.',
        'Report incidents promptly through Platform tools and to appropriate authorities when required.',
      ],
      paragraphs: [],
    },
    {
      title: '2. Honesty and compliance',
      bullets: [
        'Do not falsify credentials, hours, reports, or location check-ins.',
        'Do not misrepresent affiliation with Guardr or the Client as an employment relationship.',
        'Maintain confidentiality of sensitive site information except as required for safety or law.',
      ],
      paragraphs: [],
    },
    {
      title: '3. Marketplace integrity',
      paragraphs: [
        'Do not circumvent the Platform for payments on jobs discovered through Guardr without written permission. Do not harass, discriminate against, or retaliate against Clients or other users.',
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS: Record<LegalPageId, LegalDocument> = {
  terms: LEGAL_TERMS,
  privacy: LEGAL_PRIVACY,
  ica: LEGAL_ICA,
  'client-agreement': LEGAL_CLIENT_AGREEMENT,
  'guard-conduct': LEGAL_GUARD_CONDUCT,
};

export const LEGAL_PAGE_SIBLINGS: Partial<Record<LegalPageId, LegalPageId[]>> = {
  terms: ['privacy', 'ica', 'client-agreement'],
  privacy: ['terms'],
  ica: ['terms', 'guard-conduct'],
  'client-agreement': ['terms'],
  'guard-conduct': ['ica', 'terms'],
};
