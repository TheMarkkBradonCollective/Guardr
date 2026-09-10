import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Loader2,
} from 'lucide-react';
import type { Client, SecurityRequest } from '../../types';
import type { ClientPaymentGates } from '../../lib/platformSettings';
import {
  downloadInvoicePdf,
  formatInvoiceCurrency,
  type ClientInvoice,
} from '../../lib/clientInvoicing';
import {
  invoiceAwaitingPayment,
  unpaidClientInvoices,
} from '../../lib/clientInvoiceStorage';
import { canClientPayWithSquare, canClientPayWithStripe } from '../../lib/jobEditRules';
import { clientPaymentStatusLabel } from '../../lib/paymentDisplay';
import { createCheckoutSession } from '../../lib/stripeApi';
import { createSquareCheckoutSession } from '../../lib/paymentProcessorApi';
import { showAppToast } from '../ui/AppToast';
import { userFacingError } from '../../lib/userFacingError';
import { useClientCapabilities } from './ClientCapabilitiesContext';
import {
  AppEmptyState,
  AppList,
  AppListRow,
  AppScreen,
  AppSubScreenHeader,
} from '../ui/app/AppPrimitives';
import { ListDetailLayout } from '../ui/app/ListDetailLayout';
import { WfBadge } from '../ui/wireframe';
import { formatShiftRange } from '../../lib/dates';
import { useLayoutFormFactor } from '../../surfaces';

interface ClientInvoiceScreenProps {
  client: Client;
  clientEmail: string;
  requests: SecurityRequest[];
  invoices: ClientInvoice[];
  paymentGates: ClientPaymentGates;
  selectedRequestId?: string | null;
  onSelectRequestId?: (requestId: string | null) => void;
  onBack?: () => void;
}

function invoiceStatusTone(
  invoice: ClientInvoice,
  request?: SecurityRequest
): 'warning' | 'success' | 'default' {
  if (invoice.status === 'paid' || (request?.paymentStatus && request.paymentStatus !== 'unpaid')) {
    return 'success';
  }
  if (invoiceAwaitingPayment(invoice, request)) return 'warning';
  return 'default';
}

function invoiceStatusLabel(invoice: ClientInvoice, request?: SecurityRequest): string {
  if (invoice.status === 'paid' || (request?.paymentStatus && request.paymentStatus !== 'unpaid')) {
    return request ? clientPaymentStatusLabel(request.paymentStatus, request) : 'Paid';
  }
  if (invoiceAwaitingPayment(invoice, request)) return 'Payment due';
  if (invoice.status === 'void') return 'Void';
  return 'Draft';
}

