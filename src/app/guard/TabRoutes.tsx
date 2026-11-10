/** Page body extracted from GuardDashboard. The dashboard file keeps the shell. */
import type { ReactNode } from 'react';
import { AppGuidePage } from '../../components/docs/AppGuidePage';
import { GuardActiveShift } from '../../components/guard/GuardActiveShift';
import { GuardAvailabilityScreen } from '../../components/guard/GuardAvailabilityScreen';
import { GuardCompanyRosterPanel } from '../../components/guard/GuardCompanyRosterPanel';
import { GuardCredentialGraceBanner } from '../../components/guard/GuardCredentialGraceBanner';
import { GuardEarningsPanel } from '../../components/guard/GuardEarningsPanel';
import { GuardJobDetailView } from '../../components/guard/GuardJobDetailView';
import { GuardMessagesPanel } from '../../components/guard/GuardMessagesPanel';
import { GuardMyJobsPanel } from '../../components/guard/GuardMyJobsPanel';
import { GuardNextShiftCard } from '../../components/guard/GuardNextShiftCard';
import { GuardPerformanceScreen } from '../../components/guard/GuardPerformanceScreen';
import { GuardPreferencesScreen } from '../../components/guard/GuardPreferencesScreen';
import { GuardVehiclePanel } from '../../components/guard/GuardVehiclePanel';
import { ReplacementOfferCard } from '../../components/guard/ReplacementOfferCard';
import { ShiftMap } from '../../components/guard/ShiftMap';
import { MapBrowseDock } from '../../components/map/MapBrowseDock';
import { MapPinFilterStepper } from '../../components/map/MapPinFilterStepper';
import { MapRouteBanner } from '../../components/map/MapRouteBanner';
import { MapSelectionExperience } from '../../components/map/MapSelectionExperience';
import { PaymentsPage } from '../../components/payments/PaymentsPage';
import { UserProfileScreen } from '../../components/profile/UserProfileScreen';
import { UserSettingsScreen } from '../../components/profile/UserSettingsScreen';
import { SupportComposePage } from '../../components/support/SupportComposePage';
import { SupportReportPage } from '../../components/support/SupportReportPage';
import { AppPageTransition } from '../../components/ui/motion/AppMotion';
import { GUARD_MAP_BROWSE_EMPTY_MESSAGE } from '../../lib/mapEmptyMessages';
import { GUARD_MAP_STATUS_FILTERS, guardMapPinKind } from '../../lib/mapJobVisibility';
import { MapViewportInsetsProvider } from '../../lib/mapViewportInsets';
import { isWithinSiteRadius } from '../../lib/siteProximity';
import { isTutorialDemoId } from '../../lib/tutorialDemoData';
import { SecurityRequest } from '../../types';

