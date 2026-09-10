import React from 'react';
import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { PRODUCT_APP_LABELS, productAppForRole, type ProductRole } from '../../lib/productApps';
import { MESSENGER_APP_LABEL } from '../../lib/messengerCompanion';
import { AppButton } from '../ui/AppButton';

export function MessengerCompanionBar({
  role,
  onOpenMainApp,
  unreadCount = 0,
}: {
  role: ProductRole;
  onOpenMainApp: () => void;
  unreadCount?: number;
}) {
  const appLabel = PRODUCT_APP_LABELS[productAppForRole(role)];
  return (
    <div className="messenger-companion-bar" role="banner">
      <div className="messenger-companion-bar-brand">
        <span className="messenger-companion-bar-icon">
          <MessageCircle size={18} strokeWidth={2.25} aria-hidden />
          {unreadCount > 0 ? (
            <span className="messenger-companion-bar-badge" aria-label={`${unreadCount} unread`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </span>
        <div>
          <p className="messenger-companion-bar-title">{MESSENGER_APP_LABEL}</p>
          <p className="messenger-companion-bar-sub">Conversations for {appLabel}</p>
        </div>
      </div>
      <AppButton variant="outline" size="sm" onClick={onOpenMainApp}>
        Open {appLabel}
        <ArrowUpRight size={14} strokeWidth={2.25} aria-hidden />
      </AppButton>
    </div>
  );
}
