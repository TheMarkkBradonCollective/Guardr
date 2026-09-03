import React from 'react';
import { PaymentsPage } from '../../components/payments/PaymentsPage';
import { PREVIEW_JOB } from '../previewStaffFixtures';

/** Payments chrome + a record list so mobile / tablet / desktop headers can be compared. */
export function PaymentsPreviewScreen() {
  return (
    <PaymentsPage role="staff">
      <ul className="app-item-card-stack space-y-2">
        <li className="app-item-card p-4">
          <p className="uber-label text-xs">Payout</p>
          <p className="font-semibold">{PREVIEW_JOB.title}</p>
          <p className="text-sm text-brand-text-muted mt-1">
            Guard payout · ${PREVIEW_JOB.estimatedPayout.toFixed(2)}
          </p>
        </li>
        <li className="app-item-card p-4">
          <p className="uber-label text-xs">Invoice</p>
          <p className="font-semibold">{PREVIEW_JOB.clientName}</p>
          <p className="text-sm text-brand-text-muted mt-1">Client billing · pending</p>
        </li>
      </ul>
    </PaymentsPage>
  );
}