export interface RenderGuardTabPanelBindings {
  accountPreActive: boolean;
  activePhase: "upcoming" | "en-route" | "arrived" | "on-duty" | "complete";
  activeShiftJob: import("../../lib/guardJobView").GuardJobView;
  activeTab: "map" | "activation" | "earnings" | "myJobs" | "messages" | "guardChat" | "support" | "profile" | "settings" | "guide" | "preferences" | "performance" | "availability" | "vehicle";
  allRequests: import("../../types").SecurityRequest[];
  browseJobLists: import("../../lib/guardJobsBrowse").GuardBrowseJobLists;
  captureSelfie: () => Promise<string>;
  companyClients: import("../../types").Client[];
  completedJobs: import("../../lib/guardJobView").GuardJobView[];
  connectPending: boolean;
  connectReady: boolean;
  coworkerGuards: import("../../types").SecurityGuard[];
  currentUser: import("../../types").SessionUser;
  earningsBreakdown: import("../../lib/guardEarnings").GuardEarningsBreakdown;
  feeConfig: import("../../../lib/platformFees").PlatformFeeConfig;
  feeForJob: (job: { hourlyRate?: number; guardPay?: number; platformFeePerHour?: number; agreementFeeConfig?: import("../../../lib/platformFees").AgreementPlatformFeeConfig; }) => import("../../../lib/platformFees").PlatformFeeConfig;
  guard: import("../../types").SecurityGuard;
  guardBrowseTab: "completed" | "available" | "scheduled" | "missed";
  guardMessages: import("../../types").GuardMessage[];
  guardSelectedJobId: string;
  handleAcceptJob: (jobId: string) => void;
  handleArrived: () => Promise<void>;
  handleBeginAudit: () => Promise<void>;
  handleBrowseTabChange: (tab: import("../../lib/guardJobsBrowse").GuardJobsBrowseTab) => void;
  handleConnectStripeClick: () => void;
  handleEndBreak: () => void;
  handleEndShift: () => void;
  handleGuardSelectedJobChange: (jobId: string) => void;
  handleMapFilterChange: (filter: import("../../lib/mapJobVisibility").GuardMapStatusFilter) => void;
  handleMidShiftCheckIn: (payload: { selfie: string; uniformVerified: boolean; equipmentVerified: boolean; }) => Promise<void>;
  handleRequestStripePayout: () => Promise<void>;
  handleSkipSelfAudit: () => void;
  handleStartBreak: () => void;
  isDbConnected: boolean;
  jobChatMessages: import("../../types").JobChatMessage[];
  jobChatRequestId: string;
  jobChatThreads: import("../../types").JobChatThread[];
  mapBrowseItems: import("../../components/map/MapBrowseDock").MapBrowseDockItem[];
  mapJobs: import("../../lib/guardJobView").GuardJobView[];
  mapRoute: import("../../lib/mapRouting").MapRouteSummary;
  mapRouteLoading: boolean;
  mapStatusFilter: "upcoming" | "available" | "all" | "direct";
  mapZoomRef: React.RefObject<import("../../components/guard/ShiftMap").MapZoomControls>;
  messagesShellHeaderTrailing: React.JSX.Element;
  midShiftDue: boolean;
  nextShiftJob: import("../../lib/guardJobView").GuardJobView;
  onAcceptPriceOffer: (requestId: string, offerId: string) => void | Promise<void>;
  onAcceptReplacementOffer: (requestId: string) => void | Promise<void>;
  onAcceptTeamInvite: (requestId: string) => void | Promise<void>;
  onAddCertification: (cert: Partial<import("../../types").Certification>) => Promise<import("../../lib/certUniqueness").AddCertificationResult>;
  onAddEducation: (edu: Omit<import("../../types").GuardEducation, "id">) => void;
  onAddExperience: (exp: Omit<import("../../types").Experience, "id">) => void;
  onApplyAsTeamLead: (requestId: string) => void | Promise<void>;
  onApproveOvertime: (requestId: string) => void | Promise<void>;
  onAttachCertificationImage: (certId: string, imageUrl: string) => Promise<import("../../lib/certImagePolicy").CertImageMutationResult>;
  onCloseSupportForm: () => void;
  onCompleteJobTypeOnboarding: (jobType: import("../../types").JobType) => void | Promise<void>;
  onCreateSupportTicket: (input: import("../../types").CreateSupportTicketInput) => void | Promise<string | void>;
  onDeclineDirectJob: (requestId: string) => void | Promise<void>;
  onDeclineTeamInvite: (requestId: string) => void | Promise<void>;
  onDeleteCertification: (certId: string) => Promise<import("../../lib/certImagePolicy").CertImageMutationResult>;
  onDeleteGuardMessage: (messageId: string) => void | Promise<void>;
  onDeleteJobChatMessage: (messageId: string) => void | Promise<void>;
  onDeleteSupportMessage: (ticketId: string, messageId: string) => void | Promise<void>;
  onDisputeShiftAuditViolation: (requestId: string, violationId: string, note: string) => void | Promise<void>;
  onInviteTeamGuard: (requestId: string, guardId: string) => void | Promise<void>;
  onJobChatOpenChange: (open: boolean) => void;
  onJobChatRequestIdChange: (requestId: string) => void;
  onOpenDownload: () => void;
  onOpenLegal: (page: import("../../lib/legalContent").LegalPageId) => void;
  onOpenSupportCompose: () => void;
  onOpenSupportReport: () => void;
  onPerformanceFactorChange: (factorId: import("../../lib/guardPerformanceFactorDetail").PerformanceFactorId) => void;
  onRefreshGuardMessages: () => void | Promise<void>;
  onRemoveTeamGuard: (requestId: string, guardId: string) => void | Promise<void>;
  onRequestStripePayout: () => Promise<void>;
  onSaveInsurance: (policy: Partial<import("../../types").GuardInsurancePolicy> & { guardId: string; }) => Promise<void>;
  onSaveJobPreferences: (preferences: import("../../types").JobType[]) => void | Promise<void>;
  onSaveVehicle: (profile: Partial<import("../../types").GuardVehicleProfile> & { guardId: string; }) => Promise<void>;
  onSaveVehicleInsurance: (policy: Partial<import("../../types").GuardVehicleInsurancePolicy> & { guardId: string; }) => Promise<void>;
  onSendGuardMessage: (body: string) => void | Promise<void>;
  onSendJobChatMessage: (requestId: string, body: string) => void | Promise<void>;
  onSendSupportMessage: (ticketId: string, body: string) => void | Promise<void>;
  onStartTutorial: () => void;
  onSubmitIdentityVerification: (payload: import("../../components/profile/GuardIdentityVerificationPanel").GuardIdentityVerificationPayload) => Promise<import("../../components/profile/GuardIdentityVerificationPanel").IdentityVerificationSubmitResult>;
  onSubmitPriceOffer: (requestId: string, input: { hourlyRate: number; agreementFeeConfig?: import("../../../lib/platformFees").AgreementPlatformFeeConfig; message?: string; }) => void | Promise<void>;
  onSubmitVehicle: (profile: Partial<import("../../types").GuardVehicleProfile> & { guardId: string; }) => Promise<void>;
  onSuggestTeamGuard: (requestId: string, guardId: string) => void | Promise<void>;
  onSupportTicketIdChange: (ticketId: string) => void;
  onUpdateCertification: (certId: string, payload: import("../../components/credentials/CertDetailModal").CertUpdatePayload) => Promise<import("../../components/credentials/CertDetailModal").CertUpdateResult>;
  onUpdateProfile: (payload: import("../../components/profile/UserProfileScreen").ProfileSavePayload) => void | Promise<void>;
  openBriefingForJob: (jobId: string) => void;
  openJobChat: boolean;
  openMessagesForJob: (requestId: string) => void;
  openStripeInvoices: number;
  payments: import("../../lib/guardJobView").GuardPayoutView[];
  performanceFactorId: "acceptance" | "completion" | "on-time" | "quality" | "client-rating";
  relatedRequests: import("../../lib/guardJobView").GuardJobView[];
  replacementOffers: import("../../types").SecurityRequest[];
  requests: import("../../lib/guardJobView").GuardJobView[];
  selectedJob: import("../../lib/guardJobView").GuardJobView;
  selectedJobShouldRoute: boolean;
  setGuardMessagesChrome: (value: React.SetStateAction<import("../../lib/messagesChrome").MessagesChrome>) => void;
  setGuardMessagesDetailOpen: (value: React.SetStateAction<boolean>) => void;
  setMapRoute: (value: React.SetStateAction<import("../../lib/mapRouting").MapRouteSummary>) => void;
  setMapRouteLoading: (value: React.SetStateAction<boolean>) => void;
  setShowActivityLog: (value: React.SetStateAction<boolean>) => void;
  setShowIncidentReport: (value: React.SetStateAction<boolean>) => void;
  setTab: (next: import("../../components/GuardDashboard").GuardTab) => void;
  showNextShiftOnDock: boolean;
  showShiftOverlay: boolean;
  stripeRequestPending: boolean;
  supportMode: "compose" | "report";
  supportTicketId: string;
  supportTickets: import("../../types").SupportTicket[];
  surface: "mobile" | "tablet" | "desktop";
  tab: "map" | "activation" | "earnings" | "myJobs" | "messages" | "guardChat" | "support" | "profile" | "settings" | "guide" | "preferences" | "performance" | "availability" | "vehicle";
  tutorialActive: boolean;
  tutorialAvailable: boolean;
  tutorialCompleted: boolean;
  upcomingForMessages: import("../../lib/guardJobView").GuardJobView[];
  userLocation: import("../../lib/useUserLocation").GeoPosition;
  workBlockedMessage: string;
}

