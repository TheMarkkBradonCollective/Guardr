/**
 * renderClientRoutes — behaviour-neutral route mount moved out of App.tsx.
 * Page workstreams edit this module instead of App.tsx.
 */
import type { ReactNode } from 'react';
import { ClientDashboard, type ClientView } from '../../components/ClientDashboard';
import { InstallPrompt } from '../../components/InstallPrompt';
import { ClientCapabilitiesProvider } from '../../components/client/ClientCapabilitiesContext';
import { AccountMenu } from '../../components/layouts/AccountMenu';
import { ClientAppLayout } from '../../components/layouts/ClientAppLayout';
import { UserProfileScreen } from '../../components/profile/UserProfileScreen';
import { UserSettingsScreen } from '../../components/profile/UserSettingsScreen';
import { SupportComposePage } from '../../components/support/SupportComposePage';
import { SupportReportPage } from '../../components/support/SupportReportPage';
import { isClientAccountPending } from '../../lib/accountStatus';
import { syncAppRoute, type ClientJobsTab } from '../../lib/appNavigation';
import { resolveAllowedClientView } from '../../lib/clientCapabilities';
import { unpaidClientInvoices } from '../../lib/clientInvoiceStorage';
import { clientWorkspaceLabel } from '../../lib/clientType';
import { getBrowsableGuards } from '../../lib/guardDirectory';
import { clientMessagesBadge, clientSupportBadge } from '../../lib/messagesInbox';
import { isMessengerExperience } from '../../lib/platform/appExperience';
import type { AppMountBindings } from '../mountBindings';

