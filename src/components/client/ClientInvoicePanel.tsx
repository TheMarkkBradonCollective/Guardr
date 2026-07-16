import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import type { Client, SecurityRequest } from '../../types';
import {
  buildInvoiceFromJob,
  downloadInvoicePdf,
  formatInvoiceCurrency,
  type ClientInvoice,
} from '../../lib/clientInvoicing';

interface ClientInvoicePanelProps {
  client: Client;
  requests: SecurityRequest[];
  desktop?: boolean;
}

export function ClientInvoicePanel({ client, requests, desktop = false }: ClientInvoicePanelProps) {
  const completed = requests.filter(
    (r) => r.clientId === client.id && (r.status === 'completed' || r.status === 'closed')
  );
  const [invoices, setInvoices] = useState<ClientInvoice[]>(() =>
    completed.slice(0, 5).map((r) => buildInvoiceFromJob(r, client))
  );

  const generateForJob = (request: SecurityRequest) => {
    const inv = buildInvoiceFromJob(request, client);
    setInvoices((prev) => [inv, ...prev.filter((i) => i.requestId !== request.id)]);
  };

  return (
    <div className={desktop ? 'adm-invoice-panel space-y-4' : 'space-y-4'}>
      {!desktop && (
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-primary" />
          <h3 className="text-base font-bold text-brand-text">Invoices & Receipts</h3>
        </div>
      )}
      {completed.length === 0 ? (
        <p className={desktop ? 'adm-workbench-subtitle' : 'text-sm text-brand-text-muted'}>
          Complete a job to generate invoices.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {completed.slice(0, 3).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => generateForJob(r)}
                className={desktop ? 'adm-btn adm-btn--outline adm-btn--sm' : 'app-button-outline app-btn-sm'}
              >
                Generate for {r.title?.slice(0, 24) || 'job'}
              </button>
            ))}
          </div>
          <div className={desktop ? 'adm-invoice-list space-y-2' : 'space-y-2'}>
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className={
                  desktop
                    ? 'adm-invoice-row flex items-center justify-between p-3 rounded-lg border border-brand-border bg-brand-surface/40'
                    : 'flex items-center justify-between p-3 rounded-xl border border-brand-border'
                }
              >
                <div>
                  <p className={desktop ? 'adm-table-primary text-sm' : 'text-sm font-medium text-brand-text'}>
                    {inv.invoiceNumber}
                  </p>
                  <p className={desktop ? 'adm-table-secondary text-xs' : 'text-xs text-brand-text-muted'}>
                    {formatInvoiceCurrency(inv.total)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadInvoicePdf(inv, client)}
                  className={
                    desktop
                      ? 'adm-btn adm-btn--outline adm-btn--sm flex items-center gap-1'
                      : 'app-button-outline app-btn-sm flex items-center gap-1'
                  }
                >
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
