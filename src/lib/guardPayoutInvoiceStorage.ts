import { GuardPayoutInvoice, GuardPayoutInvoiceMethod, SecurityRequest } from '../types';
import { buildGuardPayoutInvoice } from './guardPayoutInvoice';

const STORAGE_KEY = 'guardr_guard_payout_invoices';

export function loadGuardPayoutInvoicesFromStorage(): GuardPayoutInvoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGuardPayoutInvoicesToStorage(invoices: GuardPayoutInvoice[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch {
    /* ignore */
  }
}

export function createGuardPayoutInvoiceRecord(params: {
  guard: { id: string; name: string; email: string };
  method: GuardPayoutInvoiceMethod;
  jobs: SecurityRequest[];
}): GuardPayoutInvoice {
  const built = buildGuardPayoutInvoice({
    guard: params.guard,
    method: params.method,
    jobs: params.jobs,
  });
  const now = new Date().toISOString();
  return {
    id: `gpinv-${Date.now()}`,
    guardId: params.guard.id,
    guardName: params.guard.name,
    guardEmail: params.guard.email,
    method: params.method,
    lines: built.lines,
    jobIds: built.lines.map((line) => line.jobId),
    total: built.total,
    status: 'open',
    createdAt: now,
  };
}

export function openGuardPayoutInvoices(
  invoices: GuardPayoutInvoice[],
  guardId?: string,
  method?: GuardPayoutInvoiceMethod
): GuardPayoutInvoice[] {
  return invoices
    .filter((invoice) => {
      if (invoice.status !== 'open') return false;
      if (guardId && invoice.guardId !== guardId) return false;
      if (method && invoice.method !== method) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function invoiceJobsAllPaid(invoice: GuardPayoutInvoice, requests: SecurityRequest[]): boolean {
  return invoice.jobIds.every((jobId) => {
    const job = requests.find((r) => r.id === jobId);
    return job?.paymentStatus === 'released';
  });
}

export function maybeCompletePayoutInvoice(
  invoice: GuardPayoutInvoice,
  requests: SecurityRequest[]
): GuardPayoutInvoice {
  if (invoice.status !== 'open' || !invoiceJobsAllPaid(invoice, requests)) {
    return invoice;
  }
  return {
    ...invoice,
    status: 'completed',
    resolvedAt: new Date().toISOString(),
  };
}

export function payoutInvoiceLabel(invoice: GuardPayoutInvoice): string {
  return invoice.method === 'cash' ? 'Cash pickup' : 'Bank transfer';
}
