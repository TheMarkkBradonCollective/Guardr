import { Payment, PaymentMethod, PaymentStatus, SecurityGuard, SecurityRequest } from '../types';
import { computeGuardPay, computeGuardEarnings } from './payments';
import { guardCanViewJob } from './guardJobs';

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
  location: string;
  type: SecurityRequest['type'];
  armedRequired: boolean;
  guardsNeeded?: number;
  uniformRequirements?: string;
  equipmentRequirements?: string;
  siteInstructions?: string;
  startDate: string;
  endDate: string;
  durationHours: number;
  guardPay: number;
  status: SecurityRequest['status'];
  assignedGuardId: string | null;
  requestType?: SecurityRequest['requestType'];
  targetGuardId?: string | null;
  requiredCertifications: string[];
  minGuardQualification?: SecurityRequest['minGuardQualification'];
  applicants: string[];
  ratingGiven?: number;
  reviewText?: string;
  checkInAudit?: SecurityRequest['checkInAudit'];
  midShiftAudits?: SecurityRequest['midShiftAudits'];
  checkOutAudit?: SecurityRequest['checkOutAudit'];
  reports?: SecurityRequest['reports'];
  payoutStatus?: GuardPayoutStatus;
  payoutMethod?: PaymentMethod;
  cashPayoutRequested?: boolean;
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

/** Guard-facing pay line for a completed shift — one place for shift vs payout wording */
export function getShiftPayDisplay(
  job: GuardJobView,
  payment?: GuardPayoutView
): { headline: string; subtext?: string } {
  const paidDate = formatPayDate(payment?.createdAt);

  if (job.payoutStatus === 'paid') {
    if (job.payoutMethod === 'cash') {
      return {
        headline: 'Paid in cash',
        subtext: paidDate ? `Marked paid ${paidDate}` : 'Confirmed by platform staff',
      };
    }
    if (job.payoutMethod === 'stripe') {
      return {
        headline: 'Paid on Stripe',
        subtext: paidDate ? `Deposited ${paidDate}` : 'Sent to your connected account',
      };
    }
    return { headline: 'Paid', subtext: paidDate };
  }

  if (job.cashPayoutRequested) {
    return {
      headline: 'Cash payout requested',
      subtext: 'Waiting for platform staff to pay you in cash',
    };
  }

  if (job.payoutStatus === 'processing') {
    return {
      headline: 'Payout processing',
      subtext: 'Stripe transfer is on the way',
    };
  }

  return {
    headline: 'Not paid yet',
    subtext: 'Tap Send to my bank or Request cash pickup above',
  };
}

/** Strip client billing and platform payment fields before data reaches guard UI */
export function toGuardJobView(req: SecurityRequest): GuardJobView {
  const guardPay = req.guardPay ?? computeGuardPay(req.hourlyRate);
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
    location: req.location,
    type: req.type,
    armedRequired: req.armedRequired,
    guardsNeeded: req.guardsNeeded,
    uniformRequirements: req.uniformRequirements,
    equipmentRequirements: req.equipmentRequirements,
    siteInstructions: req.siteInstructions,
    startDate: req.startDate,
    endDate: req.endDate,
    durationHours: req.durationHours,
    guardPay,
    status: req.status,
    assignedGuardId: req.assignedGuardId,
    requestType: req.requestType,
    targetGuardId: req.targetGuardId,
    requiredCertifications: req.requiredCertifications,
    minGuardQualification: req.minGuardQualification,
    applicants: req.applicants,
    ratingGiven: req.ratingGiven,
    reviewText: req.reviewText,
    checkInAudit: req.checkInAudit,
    midShiftAudits: req.midShiftAudits,
    checkOutAudit: req.checkOutAudit,
    reports: req.reports,
    payoutStatus: mapPayoutStatus(req.paymentStatus),
    payoutMethod:
      req.paymentStatus === 'released' && req.guardPayoutMethod ? req.guardPayoutMethod : undefined,
    cashPayoutRequested: !!req.guardCashPayoutRequested,
  };
}

/** Guards only receive browseable open jobs plus their own assignments */
export function getGuardVisibleJobs(guard: SecurityGuard, requests: SecurityRequest[]): GuardJobView[] {
  return requests
    .filter((r) => r.assignedGuardId === guard.id || guardCanViewJob(guard, r))
    .map(toGuardJobView);
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
    requests.filter((r) => r.assignedGuardId === guardId).map((r) => r.id)
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