export function renderGuardTabPanel(mount: RenderGuardTabPanelBindings): ReactNode {
  const {
    accountPreActive,
    activePhase,
    activeShiftJob,
    activeTab,
    allRequests,
    browseJobLists,
    captureSelfie,
    companyClients,
    completedJobs,
    connectPending,
    connectReady,
    coworkerGuards,
    currentUser,
    earningsBreakdown,
    feeConfig,
    feeForJob,
    guard,
    guardBrowseTab,
    guardMessages,
    guardSelectedJobId,
    handleAcceptJob,
    handleArrived,
    handleBeginAudit,
    handleBrowseTabChange,
    handleConnectStripeClick,
    handleEndBreak,
    handleEndShift,
    handleGuardSelectedJobChange,
    handleMapFilterChange,
    handleMidShiftCheckIn,
    handleRequestStripePayout,
    handleSkipSelfAudit,
    handleStartBreak,
    isDbConnected,
    jobChatMessages,
    jobChatRequestId,
    jobChatThreads,
    mapBrowseItems,
    mapJobs,
    mapRoute,
    mapRouteLoading,
    mapStatusFilter,
    mapZoomRef,
    messagesShellHeaderTrailing,
    midShiftDue,
    nextShiftJob,
    onAcceptPriceOffer,
    onAcceptReplacementOffer,
    onAcceptTeamInvite,
    onAddCertification,
    onAddEducation,
    onAddExperience,
    onApplyAsTeamLead,
    onApproveOvertime,
    onAttachCertificationImage,
    onCloseSupportForm,
    onCompleteJobTypeOnboarding,
    onCreateSupportTicket,
    onDeclineDirectJob,
    onDeclineTeamInvite,
    onDeleteCertification,
    onDeleteGuardMessage,
    onDeleteJobChatMessage,
    onDeleteSupportMessage,
    onDisputeShiftAuditViolation,
    onInviteTeamGuard,
    onJobChatOpenChange,
    onJobChatRequestIdChange,
    onOpenDownload,
    onOpenLegal,
    onOpenSupportCompose,
    onOpenSupportReport,
    onPerformanceFactorChange,
    onRefreshGuardMessages,
    onRemoveTeamGuard,
    onRequestStripePayout,
    onSaveInsurance,
    onSaveJobPreferences,
    onSaveVehicle,
    onSaveVehicleInsurance,
    onSendGuardMessage,
    onSendJobChatMessage,
    onSendSupportMessage,
    onStartTutorial,
    onSubmitIdentityVerification,
    onSubmitPriceOffer,
    onSubmitVehicle,
    onSuggestTeamGuard,
    onSupportTicketIdChange,
    onUpdateCertification,
    onUpdateProfile,
    openBriefingForJob,
    openJobChat,
    openMessagesForJob,
    openStripeInvoices,
    payments,
    performanceFactorId,
    relatedRequests,
    replacementOffers,
    requests,
    selectedJob,
    selectedJobShouldRoute,
    setGuardMessagesChrome,
    setGuardMessagesDetailOpen,
    setMapRoute,
    setMapRouteLoading,
    setShowActivityLog,
    setShowIncidentReport,
    setTab,
    showNextShiftOnDock,
    showShiftOverlay,
    stripeRequestPending,
    supportMode,
    supportTicketId,
    supportTickets,
    surface,
    tab,
    tutorialActive,
    tutorialAvailable,
    tutorialCompleted,
    upcomingForMessages,
    userLocation,
    workBlockedMessage,
  } = mount;

  return (
    <div
      className={`h-full min-h-0 relative overflow-hidden flex flex-col ${activeTab === 'map' ? 'guard-map-layout' : ''}`}
      data-tour={activeTab === 'map' ? 'guard-map' : undefined}
    >
      {!accountPreActive && activeTab !== 'profile' && (
        <GuardCredentialGraceBanner guard={guard} onOpenCredentials={() => setTab('profile')} />
      )}
      <div className="relative flex-1 min-h-0">
      {activeTab === 'map' && workBlockedMessage && (
        <div className="absolute top-0 left-0 right-0 z-[1002] px-4 py-3 bg-amber-500/15 border-b border-amber-500/30 text-sm text-brand-text">
          {workBlockedMessage}
        </div>
      )}

      {activeTab === 'map' && requests.find((r) => isTutorialDemoId(r.id)) && (
        <div data-tour="guard-demo-job" className="tutorial-demo-card relative z-[1003] mx-4 mt-3">
          <p className="tutorial-demo-card-label">Tutorial sample job</p>
          <p className="text-sm font-semibold mt-1">
            {requests.find((r) => isTutorialDemoId(r.id))?.title}
          </p>
          <p className="text-xs text-brand-text-muted mt-1">
            Only you can see this listing. Tap the map pin to preview how open jobs work.
          </p>
        </div>
      )}

      {activeTab === 'map' && (
        <MapViewportInsetsProvider>
      {activeTab === 'map' && !showShiftOverlay && (
        <div data-tour="guard-map-filters">
        <MapPinFilterStepper
          filters={GUARD_MAP_STATUS_FILTERS}
          value={mapStatusFilter}
          onChange={handleMapFilterChange}
          onZoomIn={() => mapZoomRef.current?.zoomIn()}
          onZoomOut={() => mapZoomRef.current?.zoomOut()}
          routeSlot={
            selectedJobShouldRoute ? (
              <MapRouteBanner
                route={mapRoute}
                loading={mapRouteLoading}
                label="Route to job"
              />
            ) : null
          }
        />
        </div>
      )}

      {activeTab === 'map' && (
        <ShiftMap
          jobs={mapJobs}
          selectedJobId={guardSelectedJobId}
          onSelectJob={handleGuardSelectedJobChange}
          drawRoute={selectedJobShouldRoute}
          onRouteChange={setMapRoute}
          onRouteLoadingChange={setMapRouteLoading}
          getPinKind={(job) => guardMapPinKind(guard.id, job as unknown as SecurityRequest)}
          zoomRef={mapZoomRef}
          routeFitResetKey={guardSelectedJobId ?? ''}
        />
      )}

      {activeTab === 'map' && !showShiftOverlay && (surface === 'tablet' || !guardSelectedJobId) ? (
        <div data-tour="guard-map-browse">
        <MapBrowseDock
          items={mapBrowseItems}
          selectedId={guardSelectedJobId}
          onSelect={handleGuardSelectedJobChange}
          emptyMessage={GUARD_MAP_BROWSE_EMPTY_MESSAGE}
          leading={
            showNextShiftOnDock && nextShiftJob ? (
              <GuardNextShiftCard
                job={nextShiftJob}
                onOpen={() => openBriefingForJob(nextShiftJob.id)}
              />
            ) : null
          }
        />
        </div>
      ) : null}

      {activeTab === 'map' && showShiftOverlay && activeShiftJob && activePhase && (
        <GuardActiveShift
          job={activeShiftJob}
          phase={activePhase}
          onSite={
            userLocation ? isWithinSiteRadius(userLocation, activeShiftJob) : false
          }
          onArrived={handleArrived}
          onBeginAudit={handleBeginAudit}
          onSkipAudit={handleSkipSelfAudit}
          onIncidentReport={() => setShowIncidentReport(true)}
          onActivityReport={() => setShowActivityLog(true)}
          onEndShift={handleEndShift}
          onStartBreak={handleStartBreak}
          onEndBreak={handleEndBreak}
          onOpenJobChat={
            onSendJobChatMessage ? () => openMessagesForJob(activeShiftJob.id) : undefined
          }
          onMidShiftCheckIn={handleMidShiftCheckIn}
          captureSelfie={captureSelfie}
          midShiftCheckInDue={midShiftDue}
        />
      )}

      {activeTab === 'map' && replacementOffers.length > 0 && !showShiftOverlay && (
        <div className="absolute inset-x-4 bottom-28 z-[1002] space-y-2">
          {replacementOffers.map((offer) => (
            <ReplacementOfferCard
              key={offer.id}
              request={offer}
              onAccept={(requestId) => void onAcceptReplacementOffer?.(requestId)}
            />
          ))}
        </div>
      )}

      {activeTab === 'map' && !showShiftOverlay && selectedJob && (
        <MapSelectionExperience
          job={selectedJob}
          role="guard"
          guardId={guard.id}
          route={mapRoute}
          loadingRoute={mapRouteLoading}
          onClose={() => handleGuardSelectedJobChange(null)}
          bottomOffsetClass=""
          guardFullBody={
            <GuardJobDetailView
              job={selectedJob}
              guard={guard}
              jobChatThreads={jobChatThreads}
              coworkerGuards={coworkerGuards}
              scheduleRequests={requests}
              onAccept={() => handleAcceptJob(selectedJob.id)}
              onDeclineDirectJob={
                onDeclineDirectJob && selectedJob.requestType === 'direct'
                  ? () => void onDeclineDirectJob(selectedJob.id)
                  : undefined
              }
              onApplyAsLead={
                onApplyAsTeamLead ? () => void onApplyAsTeamLead(selectedJob.id) : undefined
              }
              onInviteGuard={
                onInviteTeamGuard
                  ? (guardId) => void onInviteTeamGuard(selectedJob.id, guardId)
                  : undefined
              }
              onSuggestGuard={
                onSuggestTeamGuard
                  ? (guardId) => void onSuggestTeamGuard(selectedJob.id, guardId)
                  : undefined
              }
              onRemoveGuard={
                onRemoveTeamGuard
                  ? (guardId) => void onRemoveTeamGuard(selectedJob.id, guardId)
                  : undefined
              }
              onUpdateCrewProfile={
                undefined
              }
              onAcceptInvite={
                onAcceptTeamInvite ? () => void onAcceptTeamInvite(selectedJob.id) : undefined
              }
              onDeclineInvite={
                onDeclineTeamInvite ? () => void onDeclineTeamInvite(selectedJob.id) : undefined
              }
              onOpenMessages={openMessagesForJob}
              onApproveOvertime={onApproveOvertime}
              onClose={() => handleGuardSelectedJobChange(null)}
              onViewBriefing={openBriefingForJob}
              feeConfig={feeForJob(selectedJob)}
              onSubmitPriceOffer={
                onSubmitPriceOffer
                  ? (input) => void onSubmitPriceOffer(selectedJob.id, input)
                  : undefined
              }
              onAcceptPriceOffer={
                onAcceptPriceOffer
                  ? (offerId) => void onAcceptPriceOffer(selectedJob.id, offerId)
                  : undefined
              }
            />
          }
        />
      )}
        </MapViewportInsetsProvider>
      )}

      {tab !== 'map' && (
        <AppPageTransition motionKey={tab} className="absolute inset-0">
          {tab === 'earnings' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden" data-tour="guard-earnings">
              <PaymentsPage role="guard">
                <div className="flex-1 min-h-0 overflow-hidden">
                  <GuardEarningsPanel
                    breakdown={earningsBreakdown}
                    completedJobs={completedJobs}
                    stripeConnected={!!guard.stripeConnectAccountId}
                    stripeReady={connectReady}
                    connectPending={connectPending}
                    onConnectStripe={handleConnectStripeClick}
                    onRequestStripePayout={onRequestStripePayout ? handleRequestStripePayout : undefined}
                    stripeRequestPending={stripeRequestPending}
                    openStripeInvoices={openStripeInvoices}
                    payments={payments}
                  />
                </div>
              </PaymentsPage>
            </div>
          )}

          {tab === 'myJobs' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden" data-tour="guard-my-jobs">
              <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
              <GuardMyJobsPanel
                availableJobs={browseJobLists.available}
                scheduledJobs={browseJobLists.scheduled}
                completedJobs={browseJobLists.completed}
                missedJobs={browseJobLists.missed}
                guard={guard}
                currentUser={currentUser}
                coworkerGuards={coworkerGuards}
                jobChatThreads={jobChatThreads}
                scheduleRequests={requests}
                selectedJobId={guardSelectedJobId}
                onSelectedJobIdChange={handleGuardSelectedJobChange}
                activeTab={guardBrowseTab}
                onActiveTabChange={handleBrowseTabChange}
                onOpenMessages={openMessagesForJob}
                onApproveOvertime={onApproveOvertime}
                onAcceptJob={handleAcceptJob}
                onDeclineDirectJob={onDeclineDirectJob}
                onApplyAsLead={onApplyAsTeamLead}
                onInviteGuard={onInviteTeamGuard}
                onSuggestGuard={onSuggestTeamGuard}
                onRemoveGuard={onRemoveTeamGuard}
                onUpdateCrewProfile={undefined}
                onAcceptInvite={onAcceptTeamInvite}
                onDeclineInvite={onDeclineTeamInvite}
                feeConfig={feeConfig}
                onSubmitPriceOffer={onSubmitPriceOffer}
                onAcceptPriceOffer={onAcceptPriceOffer}
                onViewBriefing={openBriefingForJob}
              />
              </div>
            </div>
          )}


          {tab === 'messages' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden" data-tour="guard-messages">
              <GuardMessagesPanel
                scope="messages"
                upcomingJobs={upcomingForMessages}
                pastJobs={browseJobLists.past}
                guard={guard}
                currentUser={currentUser}
                jobChatThreads={jobChatThreads}
                jobChatMessages={jobChatMessages}
                guardMessages={guardMessages}
                supportTickets={supportTickets}
                onSendJobChatMessage={onSendJobChatMessage}
                onSendGuardMessage={onSendGuardMessage}
                onSendSupportMessage={onSendSupportMessage}
                onDeleteGuardMessage={onDeleteGuardMessage}
                onDeleteJobChatMessage={onDeleteJobChatMessage}
                onDeleteSupportMessage={onDeleteSupportMessage}
                onRefreshGuardMessages={onRefreshGuardMessages}
                initialJobChatRequestId={jobChatRequestId}
                initialJobChatOpen={openJobChat}
                onJobChatRequestIdChange={onJobChatRequestIdChange}
                onJobChatOpenChange={onJobChatOpenChange}
                onDetailOpenChange={setGuardMessagesDetailOpen}
                onMessagesChromeChange={setGuardMessagesChrome}
                shellHeaderTrailing={messagesShellHeaderTrailing}
              />
            </div>
          )}

          {tab === 'support' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden" data-tour="guard-support">
              {supportMode === 'compose' && onCreateSupportTicket ? (
                <SupportComposePage
                  onBack={() => onCloseSupportForm?.()}
                  onCreateTicket={onCreateSupportTicket}
                  onCreated={(ticketId) => {
                    onCloseSupportForm?.();
                    onSupportTicketIdChange?.(ticketId);
                  }}
                />
              ) : supportMode === 'report' && onCreateSupportTicket ? (
                <SupportReportPage
                  relatedRequests={relatedRequests}
                  onBack={() => onCloseSupportForm?.()}
                  onCreateTicket={onCreateSupportTicket}
                  onSubmitted={() => onCloseSupportForm?.()}
                />
              ) : (
                <GuardMessagesPanel
                  scope="support"
                  upcomingJobs={upcomingForMessages}
                  pastJobs={browseJobLists.past}
                  guard={guard}
                  currentUser={currentUser}
                  jobChatThreads={jobChatThreads}
                  jobChatMessages={jobChatMessages}
                  guardMessages={guardMessages}
                  supportTickets={supportTickets}
                  onSendSupportMessage={onSendSupportMessage}
                  onDeleteSupportMessage={onDeleteSupportMessage}
                  initialSupportTicketId={supportTicketId}
                  onSupportTicketIdChange={onSupportTicketIdChange}
                  onOpenSupportCompose={onOpenSupportCompose}
                  onOpenSupportReport={onOpenSupportReport}
                  onDetailOpenChange={setGuardMessagesDetailOpen}
                  onMessagesChromeChange={setGuardMessagesChrome}
                  shellHeaderTrailing={messagesShellHeaderTrailing}
                />
              )}
            </div>
          )}

          {tab === 'guide' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <AppGuidePage
                audience="guard"
                tutorialAvailable={tutorialAvailable}
                tutorialCompleted={tutorialCompleted}
                tutorialActive={tutorialActive}
                onStartTutorial={onStartTutorial}
              />
            </div>
          )}

          {tab === 'profile' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <UserProfileScreen
                currentUser={currentUser}
                guard={guard}
                requests={allRequests.length ? allRequests : (requests as SecurityRequest[])}
                onSave={onUpdateProfile}
                onAddCertification={onAddCertification}
                onDeleteCertification={onDeleteCertification}
                onAttachCertificationImage={onAttachCertificationImage}
                onUpdateCertification={onUpdateCertification}
                onAddExperience={onAddExperience}
                onAddEducation={onAddEducation}
                onSubmitIdentityVerification={onSubmitIdentityVerification}
                onSaveInsurance={onSaveInsurance}
                onSaveVehicleInsurance={onSaveVehicleInsurance}
              />
            </div>
          )}

          {tab === 'settings' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col min-h-0 overflow-hidden" data-tour="guard-settings">
              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
                <GuardCompanyRosterPanel guardId={guard.id} clients={companyClients} />
                <UserSettingsScreen
                  currentUser={currentUser}
                  onOpenLegal={onOpenLegal}
                  onOpenDownload={onOpenDownload}
                  isDbConnected={isDbConnected}
                />
              </div>
            </div>
          )}

          {tab === 'availability' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-hidden">
                <GuardAvailabilityScreen guard={guard} />
              </div>
            </div>
          )}

          {tab === 'preferences' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-hidden">
                <GuardPreferencesScreen
                  guard={guard}
                  onSaveJobPreferences={onSaveJobPreferences}
                  onCompleteJobTypeOnboarding={onCompleteJobTypeOnboarding}
                />
              </div>
            </div>
          )}

          {tab === 'performance' && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-hidden">
                <GuardPerformanceScreen
                  guard={guard}
                  requests={allRequests.length ? allRequests : (requests as SecurityRequest[])}
                  performanceFactorId={performanceFactorId}
                  onPerformanceFactorChange={onPerformanceFactorChange}
                  onDisputeShiftAuditViolation={onDisputeShiftAuditViolation}
                />
              </div>
            </div>
          )}

          {tab === 'vehicle' && onSaveVehicle && onSubmitVehicle && (
            <div className="absolute inset-0 bg-brand-bg flex flex-col overflow-hidden">
              <GuardVehiclePanel
                guard={guard}
                onSaveVehicle={onSaveVehicle}
                onSubmitVehicle={onSubmitVehicle}
              />
            </div>
          )}
        </AppPageTransition>
      )}
      </div>
    </div>
  );

}