export function renderClientRoutes(mount: AppMountBindings): ReactNode | null {
  const currentUser = mount.currentUser;
  if (!currentUser) return null;
  const {
    accountMenuExtras,
    accountNotificationMenuProps,
    buildAppRoute,
    changeThemeMode,
    clientDirectGuardId,
    clientGuardId,
    clientInvoiceRequestId,
    clientInvoices,
    clientLocations,
    clientMessages,
    clientMessagesChrome,
    clientPaymentGatesMemo,
    clientRequestsJobTab,
    clientRequestsSelectedId,
    clientTeamDetailOpen,
    clientView,
    clients,
    closeClientSupportForm,
    displayRequests,
    handleAcceptPriceOffer,
    handleAddReview,
    handleAddToCompanyRoster,
    handleCancelRequest,
    handleClientApproveOvertime,
    handleClientApprovePendingGuard,
    handleClientApproveScheduleChange,
    handleClientApproveTeamSlot,
    handleClientConfirmSelfAudit,
    handleClientDenyPendingGuard,
    handleClientDenyTeamSlot,
    handleClientDisputeOvertime,
    handleClientFlagEndCheckpoint,
    handleClientFlagStartCheckpoint,
    handleClientRejectScheduleChange,
    handleClientRequestSuggestedGuard,
    handleClientVerifyEndCheckpoint,
    handleClientVerifyStartCheckpoint,
    handleCreateSupportTicket,
    handleDeleteClientMessage,
    handleDeleteJobChatMessage,
    handleDeleteSupportMessage,
    handleDismissGuardSuggestion,
    handleEditRequest,
    handlePostRequest,
    handleRemoveFromCompanyRoster,
    handleReportClientViolation,
    handleRequestReplacement,
    handleSaveClientLocation,
    handleSendClientMessage,
    handleSendJobChatMessage,
    handleSendSupportMessage,
    handleSignOut,
    handleSubmitClientCredential,
    handleSubmitPriceOffer,
    handleToggleFavoriteGuard,
    handleUpdateClientProfile,
    handleUpdateStatus,
    isDbConnected,
    jobChatMessages,
    jobChatRequestId,
    jobChatThreads,
    jobLocations,
    marketplaceLegalGate,
    openClientSupportCompose,
    openClientSupportReport,
    openDownloadPage,
    openJobChat,
    openLegalPage,
    passwordChangeOverlay,
    platformSettings,
    refreshClientMessages,
    requests,
    setClientDirectGuardId,
    setClientGuardId,
    setClientInvoiceRequestIdState,
    setClientMessagesChrome,
    setClientMessagesDetailOpen,
    setClientRequestsJobTabState,
    setClientRequestsSelectedIdState,
    setClientView,
    setJobChatRequestId,
    setOpenJobChatState,
    setSupportTicketId,
    supportTicketId,
    supportTickets,
    themeMode,
    tutorialOverlay,
    tutorialSettingsProps,
    verifiedGuards,
    wrapMessengerCompanion,
  } = mount;


  // ── Client view ────────────────────────────────────────────
  if (currentUser.role === 'client') {
    const clientRecord = clients.find(c => c.id === currentUser.id);
    // Show only THIS client's requests
    const myRequests = displayRequests.filter(r =>
      r.clientId === currentUser.id ||
      r.clientName === currentUser.clientName ||
      r.clientName === currentUser.name
    );
    const hireableGuards = getBrowsableGuards(verifiedGuards);
    // Pending applicants must remain visible for Approve even if directory filters change.
    const clientGuardsForJobs = (() => {
      const byId = new Map(hireableGuards.map((g) => [g.id, g]));
      for (const req of myRequests) {
        const pendingId = req.pendingGuardId;
        if (pendingId && !byId.has(pendingId)) {
          const pending = verifiedGuards.find((g) => g.id === pendingId);
          if (pending) byId.set(pending.id, pending);
        }
        for (const applicantId of req.applicants ?? []) {
          if (!byId.has(applicantId)) {
            const applicant = verifiedGuards.find((g) => g.id === applicantId);
            if (applicant) byId.set(applicant.id, applicant);
          }
        }
      }
      return [...byId.values()];
    })();
    const clientAccountPending = isClientAccountPending({
      accountStatus: clientRecord?.accountStatus,
      approved: clientRecord?.approved,
    });
    const handleClientNavigate = (view: ClientView) => {
      const allowedView = resolveAllowedClientView(view, clientRecord?.clientType) as ClientView;
      if (
        !isMessengerExperience() &&
        clientAccountPending &&
        allowedView !== 'home' &&
        allowedView !== 'profile' &&
        allowedView !== 'settings' &&
        allowedView !== 'messages' &&
        allowedView !== 'support' &&
        allowedView !== 'guide' &&
        allowedView !== 'support-compose' &&
        allowedView !== 'support-report' &&
        allowedView !== 'invoices'
      ) {
        setClientView('home');
        return;
      }
      setClientView(allowedView);
    };

    const clientInvoicesBadge = unpaidClientInvoices(clientInvoices, currentUser.id).length;

    const setClientInvoiceRequestId = (requestId: string | null) => {
      setClientInvoiceRequestIdState(requestId);
      syncAppRoute(
        buildAppRoute({
          role: 'client',
          clientView: 'invoices',
          clientInvoiceRequestId: requestId ?? undefined,
        })
      );
    };

    const setClientRequestsSelectedId = (jobId: string | null) => {
      setClientRequestsSelectedIdState(jobId);
      syncAppRoute(
        buildAppRoute({
          role: 'client',
          clientView: 'requests',
          clientJobId: jobId ?? undefined,
          clientJobsTab: clientRequestsJobTab,
          jobChatRequestId: undefined,
          openJobChat: undefined,
        })
      );
    };

    const setClientRequestsJobTab = (tab: ClientJobsTab) => {
      setClientRequestsJobTabState(tab);
      syncAppRoute(
        buildAppRoute({
          role: 'client',
          clientView: 'requests',
          clientJobsTab: tab,
          clientJobId: clientRequestsSelectedId ?? undefined,
        })
      );
    };

    const clientHideHeader =
      clientView === 'support-compose' ||
      clientView === 'support-report' ||
      (clientView === 'guards' && (!!clientGuardId || clientTeamDetailOpen)) ||
      (clientView === 'requests' && !!clientRequestsSelectedId) ||
      (clientView === 'invoices' && !!clientInvoiceRequestId);

    const clientMessagesShellHeaderTrailing =
      clientView === 'messages' || clientView === 'support' ? (
        <div className="shrink-0 flex items-center gap-2">
          <AccountMenu
            userName={currentUser.name}
            userSubtitle={currentUser.email}
            avatarUrl={currentUser.avatar}
            onOpenProfile={() => handleClientNavigate('profile')}
            onOpenSettings={() => handleClientNavigate('settings')}
            onSignOut={handleSignOut}
            active={false}
            {...accountMenuExtras}
          />
        </div>
      ) : null;

    return wrapMessengerCompanion(
      <>
        {marketplaceLegalGate}
        <ClientCapabilitiesProvider clientType={clientRecord?.clientType}>
        <ClientAppLayout
          currentUser={currentUser}
          companyName={
            clientRecord
              ? clientWorkspaceLabel(clientRecord)
              : currentUser.clientName || currentUser.name || 'Your company'
          }
          onSignOut={handleSignOut}
          messagesOnly={isMessengerExperience()}
          activeView={clientView}
          requestsJobTab={clientRequestsJobTab}
          onRequestsJobTabChange={setClientRequestsJobTab}
          onNavigate={handleClientNavigate}
          accountPending={clientAccountPending}
          onOpenLegal={openLegalPage}
          onOpenDownload={openDownloadPage}
          messagesBadge={clientMessagesBadge(jobChatThreads, supportTickets, currentUser)}
          supportBadge={clientSupportBadge(supportTickets, currentUser)}
          invoicesBadge={clientInvoicesBadge}
          hideHeader={clientHideHeader}
          accountNotifications={accountNotificationMenuProps}
          messagesChrome={clientMessagesChrome}
          themeMode={themeMode}
          onChangeTheme={changeThemeMode}
        >
          {clientView === 'profile' ? (
            <UserProfileScreen
              currentUser={currentUser}
              client={clientRecord ?? null}
              onSave={(payload) => handleUpdateClientProfile(currentUser.id, payload)}
              onSubmitClientCredential={(credential) =>
                handleSubmitClientCredential(currentUser.id, credential)
              }
              platformSettings={platformSettings}
            />
          ) : clientView === 'settings' ? (
            <div data-tour="client-settings">
            <UserSettingsScreen
              currentUser={currentUser}
              isDbConnected={isDbConnected}
              onOpenLegal={openLegalPage}
              onOpenDownload={openDownloadPage}
            />
            </div>
          ) : clientView === 'support-compose' ? (
            <SupportComposePage
              onBack={() => closeClientSupportForm('support')}
              onCreateTicket={handleCreateSupportTicket}
              onCreated={(ticketId) => setSupportTicketId(ticketId)}
            />
          ) : clientView === 'support-report' ? (
            <SupportReportPage
              relatedRequests={myRequests}
              onBack={() => closeClientSupportForm('reports')}
              onCreateTicket={handleCreateSupportTicket}
              onSubmitted={() => closeClientSupportForm('reports')}
            />
          ) : (
            <ClientDashboard
              companyName={
                clientRecord
                  ? clientWorkspaceLabel(clientRecord)
                  : currentUser.clientName || currentUser.name || 'Your Company'
              }
              messagesOnly={isMessengerExperience()}
              clientId={currentUser.id}
              accountStatus={clientRecord?.accountStatus}
              approved={clientRecord?.approved}
              requests={myRequests}
              platformRequests={requests}
              guards={clientGuardsForJobs}
                  clientEmail={currentUser.email}
              avatarUrl={currentUser.avatar}
              activeView={clientView}
              onViewChange={handleClientNavigate}
              profileGuardId={clientGuardId}
              onProfileGuardIdChange={setClientGuardId}
              directRequestGuardId={clientDirectGuardId}
              onDirectRequestGuardIdChange={setClientDirectGuardId}
              onPostRequest={handlePostRequest}
              onEditRequest={handleEditRequest}
              onUpdateStatus={handleUpdateStatus}
              onCancelRequest={handleCancelRequest}
              onAddReview={handleAddReview}
              onReportViolation={handleReportClientViolation}
              onConfirmSelfAudit={handleClientConfirmSelfAudit}
              onVerifyStartCheckpoint={handleClientVerifyStartCheckpoint}
              onFlagStartCheckpoint={handleClientFlagStartCheckpoint}
              onVerifyEndCheckpoint={handleClientVerifyEndCheckpoint}
              onFlagEndCheckpoint={handleClientFlagEndCheckpoint}
              onApproveOvertime={handleClientApproveOvertime}
              onDisputeOvertime={handleClientDisputeOvertime}
              onApproveScheduleChange={handleClientApproveScheduleChange}
              onRejectScheduleChange={handleClientRejectScheduleChange}
              onApprovePendingGuard={handleClientApprovePendingGuard}
              onDenyPendingGuard={handleClientDenyPendingGuard}
              onApproveTeamSlot={handleClientApproveTeamSlot}
              onDenyTeamSlot={handleClientDenyTeamSlot}
              onRequestSuggestedGuard={handleClientRequestSuggestedGuard}
              onDismissGuardSuggestion={handleDismissGuardSuggestion}
              onAddToCompanyRoster={handleAddToCompanyRoster}
              onRemoveFromCompanyRoster={handleRemoveFromCompanyRoster}
              onRequestReplacement={handleRequestReplacement}
              onSubmitPriceOffer={(requestId, guardId, input) =>
                void handleSubmitPriceOffer(requestId, guardId, input, 'client')
              }
              onAcceptPriceOffer={(requestId, guardId, offerId) =>
                void handleAcceptPriceOffer(requestId, guardId, offerId)
              }
              crewSettings={platformSettings}
              favoriteGuardIds={clientRecord?.favoriteGuardIds ?? []}
              onToggleFavoriteGuard={handleToggleFavoriteGuard}
              clientLocations={clientLocations}
              jobLocations={jobLocations}
              onSaveClientLocation={handleSaveClientLocation}
              clientRecord={clientRecord}
              paymentGates={clientPaymentGatesMemo}
              feeConfig={platformSettings.feeConfig}
              currentUser={currentUser}
              jobChatThreads={jobChatThreads}
              jobChatMessages={jobChatMessages}
              clientMessages={clientMessages}
              onSendJobChatMessage={handleSendJobChatMessage}
              onSendClientMessage={handleSendClientMessage}
              onDeleteClientMessage={handleDeleteClientMessage}
              onDeleteJobChatMessage={handleDeleteJobChatMessage}
              onDeleteSupportMessage={handleDeleteSupportMessage}
              onRefreshClientMessages={refreshClientMessages}
              jobChatRequestId={jobChatRequestId}
              openJobChat={openJobChat}
              onJobChatRequestIdChange={(id) => setJobChatRequestId(id, { openChat: false })}
              onJobChatOpenChange={(open) => {
                setOpenJobChatState(open);
                if (!open) setJobChatRequestId(null);
                else if (jobChatRequestId) setJobChatRequestId(jobChatRequestId, { openChat: true });
              }}
              onOpenJobChat={(requestId) => {
                setJobChatRequestId(requestId, { openChat: true });
              }}
              supportTickets={supportTickets}
              onSendSupportMessage={handleSendSupportMessage}
              supportTicketId={supportTicketId}
              onSupportTicketIdChange={setSupportTicketId}
              onOpenSupportCompose={openClientSupportCompose}
              onOpenSupportReport={openClientSupportReport}
              onRequestsSelectedIdChange={setClientRequestsSelectedId}
              requestsSelectedId={clientRequestsSelectedId}
              requestsJobTab={clientRequestsJobTab}
              onRequestsJobTabChange={setClientRequestsJobTab}
              clientInvoices={clientInvoices}
              invoiceRequestId={clientInvoiceRequestId}
              onInvoiceRequestIdChange={setClientInvoiceRequestId}
              onMessagesDetailOpenChange={setClientMessagesDetailOpen}
              onMessagesChromeChange={setClientMessagesChrome}
              messagesShellHeaderTrailing={clientMessagesShellHeaderTrailing}
              {...tutorialSettingsProps}
            />
          )}
        </ClientAppLayout>
        </ClientCapabilitiesProvider>
        {passwordChangeOverlay}
        {tutorialOverlay}
        <InstallPrompt />
      </>
    );
  }
  return null;
}
