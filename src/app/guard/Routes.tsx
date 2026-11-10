/**
 * renderGuardRoutes — behaviour-neutral route mount moved out of App.tsx.
 * Page workstreams edit this module instead of App.tsx.
 */
import type { ReactNode } from 'react';
import { GuardDashboard } from '../../components/GuardDashboard';
import { InstallPrompt } from '../../components/InstallPrompt';
import { AccountPendingScreen } from '../../components/account/AccountPendingScreen';
import { AccountMenu } from '../../components/layouts/AccountMenu';
import { isGuardAccountApproved } from '../../lib/accountStatus';
import { isInactiveGuardSession } from '../../lib/guardActivationSync';
import { getBrowsableGuards } from '../../lib/guardDirectory';
import { getGuardPayoutHistory, getGuardVisibleJobs } from '../../lib/guardJobView';
import { isMessengerExperience } from '../../lib/platform/appExperience';
import { reportPushEvent } from '../../lib/pushApi';
import type { AppMountBindings } from '../mountBindings';

export function renderGuardRoutes(mount: AppMountBindings): ReactNode | null {
  const currentUser = mount.currentUser;
  if (!currentUser) return null;
  const {
    accountMenuExtras,
    accountNotificationMenuProps,
    activationSupportChat,
    activeGuard,
    activeGuardId,
    changeThemeMode,
    clients,
    closeGuardSupportForm,
    displayRequests,
    guardBrowseTab,
    guardMessages,
    guardPayoutInvoices,
    guardSelectedJobId,
    guards,
    handleAcceptPriceOffer,
    handleAcceptReplacementOffer,
    handleAcceptTeamInvite,
    handleAckBriefing,
    handleAckPostOrders,
    handleAddCertification,
    handleAddEducation,
    handleAddExperience,
    handleApplyToJob,
    handleAttachCertificationImage,
    handleCompleteGuardJobTypeOnboarding,
    handleCreateSupportTicket,
    handleDeclineTeamInvite,
    handleDeleteCertification,
    handleDeleteGuardMessage,
    handleDeleteJobChatMessage,
    handleDeleteSupportMessage,
    handleGuardApproveOvertime,
    handleGuardArrived,
    handleGuardDeclineDirectJob,
    handleGuardDisputeShiftAuditViolation,
    handleGuardRequestStripePayout,
    handleInviteTeamGuard,
    handleRecordAuditViolation,
    handleRemoveTeamGuard,
    handleSaveGuardInsurance,
    handleSaveGuardJobPreferences,
    handleSaveGuardVehicle,
    handleSaveGuardVehicleInsurance,
    handleSendGuardMessage,
    handleSendJobChatMessage,
    handleSendSupportMessage,
    handleSignOut,
    handleStartEnRoute,
    handleSubmitGuardIdentityVerification,
    handleSubmitGuardVehicle,
    handleSubmitIncidentReport,
    handleSubmitPriceOffer,
    handleSuggestTeamGuard,
    handleUpdateCertification,
    handleUpdateGuardLiveLocation,
    handleUpdateGuardProfile,
    handleUpdateGuardStripeAccount,
    handleUpdateJobAudit,
    isDbConnected,
    jobChatMessages,
    jobChatRequestId,
    jobChatThreads,
    marketplaceLegalGate,
    openDownloadPage,
    openGuardActivationSupport,
    openGuardSupportCompose,
    openGuardSupportReport,
    openJobChat,
    openLegalPage,
    passwordChangeOverlay,
    payments,
    performanceFactorId,
    platformSettings,
    refreshGuardMessages,
    requests,
    resolvedGuardTab,
    setGuardBrowseTab,
    setGuardSelectedJobId,
    setGuardTab,
    setJobChatRequestId,
    setOpenJobChatState,
    setPerformanceFactorId,
    setSupportTicketId,
    supportMode,
    supportSection,
    supportTicketId,
    supportTickets,
    themeMode,
    tutorialOverlay,
    tutorialSettingsProps,
    verifiedGuards,
    wrapMessengerCompanion,
  } = mount;


  // ── Guard view ─────────────────────────────────────────────
  if (currentUser.role === 'guard') {
    if (!activeGuard?.id) {
      return (
        <div className="page-shell min-h-screen flex flex-col bg-brand-bg">
          <header className="flex justify-end items-center gap-2 px-5 pt-[max(1rem,env(safe-area-inset-top))] shrink-0">
            <AccountMenu
              userName={currentUser.name}
              userSubtitle={currentUser.email}
              avatarUrl={currentUser.avatar}
              onOpenProfile={() => setGuardTab('settings')}
              onOpenSettings={() => setGuardTab('settings')}
              onSignOut={handleSignOut}
              hideProfile
              {...accountMenuExtras}
            />
          </header>
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
            <p className="text-brand-text font-semibold">We could not load your guard profile.</p>
            <p className="text-brand-text-muted text-sm max-w-sm">
              Your sign-in may be out of date after a database change. Sign out and sign in again with your guard email.
            </p>
          </div>
        </div>
      );
    }
    const inactiveGuard = isInactiveGuardSession(currentUser, verifiedGuards);

    if (
      inactiveGuard &&
      resolvedGuardTab !== 'settings' &&
      resolvedGuardTab !== 'support' &&
      resolvedGuardTab !== 'guide'
    ) {
      return (
        <>
          {marketplaceLegalGate}
          {passwordChangeOverlay}
          <div className="page-shell h-[100dvh] flex flex-col overflow-hidden bg-brand-bg">
            <header className="flex justify-end items-center gap-2 px-5 pt-[max(1rem,env(safe-area-inset-top))] shrink-0">
              <AccountMenu
                userName={currentUser.name}
                userSubtitle={currentUser.email}
                avatarUrl={currentUser.avatar}
                onOpenProfile={() => setGuardTab('settings')}
                onOpenSettings={() => setGuardTab('settings')}
                onSignOut={handleSignOut}
                hideProfile
                {...accountMenuExtras}
              />
            </header>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <AccountPendingScreen
              role="guard"
              guard={activeGuard}
              onOpenProfile={() => setGuardTab('settings')}
              onContactSupport={isGuardAccountApproved(activeGuard) ? openGuardActivationSupport : undefined}
              hasActivationSupportChat={Boolean(activationSupportChat)}
              onAddCertification={(cert) => handleAddCertification(activeGuard.id, cert, 'guard')}
              onDeleteCertification={(certId) => handleDeleteCertification(activeGuard.id, certId)}
              onAttachCertificationImage={(certId, imageUrl) =>
                handleAttachCertificationImage(activeGuard.id, certId, imageUrl)
              }
              onUpdateCertification={(certId, payload) =>
                handleUpdateCertification(activeGuard.id, certId, payload, 'guard')
              }
              onSubmitIdentityVerification={(payload) =>
                handleSubmitGuardIdentityVerification(activeGuard.id, payload)
              }
              onSaveInsurance={(policy) => handleSaveGuardInsurance(policy)}
              />
            </div>
          </div>
          <InstallPrompt />
        </>
      );
    }

    const guardJobs = getGuardVisibleJobs(activeGuard, displayRequests);
    const guardPayouts = getGuardPayoutHistory(activeGuard.id, requests, payments);

    return wrapMessengerCompanion(
      <>
        {marketplaceLegalGate}
        <GuardDashboard
          guard={activeGuard}
          tab={resolvedGuardTab}
          onTabChange={setGuardTab}
          messagesOnly={isMessengerExperience()}
          selectedJobId={guardSelectedJobId}
          onSelectedJobIdChange={setGuardSelectedJobId}
          browseTab={guardBrowseTab}
          onBrowseTabChange={setGuardBrowseTab}
          accountNotifications={accountNotificationMenuProps}
          requests={guardJobs}
          allRequests={requests}
          payments={guardPayouts}
          onAddCertification={(cert) => handleAddCertification(activeGuard.id, cert, 'guard')}
          onDeleteCertification={(certId) => handleDeleteCertification(activeGuard.id, certId)}
          onAttachCertificationImage={(certId, imageUrl) =>
            handleAttachCertificationImage(activeGuard.id, certId, imageUrl)
          }
          onUpdateCertification={(certId, payload) =>
            handleUpdateCertification(activeGuard.id, certId, payload, 'guard')
          }
          onAddExperience={(exp) => handleAddExperience(activeGuard.id, exp)}
          onAddEducation={(edu) => handleAddEducation(activeGuard.id, edu)}
          onSubmitIdentityVerification={(payload) =>
            handleSubmitGuardIdentityVerification(activeGuard.id, payload)
          }
          onSaveInsurance={(policy) => handleSaveGuardInsurance(policy)}
          onSaveVehicleInsurance={(policy) => handleSaveGuardVehicleInsurance(policy)}
          onSaveVehicle={(profile) => handleSaveGuardVehicle(profile)}
          onSubmitVehicle={(profile) => handleSubmitGuardVehicle(profile)}
          onAcceptJob={handleApplyToJob}
          onDeclineDirectJob={handleGuardDeclineDirectJob}
          onInviteTeamGuard={handleInviteTeamGuard}
          onSuggestTeamGuard={handleSuggestTeamGuard}
          onAcceptTeamInvite={handleAcceptTeamInvite}
          onDeclineTeamInvite={handleDeclineTeamInvite}
          onRemoveTeamGuard={handleRemoveTeamGuard}
          feeConfig={platformSettings.feeConfig}
          onSubmitPriceOffer={(requestId, input) =>
            void handleSubmitPriceOffer(requestId, activeGuardId, input, 'guard')
          }
          onAcceptPriceOffer={(requestId, offerId) =>
            void handleAcceptPriceOffer(requestId, activeGuardId, offerId)
          }
          coworkerGuards={getBrowsableGuards(verifiedGuards)}
          companyClients={clients.filter((c) => c.clientType === 'security-company')}
          onUpdateJobAudit={handleUpdateJobAudit}
          onAckPostOrders={handleAckPostOrders}
          onSaveJobPreferences={(prefs) => handleSaveGuardJobPreferences(activeGuardId, prefs)}
          onCompleteJobTypeOnboarding={(jobType) =>
            handleCompleteGuardJobTypeOnboarding(activeGuardId, jobType)
          }
          onStartEnRoute={handleStartEnRoute}
          onUpdateGuardLiveLocation={handleUpdateGuardLiveLocation}
          onAcceptReplacementOffer={(requestId) =>
            void handleAcceptReplacementOffer(requestId, activeGuardId)
          }
          onGuardArrived={(requestId) => {
            void handleGuardArrived(requestId);
          }}
          onAckBriefing={handleAckBriefing}
          onGeofenceLeave={(requestId) => {
            if (!currentUser) return;
            const req = requests.find((r) => r.id === requestId);
            const guard = guards.find((g) => g.id === req?.assignedGuardId) ?? activeGuard;
            void reportPushEvent(currentUser, {
              type: 'guard_left_site',
              guardId: guard?.id,
              guardName: guard?.name,
              requestId,
              location: req?.location,
              priority: 'high',
            });
          }}
          onApproveOvertime={handleGuardApproveOvertime}
          onRecordAuditViolation={handleRecordAuditViolation}
          onDisputeShiftAuditViolation={handleGuardDisputeShiftAuditViolation}
          onUpdateStripeAccount={handleUpdateGuardStripeAccount}
          onSignOut={handleSignOut}
          themeMode={themeMode}
          onChangeTheme={changeThemeMode}
          onUpdateProfile={(payload) => handleUpdateGuardProfile(activeGuard.id, payload)}
          currentUser={currentUser}
          supportTickets={supportTickets}
          relatedRequests={guardJobs.filter((r) => r.assignedGuardId === activeGuard.id)}
          onCreateSupportTicket={handleCreateSupportTicket}
          onSendSupportMessage={handleSendSupportMessage}
          jobChatThreads={jobChatThreads}
          jobChatMessages={jobChatMessages}
          onSendJobChatMessage={handleSendJobChatMessage}
          guardMessages={guardMessages}
          onSendGuardMessage={handleSendGuardMessage}
          onDeleteGuardMessage={handleDeleteGuardMessage}
          onDeleteJobChatMessage={handleDeleteJobChatMessage}
          onDeleteSupportMessage={handleDeleteSupportMessage}
          onRefreshGuardMessages={refreshGuardMessages}
          jobChatRequestId={jobChatRequestId}
          openJobChat={openJobChat}
          initialSelectedJobId={jobChatRequestId && !openJobChat ? jobChatRequestId : null}
          onJobChatRequestIdChange={(id) => setJobChatRequestId(id, { openChat: false })}
          onJobChatOpenChange={(open) => {
            setOpenJobChatState(open);
            if (!open) setJobChatRequestId(null);
            else if (jobChatRequestId) setJobChatRequestId(jobChatRequestId, { openChat: true });
          }}
          supportTicketId={supportTicketId}
          onSupportTicketIdChange={setSupportTicketId}
          supportMode={supportMode}
          supportSection={supportSection}
          onOpenSupportCompose={openGuardSupportCompose}
          onOpenActivationSupport={openGuardActivationSupport}
          onOpenSupportReport={openGuardSupportReport}
          onCloseSupportForm={closeGuardSupportForm}
          performanceFactorId={performanceFactorId}
          onPerformanceFactorChange={setPerformanceFactorId}
          onSubmitIncidentReport={handleSubmitIncidentReport}
          guardPayoutInvoices={guardPayoutInvoices}
          onRequestStripePayout={() => handleGuardRequestStripePayout(activeGuard.id)}
          onOpenLegal={openLegalPage}
          onOpenDownload={openDownloadPage}
          isDbConnected={isDbConnected}
          {...tutorialSettingsProps}
        />
        {passwordChangeOverlay}
        {tutorialOverlay}
        <InstallPrompt />
      </>
    );
  }
  return null;
}
