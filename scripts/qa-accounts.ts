/**
 * Signed-in accounts for the QA Neon branch.
 *
 * The default password is for that branch only. Override it with QA_SEED_PASSWORD.
 * The seed refuses the production branch and the 2026-11-09 pre-wipe backup.
 */
export const QA_SEED_PASSWORD_DEFAULT = 'QaSeed-2026!';

export function qaSeedPassword(): string {
  const fromEnv = process.env.QA_SEED_PASSWORD?.trim();
  return fromEnv || QA_SEED_PASSWORD_DEFAULT;
}

export type QaAccountKind = 'guard' | 'client' | 'staff';

export interface QaAccount {
  id: string;
  kind: QaAccountKind;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  /** Browser sign-in screen. */
  signInPath: string;
  /** Heading that proves this account, not a generic shell. */
  heading: RegExp;
  clientType?: 'personal' | 'business';
  staffRole?: 'Support' | 'Moderator' | 'Administrator' | 'Manager' | 'Director' | 'Founder';
  badgeNumber?: string;
  companyName?: string;
}

export const QA_ACCOUNTS: QaAccount[] = [
  {
    id: 'qa-guard',
    kind: 'guard',
    email: 'qa.guard@guardr.test',
    name: 'Casey Guard',
    firstName: 'Casey',
    lastName: 'Guard',
    badgeNumber: 'IC-9001',
    signInPath: '/?auth=sign-in&ar=guard',
    heading: /Welcome back, Casey/,
  },
  {
    id: 'qa-client-personal',
    kind: 'client',
    email: 'qa.client.personal@guardr.test',
    name: 'Quinn Personal',
    firstName: 'Quinn',
    lastName: 'Personal',
    clientType: 'personal',
    companyName: '',
    signInPath: '/?auth=sign-in&ar=client&ct=personal',
    heading: /Welcome back, Quinn/,
  },
  {
    id: 'qa-client-business',
    kind: 'client',
    email: 'qa.client.business@guardr.test',
    name: 'Blake Business',
    firstName: 'Blake',
    lastName: 'Business',
    clientType: 'business',
    companyName: 'QA Business Co',
    signInPath: '/?auth=sign-in&ar=client&ct=business',
    heading: /Welcome back, Blake/,
  },
  {
    id: 'qa-staff-support',
    kind: 'staff',
    email: 'qa.staff.support@guardr.test',
    name: 'Avery Support',
    firstName: 'Avery',
    lastName: 'Support',
    staffRole: 'Support',
    badgeNumber: 'QA-SUPPORT',
    signInPath: '/?auth=sign-in&ar=staff',
    heading: /Support overview/,
  },
  {
    id: 'qa-staff-moderator',
    kind: 'staff',
    email: 'qa.staff.moderator@guardr.test',
    name: 'Riley Moderator',
    firstName: 'Riley',
    lastName: 'Moderator',
    staffRole: 'Moderator',
    badgeNumber: 'QA-MOD',
    signInPath: '/?auth=sign-in&ar=staff',
    heading: /Moderator overview/,
  },
  {
    id: 'qa-staff-administrator',
    kind: 'staff',
    email: 'qa.staff.administrator@guardr.test',
    name: 'Jordan Administrator',
    firstName: 'Jordan',
    lastName: 'Administrator',
    staffRole: 'Administrator',
    badgeNumber: 'QA-ADMIN',
    signInPath: '/?auth=sign-in&ar=staff',
    heading: /Administrator overview/,
  },
  {
    id: 'qa-staff-manager',
    kind: 'staff',
    email: 'qa.staff.manager@guardr.test',
    name: 'Morgan Manager',
    firstName: 'Morgan',
    lastName: 'Manager',
    staffRole: 'Manager',
    badgeNumber: 'QA-MANAGER',
    signInPath: '/?auth=sign-in&ar=staff',
    heading: /Manager overview/,
  },
  {
    id: 'qa-staff-director',
    kind: 'staff',
    email: 'qa.staff.director@guardr.test',
    name: 'Parker Director',
    firstName: 'Parker',
    lastName: 'Director',
    staffRole: 'Director',
    badgeNumber: 'QA-DIRECTOR',
    signInPath: '/?auth=sign-in&ar=staff',
    heading: /Director overview/,
  },
  {
    id: 'qa-staff-founder',
    kind: 'staff',
    email: 'qa.staff.founder@guardr.test',
    name: 'Skyler Founder',
    firstName: 'Skyler',
    lastName: 'Founder',
    staffRole: 'Founder',
    badgeNumber: 'QA-FOUNDER',
    signInPath: '/?auth=sign-in&ar=staff',
    heading: /Founder overview/,
  },
];
