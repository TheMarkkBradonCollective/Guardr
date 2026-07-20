import type { AgreementPlatformFeeConfig, PlatformFeeModel } from '../lib/platformFees';
import type {
  GuardPriceNegotiation,
  OpeningPriceOffer,
  PriceNegotiationOffer,
  PricingMode,
} from '../lib/agreementPricing';

export type {
  AgreementPlatformFeeConfig,
  PlatformFeeModel,
  GuardPriceNegotiation,
  OpeningPriceOffer,
  PriceNegotiationOffer,
  PricingMode,
};

export type JobType =
  | 'foot-patrol'
  | 'vehicle-patrol'
  /** @deprecated Legacy DB value — maps to vehicle-patrol for preferences and driving work. */
  | 'patrol'
  | 'construction'
  | 'fire-watch'
  | 'standing-guard'
  | 'armed-escort'
  | 'bodyguard'
  | 'asset-protection'
  | 'nightclub-bar'
  | 'event-wedding'
  | 'event-concert'
  | 'event-festival'
  | 'event-corporate'
  | 'event-private'
  | 'event'
  | 'other';

export type JobStatus =
  | 'draft'
  | 'pending-review'
  | 'open'
  | 'accepted'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'closed';

export type ReportType =
  | 'daily-activity'
  | 'incident'
  | 'property-damage'
  | 'maintenance'
  | 'trespass';

export type ReplacementReason = 'call-off' | 'no-show' | 'emergency' | 'other';
export type ReplacementStatus = 'searching' | 'offering' | 'filled' | 'failed' | 'cancelled';

export interface ReplacementRequest {
  id: string;
  requestedAt: string;
  requestedBy: 'client' | 'system';
  reason: ReplacementReason;
  reasonNote?: string;
  status: ReplacementStatus;
  offeredGuardIds: string[];
  acceptedGuardId?: string;
  acceptedAt?: string;
  previousGuardId?: string;
  expiresAt?: string;
}

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
export type PlatformRole = 'client' | 'guard' | 'moderator' | 'administrator' | 'manager' | 'director' | 'owner';

/** @deprecated Use PlatformRole — kept for DB staff_role column mapping */
export type StaffRole = 'Founder' | 'Director' | 'Manager' | 'Administrator' | 'Moderator';

export type CertCategory =
  | 'guard-card'
  | 'bsis-required'
  | 'bsis-training'
  | 'bsis-permit'
  | 'medical'
  | 'fema'
  | 'security-advanced'
  | 'industry';

export type CertificationRevisionEvent =
  | 'submitted'
  | 'verified'
  | 'rejected'
  | 'update_requested'
  | 'update_submitted'
  | 'superseded';

export interface CertificationRevision {
  id: string;
  recordedAt: string;
  event: CertificationRevisionEvent;
  status: 'verified' | 'pending' | 'rejected';
  issuer?: string;
  number?: string;
  state?: string;
  expiryDate?: string;
  imageUrl?: string;
  note?: string;
}

export interface CertificationPendingUpdate {
  submittedAt: string;
  issuer: string;
  number: string;
  state?: string;
  expiryDate?: string;
  imageUrl?: string;
  status: 'pending' | 'rejected';
  rejectionReason?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  number: string;
  status: 'verified' | 'pending' | 'rejected';
  issueDate: string;
  /** @deprecated Certs no longer track expiration — kept for legacy DB rows */
  expiryDate?: string;
  /** US state code — required for BSIS guard cards */
  state?: string;
  /** Links to certCatalog entry */
  catalogId?: string;
  category?: CertCategory;
  /** Optional scan/photo of the credential document */
  imageUrl?: string;
  /** Staff note when a clearer credential photo is needed */
  rejectionReason?: string;
  /** Who uploaded this credential for approvals filtering */
  submittedByRole?: 'guard' | 'staff';
  /** Staff asked the guard to upload a new version — current verified copy stays on file. */
  updateRequestedAt?: string;
  updateRequestNote?: string;
  /** Guard-submitted replacement awaiting staff review while verified copy remains active. */
  pendingUpdate?: CertificationPendingUpdate;
  /** Prior versions and review events, newest events appended by handlers. */
  revisionHistory?: CertificationRevision[];
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

export type GuardCardStatus = 'active' | 'in_progress' | 'none';
export type GuardArmedPreference = 'armed' | 'unarmed' | 'both';

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
  /** Account lifecycle — pending sign-ups need staff approval before posting jobs */
  accountStatus?: 'pending' | 'active' | 'suspended';
  rating?: number;
  createdAt?: string;
  themePreference?: 'dark' | 'light';
  /** Set when staff provisions the account; used for sign-in only */
  password?: string;
  /** PBKDF2 hash — replaces plaintext password after migration */
  passwordHash?: string;
  mustChangePassword?: boolean;

  // --- Sign-up intake fields (used by staff to evaluate pending accounts) ---

