export type JobType = 'event' | 'patrol' | 'armed-escort' | 'bodyguard' | 'asset-protection' | 'long-term' | 'other';

export type JobStatus =
  | 'draft'
  | 'pending-review'
  | 'open'
  | 'accepted'
  | 'in-progress'
  | 'completed'
  | 'closed';

export type ReportType =
  | 'daily-activity'
  | 'incident'
  | 'property-damage'
  | 'maintenance'
  | 'trespass';

export interface ShiftReport {
  id: string;
  requestId: string;
  guardId: string;
  type: ReportType;
  notes: string;
  photos: string[];
  attachments: string[];
  submittedAt: string;
}

/** Platform user roles per Guardr spec */
export type PlatformRole = 'client' | 'guard' | 'moderator' | 'administrator' | 'director';

/** @deprecated Use PlatformRole — kept for DB staff_role column mapping */
export type StaffRole = 'Director' | 'Administrator' | 'Moderator';

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  number: string;
  status: 'verified' | 'pending' | 'rejected';
  issueDate: string;
  expiryDate: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  period: string;
  description: string;
}

/** A client account — stored separately from guards */
export interface Client {
  id: string;
  name: string;
  email: string;
  companyName: string;
  phone: string;
  avatar: string;
  totalRequests: number;
  approved?: boolean;
  rating?: number;
  createdAt?: string;
  themePreference?: 'dark' | 'light' | 'grey';
}

export interface SecurityGuard {
  id: string;
  name: string;
  email: string;
  badgeNumber: string;
  avatar: string;
  phone: string;
  bio: string;
  isArmed: boolean;
  backgroundChecked: boolean;
  verified: boolean;
  rating: number;
  jobsCompleted: number;
  certifications: Certification[];
  experience: Experience[];
  hourlyRateRequirement?: number;
  isStaff?: boolean;
  staffRole?: StaffRole;
  userStatus?: 'active' | 'suspended' | 'blocked';
  failedAudits?: number; // Automatic rule: 3 failed uniform audits = suspension
  themePreference?: 'dark' | 'light' | 'grey';
}

export interface SecurityRequest {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  clientLogo: string;
  clientRating?: number;
  siteName?: string;
  address?: string;
  location: string;
  type: JobType;
  armedRequired: boolean;
  guardsNeeded?: number;
  uniformRequirements?: string;
  equipmentRequirements?: string;
  siteInstructions?: string;
  startDate: string;
  endDate: string;
  durationHours: number;
  hourlyRate: number;
  guardPay?: number;
  platformFeePerHour?: number;
  estimatedPayout: number;
  status: JobStatus;
  assignedGuardId: string | null;
  requiredCertifications: string[];
  applicants: string[];
  ratingGiven?: number;
  reviewText?: string;
  // Dynamic Self-Audit Tracker
  checkInAudit?: {
    checkedAt: string;
    uniform: {
      uniformPresent: boolean;
      blackShoes: boolean;
      dutyBelt: boolean;
      nameBadge: boolean;
      professionalAppearance: boolean;
    };
    equipment: {
      radio: boolean;
      flashlight: boolean;
      requiredEquipment: boolean;
    };
    selfieUpload: string;
    gpsVerified: boolean;
    readyForDuty?: boolean;
  };
  midShiftAudits?: Array<{
    checkedAt: string;
    selfie: string;
    uniformVerified: boolean;
    equipmentVerified: boolean;
  }>;
  checkOutAudit?: {
    checkedAt: string;
    completed: boolean;
    noViolations: boolean;
    noEquipmentIssues: boolean;
    endSelfie?: string;
    dailyActivityReport: string;
    incidentReport: {
      hasIncident: boolean;
      incidentType?: string;
      priority?: 'low' | 'medium' | 'high';
      description?: string;
    };
    clientNotes: string;
    attachments?: string[];
  };
  reports?: ShiftReport[];
}

export interface ChatMessage {
  id: string;
  senderRole: 'client' | 'guard';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface AIAnalysisResult {
  isAuthentic: boolean;
  score: number;
  notes: string;
  verifiedScope: string[];
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
  badgeNumber?: string;
  clientName?: string;
  organization?: string;
  avatar?: string;
  hourlyRate?: number;
  /** @deprecated Derive from role for staff accounts */
  staffRole?: StaffRole;
}

