import { Client, SecurityGuard, SecurityRequest } from '../types';
import {
  getPlatformFeeAmount,
  guardPayoutAmount,
  isCashClientPayment,
  isCashGuardPayout,
  isStripeDepositSatisfied,
} from './cashPayments';
import { paymentPipelineSummary } from './paymentPipeline';
import type { OverviewMetricCell, PlatformStats } from './staffOps';

export interface OperationalFinancials {
  grossIncome: number;
  grossIncomeCash: number;
  grossIncomeCard: number;
  platformFeesTotal: number;
  platformFeesCollected: number;
  platformFeesOutstanding: number;
  guardPayoutsPaid: number;
  guardPayoutsPaidCash: number;
  guardPayoutsPaidStripe: number;
  guardPayoutsDue: number;
  clientOwed: number;
  stripeDepositPending: number;
  paidJobCount: number;
  settledJobCount: number;
  jobsInProgress: number;
  openMarketplaceJobs: number;
}

export interface DirectorOperationsLine {
  label: string;
  value: string;
}

function isClientPaid(req: SecurityRequest): boolean {
  return !!req.paymentStatus && req.paymentStatus !== 'unpaid';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatOperationalMoney(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function computeOperationalFinancials(requests: SecurityRequest[]): OperationalFinancials {
  const pipeline = paymentPipelineSummary(requests);

  let grossIncome = 0;
  let grossIncomeCash = 0;
  let grossIncomeCard = 0;
  let platformFeesTotal = 0;
  let platformFeesCollected = 0;
  let guardPayoutsPaid = 0;
  let guardPayoutsPaidCash = 0;
  let guardPayoutsPaidStripe = 0;
  let paidJobCount = 0;

  for (const req of requests) {
    if (!isClientPaid(req)) continue;

    paidJobCount += 1;
    grossIncome += req.estimatedPayout;
    if (isCashClientPayment(req)) {
      grossIncomeCash += req.estimatedPayout;
    } else {
      grossIncomeCard += req.estimatedPayout;
    }

    const fee = getPlatformFeeAmount(req);
    platformFeesTotal += fee;
    if (!isCashClientPayment(req) || isStripeDepositSatisfied(req)) {
      platformFeesCollected += fee;
    }

    if (req.paymentStatus === 'released') {
      const guardPay = guardPayoutAmount(req);
      guardPayoutsPaid += guardPay;
      if (isCashGuardPayout(req)) {
        guardPayoutsPaidCash += guardPay;
      } else {
        guardPayoutsPaidStripe += guardPay;
      }
    }
  }

  return {
    grossIncome: round2(grossIncome),
    grossIncomeCash: round2(grossIncomeCash),
    grossIncomeCard: round2(grossIncomeCard),
    platformFeesTotal: round2(platformFeesTotal),
    platformFeesCollected: round2(platformFeesCollected),
    platformFeesOutstanding: round2(platformFeesTotal - platformFeesCollected),
    guardPayoutsPaid: round2(guardPayoutsPaid),
    guardPayoutsPaidCash: round2(guardPayoutsPaidCash),
    guardPayoutsPaidStripe: round2(guardPayoutsPaidStripe),
    guardPayoutsDue: pipeline.guardPayoutDue,
    clientOwed: pipeline.awaitingClientTotal,
    stripeDepositPending: pipeline.cashDepositTotal,
    paidJobCount,
    settledJobCount: pipeline.settledCount,
    jobsInProgress: requests.filter((r) => r.status === 'in-progress').length,
    openMarketplaceJobs: requests.filter((r) => r.status === 'open').length,
  };
}

export function buildDirectorFinancialCells(financials: OperationalFinancials): OverviewMetricCell[] {
  const outstandingTotal = financials.clientOwed + financials.guardPayoutsDue + financials.stripeDepositPending;

  return [
    {
      label: 'Gross income',
      value: formatOperationalMoney(financials.grossIncome),
      sub:
        financials.paidJobCount === 0
          ? 'No client payments recorded yet'
          : `${formatOperationalMoney(financials.grossIncomeCard)} via Stripe · ${financials.paidJobCount} paid job${financials.paidJobCount === 1 ? '' : 's'}`,
      accent: financials.grossIncome > 0,
    },
    {
      label: 'Company payout',
      value: formatOperationalMoney(financials.platformFeesCollected),
      sub:
        financials.platformFeesOutstanding > 0
          ? `${formatOperationalMoney(financials.platformFeesOutstanding)} still to collect · ${formatOperationalMoney(financials.platformFeesTotal)} on paid jobs`
          : `${formatOperationalMoney(financials.platformFeesTotal)} earned on paid jobs`,
      accent: financials.platformFeesCollected > 0,
    },
    {
      label: 'Guard payouts',
      value: formatOperationalMoney(financials.guardPayoutsPaid),
      sub:
        financials.guardPayoutsPaid === 0
          ? financials.guardPayoutsDue > 0
            ? `${formatOperationalMoney(financials.guardPayoutsDue)} due on finished jobs`
            : 'No guard payouts released yet'
          : `${formatOperationalMoney(financials.guardPayoutsPaidStripe)} via Stripe${financials.guardPayoutsDue > 0 ? ` · ${formatOperationalMoney(financials.guardPayoutsDue)} due` : ''}`,
      accent: financials.guardPayoutsPaid > 0 || financials.guardPayoutsDue > 0,
    },
    {
      label: 'Outstanding',
      value: formatOperationalMoney(outstandingTotal),
      sub:
        [
          financials.clientOwed > 0 ? `${formatOperationalMoney(financials.clientOwed)} client` : null,
          financials.guardPayoutsDue > 0 ? `${formatOperationalMoney(financials.guardPayoutsDue)} guards` : null,
          financials.stripeDepositPending > 0
            ? `${formatOperationalMoney(financials.stripeDepositPending)} deposits`
            : null,
        ]
          .filter(Boolean)
          .join(' · ') || 'All payments current',
      accent: outstandingTotal > 0,
    },
  ];
}

export function buildDirectorOperationsLines(
  stats: PlatformStats,
  financials: OperationalFinancials,
  guards: SecurityGuard[],
  clients: Client[],
  requests: SecurityRequest[]
): DirectorOperationsLine[] {
  const fieldGuards = guards.filter((g) => !g.isStaff).length;
  const staffCount = guards.filter((g) => g.isStaff).length;
  const pendingReview = requests.filter((r) => r.status === 'pending-review').length;
  const activePipeline = requests.filter((r) =>
    ['pending-review', 'open', 'accepted', 'in-progress'].includes(r.status)
  ).length;

  return [
    {
      label: 'Jobs',
      value: `${requests.length} total · ${stats.completedJobs} completed · ${activePipeline} active in pipeline · ${financials.jobsInProgress} on site now`,
    },
    {
      label: 'Marketplace',
      value: `${financials.openMarketplaceJobs} open offer${financials.openMarketplaceJobs === 1 ? '' : 's'} · ${pendingReview} awaiting approval`,
    },
    {
      label: 'People',
      value: `${clients.length} client${clients.length === 1 ? '' : 's'} · ${fieldGuards} field guard${fieldGuards === 1 ? '' : 's'} · ${staffCount} staff`,
    },
    {
      label: 'Client collections',
      value: `${formatOperationalMoney(financials.grossIncomeCard)} via Stripe`,
    },
    {
      label: 'Guard settlements',
      value: `${financials.settledJobCount} job${financials.settledJobCount === 1 ? '' : 's'} fully settled · ${formatOperationalMoney(financials.guardPayoutsPaid)} paid to guards`,
    },
    {
      label: 'Approvals & incidents',
      value: `${stats.pendingApprovals} in approvals queue · ${stats.activeIncidents} open incident${stats.activeIncidents === 1 ? '' : 's'}`,
    },
  ];
}
