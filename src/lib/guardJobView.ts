import { JobOperationalDetails, JobGuardSlot, Payment, PaymentMethod, PaymentStatus, SecurityGuard, SecurityRequest } from '../types';
import { computeGuardPay, computeGuardEarnings } from './payments';
import type { PlatformSettings } from './platformSettings';
import { guardCanViewJob } from './guardJobs';
import { guardCanViewOperationalBriefing, hasJobOperationalDetails } from './jobOperationalDetails';
import { overtimeGuardEarnings } from './shiftBilling';
import { isStripeDepositSatisfied } from './cashPayments';
import { isJobPaid } from './jobEditRules';

/** Guard-safe payout state — no internal payment pipeline details */
export type GuardPayoutStatus = 'pending' | 'processing' | 'paid';

/** Job fields guards may see — never includes client billing or platform ledger data */
export interface GuardJobView {
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
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  parkingInstructions?: string;
  accessInstructions?: string;
  location: string;
  type: SecurityRequest['type'];
  armedRequired: boolean;
  guardsNeeded?: number;
  guardSlots?: JobGuardSlot[];
  uniformRequirements?: string;
  equipmentRequirements?: string;
  siteInstructions?: string;
  operationalDetails?: JobOperationalDetails;
  operationalBriefingLocked?: boolean;
  startDate: string;
  endDate: string;
  durationHours: number;
  guardPay: number;
  /** Client hourly charge — shown for open-contract negotiation */
  hourlyRate?: number;
  pricingMode?: SecurityRequest['pricingMode'];
  openingPriceOffer?: SecurityRequest['openingPriceOffer'];
  priceNegotiations?: SecurityRequest['priceNegotiations'];
  status: SecurityRequest['status'];
  assignedGuardId: string | null;
  pendingGuardId?: string | null;
  requestType?: SecurityRequest['requestType'];
  targetGuardId?: string | null;
  /**
   * Guard-safe paid flag for marketplace visibility/apply checks.
   * Full paymentStatus is omitted so billing pipeline details stay staff/client-only.
   */
  clientPaymentRecorded?: boolean;
  requiredCertifications: string[];
  minGuardQualification?: SecurityRequest['minGuardQualification'];
  minYearsExperience?: number;
  postOrdersAcknowledgments?: SecurityRequest['postOrdersAcknowledgments'];
  briefingAcknowledgments?: SecurityRequest['briefingAcknowledgments'];
  shiftAuditViolations?: SecurityRequest['shiftAuditViolations'];
  applicants: string[];
  ratingGiven?: number;
  reviewText?: string;
  checkInAudit?: SecurityRequest['checkInAudit'];
  midShiftAudits?: SecurityRequest['midShiftAudits'];
  enRouteAt?: string;
  arrivedAt?: string;
  guardLiveLocation?: SecurityRequest['guardLiveLocation'];
  replacementRequest?: SecurityRequest['replacementRequest'];
  breakMinutes?: number;
  shiftBreaks?: SecurityRequest['shiftBreaks'];
  checkOutAudit?: SecurityRequest['checkOutAudit'];
  reports?: SecurityRequest['reports'];
  payoutStatus?: GuardPayoutStatus;
  payoutMethod?: PaymentMethod;
  cashPayoutRequested?: boolean;
  guardPayoutAvailable?: boolean;
  /**
   * True when Guardr's Stripe account holds the funds for this job.
   * Always true for Stripe-only product paths (legacy cash rows are treated as deposited).
   */
  stripeDepositSatisfied?: boolean;
  overtimeHours?: number;
  overtimeGuardEarnings?: number;
  overtimeStatus?: SecurityRequest['overtimeStatus'];
}

export interface GuardPayoutView {
  id: string;
  jobId: string;
  amount: number;
  status: Payment['status'];
  createdAt?: string;
}

function mapPayoutStatus(paymentStatus?: PaymentStatus): GuardPayoutStatus | undefined {
  if (!paymentStatus || paymentStatus === 'unpaid') return undefined;
  if (paymentStatus === 'released') return 'paid';
  return 'processing';
}

export function guardPayoutStatusLabel(status?: GuardPayoutStatus): string {
  switch (status) {
    case 'paid':
      return 'Paid';
    case 'processing':
      return 'Processing';
    case 'pending':
      return 'Pending';
    default:
      return '';
  }
}

function formatPayDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function jobHasSensitiveBriefing(req: SecurityRequest): boolean {
  return (
    hasJobOperationalDetails(req.operationalDetails) ||
    Boolean(
      req.contactName?.trim() ||
        req.contactPhone?.trim() ||
        req.parkingInstructions?.trim() ||
        req.accessInstructions?.trim() ||
        req.siteInstructions?.trim()
    )
  );
}

/** Guard-facing pay line for a completed job — one place for shift vs payout wording */
export function getShiftPayDisplay(
  job: GuardJobView,
  payment?: GuardPayoutView
): { headline: string; subtext?: string } {
  const paidDate = formatPayDate(payment?.createdAt);

  if (job.payoutStatus === 'paid') {
    if (job.payoutMethod === 'stripe' || job.payoutMethod === 'cash') {
      return {
        headline: 'Paid on Stripe',
        subtext: paidDate ? `Deposited ${paidDate}` : 'Sent to your connected account',
      };
    }
    return { headline: 'Paid', subtext: paidDate };
  }

  if (job.payoutStatus === 'processing') {
    if (!job.guardPayoutAvailable) {
      return {
        headline: 'Pay pending release',
        subtext: 'Platform staff will make your pay available to collect',
      };
    }
    return {
      headline: 'Ready to collect',
      subtext: 'Send a bank transfer invoice from Pay',
    };
  }

  return {
    headline: 'Not paid yet',
    subtext: 'Send a bank transfer invoice from Pay',
  };
}

