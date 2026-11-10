/**
 * renderPublicRoutes — behaviour-neutral route mount moved out of App.tsx.
 * Page workstreams edit this module instead of App.tsx.
 */
import type { ReactNode } from 'react';
import { AppHomeScreen } from '../../components/AppHomeScreen';
import { AuthPage } from '../../components/AuthPage';
import { HomePage } from '../../components/HomePage';
import { InstallPrompt } from '../../components/InstallPrompt';
import { LoadingScreen } from '../../components/LoadingScreen';
import { AppDownloadScreen } from '../../components/app/AppDownloadScreen';
import { AuthRoleChoicePage } from '../../components/auth/AuthRoleChoicePage';
import { AppGuidePage } from '../../components/docs/AppGuidePage';
import { AccountMenu } from '../../components/layouts/AccountMenu';
import { LegalPage } from '../../components/legal/LegalPage';
import { setDataLoadIssue } from '../../lib/dataLoadStatus';
import { isAppExperience } from '../../lib/platform/appExperience';
import { installedAuthEntry } from '../../lib/productApps';
import type { AppMountBindings } from '../mountBindings';

export function renderPublicRoutes(mount: AppMountBindings): ReactNode | null {
  const {
    accountMenuExtras,
    authChoiceMode,
    authSignupPick,
    backToAuthRoleChoice,
    changeThemeMode,
    clients,
    closeAuthChoice,
    closeAuthView,
    closeDownloadPage,
    closeLegalPage,
    closePublicGuide,
    companyPlacardPublicDocuments,
    currentUser,
    downloadPageOpen,
    guards,
    handleSignIn,
    handleSignOut,
    handleSignUp,
    initialAuthMode,
    initialAuthRole,
    initialClientType,
    installedAuthRole,
    isAuthView,
    isDbConnected,
    legalPage,
    loading,
    navigateToAuth,
    oneRoleCases,
    openAuthChoice,
    openAuthView,
    openLegalPage,
    openPublicGuide,
    platformSettings,
    productApp,
    publicGuideOpen,
    rememberOneRoleHold,
    setAuthViewMode,
    setAuthViewRole,
    setLoading,
    themeMode,
  } = mount;


  if (loading) {
    return (
      <LoadingScreen
        onRetry={() => {
          setLoading(true);
          setDataLoadIssue(null);
          window.location.reload();
        }}
      />
    );
  }

  if (downloadPageOpen && isAppExperience()) {
    return (
      <>
        <AppDownloadScreen
          onBack={closeDownloadPage}
          headerRight={
            currentUser ? (
              <AccountMenu
                userName={currentUser.name}
                userSubtitle={currentUser.email}
                avatarUrl={currentUser.avatar}
                onOpenProfile={() => undefined}
                onOpenSettings={() => undefined}
                onSignOut={handleSignOut}
                hideProfile
                {...accountMenuExtras}
              />
            ) : undefined
          }
        />
        <InstallPrompt />
      </>
    );
  }

  if (legalPage) {
    return (
      <>
        <LegalPage
          page={legalPage}
          onBack={closeLegalPage}
          onOpenLegal={openLegalPage}
          headerRight={
            currentUser ? (
              <AccountMenu
                userName={currentUser.name}
                userSubtitle={currentUser.email}
                avatarUrl={currentUser.avatar}
                onOpenProfile={() => undefined}
                onOpenSettings={() => undefined}
                onSignOut={handleSignOut}
                hideProfile
                {...accountMenuExtras}
              />
            ) : undefined
          }
        />
        <InstallPrompt />
      </>
    );
  }

  if (!currentUser) {
    if (publicGuideOpen && !isAppExperience()) {
      return (
        <>
          <div className="page-shell min-h-screen flex flex-col bg-brand-bg">
            <AppGuidePage audience="all" onBack={closePublicGuide} />
          </div>
          <InstallPrompt />
        </>
      );
    }
    if (authChoiceMode && !isAppExperience()) {
      return (
        <>
          <AuthRoleChoicePage
            mode={authChoiceMode}
            signupStep={authSignupPick ?? 'path'}
            themeMode={themeMode}
            onChangeTheme={changeThemeMode}
            onNavigateToAuth={navigateToAuth}
            onSelectRole={(role) => navigateToAuth(role, authChoiceMode ?? 'sign-in')}
            onSelectSignupPath={(path) => openAuthChoice('sign-up', path)}
            onSelectClientType={(kind) => openAuthView('client', authChoiceMode ?? 'sign-in', kind)}
            onOpenGuide={openPublicGuide}
            onBack={closeAuthChoice}
          />
          <InstallPrompt />
        </>
      );
    }
    if (isAuthView && !isAppExperience()) {
      return (
        <>
          <AuthPage
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
            guardsList={guards}
            clientsList={clients}
            isDbConnected={isDbConnected}
            isAppLoading={loading}
            onBackToHome={closeAuthView}
            onBackToRoleChoice={backToAuthRoleChoice}
            onOpenLegal={openLegalPage}
            onOpenGuide={openPublicGuide}
            onAuthModeChange={setAuthViewMode}
            onAuthRoleChange={setAuthViewRole}
            initialRole={initialAuthRole}
            initialMode={initialAuthMode}
            initialClientType={initialClientType}
            themeMode={themeMode}
            onChangeTheme={changeThemeMode}
            presentation="page"
            oneRoleCases={oneRoleCases}
            onOneRoleHold={rememberOneRoleHold}
          />
          <InstallPrompt />
        </>
      );
    }
    if (isAppExperience()) {
      if (authChoiceMode) {
        const entry = installedAuthEntry(productApp, authChoiceMode);
        const showInstalledChoice = entry.type === 'role-picker' || entry.type === 'client-kind';
        if (showInstalledChoice) {
          return (
            <>
              <AuthRoleChoicePage
                mode={authChoiceMode}
                signupStep={entry.type === 'client-kind' ? 'client' : (authSignupPick ?? 'path')}
                themeMode={themeMode}
                onChangeTheme={changeThemeMode}
                onNavigateToAuth={navigateToAuth}
                onSelectRole={(role) => navigateToAuth(role, authChoiceMode ?? 'sign-in')}
                onSelectSignupPath={(path) => openAuthChoice('sign-up', path)}
                onSelectClientType={(kind) => openAuthView('client', authChoiceMode ?? 'sign-in', kind)}
                onOpenGuide={openPublicGuide}
                onBack={closeAuthChoice}
              />
              <InstallPrompt />
            </>
          );
        }
      }
      // PWA/APK: full-page auth (not bottom sheets / floating cards).
      if (isAuthView) {
        const lockToInstalledApp = Boolean(installedAuthRole);
        const clientKindStep = initialAuthRole === 'client';
        return (
          <>
            <AuthPage
              onSignIn={handleSignIn}
              onSignUp={handleSignUp}
              guardsList={guards}
              clientsList={clients}
              isDbConnected={isDbConnected}
              isAppLoading={loading}
              onBackToHome={closeAuthView}
              onBackToRoleChoice={
                lockToInstalledApp && !clientKindStep ? undefined : backToAuthRoleChoice
              }
              onOpenLegal={openLegalPage}
              onOpenGuide={openPublicGuide}
              onAuthModeChange={setAuthViewMode}
              onAuthRoleChange={lockToInstalledApp ? undefined : setAuthViewRole}
              initialRole={initialAuthRole}
              initialMode={initialAuthMode}
              initialClientType={initialClientType}
              themeMode={themeMode}
              onChangeTheme={changeThemeMode}
              presentation="page"
              oneRoleCases={oneRoleCases}
              onOneRoleHold={rememberOneRoleHold}
            />
            <InstallPrompt />
          </>
        );
      }
      return (
        <>
          <AppHomeScreen
            themeMode={themeMode}
            onChangeTheme={changeThemeMode}
            onNavigateToAuth={navigateToAuth}
            onOpenLegal={openLegalPage}
          />
          <InstallPrompt />
        </>
      );
    }
    return (
      <>
        <HomePage
          themeMode={themeMode}
          onChangeTheme={changeThemeMode}
          ownerMessage={platformSettings.ownerMessage}
          directorMessage={platformSettings.directorMessage}
          companyPlacardDocuments={companyPlacardPublicDocuments}
          onNavigateToAuth={navigateToAuth}
          onOpenLegal={openLegalPage}
          onOpenGuide={openPublicGuide}
        />
        <InstallPrompt />
      </>
    );
  }
  return null;
}
