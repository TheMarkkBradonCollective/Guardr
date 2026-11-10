/** Page body extracted from ClientDashboard. The dashboard file keeps the shell. */
import type { ReactNode } from 'react';
import { AccountPendingScreen } from '../../components/account/AccountPendingScreen';
import { WorkbenchEmpty, WorkbenchFlatSplit } from '../../components/baseui/layout/WorkbenchLayout';
import { ClientHomeDesktop } from '../../components/client/ClientHomeDesktop';
import { ClientHomeScreen } from '../../components/client/ClientHomeScreen';
import { ClientInvoiceScreen } from '../../components/client/ClientInvoiceScreen';
import { ClientLocationsPanel } from '../../components/client/ClientLocationsPanel';
import { ClientMapScreen } from '../../components/client/ClientMapScreen';
import { ClientMessagesPanel } from '../../components/client/ClientMessagesPanel';
import { ClientReportsScreen } from '../../components/client/ClientReportsScreen';
import { ClientRequestsList } from '../../components/client/ClientRequestsList';
import { DirectGuardRequestFlow } from '../../components/client/DirectGuardRequestFlow';
import { GuardDirectoryScreen } from '../../components/client/GuardDirectoryScreen';
import { GuardProfileScreen } from '../../components/client/GuardProfileScreen';
import { RequestSecurityFlow } from '../../components/client/RequestSecurityFlow';
import { SecurityCompanyOperationsScreen } from '../../components/client/SecurityCompanyOperationsScreen';
import { SecurityCompanyRosterScreen } from '../../components/client/SecurityCompanyRosterScreen';
import { AppGuidePage } from '../../components/docs/AppGuidePage';
import { ResponsivePage } from '../../components/layouts/desktop/DesktopPageShell';
import { PaymentsPage } from '../../components/payments/PaymentsPage';
import { AppScreen, AppStatusBanner } from '../../components/ui/app/AppPrimitives';
import { getClientRehireableGuards } from '../../lib/guardDirectory';
import { Client, SecurityGuard } from '../../types';

