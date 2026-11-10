/**
 * renderAccountRoutes — behaviour-neutral route mount moved out of App.tsx.
 * Page workstreams edit this module instead of App.tsx.
 */
import type { ReactNode } from 'react';
import { InstallPrompt } from '../../components/InstallPrompt';
import { OpenAppCta } from '../../components/apps/OpenAppCta';
import { ClientCapabilitiesProvider } from '../../components/client/ClientCapabilitiesContext';
import { ClientInvoiceScreen } from '../../components/client/ClientInvoiceScreen';
import { PaymentsPage } from '../../components/payments/PaymentsPage';
import { UserProfileScreen } from '../../components/profile/UserProfileScreen';
import { UserSettingsScreen } from '../../components/profile/UserSettingsScreen';
import { SupportScreen } from '../../components/support/SupportScreen';
import { WebsiteAccountDocuments } from '../../components/website/WebsiteAccountDocuments';
import { WebsiteAccountDownloads } from '../../components/website/WebsiteAccountDownloads';
import { WebsiteAccountHome } from '../../components/website/WebsiteAccountHome';
import { WebsiteAccountShell } from '../../components/website/WebsiteAccountShell';
import { defaultRouteForRole, syncAppRoute, type WebsiteAccountView, websiteAccountRoute } from '../../lib/appNavigation';
import { unpaidClientInvoices } from '../../lib/clientInvoiceStorage';
import { findGuardProfileForUser } from '../../lib/guardDirectory';
import { countUnreadForMainApp } from '../../lib/notificationInbox';
import { isAppExperience } from '../../lib/platform/appExperience';
import type { ProductRole } from '../../lib/productApps';
import React from 'react';
import type { AppMountBindings } from '../mountBindings';