  /** Business entity type, e.g. LLC, Corporation, Sole Proprietor */
  businessType?: string;
  /** Industries / sectors — multi-select */
  industries?: string[];
  /** Business license number or EIN / Tax ID */
  businessLicense?: string;
  /** Company website URL */
  website?: string;

  /** Client's own description of what security coverage they need */
  serviceDescription?: string;
  /** Types of security service requested */
  serviceTypes?: string[];
  /** Rough estimate of how many guards they need */
  estimatedGuardsNeeded?: number;
  /** Armed vs unarmed preference */
  armedPreference?: 'armed' | 'unarmed' | 'no-preference';
  /** Engagement frequency — multi-select, clients may need more than one type */
  serviceFrequencies?: string[];
  /** Approximate start date or timeframe */
  estimatedStartDate?: string;
  /** Rough budget tier */
  budgetRange?: string;

  /** City where security coverage is needed */
  serviceCity?: string;
  /** US state where coverage is needed */
  serviceState?: string;
  /** Types of property — multi-select, clients may cover more than one site type */
  propertyTypes?: string[];

  /** Freehand name of the guard or staff member who referred this client */
  referredBy?: string;
  /** Platform ID of the referring guard or staff member, if found */
  referredById?: string;
  /** How the client heard about the platform */
  howHeardAboutUs?: string;

  /** Whether the client has used a security company before */
  hasPriorSecurityService?: boolean;
  /** Previous security provider name */
  priorSecurityProvider?: string;
  /** Any special licensing, compliance, or site requirements */
  specialRequirements?: string;

  /**
   * Explicitly trusted by a Director or Founder.
   * Trusted clients skip Guardr job posting review for non-cash jobs.
   */
  trusted?: boolean;

  /** Guard IDs this client has favourited — shown first in the guard directory. */
  favoriteGuardIds?: string[];