export function ClientInvoiceScreen({
  client,
  clientEmail,
  requests,
  invoices,
  paymentGates,
  selectedRequestId = null,
  onSelectRequestId,
  onBack,
}: ClientInvoiceScreenProps) {
  const formFactor = useLayoutFormFactor();
  const [payingJobId, setPayingJobId] = useState<string | null>(null);
  const [payingSquareJobId, setPayingSquareJobId] = useState<string | null>(null);
  const caps = useClientCapabilities();
  const invoicesTitle = caps.isPersonal ? 'Payments' : 'Billing';

  const clientInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.clientId === client.id),
    [invoices, client.id]
  );
  const requestById = useMemo(() => new Map(requests.map((request) => [request.id, request])), [requests]);
  const unpaid = useMemo(() => unpaidClientInvoices(clientInvoices, client.id), [clientInvoices, client.id]);
  const selectedInvoice = selectedRequestId
    ? clientInvoices.find((invoice) => invoice.requestId === selectedRequestId) ?? null
    : null;
  const selectedRequest = selectedRequestId ? requestById.get(selectedRequestId) : undefined;

  const handlePayWithStripe = async (request: SecurityRequest) => {
    setPayingJobId(request.id);
    try {
      const amountCents = Math.round(request.estimatedPayout * 100);
      const { url } = await createCheckoutSession({
        jobId: request.id,
        clientEmail,
        jobTitle: request.title,
        amountCents,
      });
      if (url) window.location.href = url;
    } catch (error: unknown) {
      showAppToast(userFacingError(error, 'Unable to start checkout'), { tone: 'error' });
    } finally {
      setPayingJobId(null);
    }
  };

  const handlePayWithSquare = async (request: SecurityRequest) => {
    setPayingSquareJobId(request.id);
    try {
      const amountCents = Math.round(request.estimatedPayout * 100);
      const { url } = await createSquareCheckoutSession({
        jobId: request.id,
        clientEmail,
        jobTitle: request.title,
        amountCents,
      });
      if (url) window.location.href = url;
    } catch (error: unknown) {
      showAppToast(userFacingError(error, 'Unable to start Square checkout'), { tone: 'error' });
    } finally {
      setPayingSquareJobId(null);
    }
  };

  const renderInvoiceDetail = (
    invoice: ClientInvoice,
    options?: { onBack?: () => void }
  ) => {
    const request = invoice.requestId ? requestById.get(invoice.requestId) : undefined;
    const awaitingPayment = request
      ? invoiceAwaitingPayment(invoice, request)
      : invoice.status === 'sent';
    const canPayStripe = request ? canClientPayWithStripe(request, paymentGates) : false;
    const canPaySquare = request ? canClientPayWithSquare(request, paymentGates) : false;

    return (
      <div className="app-full-page-detail min-w-0 max-w-full">
        {options?.onBack ? (
          <AppSubScreenHeader
            title="Invoice"
            hideTitle
            onBack={options.onBack}
            backLabel={invoicesTitle}
          />
        ) : null}
        <div className="px-5 space-y-5">
          <div className="staff-mgmt-detail-row space-y-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-text-muted">Invoice</p>
                <p className="text-lg font-bold text-brand-text">{invoice.invoiceNumber}</p>
              </div>
              <WfBadge tone={invoiceStatusTone(invoice, request)}>
                {invoiceStatusLabel(invoice, request)}
              </WfBadge>
            </div>
            {request ? (
              <>
                <p className="text-sm font-semibold text-brand-text">{request.title}</p>
                <p className="text-xs text-brand-text-muted">
                  {request.siteName || request.address || request.location}
                </p>
                <p className="text-xs text-brand-text-muted">
                  {formatShiftRange(request.startDate, request.endDate)}
                </p>
              </>
            ) : null}
            <p className="text-xs text-brand-text-muted">
              Issued{' '}
              {new Date(invoice.issuedAt ?? invoice.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div className="border-t border-brand-border">
            {invoice.lineItems.map((line) => (
              <div
                key={`${line.description}-${line.amount}`}
                className="flex items-start justify-between gap-3 py-3 border-b border-brand-border last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-sm text-brand-text">{line.description}</p>
                  <p className="text-xs text-brand-text-muted">
                    {line.quantity} × {formatInvoiceCurrency(line.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-medium text-brand-text shrink-0">
                  {formatInvoiceCurrency(line.amount)}
                </p>
              </div>
            ))}
            <div className="py-3 space-y-1">
              <div className="flex justify-between text-sm text-brand-text-muted">
                <span>Subtotal</span>
                <span>{formatInvoiceCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.platformFee > 0 ? (
                <div className="flex justify-between text-sm text-brand-text-muted">
                  <span>Platform fee</span>
                  <span>{formatInvoiceCurrency(invoice.platformFee)}</span>
                </div>
              ) : null}
              {invoice.tax > 0 ? (
                <div className="flex justify-between text-sm text-brand-text-muted">
                  <span>Tax</span>
                  <span>{formatInvoiceCurrency(invoice.tax)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-bold text-brand-text pt-1">
                <span>Total due</span>
                <span>{formatInvoiceCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {awaitingPayment && request && (canPayStripe || canPaySquare) ? (
            <div className="rounded-2xl border border-brand-primary/30 bg-brand-primary/10 p-4 space-y-3">
              <p className="text-sm font-semibold text-brand-text">Pay this invoice</p>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Complete payment to publish your job on the Guardr marketplace and let guards apply.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                {canPayStripe ? (
                  <button
                    type="button"
                    onClick={() => void handlePayWithStripe(request)}
                    disabled={payingJobId === request.id || payingSquareJobId === request.id}
                    className="app-button-primary !w-auto !h-10 !px-5 !text-sm gap-1.5 disabled:opacity-50"
                  >
                    {payingJobId === request.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Redirecting...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" /> Pay with Stripe
                      </>
                    )}
                  </button>
                ) : null}
                {canPaySquare ? (
                  <button
                    type="button"
                    onClick={() => void handlePayWithSquare(request)}
                    disabled={payingJobId === request.id || payingSquareJobId === request.id}
                    className="app-button-outline !w-auto !h-10 !px-5 !text-sm gap-1.5 disabled:opacity-50"
                  >
                    {payingSquareJobId === request.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Redirecting...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" /> Pay with Square
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {!awaitingPayment ? (
            <p className="text-xs text-emerald-400/90 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Payment received — thank you.
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => downloadInvoicePdf(invoice, client)}
            className="app-button-outline !w-full gap-2"
          >
            <Download className="w-4 h-4" /> Download invoice
          </button>
        </div>
      </div>
    );
  };

  if (formFactor === 'tablet') {
    const unpaidBanner = unpaid.length > 0 ? (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
        <p className="text-sm font-semibold text-amber-200">
          {unpaid.length} invoice{unpaid.length === 1 ? '' : 's'} awaiting payment
        </p>
        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
          Pay approved jobs to publish them on the marketplace.
        </p>
      </div>
    ) : null;

    return (
      <AppScreen className="h-full min-h-0">
        {onBack ? (
          <AppSubScreenHeader title={invoicesTitle} onBack={onBack} backLabel="Home" hideTitle />
        ) : null}
        {unpaidBanner ? <div className="px-4 mb-4">{unpaidBanner}</div> : null}
        {clientInvoices.length === 0 ? (
          <AppEmptyState icon={<FileText className="w-5 h-5" />} title={caps.isPersonal ? 'No payments yet' : 'No invoices yet'}>
            {caps.isPersonal
              ? 'Invoices and payment history for your services will appear here.'
              : 'When Guardr approves your job, an invoice will appear here for payment.'}
          </AppEmptyState>
        ) : (
          <ListDetailLayout
            items={clientInvoices}
            selectedId={selectedRequestId}
            onSelectId={(id) => onSelectRequestId?.(id)}
            getItemId={(invoice) => invoice.requestId ?? invoice.id}
            autoSelectFirst
            mobilePresentation="page"
            emptyDetail={
              <div className="sft-empty">
                <p className="sft-empty-title">Select an invoice</p>
                <p className="sft-empty-message">Choose a bill from the list to review line items and pay.</p>
              </div>
            }
            renderItem={(invoice, isSelected, onSelect) => {
              const request = invoice.requestId ? requestById.get(invoice.requestId) : undefined;
              const tone = invoiceStatusTone(invoice, request);
              return (
                <button
                  type="button"
                  onClick={invoice.requestId ? onSelect : undefined}
                  disabled={!invoice.requestId}
                  data-selected={isSelected ? 'true' : undefined}
                  className="app-list-row app-list-row-align-top flex-col !items-stretch gap-2 text-left w-full disabled:opacity-60"
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    <div>
                      <p className="font-semibold text-sm">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-brand-text-muted mt-0.5">
                        {request?.title ?? 'Security services'}
                      </p>
                      {request ? (
                        <p className="text-xs text-brand-text-muted mt-0.5">
                          {request.siteName || request.address || request.location}
                        </p>
                      ) : null}
                    </div>
                    <WfBadge tone={tone}>{invoiceStatusLabel(invoice, request)}</WfBadge>
                  </div>
                  <div className="flex items-center justify-between gap-2 w-full">
                    <p className="text-sm font-medium text-brand-text">
                      {formatInvoiceCurrency(invoice.total)}
                    </p>
                    <p className="text-xs text-brand-text-muted">
                      {request
                        ? formatShiftRange(request.startDate, request.endDate)
                        : new Date(invoice.issuedAt ?? invoice.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                    </p>
                  </div>
                </button>
              );
            }}
            renderDetail={(invoice, options) => renderInvoiceDetail(invoice, options)}
          />
        )}
      </AppScreen>
    );
  }

  if (selectedInvoice) {
    const awaitingPayment = selectedRequest
      ? invoiceAwaitingPayment(selectedInvoice, selectedRequest)
      : selectedInvoice.status === 'sent';
    const canPayStripe = selectedRequest
      ? canClientPayWithStripe(selectedRequest, paymentGates)
      : false;
    const canPaySquare = selectedRequest
      ? canClientPayWithSquare(selectedRequest, paymentGates)
      : false;

    return (
      <AppScreen className="app-full-page-detail pb-8">
        <AppSubScreenHeader
          title="Invoice"
          hideTitle
          onBack={() => onSelectRequestId?.(null)}
          backLabel={invoicesTitle}
        />
        <div className="px-5 space-y-5">
          <div className="staff-mgmt-detail-row space-y-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-text-muted">Invoice</p>
                <p className="text-lg font-bold text-brand-text">{selectedInvoice.invoiceNumber}</p>
              </div>
              <WfBadge tone={invoiceStatusTone(selectedInvoice, selectedRequest)}>
                {invoiceStatusLabel(selectedInvoice, selectedRequest)}
              </WfBadge>
            </div>
            {selectedRequest ? (
              <>
                <p className="text-sm font-semibold text-brand-text">{selectedRequest.title}</p>
                <p className="text-xs text-brand-text-muted">
                  {selectedRequest.siteName || selectedRequest.address || selectedRequest.location}
                </p>
                <p className="text-xs text-brand-text-muted">
                  {formatShiftRange(selectedRequest.startDate, selectedRequest.endDate)}
                </p>
              </>
            ) : null}
            <p className="text-xs text-brand-text-muted">
              Issued{' '}
              {new Date(selectedInvoice.issuedAt ?? selectedInvoice.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div className="border-t border-brand-border">
            {selectedInvoice.lineItems.map((line) => (
              <div
                key={`${line.description}-${line.amount}`}
                className="flex items-start justify-between gap-3 py-3 border-b border-brand-border last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-sm text-brand-text">{line.description}</p>
                  <p className="text-xs text-brand-text-muted">
                    {line.quantity} × {formatInvoiceCurrency(line.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-medium text-brand-text shrink-0">
                  {formatInvoiceCurrency(line.amount)}
                </p>
              </div>
            ))}
            <div className="py-3 space-y-1">
              <div className="flex justify-between text-sm text-brand-text-muted">
                <span>Subtotal</span>
                <span>{formatInvoiceCurrency(selectedInvoice.subtotal)}</span>
              </div>
              {selectedInvoice.platformFee > 0 ? (
                <div className="flex justify-between text-sm text-brand-text-muted">
                  <span>Platform fee</span>
                  <span>{formatInvoiceCurrency(selectedInvoice.platformFee)}</span>
                </div>
              ) : null}
              {selectedInvoice.tax > 0 ? (
                <div className="flex justify-between text-sm text-brand-text-muted">
                  <span>Tax</span>
                  <span>{formatInvoiceCurrency(selectedInvoice.tax)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-bold text-brand-text pt-1">
                <span>Total due</span>
                <span>{formatInvoiceCurrency(selectedInvoice.total)}</span>
              </div>
            </div>
          </div>

          {awaitingPayment && selectedRequest && (canPayStripe || canPaySquare) ? (
            <div className="rounded-2xl border border-brand-primary/30 bg-brand-primary/10 p-4 space-y-3">
              <p className="text-sm font-semibold text-brand-text">Pay this invoice</p>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Complete payment to publish your job on the Guardr marketplace and let guards apply.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                {canPayStripe ? (
                  <button
                    type="button"
                    onClick={() => void handlePayWithStripe(selectedRequest)}
                    disabled={payingJobId === selectedRequest.id || payingSquareJobId === selectedRequest.id}
                    className="app-button-primary !w-auto !h-10 !px-5 !text-sm gap-1.5 disabled:opacity-50"
                  >
                    {payingJobId === selectedRequest.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Redirecting...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" /> Pay with Stripe
                      </>
                    )}
                  </button>
                ) : null}
                {canPaySquare ? (
                  <button
                    type="button"
                    onClick={() => void handlePayWithSquare(selectedRequest)}
                    disabled={payingJobId === selectedRequest.id || payingSquareJobId === selectedRequest.id}
                    className="app-button-outline !w-auto !h-10 !px-5 !text-sm gap-1.5 disabled:opacity-50"
                  >
                    {payingSquareJobId === selectedRequest.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Redirecting...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" /> Pay with Square
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {!awaitingPayment ? (
            <p className="text-xs text-emerald-400/90 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Payment received — thank you.
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => downloadInvoicePdf(selectedInvoice, client)}
            className="app-button-outline !w-full gap-2"
          >
            <Download className="w-4 h-4" /> Download invoice
          </button>
        </div>
      </AppScreen>
    );
  }

  return (
    <AppScreen className="pb-8">
      {onBack ? (
        <AppSubScreenHeader title={invoicesTitle} onBack={onBack} backLabel="Home" hideTitle />
      ) : null}

      {unpaid.length > 0 ? (
        <div className="px-4 mb-4">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-200">
              {unpaid.length} invoice{unpaid.length === 1 ? '' : 's'} awaiting payment
            </p>
            <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
              Pay approved jobs to publish them on the marketplace.
            </p>
          </div>
        </div>
      ) : null}

      {clientInvoices.length === 0 ? (
        <AppEmptyState icon={<FileText className="w-5 h-5" />} title={caps.isPersonal ? 'No payments yet' : 'No invoices yet'}>
          {caps.isPersonal
            ? 'Invoices and payment history for your services will appear here.'
            : 'When Guardr approves your job, an invoice will appear here for payment.'}
        </AppEmptyState>
      ) : (
        <AppList>
          {clientInvoices.map((invoice) => {
            const request = invoice.requestId ? requestById.get(invoice.requestId) : undefined;
            const tone = invoiceStatusTone(invoice, request);
            return (
              <AppListRow
                key={invoice.id}
                onClick={
                  invoice.requestId ? () => onSelectRequestId?.(invoice.requestId!) : undefined
                }
                className="app-list-row-align-top flex-col !items-stretch gap-2"
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div>
                    <p className="font-semibold text-sm">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-brand-text-muted mt-0.5">
                      {request?.title ?? 'Security services'}
                    </p>
                  </div>
                  <WfBadge tone={tone}>{invoiceStatusLabel(invoice, request)}</WfBadge>
                </div>
                <div className="flex items-center justify-between gap-2 w-full">
                  <p className="text-sm font-medium text-brand-text">
                    {formatInvoiceCurrency(invoice.total)}
                  </p>
                  <p className="text-xs text-brand-text-muted">
                    {new Date(invoice.issuedAt ?? invoice.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </AppListRow>
            );
          })}
        </AppList>
      )}
    </AppScreen>
  );
}
