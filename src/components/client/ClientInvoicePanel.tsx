import React, { useState } from 'react';
import { useStyletron } from 'baseui';
import { Block } from 'baseui/block';
import { HeadingXSmall, LabelSmall, LabelXSmall, ParagraphSmall } from 'baseui/typography';
import { FileText, Download } from 'lucide-react';
import type { Client, SecurityRequest } from '../../types';
import {
  buildInvoiceFromJob,
  downloadInvoicePdf,
  formatInvoiceCurrency,
  type ClientInvoice,
} from '../../lib/clientInvoicing';
import { GuardrButton } from '../baseui/GuardrButton';

interface ClientInvoicePanelProps {
  client: Client;
  requests: SecurityRequest[];
  desktop?: boolean;
}

export function ClientInvoicePanel({ client, requests, desktop = false }: ClientInvoicePanelProps) {
  const [, theme] = useStyletron();
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
    <Block display="flex" flexDirection="column" gridGap="scale500">
      {!desktop && (
        <Block display="flex" alignItems="center" gridGap="scale300">
          <FileText size={20} style={{ color: theme.colors.accent }} />
          <HeadingXSmall margin={0} $style={{ fontWeight: 700 }}>Invoices &amp; Receipts</HeadingXSmall>
        </Block>
      )}
      {completed.length === 0 ? (
        <ParagraphSmall margin={0} color="contentSecondary">
          Complete a job to generate invoices.
        </ParagraphSmall>
      ) : (
        <>
          <Block display="flex" gridGap="scale300" $style={{ flexWrap: 'wrap' }}>
            {completed.slice(0, 3).map((r) => (
              <GuardrButton
                key={r.id}
                kind="secondary"
                size="compact"
                onClick={() => generateForJob(r)}
              >
                Generate for {r.title?.slice(0, 24) || 'job'}
              </GuardrButton>
            ))}
          </Block>
          <Block display="flex" flexDirection="column" gridGap="scale300">
            {invoices.map((inv) => (
              <Block
                key={inv.id}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                padding="scale400"
                backgroundColor={desktop ? 'backgroundSecondary' : 'backgroundPrimary'}
                $style={{ borderRadius: '12px', border: `1px solid ${theme.colors.borderOpaque}` }}
              >
                <Block>
                  <LabelSmall margin={0} $style={{ fontWeight: 600 }}>
                    {inv.invoiceNumber}
                  </LabelSmall>
                  <LabelXSmall color="contentSecondary" marginTop="scale100">
                    {formatInvoiceCurrency(inv.total)}
                  </LabelXSmall>
                </Block>
                <GuardrButton
                  kind="secondary"
                  size="compact"
                  onClick={() => downloadInvoicePdf(inv, client)}
                  startEnhancer={<Download className="w-3 h-3" />}
                >
                  Download
                </GuardrButton>
              </Block>
            ))}
          </Block>
        </>
      )}
    </Block>
  );
}