  /** Default guard placement mode for new job posts. */
  defaultAssignmentMode?: AssignmentMode;
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

export type CoiRevisionEvent = 'submitted' | 'verified' | 'rejected' | 'update_submitted' | 'superseded';

export interface CoiRevision {
  id: string;
  recordedAt: string;
  event: CoiRevisionEvent;
  status: 'verified' | 'pending' | 'rejected';
  carrier?: string;
  policyNumber?: string;
  generalLiabilityLimit?: number;
  effectiveDate?: string;
  expiryDate?: string;
  documentUrl?: string;
  note?: string;
}

export interface GuardInsurancePolicy {
  id: string;
  guardId: string;
  carrier: string;
  policyNumber: string;
  generalLiabilityLimit?: number;
  effectiveDate?: string;
  expiryDate?: string;
  documentUrl?: string;
  status: 'not_submitted' | 'pending' | 'verified' | 'rejected' | 'expired';
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  /** Staff or automation asked for an updated COI while the verified copy stays on file. */
  updateRequestedAt?: string;
  updateRequestNote?: string;
  /** Prior COI uploads and review events, newest events prepended by handlers. */
  revisionHistory?: CoiRevision[];
}

export type GovernmentIdDocumentType = 'state_id' | 'drivers_license';

export type GovIdRevisionEvent = 'submitted' | 'verified' | 'rejected' | 'update_submitted' | 'superseded';

export interface GovIdRevision {
  id: string;
  recordedAt: string;
  event: GovIdRevisionEvent;
  status: 'verified' | 'pending' | 'rejected';
  idDocumentType?: GovernmentIdDocumentType;
  idLicenseClass?: string;
  idState?: string;
  idNumber?: string;
  idExpiryDate?: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  idSelfieUrl?: string;
  note?: string;
}

export const DRIVER_LICENSE_CLASSES = ['Class A', 'Class B', 'Class C', 'Class M'] as const;

export type DriverLicenseClass = (typeof DRIVER_LICENSE_CLASSES)[number];

export type GuardVehicleInsuranceStatus =
  | 'not_submitted'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'expired';

/** Auto insurance for patrol / driving work — separate from general liability COI. */
export interface GuardVehicleInsurancePolicy {
  id: string;
  guardId: string;
  carrier: string;
  policyNumber: string;
  effectiveDate?: string;
  expiryDate?: string;
  documentUrl?: string;
  status: GuardVehicleInsuranceStatus;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  updateRequestedAt?: string;
  updateRequestNote?: string;
}

export type GuardVehicleProfileStatus = 'draft' | 'pending' | 'verified' | 'rejected';

export interface GuardVehicleProfile {
  id: string;
  guardId: string;
  make: string;
  model: string;
  year?: string;
  color?: string;
  plateNumber: string;
  plateState: string;
  frontPhotoUrl?: string;
  leftSidePhotoUrl?: string;
  rightSidePhotoUrl?: string;
  backPhotoUrl?: string;
  vehicleInsurancePolicyId?: string;
  status: GuardVehicleProfileStatus;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface JobServiceAgreement {
  id: string;
  jobId: string;
  clientId: string;
  guardId: string;
  version: string;
  generatedAt: string;
  title: string;
  hourlyRate: number;
  guardPayPerHour: number;
  durationHours: number;
  location: string;
  startDate: string;
  endDate: string;
  clientName: string;
  guardName: string;
  body: string;
}

export type GuardWeaponGearId = 'flashlight' | 'oc-spray' | 'baton' | 'handcuffs' | 'taser' | 'firearm';

/** Non-weapon equipment badges shown on guard profiles. */
export type GuardEquipmentGearId = 'body-cam' | 'walkie-talkie';

export type LocationRiskLevel = 'low' | 'medium' | 'high';

export type ClientLocationStatus = 'pending' | 'active' | 'rejected';

export interface ClientLocation {
  id: string;
  clientId: string;
  name: string;
  address: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  riskLevel: LocationRiskLevel;
  status: ClientLocationStatus;
  siteInstructions?: string;
  createdAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export type AssignmentMode = 'client-approve' | 'first-to-accept';

export interface DifferentialPayRates {
  unarmed?: number;
  lightArmed?: number;
  armed?: number;
}

export interface PostOrdersAcknowledgment {
  guardId: string;
  acknowledgedAt: string;
}

export interface BriefingAcknowledgment {
  guardId: string;
  acknowledgedAt: string;
}

export type ShiftCheckpointKind = 'start' | 'end' | 'briefing';

export type ShiftAuditViolationSource = 'system' | 'client';

export type ShiftAuditViolationStatus =
  | 'auto-flagged'
  | 'flagged'
  | 'verified'
  | 'expired'
  | 'dispute-open'
  | 'upheld'
  | 'dismissed';

export interface ShiftAuditViolationDispute {
  status: 'open' | 'upheld' | 'dismissed';
  guardNote?: string;
  guardSubmittedAt?: string;
  disputeDeadlineAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

export interface ShiftAuditViolation {
  id: string;
  checkpoint: ShiftCheckpointKind;
  source: ShiftAuditViolationSource;
  category: string;
  label: string;
  description: string;
  createdAt: string;
  guardId: string;
  reportedByClientId?: string;
  reportedByClientName?: string;
  status: ShiftAuditViolationStatus;
  reviewExpiresAt?: string;
  dispute?: ShiftAuditViolationDispute;
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
  /** California cities where the guard advertises availability */
  serviceAreas?: string[];
  specialties?: string[];
  yearsExperience?: number;
  availabilityNotes?: string;
  isArmed: boolean;
  /** Gear/weapons the guard lists on their profile when BSIS requirements are met. */
  listedWeaponGear?: GuardWeaponGearId[];
  /** Body cam, walkie-talkie, and other equipment badges. */
  listedEquipmentGear?: GuardEquipmentGearId[];
  /** Job types the guard wants to be notified about (DoorDash-style preferences). */
  jobTypePreferences?: JobType[];
  /** ISO timestamps when the guard completed onboarding for each job type. */
  jobTypeOnboarding?: Partial<Record<JobType, string>>;
  backgroundChecked: boolean;
  verified: boolean;
  rating: number;
  jobsCompleted: number;
  certifications: Certification[];
  experience: Experience[];
  education?: GuardEducation[];
  hourlyRateRequirement?: number;
  /** Sign-up armed work preference */
  armedPreference?: GuardArmedPreference;
  /** Self-reported BSIS guard card status at application */
  guardCardStatus?: GuardCardStatus;
  /** Self-reported at application */
  hasReliableTransportation?: boolean;
  isStaff?: boolean;
  staffRole?: StaffRole;
  /** Cities this staff member may manage or operate in */
  managedCities?: string[];
  /** Manager staff IDs supervising this account */
  assignedManagerIds?: string[];
  userStatus?: 'pending' | 'approved' | 'active' | 'suspended' | 'blocked';
  failedAudits?: number; // Automatic rule: 3 failed uniform audits = suspension
  themePreference?: 'dark' | 'light';
  stripeConnectAccountId?: string;
  /** Set when staff provisions the account; used for sign-in only */
  password?: string;
  /** PBKDF2 hash — replaces plaintext password after migration */
  passwordHash?: string;
  mustChangePassword?: boolean;
  /** Government ID verification — separate from profile avatar */
  idVerificationStatus?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  idState?: string;
  idNumber?: string;
  idExpiryDate?: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  idSelfieUrl?: string;
  idVerificationSubmittedAt?: string;
  idVerificationReviewedAt?: string;
  idVerificationRejectionReason?: string;
  /** Automatic or staff update request while verified government ID stays on file. */
  idUpdateRequestedAt?: string;
  idUpdateRequestNote?: string;
  /** Who submitted government ID for approvals filtering */
  idSubmittedBy?: 'guard' | 'staff';
  /** State ID or driver's license — controls labels and driving eligibility. */
  idDocumentType?: GovernmentIdDocumentType;
  /** Shown when idDocumentType is drivers_license (e.g. Class C). */
  idLicenseClass?: string;
  /** Prior government ID uploads and review events, newest events prepended by handlers. */
  idRevisionHistory?: GovIdRevision[];
  /** Auto insurance credential for driving / patrol work. */
  vehicleInsurancePolicy?: GuardVehicleInsurancePolicy;
  /** Guard vehicle submitted for staff approval before driving priority unlocks. */
  vehicleProfile?: GuardVehicleProfile;
  /** Staff-granted deadline to upload optional credentials before account deactivation */
  credentialGraceDeadline?: string;
  /** Credential labels missing when grace period started */
  credentialGraceMissing?: string[];
  /** Staff-granted grace window length in hours (set at activation) */
  credentialGraceHours?: number;
  /** Marketplace access removed until expired required credentials are re-verified. */
  credentialExpiryRestricted?: boolean;
  /**
   * Explicitly trusted by a Director or Founder.
   * Trusted guards skip Guardr applicant review on Stripe jobs and may coordinate crews.
   * Cash jobs always require Guardr review; cash payments must be confirmed by staff.
   */
  trusted?: boolean;
  /** Public team name clients see in the Teams directory (trusted guards). */
  standingCrewName?: string;
  /** Public team description clients can read in the Teams directory. */
  standingCrewDescription?: string;
  /** General liability COI — required for marketplace applications */
  insurancePolicy?: GuardInsurancePolicy;
}

export type StandingCrewMemberStatus = 'pending' | 'active' | 'declined' | 'removed';

/** Persistent roster a trusted guard maintains across jobs. */
export interface GuardStandingCrewMember {
  id: string;
  leadGuardId: string;
  memberGuardId: string;
  status: StandingCrewMemberStatus;
  invitedAt: string;
  respondedAt?: string;
}

export type GuardCrewJoinRequestStatus = 'pending' | 'approved' | 'declined';

/** Trusted guard asking staff to approve them as a standing crew lead. */
export interface GuardCrewJoinRequest {
  id: string;
  guardId: string;
  status: GuardCrewJoinRequestStatus;
  message?: string;
  requestedAt: string;
  resolvedAt?: string;
  resolvedByStaffId?: string;
}

/** In-app notification inbox row — unread until read/clicked. */
export interface UserNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  url?: string;
  requestId?: string;
  guardId?: string;
  ticketId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  readAt?: string;
  clickedAt?: string;
}

export interface StaffSpotCheck {
  id: string;
  imageUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  clientConfirmedAt?: string;
  clientConfirmedBy?: string;
}

/** Named point on site — fire extinguishers, med kits, Narcan, AED, etc. */
export interface JobOperationalLocation {
  label?: string;
  details: string;
}

/** On-site contact for guards — venue, client, emergency, law enforcement. */
export interface JobOperationalContact {
  role?: string;
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

/** Guard post or checkpoint with location and post orders. */
export interface JobOperationalCheckpoint {
  label?: string;
  location?: string;
  schedule?: string;
  instructions?: string;
}

/** Client-defined briefing field — unlimited custom details. */
export interface JobOperationalCustomField {
  section?: string;
  label: string;
  value: string;
}

/** Optional client site briefing — sensitive fields hidden from guards until assigned. */
export interface JobOperationalDetails {
  // Venue & site layout
  venueType?: string;
  venueCapacity?: string;
  patronHeadCount?: string;
  indoorOutdoorSplit?: string;
  floorPlanNotes?: string;
  zoneDefinitions?: string;
  seatingLayout?: string;
  stageLocation?: string;
  mainEntranceDetails?: string;
  secondaryEntrances?: string;
  exitDoors?: string;
  emergencyExits?: string;
  elevatorLocations?: string;
  stairwellLocations?: string;
  roofAccess?: string;
  basementAccess?: string;
  loadingDockDetails?: string;
  dumpsterAreas?: string;
  postAssignment?: string;
  // Schedule & doors
  doorsOpenTime?: string;
  doorsCloseTime?: string;
  curfewTime?: string;
  showStartTime?: string;
  showEndTime?: string;
  soundcheckSchedule?: string;
  vendorLoadInDetails?: string;
  shiftBriefingTime?: string;
  shiftBriefingLocation?: string;
  kitchenCloseTime?: string;
  cleanupProcedure?: string;
  lockupProcedure?: string;
  finalWalkthroughChecklist?: string;
  alarmArmingProcedure?: string;
  lightsHvacShutdown?: string;
  // Perimeter & technology
  perimeterDescription?: string;
  blindSpots?: string;
  climbPoints?: string;
  fenceGates?: string;
  vehicleBarriers?: string;
  bollardLocations?: string;
  securityLighting?: string;
  cctvCameraLocations?: string;
  alarmPanelLocation?: string;
  panicButtonLocations?: string;
  itServerRoomAccess?: string;
  cctvMonitoringRoom?: string;
  // Parking & transport
  parkingLotLayout?: string;
  guestParkingZones?: string;
  staffParking?: string;
  vipParking?: string;
  accessibleParking?: string;
  ridesharePickupZone?: string;
  taxiStand?: string;
  busShuttle?: string;
  tourBusParking?: string;
  towCompany?: string;
  parkingEnforcement?: string;
  oversizeVehiclePolicy?: string;
  // Screening & weapons
  bagCheckPolicy?: string;
  bagCheckLocations?: string;
  metalDetectorPolicy?: string;
  metalDetectorLocations?: string;
  wandSearchPolicy?: string;
  patDownPolicy?: string;
  prohibitedItemsList?: string;
  allowedItemsList?: string;
  screeningExceptions?: string;
  weaponPolicy?: string;
  offDutyLawEnforcementPolicy?: string;
  // Crowd management
  queueManagement?: string;
  lineControlPoints?: string;
  capacityHoldProcedure?: string;
  crowdSurgeProtocol?: string;
  moshpitPitRules?: string;
  balconyOverlookRules?: string;
  standingVsSeated?: string;
  generalAdmissionFlow?: string;
  seatedSectionFlow?: string;
  // Credentialing
  credentialingDetails?: string;
  wristbandColors?: string;
  laminateLevels?: string;
  staffCredentialTypes?: string;
  artistCredentialRules?: string;
  vendorCredentialRules?: string;
  mediaCredentialRules?: string;
  ageVerificationProcedure?: string;
  idCheckLocations?: string;
  minorAccompanimentPolicy?: string;
  reEntryPolicy?: string;
  handStampPolicy?: string;
  credentialConfiscationPolicy?: string;
  // Talent & production
  headlinerDetails?: string;
  openingActs?: string;
  performanceSchedule?: string;
  greenRoomLocations?: string;
  vipAreaDetails?: string;
  artistEntourageRules?: string;
  stageDoorPolicy?: string;
  meetGreetSecurity?: string;
  autographAreaRules?: string;
  merchandiseBoothSecurity?: string;
  // Bar & hospitality
  barDetails?: string;
  barLastCallTime?: string;
  barCloseTime?: string;
  intoxicationPolicy?: string;
  kitchenAccess?: string;
  foodTruckLocations?: string;
  allergenEmergency?: string;
  cashHandlingPolicy?: string;
  atmLocations?: string;
  cashRoomLocation?: string;
  safeLocation?: string;
  armoredCarSchedule?: string;
  // Smoking & substances
  /** @deprecated Use smokingAreaLocation / smokingAreaRules — kept for legacy JSONB rows */
  smokingAreaDetails?: string;
  smokingAreaLocation?: string;
  smokingAreaOpenTime?: string;
  smokingAreaCloseTime?: string;
  smokingAreaRules?: string;
  smokingAreaGuardNotes?: string;
  tobaccoPolicyBeyondSmoking?: string;
  cannabisPolicy?: string;
  // Access & keys
  accessCodes?: string;
  keyLocation?: string;
  accessNotes?: string;
  keysReturnProcedure?: string;
  contractorEscortRules?: string;
  utilityRoomAccess?: string;
  // Emergency & medical
  emergencyProtocol?: string;
  activeShooterProtocol?: string;
  bombThreatProtocol?: string;
  severeWeatherShelter?: string;
  weatherContingencyPlans?: string;
  earthquakeProtocol?: string;
  powerOutageProtocol?: string;
  gasLeakProtocol?: string;
  hazmatNotes?: string;
  medicalEmergencyContacts?: string;
  nearestHospital?: string;
  emsStagingLocation?: string;
  triageLocation?: string;
  evacuationRallyPoint?: string;
  evacuationRoutes?: string;
  shelterInPlaceLocation?: string;
  firePullStationNotes?: string;
  cooldownAreaDetails?: string;
  poolWaterFeatureRules?: string;
  strobeLightWarnings?: string;
  medicalConditionsOnSite?: string;
  fireExtinguisherLocations?: JobOperationalLocation[];
  medkitLocations?: JobOperationalLocation[];
  narcanLocations?: JobOperationalLocation[];
  aedLocations?: JobOperationalLocation[];
  eyewashStationLocations?: JobOperationalLocation[];
  spillKitLocations?: JobOperationalLocation[];
  // Communications & command
  radioChannel?: string;
  radioCodes?: string;
  radioCallSignPolicy?: string;
  communicationTree?: string;
  chainOfCommand?: string;
  clientAuthorizedContacts?: string;
  escalationTier1?: string;
  escalationTier2?: string;
  escalationTier3?: string;
  guardStationLocation?: string;
  supervisorPostLocation?: string;
  patrolRouteDetails?: string;
  patrolIntervalMinutes?: string;
  fixedPostRoster?: string;
  roverResponsibilities?: string;
  restroomBreakPolicy?: string;
  uniformByPost?: string;
  equipmentByPost?: string;
  handoffNotesFromPriorShift?: string;
  guardPosts?: JobOperationalCheckpoint[];
  contacts?: JobOperationalContact[];
  // Incidents & enforcement
  incidentReportProcedure?: string;
  evidencePreservation?: string;
  witnessStatementProcedure?: string;
  bodyCamPolicy?: string;
  useOfForceReporting?: string;
  detentionHoldArea?: string;
  trespassProcedure?: string;
  ejectionRoutes?: string;
  ejectionDocumentation?: string;
  bannedPersonList?: string;
  knownProblemGuests?: string;
  lostChildProcedure?: string;
  lostAndFoundProcedure?: string;
  theftResponseProcedure?: string;
  sexualHarassmentResponse?: string;
  sexualAssaultResponseProtocol?: string;
  // Policies & compliance
  filmingPhotoPolicy?: string;
  socialMediaPolicy?: string;
  dronePolicy?: string;
  liquorLicenseCompliance?: string;
  noiseCurfewCompliance?: string;
  adaAccessibilityNotes?: string;
  serviceAnimalPolicy?: string;
  languageTranslationNeeds?: string;
  protestUnauthorizedActivity?: string;
  picketLineProtocol?: string;
  unionStrikeRules?: string;
  neighborhoodRelations?: string;
  lawEnforcementLiaison?: string;
  fireMarshalContact?: string;
  // Client notes
  clientSpecialRequests?: string;
  additionalNotes?: string;
  customBriefingFields?: JobOperationalCustomField[];
}

export type JobGuardSlotStatus =
  | 'open'
  | 'invited'
  | 'pending_staff'
  /** Guard confirmed on crew internally — waiting for full roster before client review. */
  | 'crew_confirmed'
  | 'pending_client'
  | 'approved'
  | 'declined'
  | 'expired'
  | 'withdrawn';

export interface JobGuardSlot {
  id: string;
  jobId: string;
  slotIndex: number;
  guardId?: string | null;
  isLead: boolean;
  status: JobGuardSlotStatus;
  invitedByGuardId?: string | null;
  invitedAt?: string;
  inviteExpiresAt?: string;
  staffApprovedAt?: string;
  clientApprovedAt?: string;
  updatedAt?: string;
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
  /** California work city (e.g. Los Angeles) — not the license/ID state code */
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
  /** Client site briefing — hidden from guards until they are approved for the shift */
  operationalDetails?: JobOperationalDetails;
  startDate: string;
  endDate: string;
  /** One-time shift vs ongoing recurring coverage */
  scheduleType?: 'one-time' | 'recurring';
  /** When scheduleType is recurring, optional end date for the series */
  recurringEndDate?: string;
  /** Days of week for recurring posts (0 = Sunday … 6 = Saturday) */
  recurringDays?: number[];
  /** How guards are placed: client approves applicants vs first qualified guard wins */
  assignmentMode?: AssignmentMode;
  /** Minimum years of field experience required to apply */
  minYearsExperience?: number;
  /** Saved client location used for this job */
  clientLocationId?: string;
  /** Location risk snapshot at post time */
  locationRiskLevel?: LocationRiskLevel;
  /** Tiered guard pay by armed status — overrides single guardPay when set */
  tierPayRates?: DifferentialPayRates;
  /** Guards who acknowledged post orders before clock-in */
  postOrdersAcknowledgments?: PostOrdersAcknowledgment[];
  /** Guard confirmed they read the pre-shift site briefing. */
  briefingAcknowledgments?: BriefingAcknowledgment[];
  /** Checkpoint violations (skips, not-ready briefing, client flags) with dispute lifecycle. */
  shiftAuditViolations?: ShiftAuditViolation[];
  durationHours: number;
  /** Original scheduled duration before late clock-out billing adjustment */
  scheduledDurationHours?: number;
  hourlyRate: number;
  guardPay?: number;
  platformFeePerHour?: number;
  /** standard = preset/platform default rates; open_contract = negotiated client–guard pricing */
  pricingMode?: PricingMode;
  /** Per-deal platform fee override (flat $/hr or % of charge) when agreed */
  agreementFeeConfig?: AgreementPlatformFeeConfig;
  /** Client opening offer for open-contract jobs before a guard responds */
  openingPriceOffer?: OpeningPriceOffer;
  /** Per-guard price negotiation thread for open-contract jobs */
  priceNegotiations?: GuardPriceNegotiation[];
  estimatedPayout: number;
  /** Original client bill before late clock-out billing adjustment */
  scheduledEstimatedPayout?: number;
  /** Extra hours billed when guard clocked out after scheduled end */
  overtimeHours?: number;
  /** Additional client charge for late clock-out */
  overtimeAmount?: number;
  /** Process: none → pending_guard → pending_client → awaiting_payment | disputed → paid | waived */
  overtimeStatus?: 'none' | 'pending_guard' | 'pending_client' | 'awaiting_payment' | 'disputed' | 'paid' | 'waived';
  overtimeGuardApprovedAt?: string;
  overtimeClientApprovedAt?: string;
  overtimeDisputeReason?: string;
  overtimeDisputedAt?: string;
  overtimeDisputeClaimedClockOutAt?: string;
  overtimeDisputeResolvedAt?: string;
  overtimeDisputeResolution?: string;
  overtimeOriginalHours?: number;
  overtimeOriginalAmount?: number;
  /** Tracks whether the overtime difference has been collected from the client */
  overtimePaymentStatus?: 'none' | 'unpaid' | 'paid';
  overtimeClientPaymentMethod?: 'cash' | 'stripe';
  overtimeClientCashPaymentRequested?: boolean;
  overtimeClientCashPaymentRequestedAt?: string;
  overtimeGuardPayoutAvailable?: boolean;
  overtimeGuardPayoutAvailableAt?: string;
  overtimeGuardPayoutMethod?: 'cash' | 'stripe';

