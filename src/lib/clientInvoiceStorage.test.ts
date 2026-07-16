import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityRequest, Client } from '../types';
import {
  invoiceAwaitingPayment,
  syncInvoicePaymentStatus,
  upsertClientInvoice,
} from './clientInvoiceStorage';
import { issueInvoiceForApprovedJob } from './clientInvoicing';

function sampleRequest(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    id: 'job-1',
    clientId: 'client-1',
    title: 'Night patrol',
    status: 'open',
    paymentStatus: 'unpaid',
    estimatedPayout: 420,
    hourlyRate: 35,
    durationHours: 8,
    guardsNeeded: 1,
  } as SecurityRequest;
}

function sampleClient(): Client {
  return {
    id: 'client-1',
    name: 'Acme',
    companyName: 'Acme Security',
    email: 'client@test.com',
    phone: '',
    avatar: '',
    totalRequests: 1,
  } as Client;
}

describe('client invoice storage', () => {
  it('issues sent invoices for approved jobs', () => {
    const invoice = issueInvoiceForApprovedJob(sampleRequest(), sampleClient());
    assert.equal(invoice.status, 'sent');
    assert.ok(invoice.issuedAt);
    assert.equal(invoice.requestId, 'job-1');
  });

  it('marks invoices paid when request payment status changes', () => {
    const invoice = issueInvoiceForApprovedJob(sampleRequest(), sampleClient());
    const synced = syncInvoicePaymentStatus([invoice], [
      { ...sampleRequest(), paymentStatus: 'held' },
    ]);
    assert.equal(synced[0]?.status, 'paid');
    assert.ok(synced[0]?.paidAt);
  });

  it('detects awaiting payment only for sent unpaid invoices', () => {
    const invoice = issueInvoiceForApprovedJob(sampleRequest(), sampleClient());
    assert.equal(invoiceAwaitingPayment(invoice, sampleRequest()), true);
    assert.equal(
      invoiceAwaitingPayment(invoice, { ...sampleRequest(), paymentStatus: 'held' }),
      false
    );
  });

  it('replaces prior invoice for the same request', () => {
    const first = issueInvoiceForApprovedJob(sampleRequest(), sampleClient());
    const second = issueInvoiceForApprovedJob(
      { ...sampleRequest(), estimatedPayout: 500 },
      sampleClient()
    );
    const merged = upsertClientInvoice([first], second);
    assert.equal(merged.length, 1);
    assert.equal(merged[0]?.total, second.total);
  });
});