export function renderAccountRoutes(mount: AppMountBindings): ReactNode | null {
  const currentUser = mount.currentUser;
  if (!currentUser) return null;
  const {
    accountMenuExtras,
    appRoleForUser,
    applyAppRoute,
    canDownloadApks,
    clientInvoiceRequestId,
    clientInvoices,
    clientPaymentGatesMemo,
    clients,
    displayRequests,
    guards,
    handleSendSupportMessage,
    handleSignOut,
    handleSubmitClientCredential,
    handleUpdateClientProfile,
    handleUpdateGuardProfile,
    isDbConnected,
    messengerAvailable,
    openLegalPage,
    platformSettings,
    resolveWebsiteAccess,
    sessionGuard,
    setClientInvoiceRequestIdState,
    setSupportTicketId,
    setWebsiteAccountView,
    supportSection,
    supportTicketId,
    supportTickets,
    userNotifications,
    websiteAccountView,
  } = mount;


  const signedInRole = appRoleForUser(currentUser);
  const productRole: ProductRole = signedInRole ?? 'client';
  const openSignedInApp = () => {
    const access = resolveWebsiteAccess(currentUser);
    if (access === 'operations' || access === 'activation') {
      const fallback =
        access === 'activation' && productRole === 'guard'
          ? { role: 'guard' as const, guardTab: 'activation' as const }
          : productRole === 'guard'
            ? defaultRouteForRole('guard', findGuardProfileForUser(currentUser, guards))
            : defaultRouteForRole(productRole);
      setWebsiteAccountView(null);
      applyAppRoute(fallback);
      syncAppRoute(fallback);
      return;
    }
    const downloads = websiteAccountRoute(productRole, 'downloads');
    applyAppRoute(downloads);
    syncAppRoute(downloads);
  };
  const goWebsiteAccount = (view: WebsiteAccountView) => {
    const route = websiteAccountRoute(productRole, view);
    applyAppRoute(route);
    syncAppRoute(route);
  };

  const signedInWebsiteAccess = resolveWebsiteAccess(currentUser);
  const browserAccountShellOnly =
    !isAppExperience() &&
    signedInRole !== 'staff' &&
    signedInWebsiteAccess === 'account';
  const accountShellView: WebsiteAccountView | null =
    websiteAccountView ?? (browserAccountShellOnly ? 'home' : null);

  if (accountShellView) {
    const clientRecord = clients.find((c) => c.id === currentUser.id);
    const unreadCount = countUnreadForMainApp(userNotifications, messengerAvailable);
    const accountStatusLabel =
      currentUser.role === 'client'
        ? clientRecord?.accountStatus === 'active' || clientRecord?.approved
          ? 'Active'
          : 'Pending review'
        : currentUser.role === 'guard'
          ? sessionGuard?.userStatus === 'active'
            ? 'Active'
            : 'Activation required'
          : 'Staff';

    let accountBody: React.ReactNode = (
      <WebsiteAccountHome
        currentUser={currentUser}
        role={productRole}
        statusLabel={accountStatusLabel}
        statusDetail={currentUser.email}
        billingSummary={
          productRole === 'client'
            ? `${unpaidClientInvoices(clientInvoices, currentUser.id).length} open invoice${unpaidClientInvoices(clientInvoices, currentUser.id).length === 1 ? '' : 's'}`
            : productRole === 'guard'
              ? sessionGuard?.stripeConnectAccountId
                ? 'Payouts connected'
                : 'Connect payouts in the Guard app'
              : 'Operations run in the browser'
        }
        notificationCount={unreadCount}
        onboardingOpen={resolveWebsiteAccess(currentUser) === 'activation'}
        onOpenApp={openSignedInApp}
        onOpenBilling={() => goWebsiteAccount(productRole === 'guard' ? 'payouts' : 'billing')}
        onOpenProfile={() => goWebsiteAccount('profile')}
      />
    );

    if (accountShellView === 'profile') {
      accountBody = (
        <div className="website-account-panel">
          <UserProfileScreen
            currentUser={currentUser}
            client={clientRecord ?? null}
            guard={
              currentUser.role === 'client'
                ? null
                : guards.find((g) => g.id === currentUser.id) ?? null
            }
            onSave={(payload) => {
              if (currentUser.role === 'client') return handleUpdateClientProfile(currentUser.id, payload);
              return handleUpdateGuardProfile(currentUser.id, payload);
            }}
            onSubmitClientCredential={
              currentUser.role === 'client'
                ? (credential) => handleSubmitClientCredential(currentUser.id, credential)
                : undefined
            }
            platformSettings={platformSettings}
          />
        </div>
      );
    } else if (accountShellView === 'settings') {
      accountBody = (
        <div className="website-account-panel">
          <UserSettingsScreen
            currentUser={currentUser}
            isDbConnected={isDbConnected}
            onOpenLegal={openLegalPage}
            onOpenDownload={canDownloadApks ? () => goWebsiteAccount('downloads') : undefined}
          />
        </div>
      );
    } else if (accountShellView === 'support') {
      accountBody = (
        <div className="website-account-panel">
          <SupportScreen
            currentUser={currentUser}
            tickets={supportTickets}
            onSendMessage={handleSendSupportMessage}
            initialTicketId={supportTicketId}
            onActiveTicketIdChange={setSupportTicketId}
            initialSection={supportSection}
          />
        </div>
      );
    } else if (accountShellView === 'documents') {
      accountBody = (
        <WebsiteAccountDocuments currentUser={currentUser} onOpenLegal={openLegalPage} />
      );
    } else if (accountShellView === 'downloads') {
      accountBody = (
        <WebsiteAccountDownloads role={productRole} canDownloadApks={canDownloadApks} />
      );
    } else if (accountShellView === 'billing' || accountShellView === 'payouts') {
      if (productRole === 'client' && clientRecord) {
        accountBody = (
          <ClientCapabilitiesProvider clientType={clientRecord.clientType}>
            <div className="website-account-panel" style={{ minHeight: 420 }}>
              <PaymentsPage role="client">
                <ClientInvoiceScreen
                  client={clientRecord}
                  clientEmail={currentUser.email}
                  requests={displayRequests.filter(
                    (r) =>
                      r.clientId === currentUser.id ||
                      r.clientName === currentUser.clientName ||
                      r.clientName === currentUser.name
                  )}
                  invoices={clientInvoices}
                  paymentGates={clientPaymentGatesMemo}
                  selectedRequestId={clientInvoiceRequestId}
                  onSelectRequestId={(id) => setClientInvoiceRequestIdState(id)}
                />
              </PaymentsPage>
            </div>
          </ClientCapabilitiesProvider>
        );
      } else {
        accountBody = (
          <div className="website-account-panel" style={{ padding: 24 }}>
            <h1 style={{ fontSize: '1.5rem', letterSpacing: '-0.03em', fontWeight: 750, marginBottom: 8 }}>
              {productRole === 'guard' ? 'Payouts' : 'Billing'}
            </h1>
            <p className="website-account-lead">
              {productRole === 'guard'
                ? 'Connect Stripe, request payouts, and review shift pay in the Guard app.'
                : 'Platform billing and payout administration live in operations.'}
            </p>
            <OpenAppCta
              role={productRole}
              destination={productRole === 'guard' ? '/guard/payments' : '/staff/payments'}
              onOpenWebApp={() => {
                const dest =
                  productRole === 'guard'
                    ? { role: 'guard' as const, guardTab: 'earnings' as const }
                    : { role: 'staff' as const, staffSection: 'payments' as const };
                setWebsiteAccountView(null);
                applyAppRoute(dest);
                syncAppRoute(dest);
              }}
            />
          </div>
        );
      }
    }

    return (
      <>
        <WebsiteAccountShell
          role={productRole}
          userName={currentUser.name}
          userEmail={currentUser.email}
          avatarUrl={currentUser.avatar}
          activeView={accountShellView}
          onNavigate={goWebsiteAccount}
          onOpenApp={openSignedInApp}
          onboardingOpen={resolveWebsiteAccess(currentUser) === 'activation'}
          canDownloadApks={canDownloadApks}
          onSignOut={handleSignOut}
          accountMenu={{
            userName: currentUser.name,
            userSubtitle: currentUser.email,
            avatarUrl: currentUser.avatar,
            onOpenProfile: () => goWebsiteAccount('profile'),
            onOpenSettings: () => goWebsiteAccount('settings'),
            onSignOut: handleSignOut,
            ...accountMenuExtras,
          }}
        >
          {accountBody}
        </WebsiteAccountShell>
        <InstallPrompt />
      </>
    );
  }
  return null;
}
