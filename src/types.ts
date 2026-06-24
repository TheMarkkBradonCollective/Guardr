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
  /** Staff note when a clearer credential photo is needed */
  rejectionReason?: string;
  /** Who uploaded this credential for approvals filtering */
  submittedByRole?: 'guard' | 'staff';
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
  /** Account lifecycle — pending sign-ups need staff approval before posting jobs */
  accountStatus?: 'pending' | 'active' | 'suspended';
  rating?: number;
  createdAt?: string;
  themePreference?: 'dark' | 'light' | 'grey';
  /** Set when staff provisions the account; used for sign-in only */
  password?: string;
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
   * Explicitly trusted by a Director or Owner.
   * Trusted clients skip Guardr job posting review for non-cash jobs.
   */
  trusted?: boolean;

  /** Guard IDs this client has favourited — shown first in the guard directory. */
  favoriteGuardIds?: string[];
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
  userStatus?: 'pending' | 'approved' | 'active' | 'suspended' | 'blocked';
  failedAudits?: number; // Automatic rule: 3 failed uniform audits = suspension
  themePreference?: 'dark' | 'light' | 'grey';
  stripeConnectAccountId?: string;
  /** Set when staff provisions the account; used for sign-in only */
  password?: string;
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
  /** Who submitted government ID for approvals filtering */
  idSubmittedBy?: 'guard' | 'staff';
  /** Staff-granted deadline to upload optional credentials before account deactivation */
  credentialGraceDeadline?: string;
  /** Credential labels missing when grace period started */
  credentialGraceMissing?: string[];
  /** Staff-granted grace window length in hours (set at activation) */
  credentialGraceHours?: number;
  /**
   * Explicitly trusted by a Director or Owner.
   * Trusted guards skip Guardr applicant review on Stripe jobs and may coordinate crews.
   * Cash jobs always require Guardr review; cash payments must be confirmed by staff.
   */
  trusted?: boolean;
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
  durationHours: number;
  /** Original scheduled duration before late clock-out billing adjustment */
  scheduledDurationHours?: number;
  hourlyRate: number;
  guardPay?: number;
  platformFeePerHour?: number;
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
  /** Total unpaid break minutes allowed during the shift (set by client). */
  breakMinutes?: number;
  /** Guard break sessions during an active shift. */
  shiftBreaks?: Array<{
    id: string;
    startedAt: string;
    endedAt?: string;
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

export interface NotificationPreferences {
  userId: string;
  assignment: boolean;
  guardCheckin: boolean;
  guardClockout: boolean;
  guardBreakStart: boolean;
  guardBreakEnd: boolean;
  missedCheckin: boolean;
  emergencyAlert: boolean;
  supportMessage: boolean;
  jobChatMessage: boolean;
  staffMessage: boolean;
  guardMessage: boolean;
  jobSubmitted: boolean;
  guardApplication: boolean;
  guardPendingApproval: boolean;
  clientPendingApproval: boolean;
  credentialPending: boolean;
  paymentAttention: boolean;
  supportTicket: boolean;
  supportTicketStatus: boolean;
  disputeUpdate: boolean;
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

