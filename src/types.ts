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
export type PlatformRole = 'client' | 'guard' | 'moderator' | 'administrator' | 'director' | 'owner';

/** @deprecated Use PlatformRole — kept for DB staff_role column mapping */
export type StaffRole = 'Owner' | 'Director' | 'Administrator' | 'Moderator';

export type CertCategory =
  | 'guard-card'
  | 'bsis-required'
  | 'bsis-training'
  | 'bsis-permit'
  | 'medical'
  | 'fema'
  | 'security-advanced'
  | 'industry';

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  number: string;
  status: 'verified' | 'pending' | 'rejected';
  issueDate: string;
  expiryDate: string;
  /** US state code — required for BSIS guard cards */
  state?: string;
  /** Links to certCatalog entry */
  catalogId?: string;
  category?: CertCategory;
  /** Optional scan/photo of the credential document */
  imageUrl?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  period: string;
  description: string;
}

export interface GuardEducation {
  id: string;
  school: string;
  degree: string;
  field: string;
  period: string;
  description?: string;
}

/** How a security request was created */
export type RequestType = 'marketplace' | 'direct';

/** Minimum guard status to accept a job — Active (guard card) or full-training preference; see guardQualification.ts */
export type MinGuardQualification = 'pending' | 'active';

export const GUARD_SPECIALTY_OPTIONS = [
  'Event security',
  'Corporate / office',
  'Construction site',
  'Residential / HOA',
  'Retail & loss prevention',
  'Executive protection',
  'Armed transport',
  'Fire watch',
  'Hospital / healthcare',
  'School / campus',
] as const;

export type GuardSpecialty = (typeof GUARD_SPECIALTY_OPTIONS)[number];

/** A client account — stored separately from guards */
export interface Client {
  id: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email: string;
  companyName: string;
  phone: string;
  avatar: string;
  totalRequests: number;
  approved?: boolean;
  rating?: number;
  createdAt?: string;
  themePreference?: 'dark' | 'light' | 'grey';
  /** Set when staff provisions the account; used for sign-in only */
  password?: string;
  mustChangePassword?: boolean;
}

export type PaymentStatus = 'unpaid' | 'paid' | 'held' | 'released';

export type PaymentMethod = 'stripe' | 'cash';

export type PaymentRecordStatus = 'pending' | 'paid' | 'held' | 'released' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  jobId: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeTransferId?: string;
  status: PaymentRecordStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type GuardPayoutInvoiceMethod = 'cash' | 'stripe';
export type GuardPayoutInvoiceStatus = 'open' | 'completed' | 'cancelled';

export interface GuardPayoutInvoiceLine {
  jobId: string;
  title: string;
  clientName: string;
  amount: number;
  schedule: string;
}

