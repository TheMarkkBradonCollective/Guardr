import React, { useState } from 'react';
import { ClientInvoiceScreen } from '../../components/client/ClientInvoiceScreen';
import type { ClientInvoice } from '../../lib/clientInvoicing';
import type { Client, SecurityRequest } from '../../types';
import { PREVIEW_JOB } from '../previewStaffFixtures';
import { previewScreenState } from '../previewScreenState';

const CLIENT: Client = {
  id: 'client-preview-1',
  name: 'Portage Distribution',
  companyName: 'Portage Distribution',
  email: 'billing@portage.example',
  phone: '',
  avatar: '',
  totalRequests: 1,
};

const REQUEST: SecurityRequest = {
  ...PREVIEW_JOB,
  clientId: CLIENT.id,
  paymentStatus: 'unpaid',
};

const INVOICE: ClientInvoice = {
  id: 'inv-preview-1',
  clientId: CLIENT.id,
  requestId: REQUEST.id,
  invoiceNumber: 'INV-1042',
  subtotal: 224,
  platformFee: 56,
  tax: 0,
  total: 280,
  status: 'sent',
  lineItems: [
    { description: 'Dock A3 coverage', quantity: 8, unitPrice: 28, amount: 224 },
  ],
  issuedAt: '2026-09-01T15:00:00.000Z',
  createdAt: '2026-09-01T15:00:00.000Z',
};

/** Real client checkout screen, driven by fixture invoices. */
export function InvoicePreviewScreen() {
  const state = previewScreenState();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const invoices = state === 'empty' ? [] : [INVOICE];

  return (
    <div className="invoice-preview h-full min-h-0">
      {state === 'error' ? (
        <p className="invoice-preview-error" role="alert">
          Checkout could not be confirmed. You can try the payment buttons again.
        </p>
      ) : null}
      <ClientInvoiceScreen
        client={CLIENT}
        clientEmail={CLIENT.email}
        requests={state === 'empty' ? [] : [REQUEST]}
        invoices={invoices}
        paymentGates={{ allowStripe: true, allowSquare: true }}
        selectedRequestId={state === 'empty' ? null : selectedRequestId}
        onSelectRequestId={setSelectedRequestId}
      />
    </div>
  );
}
