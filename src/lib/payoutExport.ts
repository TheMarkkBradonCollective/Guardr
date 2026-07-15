import type { Payment, SecurityGuard, SecurityRequest } from '../types';

export interface PayoutExportRow {
  jobId: string;
  jobTitle: string;
  clientName: string;
  guardId: string;
  guardName: string;
  guardEmail: string;
  estimatedPayout: number;
  guardPay: number;
  durationHours: number;
  paymentStatus: string;
  guardPayoutMethod: string;
  guardPayoutAvailable: boolean;
  jobStatus: string;
  startDate: string;
  completedAt: string;
}

function csvEscape(value: string | number | boolean): string {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function buildPayoutExportRows(
  requests: SecurityRequest[],
  guards: SecurityGuard[],
  payments: Payment[]
): PayoutExportRow[] {
  const guardById = new Map(guards.map((g) => [g.id, g]));
  const paymentByJob = new Map(payments.map((p) => [p.jobId, p]));

  return requests
    .filter((r) => r.assignedGuardId && (r.status === 'completed' || r.guardPayoutAvailable))
    .map((job) => {
      const guard = guardById.get(job.assignedGuardId!);
      const payment = paymentByJob.get(job.id);
      return {
        jobId: job.id,
        jobTitle: job.title,
        clientName: job.clientName,
        guardId: job.assignedGuardId!,
        guardName: guard?.name ?? 'Unknown',
        guardEmail: guard?.email ?? '',
        estimatedPayout: job.estimatedPayout,
        guardPay: job.guardPay ?? job.hourlyRate,
        durationHours: job.durationHours,
        paymentStatus: payment?.status ?? job.paymentStatus ?? 'unknown',
        guardPayoutMethod: job.guardPayoutMethod ?? '',
        guardPayoutAvailable: !!job.guardPayoutAvailable,
        jobStatus: job.status,
        startDate: job.startDate,
        completedAt: job.endDate,
      };
    })
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export function payoutExportToCsv(rows: PayoutExportRow[]): string {
  const headers = [
    'job_id',
    'job_title',
    'client_name',
    'guard_id',
    'guard_name',
    'guard_email',
    'estimated_payout',
    'guard_pay_per_hour',
    'duration_hours',
    'payment_status',
    'guard_payout_method',
    'guard_payout_available',
    'job_status',
    'start_date',
    'completed_at',
  ] as const;

  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((key) => csvEscape(row[key as keyof PayoutExportRow] ?? '')).join(',')
    ),
  ];
  return lines.join('\n');
}

export function downloadPayoutCsv(rows: PayoutExportRow[], filename = 'guardr-payouts.csv'): void {
  const csv = payoutExportToCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