/** Guard-submitted payout request — staff processes in Payments */
export interface GuardPayoutInvoice {
  id: string;
  guardId: string;
  guardName: string;
  guardEmail: string;
  method: GuardPayoutInvoiceMethod;
  lines: GuardPayoutInvoiceLine[];
  jobIds: string[];
  total: number;
  status: GuardPayoutInvoiceStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface SecurityGuard {
  id: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email: string;
  badgeNumber: string;
  avatar: string;
  phone: string;
  /** @deprecated Use summary/about — kept for legacy rows */
  bio: string;
  /** Professional title, e.g. "Executive Protection Specialist" */
  headline?: string;
  /** Short elevator pitch shown on directory cards */
  summary?: string;
  /** Full resume-style description guards build over time */
  about?: string;
  skills?: string[];
  languages?: string[];
  /** US state codes where guard advertises availability */
  serviceAreas?: string[];
  specialties?: string[];
  yearsExperience?: number;
  availabilityNotes?: string;
  isArmed: boolean;
  backgroundChecked: boolean;
  verified: boolean;
  rating: number;
  jobsCompleted: number;
  certifications: Certification[];
  experience: Experience[];
  education?: GuardEducation[];
  hourlyRateRequirement?: number;
  isStaff?: boolean;
  staffRole?: StaffRole;
  userStatus?: 'active' | 'suspended' | 'blocked';
  failedAudits?: number; // Automatic rule: 3 failed uniform audits = suspension
  themePreference?: 'dark' | 'light' | 'grey';
  stripeConnectAccountId?: string;
  /** Set when staff provisions the account; used for sign-in only */
  password?: string;
  mustChangePassword?: boolean;
}

export interface StaffSpotCheck {
  id: string;
  imageUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  clientConfirmedAt?: string;
  clientConfirmedBy?: string;
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
  state?: string;
  /** Geocoded map pin — preferred over hash-based placement */
  latitude?: number;
  longitude?: number;
  location: string;
  /** On-site point of contact */
  contactName?: string;
  contactPhone?: string;
  parkingInstructions?: string;
  accessInstructions?: string;
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
  stripePaymentIntentId?: string;
  paymentStatus?: PaymentStatus;
  /** How the client paid — cash is recorded by Director only */
  clientPaymentMethod?: PaymentMethod;
  /** How the guard was paid out — cash is recorded by Director only */
  guardPayoutMethod?: PaymentMethod;
  /** Guard requested physical cash from director for this job */
  guardCashPayoutRequested?: boolean;
  guardCashPayoutRequestedAt?: string;
  /** Director paid client cash into Stripe via card checkout */
  cashDepositedToStripe?: boolean;
  /** Dollars paid into Stripe (card) for cash-client jobs */
  cashDepositedAmount?: number;
  cashDepositedAt?: string;
  /** Director manually deposited platform fee (off-Stripe) */
  platformFeePaidCash?: boolean;
  assignedGuardId: string | null;
  /** marketplace = open post for any guard; direct = client sent from a guard profile */
  requestType?: RequestType;
  /** Set only when requestType is direct */
  targetGuardId?: string | null;
  /** Catalog IDs from certCatalog — used for job matching filters */
  requiredCertifications: string[];
  /** Active (guard card) or full BSIS training preference — clients choose per job */
  minGuardQualification?: MinGuardQualification;
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
    uniformPhoto?: string;
    shoesPhoto?: string;
    /** Guard clocked in without completing self-audit photos */
    selfAuditSkipped?: boolean;
    gpsVerified: boolean;
    readyForDuty?: boolean;
    /** Staff uploaded photos on behalf of the guard */
    staffUploadedAt?: string;
    staffUploadedBy?: string;
    /** Client reviewed and confirmed the self-audit photos */
    clientConfirmedAt?: string;
    clientConfirmedBy?: string;
  };
  /** Staff-uploaded presence verification photos for an assigned guard */
  spotChecks?: StaffSpotCheck[];
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

export type JobChatThreadStatus = 'active' | 'archived';

export interface JobChatThread {
  id: string;
  requestId: string;
  clientId: string;
  guardId: string;
  status: JobChatThreadStatus;
  createdAt: string;
  archivedAt?: string;
}

export interface JobChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: PlatformRole;
  body: string;
  createdAt: string;
}

export interface StaffMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: PlatformRole;
  body: string;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: string;
  assignment: boolean;
  guardCheckin: boolean;
  missedCheckin: boolean;
  emergencyAlert: boolean;
  supportMessage: boolean;
  jobChatMessage: boolean;
  staffMessage: boolean;
  updatedAt: string;
}

export type SupportTicketKind = 'chat' | 'report';
export type SupportTicketStatus = 'open' | 'in-progress' | 'resolved';
export type SupportTicketCategory =
  | 'general'
  | 'account'
  | 'payment'
  | 'job-issue'
  | 'safety'
  | 'technical'
  | 'other';
export type SupportPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: PlatformRole;
  body: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: PlatformRole;
  kind: SupportTicketKind;
  subject: string;
  category: SupportTicketCategory;
  priority: SupportPriority;
  status: SupportTicketStatus;
  relatedRequestId?: string;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
}

export interface CreateSupportTicketInput {
  kind: SupportTicketKind;
  subject: string;
  category: SupportTicketCategory;
  priority?: SupportPriority;
  body: string;
  relatedRequestId?: string;
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

