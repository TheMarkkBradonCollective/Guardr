import React, { useState } from 'react';
import { Megaphone } from 'lucide-react';
import { SessionUser } from '../../types';
import { PlatformSettings } from '../../lib/platformSettings';
import { canBroadcastToAllUsers } from '../../lib/permissions';
import { sendBroadcastPush } from '../../lib/pushApi';
import { AppFormSection } from '../ui/app/AppPrimitives';
import { useLayoutFormFactor } from '../../surfaces';
import { WorkbenchToolbar } from '../baseui/layout/WorkbenchLayout';
import { StaffCompanyPlacardPanel } from './StaffCompanyPlacardPanel';
import { StaffMgmtSection } from './StaffMgmtSection';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import { showAppToast } from '../ui/AppToast';
import type { CompanyPublicDocument } from '../../lib/companyPlacard';
import { userFacingError } from '../../lib/userFacingError';

interface StaffSettingsPanelProps {
  currentUser: SessionUser;
  platformSettings: PlatformSettings;
  onUpdatePublicInformation?: (
    patch: Pick<
      PlatformSettings,
      'ownerMessage' | 'directorMessage' | 'ownerMessageUpdatedAt' | 'directorMessageUpdatedAt'
    >
  ) => void | Promise<void>;
  companyPublicDocuments?: CompanyPublicDocument[];
  onSaveCompanyPublicDocument?: (doc: CompanyPublicDocument) => Promise<void>;
  onSetCompanyPlacardPublicEnabled?: (enabled: boolean) => Promise<void>;
}

function DesktopSettingsCard({
  title,
  children,
  className = '',
  fullWidth = false,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <StaffMgmtSection title={title} className={className} fullWidth={fullWidth}>
      {children}
    </StaffMgmtSection>
  );
}

