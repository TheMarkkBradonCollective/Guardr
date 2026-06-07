export type JobType = 'event' | 'patrol' | 'armed-escort' | 'bodyguard' | 'asset-protection' | 'long-term' | 'other';

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
  createdAt?: string;
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
  staffRole?: 'Director' | 'Administrator' | 'Moderator';
  userStatus?: 'active' | 'suspended' | 'blocked';
  failedAudits?: number; // Automatic rule: 3 failed uniform audits = suspension
}

export interface SecurityRequest {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  clientLogo: string;
  location: string;
  type: JobType;
  armedRequired: boolean;
  startDate: string;
  endDate: string;
  durationHours: number;
  hourlyRate: number;
  estimatedPayout: number;
  status: 'open' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  assignedGuardId: string | null;
  requiredCertifications: string[];
  applicants: string[]; // List of guardIds who applied or accepted
  ratingGiven?: number;
  reviewText?: string;
  // Dynamic Self-Audit Tracker
  checkInAudit?: {
    checkedAt: string;
    uniform: {
      shirt: boolean;
      pants: boolean;
      belt: boolean;
      footwear: boolean;
      badge: boolean;
      equipment: boolean;
    };
    equipment: {
      radio: boolean;
      flashlight: boolean;
      phoneCharged: boolean;
      baton?: boolean;
      spray?: boolean;
      firearm?: boolean;
    };
    frontSelfie: string;
    fullBodyPhoto: string;
    signature: string;
    gpsVerified: boolean;
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
  role: 'client' | 'guard' | 'auditor' | 'staff';
  badgeNumber?: string;
  clientName?: string;
  organization?: string;
  avatar?: string;
  hourlyRate?: number;
  staffRole?: 'Director' | 'Administrator' | 'Moderator';
}

