import React, { useState } from 'react';
import { PaymentsPage } from '../../components/payments/PaymentsPage';
import { showAppToast } from '../../components/ui/AppToast';
import { useSurfaceKind } from '../../surfaces';
import { PREVIEW_JOB } from '../previewStaffFixtures';
import { previewScreenState } from '../previewScreenState';

const RECORDS = [
  {
    id: 'payout',
    kind: 'Payout',
    title: PREVIEW_JOB.title,
    amount: `$${PREVIEW_JOB.estimatedPayout.toFixed(2)}`,
    status: 'Pending',
  },
  {
    id: 'invoice',
    kind: 'Invoice',
    title: PREVIEW_JOB.clientName,
    amount: '$280.00',
    status: 'Payment due',
  },
];

/**
 * Checkout-shaped payments chrome. Pay does not call Stripe — it surfaces the
 * same checkout error the live invoice screen shows when a session cannot start.
 */
export function PaymentsPreviewScreen() {
  const surface = useSurfaceKind();
  const state = previewScreenState();
  const [selectedId, setSelectedId] = useState<string | null>(RECORDS[1]?.id ?? null);
  const records = state === 'ready' ? RECORDS : [];
  const selected = records.find((record) => record.id === selectedId) ?? null;

  const failCheckout = () => {
    showAppToast('Unable to start checkout', { tone: 'error' });
  };

  if (state === 'error') {
    return (
      <PaymentsPage role="staff">
        <div className={`pay-surface pay-surface--${surface} pay-surface--state`} role="alert">
          <p className="pay-surface-error-title">Couldn&apos;t load payments</p>
          <p>Invoices and payouts did not come back.</p>
          <button type="button" onClick={failCheckout}>
            Try checkout again
          </button>
        </div>
      </PaymentsPage>
    );
  }

  if (records.length === 0) {
    return (
      <PaymentsPage role="staff">
        <div className={`pay-surface pay-surface--${surface} pay-surface--state pay-surface--empty`}>
          <p>No payment activity yet</p>
          <p>Payouts and client invoices will show up here.</p>
        </div>
      </PaymentsPage>
    );
  }

  if (surface === 'desktop') {
    return (
      <PaymentsPage role="staff">
        <div className="pay-surface pay-surface--desktop">
          <table className="pay-surface-table">
            <caption className="sr-only">Payments</caption>
            <thead>
              <tr>
                <th>Type</th>
                <th>Record</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr
                  key={record.id}
                  data-selected={record.id === selectedId ? 'true' : undefined}
                  onClick={() => setSelectedId(record.id)}
                >
                  <td>{record.kind}</td>
                  <td>{record.title}</td>
                  <td>{record.status}</td>
                  <td>{record.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <aside className="pay-surface-checkout" aria-label="Checkout">
            {selected ? (
              <>
                <p>{selected.kind}</p>
                <p>{selected.title}</p>
                <p>{selected.amount}</p>
                <button type="button" onClick={failCheckout}>
                  Pay {selected.amount}
                </button>
              </>
            ) : (
              <p>Select a record to pay.</p>
            )}
          </aside>
        </div>
      </PaymentsPage>
    );
  }

  if (surface === 'tablet') {
    return (
      <PaymentsPage role="staff">
        <div className="pay-surface pay-surface--tablet">
          <div className="pay-surface-summary">
            <p>Open records</p>
            <p>{records.length}</p>
          </div>
          <div className="pay-surface-list">
            {records.map((record) => (
              <button
                key={record.id}
                type="button"
                data-selected={record.id === selectedId ? 'true' : undefined}
                onClick={() => setSelectedId(record.id)}
              >
                <span>{record.title}</span>
                <span>
                  {record.kind} · {record.status}
                </span>
                <strong>{record.amount}</strong>
              </button>
            ))}
            {selected ? (
              <button type="button" className="pay-surface-pay" onClick={failCheckout}>
                Pay {selected.amount}
              </button>
            ) : null}
          </div>
        </div>
      </PaymentsPage>
    );
  }

  return (
    <PaymentsPage role="staff">
      <div className="pay-surface pay-surface--mobile">
        {records.map((record) => (
          <article key={record.id}>
            <p>{record.kind}</p>
            <p>{record.title}</p>
            <p>{record.amount}</p>
            <button type="button" onClick={failCheckout}>
              Pay
            </button>
          </article>
        ))}
      </div>
    </PaymentsPage>
  );
}