export interface RenderClientViewsBindings {
  accountPending: boolean;
  accountStatus: "active" | "pending" | "suspended";
  approved: boolean;
  avatarUrl: string;
  caps: { clientType: import("../../types").ClientType; isPersonal: boolean; isBusiness: boolean; isSecurityCompany: boolean; isOrganization: boolean; has: (capability: import("../../lib/clientProductModules").ClientCapability) => boolean; maxGuardsPerRequest: number; maxSavedLocations: number; overflowNav: { id: import("../../lib/clientCapabilities").ClientOverflowNavId; label: string; }[]; homeQuickActions: { id: import("../../lib/clientCapabilities").ClientHomeQuickActionId; label: string; sub: string; }[]; primaryNav: { id: "requests" | "map" | "operations" | "roster" | "home"; label: string; }[]; postJobLabel: string; allowsView: (view: string) => boolean; resolveView: (view: string) => string; };
  clientEmail: string;
  clientId: string;
  clientInvoices: import("../../lib/clientInvoicing").ClientInvoice[];
  clientLocations: import("../../types").ClientLocation[];
  clientMessages: import("../../types").ClientMessage[];
  clientRecord: import("../../types").Client;
  companyName: string;
  coverage: import("../../lib/clientCoverage").CoverageSummary;
  crewSettings: import("../../lib/platformSettings").PlatformSettings;
  currentUser: import("../../types").SessionUser;
  favoriteGuardIds: string[];
  feeConfig: import("../../../lib/platformFees").PlatformFeeConfig;
  flowPreset: "default" | "schedule" | "recurring";
  formFactor: "mobile" | "tablet" | "desktop";
  guards: import("../../types").SecurityGuard[];
  handleHomeAction: (action: import("../../components/client/ClientHomeScreen").ClientHomeAction) => void;
  incidentDetails: import("../../lib/incidentReports").IncidentReportViewContext[];
  invoiceRequestId: string;
  jobChatMessages: import("../../types").JobChatMessage[];
  jobChatRequestId: string;
  jobChatThreads: import("../../types").JobChatThread[];
  jobLocations: import("../../types").JobLocation[];
  messagesShellHeaderTrailing: React.ReactNode;
  navigate: (next: import("../../components/ClientDashboard").ClientView) => void;
  onAcceptPriceOffer: (requestId: string, guardId: string, offerId: string) => void | Promise<void>;
  onAddReview: (requestId: string, rating: number, reviewText: string, tipCents?: number) => void | Promise<string | void>;
  onAddToCompanyRoster: (guardId: string) => void | Promise<void>;
  onApproveFullTeam: (requestId: string) => void | Promise<void>;
  onApproveOvertime: (requestId: string) => void | Promise<void>;
  onApprovePendingGuard: (requestId: string) => void | Promise<void>;
  onApproveScheduleChange: (requestId: string) => void | Promise<void>;
  onApproveTeamSlot: (requestId: string, slotId: string) => void | Promise<void>;
  onCancelRequest: (requestId: string) => void;
  onConfirmSelfAudit: (requestId: string) => void | Promise<void>;
  onDeleteClientMessage: (messageId: string) => void | Promise<void>;
  onDeleteJobChatMessage: (messageId: string) => void | Promise<void>;
  onDeleteSupportMessage: (ticketId: string, messageId: string) => void | Promise<void>;
  onDenyFullTeam: (requestId: string) => void | Promise<void>;
  onDenyPendingGuard: (requestId: string) => void | Promise<void>;
  onDenyTeamSlot: (requestId: string, slotId: string) => void | Promise<void>;
  onDismissGuardSuggestion: (requestId: string, suggestionId: string) => void | Promise<void>;
  onDisputeOvertime: (requestId: string, input: import("../../lib/shiftBilling").OvertimeDisputeInput) => void | Promise<void>;
  onEditRequest: (requestId: string, req: Partial<import("../../types").SecurityRequest>) => void;
  onFlagEndCheckpoint: (requestId: string, category: string, note: string) => void | Promise<void>;
  onFlagStartCheckpoint: (requestId: string, category: string, note: string) => void | Promise<void>;
  onInvoiceRequestIdChange: (requestId: string) => void;
  onJobChatOpenChange: (open: boolean) => void;
  onJobChatRequestIdChange: (requestId: string) => void;
  onMessagesChromeChange: (chrome: import("../../lib/messagesChrome").MessagesChrome) => void;
  onMessagesDetailOpenChange: (open: boolean) => void;
  onOpenJobChat: (requestId: string) => void;
  onOpenSupportCompose: () => void;
  onOpenSupportReport: () => void;
  onPostRequest: (req: Partial<import("../../types").SecurityRequest>) => void;
  onRefreshClientMessages: () => void | Promise<void>;
  onRejectScheduleChange: (requestId: string) => void | Promise<void>;
  onRemoveFromCompanyRoster: (guardId: string) => void | Promise<void>;
  onReportViolation: (requestId: string, input: import("../../components/client/ClientViolationReportSheet").ClientViolationReportInput) => void | Promise<void>;
  onRequestReplacement: (requestId: string, reasonNote?: string) => void | Promise<void>;
  onRequestsJobTabChange: (tab: "open" | "completed" | "scheduled" | "missed") => void;
  onRequestsSelectedIdChange: (jobId: string) => void;
  onRequestSuggestedGuard: (requestId: string, guardId: string) => void | Promise<void>;
  onSaveClientLocation: (location: import("../../types").ClientLocation) => void | Promise<void>;
  onSendClientMessage: (body: string) => void | Promise<void>;
  onSendJobChatMessage: (requestId: string, body: string) => void | Promise<void>;
  onSendSupportMessage: (ticketId: string, body: string) => void | Promise<void>;
  onStartTutorial: () => void;
  onSubmitPriceOffer: (requestId: string, guardId: string, input: { hourlyRate: number; agreementFeeConfig?: import("../../../lib/platformFees").AgreementPlatformFeeConfig; message?: string; }) => void | Promise<void>;
  onSupportTicketIdChange: (ticketId: string) => void;
  onToggleFavoriteGuard: (guardId: string) => void | Promise<void>;
  onUpdateStatus: (requestId: string, status: import("../../types").JobStatus) => void;
  onVerifyEndCheckpoint: (requestId: string) => void | Promise<void>;
  onVerifyStartCheckpoint: (requestId: string) => void | Promise<void>;
  openJobChat: boolean;
  openMessages: (requestId: string) => void;
  page: (key: string, node: React.ReactNode, dataTour?: string) => React.JSX.Element;
  paymentGates: import("../../lib/platformSettings").ClientPaymentGates;
  platformRequests: import("../../types").SecurityRequest[];
  recentReports: import("../../lib/clientCoverage").ClientReportCard[];
  requests: import("../../types").SecurityRequest[];
  requestsJobTab: "open" | "completed" | "scheduled" | "missed";
  requestsSelectedId: string;
  requestTargetGuard: import("../../types").SecurityGuard;
  selectedGuard: import("../../types").SecurityGuard;
  selectedIncidentId: string;
  setFlowPreset: (value: React.SetStateAction<import("../../components/client/RequestSecurityFlow").RequestFlowPreset>) => void;
  setRequestTargetGuard: (guard: import("../../types").SecurityGuard) => void;
  setSelectedGuard: (guard: import("../../types").SecurityGuard) => void;
  setSelectedIncidentId: (value: React.SetStateAction<string>) => void;
  startDirectGuardRequest: (guard: import("../../types").SecurityGuard) => void;
  supportTicketId: string;
  supportTickets: import("../../types").SupportTicket[];
  tabletPortrait: boolean;
  teamLeadSettings: import("../../lib/platformSettings").PlatformSettings;
  tutorialActive: boolean;
  tutorialAvailable: boolean;
  tutorialCompleted: boolean;
  tutorialDemoBanner: React.JSX.Element;
  view: "requests" | "map" | "messages" | "support" | "profile" | "settings" | "guide" | "reports" | "guards" | "locations" | "operations" | "invoices" | "roster" | "request" | "home" | "direct-request" | "support-compose" | "support-report";
}

