import type { SecurityRequest, Client } from '../types';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface ClientInvoice {
  id: string;
  clientId: string;
  requestId?: string;
  invoiceNumber: string;
  subtotal: number;
  platformFee: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'void';
  lineItems: InvoiceLineItem[];
  issuedAt?: string;
  paidAt?: string;
  createdAt: string;
}

let invoiceCounter = 1000;

export function generateInvoiceNumber(): string {
  invoiceCounter++;
  const year = new Date().getFullYear();
  return `GRD-${year}-${String(invoiceCounter).padStart(5, '0')}`;
}

export function issueInvoiceForApprovedJob(
  request: SecurityRequest,
  client: Client,
  taxRate = 0
): ClientInvoice {
  const invoice = buildInvoiceFromJob(request, client, taxRate);
  const issuedAt = new Date().toISOString();
  return {
    ...invoice,
    status: 'sent',
    issuedAt,
  };
}

export function buildInvoiceFromJob(
  request: SecurityRequest,
  client: Client,
  taxRate = 0
): ClientInvoice {
  const hours = request.durationHours ?? 8;
  const rate = request.hourlyRate ?? 35;
  const guards = request.guardsNeeded ?? 1;
  const subtotal = rate * hours * guards;
  const platformFee = (request.platformFeePerHour ?? 5) * hours * guards;
  const tax = (subtotal + platformFee) * taxRate;
  const total = subtotal + platformFee + tax;

  const lineItems: InvoiceLineItem[] = [
    {
      description: `${request.title} — ${request.siteName || request.address || 'Security services'}`,
      quantity: hours * guards,
      unitPrice: rate,
      amount: subtotal,
    },
  ];

  if (platformFee > 0) {
    lineItems.push({
      description: 'Platform service fee',
      quantity: hours * guards,
      unitPrice: request.platformFeePerHour ?? 5,
      amount: platformFee,
    });
  }

  return {
    id: `inv-${Date.now()}`,
    clientId: client.id,
    requestId: request.id,
    invoiceNumber: generateInvoiceNumber(),
    subtotal,
    platformFee,
    tax,
    total,
    status: 'draft',
    lineItems,
    createdAt: new Date().toISOString(),
  };
}

export function formatInvoiceCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function invoiceToPdfText(invoice: ClientInvoice, client: Client): string {
  const lines = [
    'GUARDR INVOICE',
    `Invoice #: ${invoice.invoiceNumber}`,
    `Date: ${new Date(invoice.createdAt).toLocaleDateString()}`,
    `Client: ${client.companyName || client.name}`,
    '',
    'Line Items:',
    ...invoice.lineItems.map(
      (li) => `  ${li.description} — ${li.quantity} × ${formatInvoiceCurrency(li.unitPrice)} = ${formatInvoiceCurrency(li.amount)}`
    ),
    '',
    `Subtotal: ${formatInvoiceCurrency(invoice.subtotal)}`,
    `Platform fee: ${formatInvoiceCurrency(invoice.platformFee)}`,
    invoice.tax > 0 ? `Tax: ${formatInvoiceCurrency(invoice.tax)}` : '',
    `TOTAL: ${formatInvoiceCurrency(invoice.total)}`,
    '',
    'Thank you for using Guardr.',
  ];
  return lines.filter(Boolean).join('\n');
}

export function downloadInvoicePdf(invoice: ClientInvoice, client: Client): void {
  const text = invoiceToPdfText(invoice, client);
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoice.invoiceNumber}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