export function StaffSettingsPanel({
  currentUser,
  platformSettings,
  onUpdatePublicInformation,
  companyPublicDocuments = [],
  onSaveCompanyPublicDocument,
  onSetCompanyPlacardPublicEnabled,
}: StaffSettingsPanelProps) {
  const formFactor = useLayoutFormFactor();
  const isDesktop = formFactor === 'desktop';
  const canBroadcast = canBroadcastToAllUsers(currentUser);
  const [broadcastTitle, setBroadcastTitle] = useState('Guardr');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastBusy, setBroadcastBusy] = useState(false);

  const handleBroadcast = async () => {
    const message = broadcastBody.trim();
    if (!message || broadcastBusy) return;
    setBroadcastBusy(true);
    try {
      const result = await sendBroadcastPush(currentUser, {
        title: broadcastTitle.trim() || 'Guardr',
        body: message,
      });
      showAppToast(
        `Broadcast sent — ${result.inbox} inboxes, ${result.sent} push${result.sent === 1 ? '' : 'es'}.`,
        { tone: 'success' }
      );
      setBroadcastBody('');
    } catch (err) {
      showAppToast(userFacingError(err, 'Broadcast failed'), { tone: 'error' });
    } finally {
      setBroadcastBusy(false);
    }
  };

  const broadcastBodySection = (
    <div className="space-y-4">
      <p className="text-sm text-brand-text-muted leading-relaxed">
        Send a push and in-app notification to every client, guard, and staff account. Replaces the old
        Test all users action.
      </p>
      <label className="block space-y-1.5">
        <span className="uber-label">Title</span>
        <input
          type="text"
          value={broadcastTitle}
          disabled={!canBroadcast || broadcastBusy}
          onChange={(e) => setBroadcastTitle(e.target.value)}
          className="uber-input w-full"
          placeholder="Guardr"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="uber-label">Message</span>
        <textarea
          value={broadcastBody}
          disabled={!canBroadcast || broadcastBusy}
          onChange={(e) => setBroadcastBody(e.target.value)}
          rows={4}
          className="uber-input w-full resize-y"
          placeholder="What should everyone see?"
        />
      </label>
      <button
        type="button"
        disabled={!canBroadcast || broadcastBusy || !broadcastBody.trim()}
        onClick={() => void handleBroadcast()}
        className="w-full flex items-center justify-center gap-2 app-button-outline !h-11 !text-sm disabled:opacity-50"
      >
        <Megaphone className="w-4 h-4" />
        Broadcast
      </button>
      {!canBroadcast && (
        <p className="text-xs text-brand-text-muted">Only Directors and Founders can broadcast.</p>
      )}
    </div>
  );

  const companyPlacardBody =
    onSaveCompanyPublicDocument && onSetCompanyPlacardPublicEnabled ? (
      <StaffCompanyPlacardPanel
        currentUser={currentUser}
        documents={companyPublicDocuments}
        publicEnabled={platformSettings.companyPlacardPublicEnabled !== false}
        onSaveDocument={onSaveCompanyPublicDocument}
        onSetPublicEnabled={onSetCompanyPlacardPublicEnabled}
        variant={isDesktop ? 'desktop' : formFactor === 'tablet' ? 'desktop' : 'mobile'}
      />
    ) : null;

  const homepageMessagesBody = (
    <div className="space-y-4">
      <label className="block space-y-1.5">
        <span className="uber-label">Founder message (Markeith White)</span>
        <textarea
          value={platformSettings.ownerMessage ?? ''}
          disabled={currentUser.role !== 'owner'}
          onChange={(e) =>
            currentUser.role === 'owner' &&
            onUpdatePublicInformation?.({
              ownerMessage: e.target.value,
              ownerMessageUpdatedAt: new Date().toISOString(),
            })
          }
          rows={4}
          className="uber-input w-full resize-y"
          placeholder="Message shown on the public homepage from the Founder account."
        />
      </label>
      <label className="block space-y-1.5">
        <span className="uber-label">Director message (Tyrone Johnson)</span>
        <textarea
          value={platformSettings.directorMessage ?? ''}
          disabled={currentUser.role !== 'owner' && currentUser.role !== 'director'}
          onChange={(e) =>
            (currentUser.role === 'owner' || currentUser.role === 'director') &&
            onUpdatePublicInformation?.({
              directorMessage: e.target.value,
              directorMessageUpdatedAt: new Date().toISOString(),
            })
          }
          rows={4}
          className="uber-input w-full resize-y"
          placeholder="Message shown on the public homepage from the Director account."
        />
      </label>
      {currentUser.role !== 'owner' && currentUser.role !== 'director' && (
        <p className="text-xs text-brand-text-muted">
          Homepage leadership messages are read-only for your role.
        </p>
      )}
    </div>
  );

  if (isDesktop || formFactor === 'tablet') {
    return (
      <StaffOpsPageShell
        className={`staff-mgmt-panel staff-roster-panel adm-platform-page adm-platform-settings-page${formFactor === 'tablet' ? ' sft-settings-page' : ''}`}
        toolbar={
          <WorkbenchToolbar
            eyebrow="Platform"
            subtitle="Homepage messages, broadcast, and public placard."
          />
        }
      >
        <div className={formFactor === 'tablet' ? 'sft-settings-grid' : 'adm-platform-settings-grid adm-platform-settings-grid--split'}>
          <DesktopSettingsCard title="Homepage messages">{homepageMessagesBody}</DesktopSettingsCard>
          <DesktopSettingsCard title="Broadcast">{broadcastBodySection}</DesktopSettingsCard>
          {companyPlacardBody && (
            <DesktopSettingsCard title="Company public placard" fullWidth>
              {companyPlacardBody}
            </DesktopSettingsCard>
          )}
        </div>
      </StaffOpsPageShell>
    );
  }

  return (
    <div className="animate-fade-in min-w-0 max-w-full">
      <AppFormSection title="Homepage messages">
        <div className="pb-6">{homepageMessagesBody}</div>
      </AppFormSection>

      <AppFormSection title="Broadcast">
        <div className="pb-6">{broadcastBodySection}</div>
      </AppFormSection>

      {companyPlacardBody}
    </div>
  );
}