/** Strip client billing and platform payment fields before data reaches guard UI */
export function toGuardJobView(
  req: SecurityRequest,
  guardId?: string
): GuardJobView {
  const guardPay = req.guardPay ?? computeGuardPay(req.hourlyRate, req.platformFeePerHour);
  const canViewBriefing = guardId ? guardCanViewOperationalBriefing(guardId, req) : false;
  const sensitiveBriefingExists = jobHasSensitiveBriefing(req);

  return {
    id: req.id,
    title: req.title,
    description: req.description,
    clientId: req.clientId,
    clientName: req.clientName,
    clientLogo: req.clientLogo,
    clientRating: req.clientRating,
    siteName: req.siteName,
    address: req.address,
    state: req.state,
    latitude: req.latitude,
    longitude: req.longitude,
    contactName: canViewBriefing ? req.contactName : undefined,
    contactPhone: canViewBriefing ? req.contactPhone : undefined,
    parkingInstructions: canViewBriefing ? req.parkingInstructions : undefined,
    accessInstructions: canViewBriefing ? req.accessInstructions : undefined,
    location: req.location,
    type: req.type,
    armedRequired: req.armedRequired,
    guardsNeeded: req.guardsNeeded,
    guardSlots: req.guardSlots,
    uniformRequirements: req.uniformRequirements,
    equipmentRequirements: req.equipmentRequirements,
    siteInstructions: canViewBriefing ? req.siteInstructions : undefined,
    operationalDetails: canViewBriefing ? req.operationalDetails : undefined,
    operationalBriefingLocked: !canViewBriefing && sensitiveBriefingExists,
    startDate: req.startDate,
    endDate: req.endDate,
    durationHours: req.durationHours,
    guardPay,
    hourlyRate: req.hourlyRate,
    pricingMode: req.pricingMode,
    openingPriceOffer: req.openingPriceOffer,
    priceNegotiations: req.priceNegotiations,
    status: req.status,
    assignedGuardId: req.assignedGuardId,
    pendingGuardId: req.pendingGuardId,
    requestType: req.requestType,
    targetGuardId: req.targetGuardId,
    clientPaymentRecorded: isJobPaid(req),
    requiredCertifications: req.requiredCertifications,
    minGuardQualification: req.minGuardQualification,
    minYearsExperience: req.minYearsExperience,
    postOrdersAcknowledgments: req.postOrdersAcknowledgments,
    briefingAcknowledgments: req.briefingAcknowledgments,
    shiftAuditViolations: req.shiftAuditViolations,
    applicants: req.applicants,
    ratingGiven: req.ratingGiven,
    reviewText: req.reviewText,
    checkInAudit: req.checkInAudit,
    midShiftAudits: req.midShiftAudits,
    enRouteAt: req.enRouteAt,
    arrivedAt: req.arrivedAt,
    guardLiveLocation: req.guardLiveLocation,
    replacementRequest: req.replacementRequest,
    breakMinutes: req.breakMinutes,
    shiftBreaks: req.shiftBreaks,
    checkOutAudit: req.checkOutAudit,
    reports: req.reports,
    payoutStatus: mapPayoutStatus(req.paymentStatus),
    payoutMethod:
      req.paymentStatus === 'released' && req.guardPayoutMethod ? req.guardPayoutMethod : undefined,
    cashPayoutRequested: !!req.guardCashPayoutRequested,
    guardPayoutAvailable: !!req.guardPayoutAvailable,
    stripeDepositSatisfied: isStripeDepositSatisfied(req),
    overtimeHours: req.overtimeHours,
    overtimeGuardEarnings: req.overtimeHours ? overtimeGuardEarnings(req) : undefined,
    overtimeStatus: req.overtimeStatus,
  };
}

/** Guards only receive browseable open jobs plus their own assignments */
export function getGuardVisibleJobs(
  guard: SecurityGuard,
  requests: SecurityRequest[]
): GuardJobView[] {
  return requests
    .filter(
      (r) =>
        r.assignedGuardId === guard.id ||
        guardHasSlotOnJob(r, guard.id) ||
        guardCanViewJob(guard, r)
    )
    .map((req) => toGuardJobView(req, guard.id));
}

function guardHasSlotOnJob(req: SecurityRequest, guardId: string): boolean {
  return (req.guardSlots ?? []).some(
    (s) =>
      s.guardId === guardId &&
      ['invited', 'pending_staff', 'crew_confirmed', 'pending_client', 'approved'].includes(s.status)
  );
}

export function getGuardShiftEarnings(job: Pick<GuardJobView, 'guardPay' | 'durationHours'>): number {
  return Math.round(job.durationHours * job.guardPay * 100) / 100;
}

/** Payout ledger rows show guard earnings only — not the client bill */
export function toGuardPayoutView(payment: Payment, job: SecurityRequest): GuardPayoutView {
  return {
    id: payment.id,
    jobId: payment.jobId,
    amount: computeGuardEarnings(job.durationHours, job.hourlyRate),
    status: payment.status,
    createdAt: payment.createdAt,
  };
}

export function getGuardPayoutHistory(
  guardId: string,
  requests: SecurityRequest[],
  payments: Payment[]
): GuardPayoutView[] {
  const assignedJobIds = new Set(
    requests
      .filter(
        (r) =>
          r.assignedGuardId === guardId ||
          (r.guardSlots ?? []).some((s) => s.guardId === guardId && s.status === 'approved')
      )
      .map((r) => r.id)
  );
  return payments
    .filter((p) => assignedJobIds.has(p.jobId))
    .map((p) => {
      const job = requests.find((r) => r.id === p.jobId);
      if (!job) return null;
      return toGuardPayoutView(p, job);
    })
    .filter((p): p is GuardPayoutView => p != null);
}
