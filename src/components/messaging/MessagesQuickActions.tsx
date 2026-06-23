import React from 'react';
import { ChevronRight, FileText, LifeBuoy } from 'lucide-react';
import { AppItemCard, AppItemCardStack } from '../ui/app/AppPrimitives';

interface MessagesQuickActionsProps {
  onContactSupport?: () => void;
  onFileReport?: () => void;
  supportLabel?: string;
  supportHint?: string;
  reportLabel?: string;
  reportHint?: string;
}

export function MessagesQuickActions({
  onContactSupport,
  onFileReport,
  supportLabel = 'Contact support',
  supportHint = '',
  reportLabel = 'File a report',
  reportHint = '',
}: MessagesQuickActionsProps) {
  return (
    <div className="app-messages-quick-actions">
      <AppItemCardStack>
        <AppItemCard onClick={() => onContactSupport?.()}>
          <LifeBuoy className="w-5 h-5 shrink-0 text-brand-primary" strokeWidth={1.5} />
          <div className="flex-1 min-w-0 text-left">
            <p className="font-semibold text-sm">{supportLabel}</p>
            {supportHint && <p className="text-sm text-brand-text-muted mt-0.5 leading-snug">{supportHint}</p>}
          </div>
          <ChevronRight className="w-5 h-5 text-brand-text-muted shrink-0 lg:hidden" />
        </AppItemCard>
        <AppItemCard onClick={() => onFileReport?.()}>
          <FileText className="w-5 h-5 shrink-0 text-brand-primary" strokeWidth={1.5} />
          <div className="flex-1 min-w-0 text-left">
            <p className="font-semibold text-sm">{reportLabel}</p>
            {reportHint && <p className="text-sm text-brand-text-muted mt-0.5 leading-snug">{reportHint}</p>}
          </div>
          <ChevronRight className="w-5 h-5 text-brand-text-muted shrink-0 lg:hidden" />
        </AppItemCard>
      </AppItemCardStack>
    </div>
  );
}