export function renderClientViews(mount: RenderClientViewsBindings): ReactNode {
  const {
    accountPending,
    accountStatus,
    approved,
    avatarUrl,
    caps,
    clientEmail,
    clientId,
    clientInvoices,
    clientLocations,
    clientMessages,
    clientRecord,
    companyName,
    coverage,
    crewSettings,
    currentUser,
    favoriteGuardIds,
    feeConfig,
    flowPreset,
    formFactor,
    guards,
    handleHomeAction,
    incidentDetails,
    invoiceRequestId,
    jobChatMessages,
    jobChatRequestId,
    jobChatThreads,
    jobLocations,
    messagesShellHeaderTrailing,
    navigate,
    onAcceptPriceOffer,
    onAddReview,
    onAddToCompanyRoster,
    onApproveFullTeam,
    onApproveOvertime,
    onApprovePendingGuard,
    onApproveScheduleChange,
    onApproveTeamSlot,
    onCancelRequest,
    onConfirmSelfAudit,
    onDeleteClientMessage,
    onDeleteJobChatMessage,
    onDeleteSupportMessage,
    onDenyFullTeam,
    onDenyPendingGuard,
    onDenyTeamSlot,
    onDismissGuardSuggestion,
    onDisputeOvertime,
    onEditRequest,
    onFlagEndCheckpoint,
    onFlagStartCheckpoint,
    onInvoiceRequestIdChange,
    onJobChatOpenChange,
    onJobChatRequestIdChange,
    onMessagesChromeChange,
    onMessagesDetailOpenChange,
    onOpenJobChat,
    onOpenSupportCompose,
    onOpenSupportReport,
    onPostRequest,
    onRefreshClientMessages,
    onRejectScheduleChange,
    onRemoveFromCompanyRoster,
    onReportViolation,
    onRequestReplacement,
    onRequestSuggestedGuard,
    onRequestsJobTabChange,
    onRequestsSelectedIdChange,
    onSaveClientLocation,
    onSendClientMessage,
    onSendJobChatMessage,
    onSendSupportMessage,
    onStartTutorial,
    onSubmitPriceOffer,
    onSupportTicketIdChange,
    onToggleFavoriteGuard,
    onUpdateStatus,
    onVerifyEndCheckpoint,
    onVerifyStartCheckpoint,
    openJobChat,
    openMessages,
    page,
    paymentGates,
    platformRequests,
    recentReports,
    requestTargetGuard,
    requests,
    requestsJobTab,
    requestsSelectedId,
    selectedGuard,
    selectedIncidentId,
    setFlowPreset,
    setRequestTargetGuard,
    setSelectedGuard,
    setSelectedIncidentId,
    startDirectGuardRequest,
    supportTicketId,
    supportTickets,
    tabletPortrait,
    teamLeadSettings,
    tutorialActive,
    tutorialAvailable,
    tutorialCompleted,
    tutorialDemoBanner,
    view,
  } = mount;


  if (
    accountPending &&
    view !== 'profile' &&
    view !== 'settings' &&
    view !== 'messages' &&
    view !== 'home' &&
    view !== 'guide' &&
    view !== 'invoices' &&
    view !== 'support' &&
    view !== 'support-compose' &&
    view !== 'support-report'
  ) {
    return page(
      'pending',
      <AccountPendingScreen
        role="client"
        client={clientRecord ?? { accountStatus, approved }}
        onOpenProfile={() => navigate('profile')}
      />
    );
  }

  if (view === 'map') {
    return page(
      'map',
      <ClientMapScreen
        requests={requests}
        guards={guards}
        currentUser={currentUser}
        clientEmail={clientEmail}
        paymentGates={paymentGates}
        crewSettings={crewSettings ?? teamLeadSettings}
        jobChatThreads={jobChatThreads}
        onOpenJobChat={openMessages}
        onPostJob={() => {
          setFlowPreset('default');
          navigate('request');
        }}
        onRequestGuard={() => navigate('guards')}
        initialLiveJobId={jobChatRequestId}
        onLiveJobIdChange={onJobChatRequestIdChange}
        onConfirmSelfAudit={onConfirmSelfAudit}
        onVerifyStartCheckpoint={onVerifyStartCheckpoint}
        onFlagStartCheckpoint={onFlagStartCheckpoint}
        onVerifyEndCheckpoint={onVerifyEndCheckpoint}
        onFlagEndCheckpoint={onFlagEndCheckpoint}
        onApproveOvertime={onApproveOvertime}
        onDisputeOvertime={onDisputeOvertime}
        onApproveScheduleChange={onApproveScheduleChange}
        onRejectScheduleChange={onRejectScheduleChange}
        onApprovePendingGuard={onApprovePendingGuard}
        onDenyPendingGuard={onDenyPendingGuard}
        onApproveTeamSlot={onApproveTeamSlot}
        onDenyTeamSlot={onDenyTeamSlot}
        onRequestSuggestedGuard={onRequestSuggestedGuard}
        onDismissGuardSuggestion={onDismissGuardSuggestion}
        onApproveFullTeam={onApproveFullTeam}
        onDenyFullTeam={onDenyFullTeam}
        onRequestReplacement={onRequestReplacement}
        feeConfig={feeConfig}
        onSubmitPriceOffer={onSubmitPriceOffer}
        onAcceptPriceOffer={onAcceptPriceOffer}
        onAddReview={onAddReview}
        onReportViolation={onReportViolation}
        onCancelRequest={onCancelRequest}
        onEditRequest={onEditRequest}
        onUpdateStatus={onUpdateStatus}
      />,
      'client-map'
    );
  }

  if (view === 'request') {
    return page(
      'request',
      <RequestSecurityFlow
        preset={flowPreset}
        feeConfig={feeConfig}
        feeSchedules={crewSettings?.clientFeeSchedules}
        clientType={clientRecord?.clientType}
        guards={guards}
        favoriteGuardIds={favoriteGuardIds}
        clientLocations={clientLocations}
        jobLocations={jobLocations}
        clientId={clientId}
        defaultAssignmentMode={clientRecord?.defaultAssignmentMode}
        clientRecord={clientRecord}
        clientCredentialRules={crewSettings?.clientCredentialRules}
        onBack={() => navigate('home')}
        onSubmit={(req) => {
          onPostRequest(req);
          navigate('home');
        }}
      />
    );
  }

  if (view === 'locations' && clientRecord && onSaveClientLocation) {
    return page(
      'locations',
      <ResponsivePage>
        <ClientLocationsPanel
          client={clientRecord}
          locations={clientLocations}
          sharedLocations={jobLocations}
          onSave={onSaveClientLocation}
        />
      </ResponsivePage>
    );
  }

  if (view === 'direct-request' && requestTargetGuard) {
    return page(
      `direct-request-${requestTargetGuard.id}`,
      <DirectGuardRequestFlow
        guard={requestTargetGuard}
        feeConfig={feeConfig}
        feeSchedules={crewSettings?.clientFeeSchedules}
        clientType={clientRecord?.clientType}
        clientRecord={clientRecord}
        clientCredentialRules={crewSettings?.clientCredentialRules}
        onBack={() => {
          setRequestTargetGuard(null);
          navigate('guards');
        }}
        onSubmit={(req) => {
          onPostRequest(req);
          setRequestTargetGuard(null);
          navigate('requests');
        }}
      />
    );
  }

  if (view === 'guards') {
    if (formFactor === 'desktop') {
      return page(
        'guards',
        <>
          {tutorialDemoBanner}
          <WorkbenchFlatSplit
            list={
              <GuardDirectoryScreen
                guards={guards}
                onSelectGuard={setSelectedGuard}
                favoriteGuardIds={favoriteGuardIds}
                onToggleFavorite={onToggleFavoriteGuard}
                clientId={clientId}
                requests={requests}
                        onRequestGuard={startDirectGuardRequest}
              />
            }
            detail={
              selectedGuard ? (
                <GuardProfileScreen
                  guard={selectedGuard}
                  clientId={clientId}
                  requests={requests}
                  platformRequests={platformRequests}
                  onBack={() => setSelectedGuard(null)}
                  onRequestGuard={startDirectGuardRequest}
                  jobChatThreads={jobChatThreads}
                  currentUser={currentUser}
                  onSendJobChatMessage={onSendJobChatMessage}
                  onOpenJobChat={onOpenJobChat ?? openMessages}
                  isFavorite={favoriteGuardIds.includes(selectedGuard.id)}
                  onToggleFavorite={
                    onToggleFavoriteGuard ? () => onToggleFavoriteGuard(selectedGuard.id) : undefined
                  }
                />
              ) : (
                <WorkbenchEmpty message="Select a guard or team to view profile and hire options" variant="detail" />
              )
            }
          />
        </>,
        'client-guards',
      );
    }
    if (formFactor === 'tablet') {
      return page(
        'guards',
        <>
          {tutorialDemoBanner}
          <div
            className="tablet-split-panel"
            data-selected={selectedGuard ? 'true' : undefined}
            data-orientation={tabletPortrait ? 'portrait' : 'landscape'}
          >
            <div className="split-list-pane">
              <GuardDirectoryScreen
                guards={guards}
                onSelectGuard={setSelectedGuard}
                favoriteGuardIds={favoriteGuardIds}
                onToggleFavorite={onToggleFavoriteGuard}
                clientId={clientId}
                requests={requests}
                onRequestGuard={startDirectGuardRequest}
              />
            </div>
            <div className="split-detail-pane">
              {selectedGuard ? (
                <GuardProfileScreen
                  guard={selectedGuard}
                  clientId={clientId}
                  requests={requests}
                  platformRequests={platformRequests}
                  onBack={() => setSelectedGuard(null)}
                  onRequestGuard={startDirectGuardRequest}
                  jobChatThreads={jobChatThreads}
                  currentUser={currentUser}
                  onSendJobChatMessage={onSendJobChatMessage}
                  onOpenJobChat={onOpenJobChat ?? openMessages}
                  isFavorite={favoriteGuardIds.includes(selectedGuard.id)}
                  onToggleFavorite={
                    onToggleFavoriteGuard ? () => onToggleFavoriteGuard(selectedGuard.id) : undefined
                  }
                />
              ) : (
                <p className="sft-split-empty">Select a guard or team to view profile and hire options</p>
              )}
            </div>
          </div>
        </>,
        'client-guards',
      );
    }
    if (selectedGuard) {
      return page(
        `guards-${selectedGuard.id}`,
        <GuardProfileScreen
          guard={selectedGuard}
          clientId={clientId}
          requests={requests}
          platformRequests={platformRequests}
          onBack={() => setSelectedGuard(null)}
          onRequestGuard={startDirectGuardRequest}
          jobChatThreads={jobChatThreads}
          currentUser={currentUser}
          onSendJobChatMessage={onSendJobChatMessage}
          onOpenJobChat={onOpenJobChat ?? openMessages}
          isFavorite={favoriteGuardIds.includes(selectedGuard.id)}
          onToggleFavorite={onToggleFavoriteGuard ? () => onToggleFavoriteGuard(selectedGuard.id) : undefined}
        />
      );
    }
    return page(
      'guards',
      <>
        {tutorialDemoBanner}
        <GuardDirectoryScreen
        guards={guards}
        onSelectGuard={setSelectedGuard}
        favoriteGuardIds={favoriteGuardIds}
        onToggleFavorite={onToggleFavoriteGuard}
        clientId={clientId}
        requests={requests}
        onRequestGuard={startDirectGuardRequest}
      />
      </>,
      'client-guards'
    );
  }

  if (view === 'messages' && currentUser && onSendJobChatMessage && onSendSupportMessage) {
    return page(
      'messages',
      <>
        {tutorialDemoBanner}
        <ClientMessagesPanel
        scope="messages"
        requests={requests}
        guards={guards}
        currentUser={currentUser}
        accountStatus={accountStatus}
        approved={approved}
        jobChatThreads={jobChatThreads}
        jobChatMessages={jobChatMessages}
        clientMessages={clientMessages}
        supportTickets={supportTickets}
        onSendJobChatMessage={onSendJobChatMessage}
        onSendClientMessage={onSendClientMessage}
        onDeleteClientMessage={onDeleteClientMessage}
        onDeleteJobChatMessage={onDeleteJobChatMessage}
        onDeleteSupportMessage={onDeleteSupportMessage}
        onRefreshClientMessages={onRefreshClientMessages}
        onSendSupportMessage={onSendSupportMessage}
        initialChatRequestId={jobChatRequestId}
        initialChatOpen={openJobChat}
        onChatRequestIdChange={onJobChatRequestIdChange}
        onChatOpenChange={onJobChatOpenChange}
        initialSupportTicketId={supportTicketId}
        onSupportTicketIdChange={onSupportTicketIdChange}
        onOpenCompose={onOpenSupportCompose}
        onOpenReport={onOpenSupportReport}
        onDetailOpenChange={onMessagesDetailOpenChange}
        onMessagesChromeChange={onMessagesChromeChange}
        shellHeaderTrailing={messagesShellHeaderTrailing}
      />
      </>,
      'client-messages'
    );
  }

  if (view === 'support' && currentUser && onSendSupportMessage) {
    return page(
      'support',
      <>
        {tutorialDemoBanner}
        <ClientMessagesPanel
          scope="support"
          requests={requests}
          guards={guards}
          currentUser={currentUser}
          accountStatus={accountStatus}
          approved={approved}
          jobChatThreads={jobChatThreads}
          jobChatMessages={jobChatMessages}
          clientMessages={clientMessages}
          supportTickets={supportTickets}
          onSendJobChatMessage={onSendJobChatMessage!}
          onSendClientMessage={onSendClientMessage}
          onDeleteClientMessage={onDeleteClientMessage}
          onDeleteJobChatMessage={onDeleteJobChatMessage}
          onDeleteSupportMessage={onDeleteSupportMessage}
          onRefreshClientMessages={onRefreshClientMessages}
          onSendSupportMessage={onSendSupportMessage}
          initialSupportTicketId={supportTicketId}
          onSupportTicketIdChange={onSupportTicketIdChange}
          onOpenCompose={onOpenSupportCompose}
          onOpenReport={onOpenSupportReport}
          onDetailOpenChange={onMessagesDetailOpenChange}
          onMessagesChromeChange={onMessagesChromeChange}
          shellHeaderTrailing={messagesShellHeaderTrailing}
        />
      </>,
      'client-support'
    );
  }

  if (view === 'messages') {
    return page(
      'messages-unavailable',
      <AppScreen className="p-5">
        <AppStatusBanner title="Messages are temporarily unavailable">
          <p className="text-sm text-brand-text-muted leading-relaxed">
            We could not initialize job chat or support messaging for this session. Refresh the app or
            contact Guardr support if this keeps happening.
          </p>
        </AppStatusBanner>
      </AppScreen>
    );
  }

  if (view === 'reports' && caps.has('reporting')) {
    const clientRecord: Client = {
      id: clientId,
      name: companyName,
      companyName,
      email: clientEmail,
      phone: '',
      avatar: avatarUrl ?? '',
      totalRequests: requests.length,
    };
    return page(
      'reports',
      <ClientReportsScreen
        reports={recentReports}
        incidentDetails={incidentDetails}
        selectedIncidentId={selectedIncidentId}
        onSelectIncident={setSelectedIncidentId}
        onBack={() => {
          setSelectedIncidentId(null);
          navigate('home');
        }}
        client={clientRecord}
        requests={requests}
      />
    );
  }

  if (view === 'invoices' && clientRecord) {
    return page(
      'invoices',
      <PaymentsPage role="client">
        <ClientInvoiceScreen
          client={clientRecord}
          clientEmail={clientEmail}
          requests={requests}
          invoices={clientInvoices}
          paymentGates={paymentGates}
          selectedRequestId={invoiceRequestId}
          onSelectRequestId={onInvoiceRequestIdChange}
        />
      </PaymentsPage>
    );
  }

  if (view === 'requests') {
    return page(
      'requests',
      <>
        {tutorialDemoBanner}
        <ClientRequestsList
        requests={requests}
        guards={guards}
        clientEmail={clientEmail}
        paymentGates={paymentGates}
        onCancelRequest={onCancelRequest}
        onEditRequest={onEditRequest}
        onUpdateStatus={onUpdateStatus}
        onAddReview={onAddReview}
        onReportViolation={onReportViolation}
        onConfirmSelfAudit={onConfirmSelfAudit}
        onVerifyStartCheckpoint={onVerifyStartCheckpoint}
        onFlagStartCheckpoint={onFlagStartCheckpoint}
        onVerifyEndCheckpoint={onVerifyEndCheckpoint}
        onFlagEndCheckpoint={onFlagEndCheckpoint}
        onApproveOvertime={onApproveOvertime}
        onDisputeOvertime={onDisputeOvertime}
        onApproveScheduleChange={onApproveScheduleChange}
        onRejectScheduleChange={onRejectScheduleChange}
        onApprovePendingGuard={onApprovePendingGuard}
        onDenyPendingGuard={onDenyPendingGuard}
        onApproveTeamSlot={onApproveTeamSlot}
        onDenyTeamSlot={onDenyTeamSlot}
        onRequestSuggestedGuard={onRequestSuggestedGuard}
        onDismissGuardSuggestion={onDismissGuardSuggestion}
        onApproveFullTeam={onApproveFullTeam}
        onDenyFullTeam={onDenyFullTeam}
        onRequestReplacement={onRequestReplacement}
        feeConfig={feeConfig}
        onSubmitPriceOffer={onSubmitPriceOffer}
        onAcceptPriceOffer={onAcceptPriceOffer}
        crewSettings={crewSettings ?? teamLeadSettings}
        onRequestNew={() => {
          setFlowPreset('default');
          navigate('request');
        }}
        currentUser={currentUser}
        jobChatThreads={jobChatThreads}
        onOpenJobChat={openMessages}
        onSelectedJobIdChange={onRequestsSelectedIdChange}
        initialSelectedId={requestsSelectedId}
        initialJobTab={requestsJobTab}
        onJobTabChange={onRequestsJobTabChange}
      />
      </>,
      'client-request'
    );
  }

  if (view === 'roster' && clientRecord && caps.has('roster-management')) {
    return page(
      'roster',
      <SecurityCompanyRosterScreen
        client={clientRecord}
        guards={guards}
        marketplaceGuards={guards}
        onAddToRoster={(guardId) => void onAddToCompanyRoster?.(guardId)}
        onRemoveFromRoster={(guardId) => void onRemoveFromCompanyRoster?.(guardId)}
        onRequestGuard={startDirectGuardRequest}
        onBack={() => navigate('home')}
      />,
      'client-roster'
    );
  }

  if (view === 'operations' && clientRecord && caps.has('shift-operations')) {
    return page(
      'operations',
      <SecurityCompanyOperationsScreen
        clientId={clientId}
        companyName={companyName}
        requests={requests}
        guards={guards}
        onOpenJob={(jobId) => {
          onRequestsSelectedIdChange?.(jobId);
          navigate('requests');
        }}
        onBack={() => navigate('home')}
      />,
      'client-operations'
    );
  }

  if (view === 'guide') {
    return page(
      'guide',
      <AppGuidePage
        audience="client"
        tutorialAvailable={tutorialAvailable}
        tutorialCompleted={tutorialCompleted}
        tutorialActive={tutorialActive}
        onStartTutorial={onStartTutorial}
      />
    );
  }

  const homeProps = {
    companyName,
    coverage,
    requests,
    recentReports,
    accountPending,
    onOpenProfile: () => navigate('profile'),
    onAction: handleHomeAction,
    onOpenRequest: (jobId: string) => {
      onRequestsSelectedIdChange?.(jobId);
      navigate('requests');
    },
    recentGuards: getClientRehireableGuards(clientId, requests, guards).slice(0, 5),
    onHireGuard: startDirectGuardRequest,
    onViewGuard: (guard: SecurityGuard) => {
      setSelectedGuard(guard);
      navigate('guards');
    },
    guards,
  };

  if (formFactor === 'desktop') {
    return page('home', <ClientHomeDesktop {...homeProps} />, 'client-home');
  }

  return page('home', <ClientHomeScreen {...homeProps} />, 'client-home');
}