  // --- Early clock-out refund ---
  /** Actual hours worked when guard clocked out before scheduled end. */
  earlyClockOutActualHours?: number;
  /** Amount owed back to client for unused scheduled time. */
  earlyClockOutRefundAmount?: number;
  /** Refund return status — pending until staff processes it. */
  earlyClockOutRefundStatus?: 'pending' | 'returned_stripe' | 'returned_cash' | 'waived';

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
  /** Staff released pay — guard can collect via Pay (bank or cash pickup) */
  guardPayoutAvailable?: boolean;
  guardPayoutAvailableAt?: string;
  /** Client chose pay-in-cash — awaiting staff confirmation */
  clientCashPaymentRequested?: boolean;
  clientCashPaymentRequestedAt?: string;
  /** Director paid client cash into Stripe via card checkout */
  cashDepositedToStripe?: boolean;
  /** Dollars paid into Stripe (card) for cash-client jobs */
  cashDepositedAmount?: number;
  cashDepositedAt?: string;
  /** Director recorded a cash-client deposit off-card (bank transfer, in-hand, etc.) */
  cashDepositedManually?: boolean;
  /** Director manually deposited platform fee (off-Stripe) */
  platformFeePaidCash?: boolean;
  /** Staff approved this guard — awaiting client confirmation (single-guard jobs) */
  pendingGuardId?: string | null;
  staffApprovedGuardAt?: string;
  assignedGuardId: string | null;
  /** Crew coordinator for multi-guard team jobs */
  teamLeadId?: string | null;
  /** Shareable code for crew self-join (multi-guard jobs with a coordinator) */
  teamCode?: string | null;
  /** Client-visible crew display name (coordinator-editable) */
  crewName?: string | null;
  /** Client-visible crew pitch / capabilities summary */
  crewDescription?: string | null;
  /** When the job listing went live (open) — used for invite expiry */
  openedAt?: string;
  /** Client-requested schedule change awaiting staff approval */
  pendingStartDate?: string;
  pendingEndDate?: string;
  pendingDurationHours?: number;
  pendingEstimatedPayout?: number;
  scheduleChangeStatus?: 'none' | 'pending_staff' | 'pending_client' | 'awaiting_payment' | 'pending_staff_billing';
  scheduleChangeRequestedAt?: string;
  scheduleChangeRequestedBy?: 'client' | 'staff';
  scheduleChangeExtraAmount?: number;
  /** Per-slot roster for multi-guard jobs */
  guardSlots?: JobGuardSlot[];
  /** marketplace = open post for any guard; direct = client sent from a guard profile */
  requestType?: RequestType;
  /** Set only when requestType is direct */
  targetGuardId?: string | null;
  /** Catalog IDs from certCatalog — used for job matching filters */
  requiredCertifications: string[];
  /** Active (guard card) or full BSIS training preference — clients choose per job */
  minGuardQualification?: MinGuardQualification;
  applicants: string[];
  /** Generated direct client–guard agreement when assignment is confirmed */
  serviceAgreement?: JobServiceAgreement;
  /** Automatic Stripe payout runs after this timestamp when enabled */
  autoPayoutScheduledAt?: string;
  ratingGiven?: number;
  reviewText?: string;
  /** Optional gratuity left by the client after the shift. */
  tipAmount?: number;
  tipPaymentStatus?: 'none' | 'pending' | 'paid' | 'failed';
  tipStripeSessionId?: string;
  tipStripePaymentIntentId?: string;
  tipPaidAt?: string;
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
    /** Photo of post / site at clock-in */
    locationPhoto?: string;
    /** Guard clocked in without completing self-audit photos */
    selfAuditSkipped?: boolean;
    /** Guard skipped location photo at clock-in */
    locationPhotoSkipped?: boolean;
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
  /** Break minutes allowed during the shift (set by client). */
  breakMinutes?: number;
  /** When false, break time is subtracted from client billing. */
  breakPaid?: boolean;
  /** Guard break sessions during an active shift. */
  shiftBreaks?: Array<{
    id: string;
    startedAt: string;
    endedAt?: string;
  }>;
  /** Guard tapped "En route" or auto-inferred heading to site. */
  enRouteAt?: string;
  /** Live GPS pin shared during accepted / in-progress shifts. */
  guardLiveLocation?: {
    lat: number;
    lng: number;
    updatedAt: string;
  };
  /** Emergency / no-show replacement workflow (first-accept assignment). */
  replacementRequest?: ReplacementRequest;
  /** Set when guard never clocked in after scheduled start. */
  noShow?: boolean;
  /** Client-reported guard or job violations — affects guard performance when target is guard. */
  clientViolationReports?: Array<{
    id: string;
    target: 'guard' | 'job';
    category: string;
    description: string;
    reportedAt: string;
    reportedByClientId: string;
    reportedByClientName?: string;
    guardId?: string;
  }>;
  checkOutAudit?: {
    checkedAt: string;
    completed: boolean;
    noViolations: boolean;
    noEquipmentIssues: boolean;
    endSelfie?: string;
    /** Photo of post / site at clock-out */
    locationPhoto?: string;
    /** Guard skipped end-of-shift self-audit photos */
    endSelfAuditSkipped?: boolean;
    /** Guard skipped location photo at clock-out */
    locationPhotoSkipped?: boolean;
    /** Client reviewed and confirmed end-of-shift checkpoint */
    clientConfirmedAt?: string;
    clientConfirmedBy?: string;
    dailyActivityReport: string;
    incidentReport: {
      hasIncident: boolean;
      incidentType?: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      occurredAt?: string;
      locationOnSite?: string;
      description?: string;
      partiesInvolved?: string;
      witnesses?: string;
      causeOrTrigger?: string;
      actionsTaken?: string;
      authoritiesNotified?: boolean;
      authorityDetails?: string;
      injuryInvolved?: boolean;
      propertyDamageInvolved?: boolean;
      injuryDetails?: string;
      propertyDamageDetails?: string;
      followUpRequired?: boolean;
      followUpNotes?: string;
      evidenceNotes?: string;
      submittedAt?: string;
      submittedByGuardId?: string;
      submittedByGuardName?: string;
    };
    /** All incident reports filed during this shift (mid-shift and checkout). */
    incidentReports?: Array<{
      id: string;
      hasIncident: boolean;
      incidentType?: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      occurredAt?: string;
      locationOnSite?: string;
      description?: string;
      partiesInvolved?: string;
      witnesses?: string;
      causeOrTrigger?: string;
      actionsTaken?: string;
      authoritiesNotified?: boolean;
      authorityDetails?: string;
      injuryInvolved?: boolean;
      propertyDamageInvolved?: boolean;
      injuryDetails?: string;
      propertyDamageDetails?: string;
      followUpRequired?: boolean;
      followUpNotes?: string;
      evidenceNotes?: string;
      submittedAt: string;
      submittedByGuardId?: string;
      submittedByGuardName?: string;
    }>;
    clientNotes: string;
    attachments?: string[];
    /** Guard corrected departure time after forgetting to clock out on time */
    leftEarlier?: boolean;
    /** Guard explicitly claimed overtime (stayed past end or set departure after scheduled end). */
    overtimeClaimed?: boolean;
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

export interface TeamChatThread {
  id: string;
  requestId: string;
  teamLeadId: string;
  status: JobChatThreadStatus;
  createdAt: string;
  archivedAt?: string;
}

/** Crew chat message — same shape as job chat messages. */
export type TeamChatMessage = JobChatMessage;

export interface StaffMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: PlatformRole;
  body: string;
  createdAt: string;
}

export interface GuardMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: PlatformRole;
  body: string;
  createdAt: string;
}

export interface ClientMessage {
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
  guardClockout: boolean;
  guardArrived: boolean;
  guardLeftSite: boolean;
  guardBreakStart: boolean;
  guardBreakEnd: boolean;
  missedCheckin: boolean;
  emergencyAlert: boolean;
  supportMessage: boolean;
  jobChatMessage: boolean;
  staffMessage: boolean;
  guardMessage: boolean;
  clientMessage: boolean;
  jobSubmitted: boolean;
  jobOpenToGuards: boolean;
  guardApplication: boolean;
  guardPendingApproval: boolean;
  clientPendingApproval: boolean;
  credentialPending: boolean;
  paymentAttention: boolean;
  clientInvoiceReady: boolean;
  supportTicket: boolean;
  supportTicketStatus: boolean;
  disputeUpdate: boolean;
  guardTrustedStatus: boolean;
  clientTrustedStatus: boolean;
  jobRelisted: boolean;
  jobScheduleChanged: boolean;
  preShiftBriefing: boolean;
  standingCrewInvite: boolean;
  crewLeadRequest: boolean;
  teamChatMessage: boolean;
  companyPlacardExpiry: boolean;
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

