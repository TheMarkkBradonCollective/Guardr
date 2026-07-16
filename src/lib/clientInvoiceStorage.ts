import type { SupabaseClient } from '@supabase/supabase-js';
import type { Client, SecurityRequest } from '../types';
import {
  buildInvoiceFromJob,
  formatInvoiceCurrency,
  issueInvoiceForApprovedJob,
  type ClientInvoice,
  type InvoiceLineItem,
} from './clientInvoicing';

const STORAGE_KEY = 'guardr_client_invoices';

export function loadClientInvoicesFromStorage(): ClientInvoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveClientInvoicesToStorage(invoices: ClientInvoice[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch {
    /* ignore */
  }
}

function parseLineItems(value: unknown): InvoiceLineItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const item = row as Record<string, unknown>;
      const description = typeof item.description === 'string' ? item.description : '';
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unit_price ?? item.unitPrice);
      const amount = Number(item.amount);
      if (!description || !Number.isFinite(quantity) || !Number.isFinite(unitPrice) || !Number.isFinite(amount)) {
        return null;
      }
      return { description, quantity, unitPrice, amount };
    })
    .filter((item): item is InvoiceLineItem => item != null);
}

export function clientInvoiceFromRow(row: Record<string, unknown>): ClientInvoice {
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    requestId: row.request_id ? String(row.request_id) : undefined,
    invoiceNumber: String(row.invoice_number),
    subtotal: Number(row.subtotal ?? 0),
    platformFee: Number(row.platform_fee ?? 0),
    tax: Number(row.tax ?? 0),
    total: Number(row.total ?? 0),
    status: (row.status as ClientInvoice['status']) ?? 'draft',
    lineItems: parseLineItems(row.line_items),
    issuedAt: row.issued_at ? String(row.issued_at) : undefined,
    paidAt: row.paid_at ? String(row.paid_at) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function clientInvoiceToRow(invoice: ClientInvoice): Record<string, unknown> {
  return {
    id: invoice.id,
    client_id: invoice.clientId,
    request_id: invoice.requestId ?? null,
    invoice_number: invoice.invoiceNumber,
    subtotal: invoice.subtotal,
    platform_fee: invoice.platformFee,
    tax: invoice.tax,
    total: invoice.total,
    status: invoice.status,
    line_items: invoice.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      amount: item.amount,
    })),
    issued_at: invoice.issuedAt ?? null,
    paid_at: invoice.paidAt ?? null,
    created_at: invoice.createdAt,
  };
}

export function upsertClientInvoice(
  invoices: ClientInvoice[],
  invoice: ClientInvoice
): ClientInvoice[] {
  const withoutDup = invoices.filter(
    (row) => row.id !== invoice.id && row.requestId !== invoice.requestId
  );
  return [invoice, ...withoutDup].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function invoicesForClient(invoices: ClientInvoice[], clientId: string): ClientInvoice[] {
  return invoices
    .filter((invoice) => invoice.clientId === clientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function unpaidClientInvoices(invoices: ClientInvoice[], clientId: string): ClientInvoice[] {
  return invoicesForClient(invoices, clientId).filter((invoice) => invoice.status === 'sent');
}

export function invoiceAwaitingPayment(
  invoice: ClientInvoice,
  request?: SecurityRequest | null
): boolean {
  if (invoice.status !== 'sent') return false;
  if (!request) return true;
  return !request.paymentStatus || request.paymentStatus === 'unpaid';
}

export function syncInvoicePaymentStatus(
  invoices: ClientInvoice[],
  requests: SecurityRequest[]
): ClientInvoice[] {
  const requestById = new Map(requests.map((request) => [request.id, request]));
  let changed = false;
  const next = invoices.map((invoice) => {
    if (!invoice.requestId || invoice.status === 'paid' || invoice.status === 'void') {
      return invoice;
    }
    const request = requestById.get(invoice.requestId);
    if (!request?.paymentStatus || request.paymentStatus === 'unpaid') return invoice;
    changed = true;
    return {
      ...invoice,
      status: 'paid' as const,
      paidAt: invoice.paidAt ?? new Date().toISOString(),
    };
  });
  return changed ? next : invoices;
}

export async function persistClientInvoiceToDb(
  db: SupabaseClient,
  invoice: ClientInvoice
): Promise<void> {
  const { error } = await db.from('client_invoices').upsert(clientInvoiceToRow(invoice));
  if (error) throw error;
}

export function createApprovedJobInvoice(request: SecurityRequest, client: Client): ClientInvoice {
  return issueInvoiceForApprovedJob(request, client);
}

export function invoiceReadyNotificationBody(request: SecurityRequest, invoice: ClientInvoice): string {
  return `Your invoice for "${request.title}" is ready — ${formatInvoiceCurrency(invoice.total)} due. Pay to publish on the marketplace.`;
}

export function invoiceReadyNotificationUrl(requestId: string): string {
  return `/client/invoices?inv=${encodeURIComponent(requestId)}`;
}

/** Build a receipt-style invoice after a job completes when none was issued at approval. */
export function ensureCompletedJobInvoice(
  invoices: ClientInvoice[],
  request: SecurityRequest,
  client: Client
): ClientInvoice | null {
  if (!['completed', 'closed'].includes(request.status)) return null;
  if (invoices.some((invoice) => invoice.requestId === request.id)) return null;
  const invoice = buildInvoiceFromJob(request, client);
  return {
    ...invoice,
    status: request.paymentStatus && request.paymentStatus !== 'unpaid' ? 'paid' : 'sent',
    issuedAt: invoice.createdAt,
    paidAt:
      request.paymentStatus && request.paymentStatus !== 'unpaid'
        ? invoice.createdAt
        : undefined,
  };
}
