/**
 * renderStaffRoutes — behaviour-neutral route mount moved out of App.tsx.
 * Page workstreams edit this module instead of App.tsx.
 */
import type { ReactNode } from 'react';
import { InstallPrompt } from '../../components/InstallPrompt';
import { StaffDashboard } from '../../components/StaffDashboard';
import { AccountMenu } from '../../components/layouts/AccountMenu';
import { StaffAccountPendingScreen } from '../../components/staff/StaffAccountPendingScreen';
import { isManagementStaffMember, isStaffRole } from '../../lib/permissions';
import { isMessengerExperience } from '../../lib/platform/appExperience';
import { staffNeedsCredentialCompletion } from '../../lib/staffAccountActivation';
import type { AppMountBindings } from '../mountBindings';

export function renderStaffRoutes(mount: AppMountBindings): ReactNode | null {
  const currentUser = mount.currentUser;
  if (!currentUser) return null;
  const {
    accountMenuExtras,
    accountNotificationMenuProps,
    changeThemeMode,
    clientLocations,
    clientMessages,
    clients,
    companyPublicDocuments,
    displayRequests,
    guardMessages,
    guardPayoutInvoices,
    guards,
    handleAddCertification,
    handleAddClientProfile,
    handleAddEducation,
    handleAddExperience,
    handleAddGuardProfile,
    handleAddStaffProfile,
    handleApproveCert,
    handleApproveClient,
    handleApproveClientCredential,
    handleApproveGuardAccount,
    handleApproveGuardIdentityVerification,
    handleApproveRequest,
    handleApproveScheduleChange,
    handleApproveScheduleChangeBilling,
    handleApproveStaffAccount,
    handleAssignCityManager,
    handleAttachCertificationImage,
    handleBlockOneRoleCase,
    handleCompletePayoutInvoice,
    handleDeleteCertification,
    handleDeleteClientAccount,
    handleDeleteClientMessage,
    handleDeleteGuardAccount,
    handleDeleteGuardMessage,
    handleDeleteJobChatMessage,
    handleDeleteStaffMessage,
    handleDeleteSupportMessage,
    handleDeleteSupportTicket,
    handleDenyRequest,
    handleIgnoreOneRoleCase,
    handleMakeGuardPayoutAvailable,
    handleMakeOvertimeGuardPayoutAvailable,
    handleRecordAuditViolation,
    handleRefundPayment,
    handleRejectCert,
    handleRejectClient,
    handleRejectClientCredential,
    handleRejectGuardIdentityVerification,
    handleRejectScheduleChange,
    handleRejectStaffAccount,
    handleReleasePayout,
    handleRequestCertImageResubmit,
    handleRequestCertUpdate,
    handleRequestClientApplicationRevision,
    handleRequestCoiUpdate,
    handleRequestGuardApplicationRevision,
    handleRequestGuardIdResubmit,
    handleResetAuditFailures,
    handleResolveDispute,
    handleReviewGuardInsurance,
    handleReviewGuardVehicle,
    handleRevokeGuardIdentityVerification,
    handleSaveCompanyPublicDocument,
    handleSaveJobLocation,
    handleSendClientMessage,
    handleSendGuardMessage,
    handleSendJobChatMessage,
    handleSendStaffMessage,
    handleSendSupportMessage,
    handleSetClientTrusted,
    handleSetCompanyPlacardPublicEnabled,
    handleSetGuardTrusted,
    handleSignOut,
    handleStaffApproveGuardApplication,
    handleStaffCreateJob,
    handleStaffDenyGuardApplication,
    handleStaffEditJobListing,
    handleStaffResolveAuditViolation,
    handleStaffResolveOvertimeDispute,
    handleStaffUpdateGuardIdImages,
    handleSubmitGuardIdentityVerification,
    handleUpdateBackgroundChecked,
    handleUpdateCertification,
    handleUpdateClientCredentialRules,
    handleUpdateGuardProfile,
    handleUpdateGuardStripeAccount,
    handleUpdateGuardUserStatus,
    handleUpdatePlatformCity,
    handleUpdatePlatformSettings,
    handleUpdatePublicInformation,
    handleUpdateStaffCityAccess,
    handleUpdateStaffIntegrations,
    handleUpdateStaffPermissions,
    handleUpdateStaffRole,
    handleUpdateSupportTicketStatus,
    isDbConnected,
    jobChatMessages,
    jobChatRequestId,
    jobChatThreads,
    jobLocations,
    legalAcceptanceRecords,
    marketplaceLegalGate,
    oneRoleCases,
    openDownloadPage,
    openLegalPage,
    passwordChangeOverlay,
    payments,
    performanceFactorId,
    platformCities,
    platformSettings,
    refreshStaffMessages,
    setJobChatRequestId,
    setStaffClientId,
    setStaffCredentialItemId,
    setStaffEdit,
    setStaffGuardId,
    setStaffGuardTab,
    setStaffJobId,
    setStaffPerformanceFactorId,
    setStaffSection,
    setStaffTeamId,
    setSupportTicketId,
    staffClientId,
    staffCredentialItemId,
    staffEdit,
    staffGuardId,
    staffGuardTab,
    staffJobId,
    staffMessages,
    staffMessagesTab,
    staffSection,
    staffTeamId,
    supportTicketId,
    supportTickets,
    themeMode,
    tutorialOverlay,
    tutorialSettingsProps,
    verifiedGuards,
    wrapMessengerCompanion,
  } = mount;


  // ── Staff Operations Command Center ─────────────────────────
  if (isStaffRole(currentUser.role)) {
    const activeStaffProfile = guards.find((g) => g.id === currentUser.id && g.isStaff);
    if (
      activeStaffProfile &&
      staffNeedsCredentialCompletion(activeStaffProfile) &&
      !isManagementStaffMember(activeStaffProfile)
    ) {
      return (
        <>
          {marketplaceLegalGate}
          {passwordChangeOverlay}
          <div className="page-shell flex h-[100dvh] flex-col overflow-hidden bg-brand-bg">
            <header className="flex shrink-0 items-center justify-end gap-2 px-5 pt-[max(1rem,env(safe-area-inset-top))]">
              <AccountMenu
                userName={currentUser.name}
                userSubtitle={currentUser.email}
                avatarUrl={currentUser.avatar}
                onOpenProfile={() => {}}
                onOpenSettings={() => {}}
                onSignOut={handleSignOut}
                hideProfile
                {...accountMenuExtras}
              />
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <StaffAccountPendingScreen
                member={activeStaffProfile}
                onSubmitIdentityVerification={(payload) =>
                  handleSubmitGuardIdentityVerification(activeStaffProfile.id, payload)
                }
                onUpdateStripeAccount={handleUpdateGuardStripeAccount}
              />
            </div>
          </div>
          <InstallPrompt />
        </>
      );
    }
    return wrapMessengerCompanion(
      <>
        {marketplaceLegalGate}
        <StaffDashboard
          section={staffSection}
          onSectionChange={setStaffSection}
          messagesOnly={isMessengerExperience()}
          accountNotifications={accountNotificationMenuProps}
          selectedGuardId={staffGuardId}
          onSelectedGuardIdChange={setStaffGuardId}
          selectedClientId={staffClientId}
          onSelectedClientIdChange={setStaffClientId}
          selectedJobId={staffJobId}
          onSelectedJobIdChange={setStaffJobId}
          selectedCredentialItemId={staffCredentialItemId}
          onSelectedCredentialItemIdChange={setStaffCredentialItemId}
          selectedTeamId={staffTeamId}
          onSelectedTeamIdChange={setStaffTeamId}
          staffGuardEdit={staffEdit}
          onStaffGuardEditChange={setStaffEdit}
          staffGuardTab={staffGuardTab}
          onStaffGuardTabChange={setStaffGuardTab}
          performanceFactorId={performanceFactorId}
          onPerformanceFactorChange={setStaffPerformanceFactorId}
          selectedSupportTicketId={supportTicketId}
          onSelectedSupportTicketIdChange={setSupportTicketId}
          selectedJobChatRequestId={jobChatRequestId}
          onSelectedJobChatRequestIdChange={(id) => setJobChatRequestId(id)}
          initialStaffMessagesTab={staffMessagesTab}
          guards={verifiedGuards}
          clients={clients}
          oneRoleCases={oneRoleCases}
          onIgnoreOneRoleCase={handleIgnoreOneRoleCase}
          onBlockOneRoleCase={handleBlockOneRoleCase}
          requests={displayRequests}
          supportTickets={supportTickets}
          payments={payments}
          guardPayoutInvoices={guardPayoutInvoices}
          onUpdateGuardUserStatus={handleUpdateGuardUserStatus}
          onApproveRequest={handleApproveRequest}
          onDenyRequest={handleDenyRequest}
          onApproveScheduleChange={handleApproveScheduleChange}
          onRejectScheduleChange={handleRejectScheduleChange}
          onApproveScheduleChangeBilling={handleApproveScheduleChangeBilling}
          onApproveClient={handleApproveClient}
          onRejectClient={handleRejectClient}
          onApproveGuardAccount={handleApproveGuardAccount}
          onRequestGuardApplicationRevision={handleRequestGuardApplicationRevision}
          onRequestClientApplicationRevision={handleRequestClientApplicationRevision}
          onSetGuardTrusted={handleSetGuardTrusted}
          onSetClientTrusted={handleSetClientTrusted}
          onSubmitGuardIdentityVerification={handleSubmitGuardIdentityVerification}
          onApproveGuardIdentityVerification={handleApproveGuardIdentityVerification}
          onRejectGuardIdentityVerification={handleRejectGuardIdentityVerification}
          onRequestGuardIdResubmit={handleRequestGuardIdResubmit}
          onUpdateGuardIdImages={handleStaffUpdateGuardIdImages}
          onRequestCertImageResubmit={handleRequestCertImageResubmit}
          onReviewGuardInsurance={handleReviewGuardInsurance}
          onApproveVehicle={(guardId) => handleReviewGuardVehicle(guardId, 'verified')}
          onRejectVehicle={(guardId, reason) => handleReviewGuardVehicle(guardId, 'rejected', reason)}
          onRequestCoiUpdate={handleRequestCoiUpdate}
          onRequestCertUpdate={handleRequestCertUpdate}
          onRevokeGuardIdentityVerification={handleRevokeGuardIdentityVerification}
          onApproveClientCredential={handleApproveClientCredential}
          onRejectClientCredential={handleRejectClientCredential}
          onUpdateClientCredentialRules={handleUpdateClientCredentialRules}
          onDeleteGuardAccount={handleDeleteGuardAccount}
          onDeleteClientAccount={handleDeleteClientAccount}
          onApproveCert={handleApproveCert}
          onRejectCert={handleRejectCert}
          onUpdateBackgroundChecked={handleUpdateBackgroundChecked}
          onRecordAuditViolation={handleRecordAuditViolation}
          onResetAuditFailures={handleResetAuditFailures}
          onMakeGuardPayoutAvailable={handleMakeGuardPayoutAvailable}
          onReleasePayout={handleReleasePayout}
          onRefundPayment={handleRefundPayment}
          onResolveOvertimeDispute={handleStaffResolveOvertimeDispute}
          onResolveAuditViolation={handleStaffResolveAuditViolation}
          onMakeOvertimeGuardPayoutAvailable={handleMakeOvertimeGuardPayoutAvailable}
          onCompletePayoutInvoice={handleCompletePayoutInvoice}
          platformSettings={platformSettings}
          platformCities={platformCities}
          jobLocations={jobLocations}
          clientLocations={clientLocations}
          onSaveJobLocation={handleSaveJobLocation}
          onUpdatePlatformCity={handleUpdatePlatformCity}
          onUpdateStaffCityAccess={handleUpdateStaffCityAccess}
          onAssignCityManager={handleAssignCityManager}
          onUpdatePlatformSettings={handleUpdatePlatformSettings}
          onUpdatePublicInformation={handleUpdatePublicInformation}
          onUpdateStaffIntegrations={handleUpdateStaffIntegrations}
          onUpdateStaffPermissions={handleUpdateStaffPermissions}
          isDbConnected={isDbConnected}
          currentUser={currentUser}
          onAddStaffProfile={handleAddStaffProfile}
          onApproveStaffAccount={handleApproveStaffAccount}
          onRejectStaffAccount={handleRejectStaffAccount}
          onUpdateStaffRole={handleUpdateStaffRole}
          onAddGuardProfile={handleAddGuardProfile}
          onAddClientProfile={handleAddClientProfile}
          onStaffCreateJob={handleStaffCreateJob}
          onEditJobListing={handleStaffEditJobListing}
          onApproveGuardApplication={handleStaffApproveGuardApplication}
          onDenyGuardApplication={handleStaffDenyGuardApplication}
          themeMode={themeMode}
          onChangeTheme={changeThemeMode}
          onSignOut={handleSignOut}
          onUpdateGuardProfile={handleUpdateGuardProfile}
          onAddCertification={(guardId, cert) => handleAddCertification(guardId, cert, 'staff')}
          onDeleteCertification={handleDeleteCertification}
          onAttachCertificationImage={handleAttachCertificationImage}
          onUpdateCertification={(guardId, certId, payload) =>
            handleUpdateCertification(guardId, certId, payload, 'staff')
          }
          onAddExperience={handleAddExperience}
          onAddEducation={handleAddEducation}
          onSendSupportMessage={handleSendSupportMessage}
          onUpdateSupportStatus={handleUpdateSupportTicketStatus}
          onDeleteSupportTicket={handleDeleteSupportTicket}
          onResolveDispute={handleResolveDispute}
          jobChatThreads={jobChatThreads}
          jobChatMessages={jobChatMessages}
          staffMessages={staffMessages}
          guardMessages={guardMessages}
          clientMessages={clientMessages}
          onSendStaffMessage={handleSendStaffMessage}
          onDeleteStaffMessage={handleDeleteStaffMessage}
          onSendGuardMessage={handleSendGuardMessage}
          onDeleteGuardMessage={handleDeleteGuardMessage}
          onSendClientMessage={handleSendClientMessage}
          onDeleteClientMessage={handleDeleteClientMessage}
          onDeleteJobChatMessage={handleDeleteJobChatMessage}
          onDeleteSupportMessage={handleDeleteSupportMessage}
          onRefreshStaffMessages={refreshStaffMessages}
          onSendJobChat={handleSendJobChatMessage}
          onOpenLegal={openLegalPage}
          onOpenDownload={openDownloadPage}
          legalAcceptances={legalAcceptanceRecords}
          companyPublicDocuments={companyPublicDocuments}
          onSaveCompanyPublicDocument={handleSaveCompanyPublicDocument}
          onSetCompanyPlacardPublicEnabled={handleSetCompanyPlacardPublicEnabled}
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
