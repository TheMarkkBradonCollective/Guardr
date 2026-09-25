# Guardr — Page-by-page, button-level inventory

**Prepared:** Sep 25, 2026 (PT) · code `main` @ c243968 · companion to `GAP-ANALYSIS.md`

## How to read this
- **works** = the control is wired to a real handler (App.tsx action, API/Supabase call, navigation, or real on-screen state). It is *wired in code*, **not** proven end to end (the core loop has never completed, and production returns HTTP 402 today).
- **stub** = no-op, toast/message only, device-only, manual placeholder, never shown (dead code), or hidden because its callback is never passed in.
- **broken** = exists but fails, is unsafe, or matches a known AUD defect. Includes page-level defects.
- **missing** = a control the page clearly needs but doesn't have (listed under each page). These were checked by searching the code.
- Guard and Customer pages below are only reachable in the installed PWA/APK for Active users. The website sends them to `/account` (AUD-013/016).
- Staff sections are shown or hidden by role (see the role table). All role checks run in the browser only (see GAP-ANALYSIS A2).
- Method: TypeScript AST scan of all 444 `.tsx` components → every onClick/href/onSubmit/slide/toggle control, with the label text and handler. Shared kit components (buttons, sheets, layout) are counted where they are used. Each control is counted once per surface.

## Counts per surface

| Surface | works | stub | broken | missing |
|---|---|---|---|---|
| Public website | 79 | 12 | 0 | 3 |
| Website /account area (signed-in, browser) | 123 | 0 | 4 | 5 |
| Guard app / PWA / APK | 194 | 1 | 8 | 6 |
| Customer app (Personal / Business / PPO security company) | 192 | 5 | 9 | 13 |
| Staff app (browser/PWA/APK; visibility depends on role) | 302 | 6 | 9 | 20 |

## Staff sections by role (default permissions, `src/lib/permissions.ts` + `src/lib/staffNavAccess.ts`)

| Section | Support | Moderator | Administrator | Manager | Director | Founder |
|---|---|---|---|---|---|---|
| Overview, Messages, Support inbox, Incidents (view), Violations (view), Guide, Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Applications (approve guards/customers, one-role holds), Stats | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Credentials verify, Job-offer review, Disputes, Suspend, Settings, Integrations, Locations, Analytics, Staff roster | — | — | ✅ | ✅ | ✅ | ✅ |
| Payments, Platform fees, Staff compensation (manage), Audit log, Agreements, Dev notes, Management, Permissions | — | — | — | ✅ | ✅ | ✅ |
| Cities (open/close markets, city manager) | — | — | — | recommend | ✅ | ✅ |
| Create/modify Directors & Founders | — | — | — | — | — | ✅ |
| Finance side seat | Payments, Platform fees, Staff comp, Agreements, Audit log only | | | | | |

Rule: staff can only assign or modify roles **strictly below** their own (`getAssignableStaffRoles`). That's why a Director can't make a Director (AUD-012) and can't delete a same-rank peer (AUD-011).

## Worst dead or broken buttons per surface

- **Public website:** no "Forgot password" (missing); staff sign-up has no role picker (AUD-001); 11 landing CTAs sit in `LandingSections.tsx`, which is never shown (dead code, harmless); "Start tutorial" in the Guide is hidden because `onStartTutorial` is never passed.
- **Website /account:** "Open Guard / Open Customer" on Account home loops back to /account or the APK page (AUD-013/016/021); guard **Payouts** page is just text plus that same looping button; no "Delete my account".
- **Guard app:** "Save availability" only saves on the device (B1); no "Withdraw application" or "Can't make this shift"; "Apply as team lead" never appears (not wired); map tiles say "API KEY REQUIRED"; Performance factor rows have a no-op click (`GuardPerformanceFactorDetail.tsx:199`).
- **Customer app:** "Slide to post job offer" posts with no draft, and Business is blocked even when Verified (AUD-009/016/020); "Pay with Stripe" is still offered after the shift ends and the amount comes from the browser (AUD-019, A3); "Recurring coverage" creates no future shifts; "Approve/Deny full team" never appears; `/client/sites` goes to Home (AUD-018); PPO Live ops has only "Open job".
- **Staff app:** Disputes "Approve / Hold / **Partial payout** / Cancel payout" only send notifications ("Partial payout issued." when nothing was paid); "Ignore hold" doesn't stick (AUD-008); "Refund client" and "Release payout" call unauthenticated endpoints; no "Mark paid / Waive" (AUD-017); city cap not editable (AUD-006); Incidents has no status or assign; "Delete account" doesn't cascade (AUD-011); "Mark background checked" is a manual toggle, not a check.

---


## Public website

### / (landing)
Components: `HomePage.tsx`, `landing/LandingPathCards.tsx`, `landing/LandingAppDownloads.tsx`, `landing/PwaInstallGuide.tsx`, `landing/desktop/DesktopLandingPage.tsx`, `landing/tablet/TabletLandingPage.tsx`, `landing/mobile/MobileLandingPage.tsx`, `landing/shared/LandingSections.tsx`, `landing/mobility/MobilityStyleLandingPage.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Sign up | landing/LandingAppDownloads.tsx:84 | `() => onNavigateToAuth(undefined, 'sign-up')` | works |
| Log in | landing/LandingAppDownloads.tsx:92 | `() => onNavigateToAuth(undefined, 'sign-in')` | works |
| Work at Guardr Apply for a staff role Platform operations — not guard or client marketplac | landing/LandingPathCards.tsx:26 | `() => onNavigateToAuth('staff', 'sign-up')` | works |
| Personal or business I need security Hire as yourself or as a company — whoever pays is th | landing/LandingPathCards.tsx:57 | `() => onNavigateToAuth('client', 'sign-up')` | works |
| Independent contractor I&apos;m a guard Browse marketplace shifts — not a Guardr employee  | landing/LandingPathCards.tsx:88 | `() => onNavigateToAuth('guard', 'sign-up')` | works |
| "Close install guide" | landing/PwaInstallGuide.tsx:33 | `onClose` | works |
| Done | landing/PwaInstallGuide.tsx:88 | `() => { onDone?.(); onClose(); }` | works |
| Back | landing/PwaInstallGuide.tsx:98 | `onClose` | works |
| Manuals | landing/mobility/MobilityStyleLandingPage.tsx:168 | `resolveManualPdfUrl(USER_MANUALS_COMBINED_HREF)` | works |
| Company package | landing/mobility/MobilityStyleLandingPage.tsx:179 | `resolveStakeholderDownloadPageUrl()` | works |
| Post a job | landing/mobility/MobilityStyleLandingPage.tsx:198 | `() => onNavigateToAuth('client', 'sign-up')` | works |
| Find work | landing/mobility/MobilityStyleLandingPage.tsx:205 | `() => onNavigateToAuth('guard', 'sign-up')` | works |
| {ctaLabel} | landing/shared/LandingSections.tsx:151 | `onCta` | DEAD CODE — component is never rendered |
| Apply at Guardr (staff) | landing/shared/LandingSections.tsx:368 | `() => onNavigateToAuth('staff', 'sign-up')` | DEAD CODE — component is never rendered |
| I need security | landing/shared/LandingSections.tsx:371 | `() => onNavigateToAuth('client', 'sign-up')` | DEAD CODE — component is never rendered |
| I&apos;m a guard | landing/shared/LandingSections.tsx:374 | `() => onNavigateToAuth('guard', 'sign-up')` | DEAD CODE — component is never rendered |
| Sign in to your account | landing/shared/LandingSections.tsx:380 | `() => onNavigateToAuth(undefined, 'sign-in')` | DEAD CODE — component is never rendered |
| Already have an account? Sign in → | landing/shared/LandingSections.tsx:473 | `() => onNavigateToAuth(undefined, 'sign-in')` | DEAD CODE — component is never rendered |
| _(icon/unnamed)_ | landing/shared/LandingSections.tsx:561 | `onChangeTheme` | DEAD CODE — component is never rendered |
| Guide | landing/shared/LandingSections.tsx:566 | `onOpenGuide` | DEAD CODE — component is never rendered |
| _(icon/unnamed)_ | landing/shared/LandingSections.tsx:606 | `onChangeTheme` | DEAD CODE — component is never rendered |
| I need security | landing/shared/LandingSections.tsx:642 | `() => onNavigateToAuth('client', 'sign-up')` | DEAD CODE — component is never rendered |
| I&apos;m a guard | landing/shared/LandingSections.tsx:645 | `() => onNavigateToAuth('guard', 'sign-up')` | DEAD CODE — component is never rendered |

### /?auth=sign-in | sign-up (&ar=guard|client|staff, &ct=)

**Missing controls this page needs:**
- MISSING — "Forgot password" / reset-by-email link — no reset flow exists anywhere in src/ (grep: no resetPasswordForEmail/forgot)
- MISSING — Staff sign-up "Which role are you applying for?" picker — every applicant is forced to Support (AUD-001)
- MISSING — Bot/abuse protection (captcha) on sign-up — none found

Components: `AuthPage.tsx`, `auth/AuthRoleChoicePage.tsx`, `auth/AuthFormChrome.tsx`, `auth/ChangePasswordPrompt.tsx`, `auth/StaffSignupNotice.tsx`, `auth/clientSignup/ClientSignupIntake.tsx`, `SignatureSecurityBrand.tsx`, `landing/LandingPrimitives.tsx`, `auth/clientSignup/ClientSignupSharedSections.tsx`, `auth/clientSignup/PersonalClientSignupIntake.tsx`, `auth/clientSignup/BusinessClientSignupIntake.tsx`, `auth/clientSignup/SecurityCompanyClientSignupIntake.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| _(icon/unnamed)_ | AuthPage.tsx:858 | `onChangeTheme` | works |
| "Open guide" | AuthPage.tsx:866 | `onOpenGuide` | works |
| Email Password {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" / | AuthPage.tsx:901 | `handleAuthSubmit` | works |
| showPassword ? 'Hide password' : 'Show password' {showPassword ? <EyeOff className="w-4 h- | AuthPage.tsx:940 | `() => setShowPassword(!showPassword)` | works |
| Select city | AuthPage.tsx:990 | `(e) => setGuardPrimaryCity(e.target.value)` | works |
| Select… Unarmed only Armed only Open to armed & unarmed | AuthPage.tsx:1088 | `(e) => setGuardArmedPreference(e.target.value as GuardArmedPreference \| '')` | works |
| {opt} | AuthPage.tsx:1108 | `() => setGuardSpecialties((prev) => prev.includes(opt) ? prev.filter((x) => x !== opt) : [` | works |
| _(icon/unnamed)_ | AuthPage.tsx:1133 | `(e) => handleGuardCityChange(e.target.value)` | works |
| Select… | AuthPage.tsx:1178 | `(e) => setGuardCardStatus(e.target.value as GuardCardStatus \| '')` | works |
| Select… Yes No | AuthPage.tsx:1197 | `(e) => setGuardReliableTransport(e.target.value as '' \| 'yes' \| 'no')` | works |
| Select… | AuthPage.tsx:1321 | `(e) => setBusinessType(e.target.value)` | works |
| {opt} | AuthPage.tsx:1338 | `() => setIndustries((prev) => prev.includes(opt) ? prev.filter((x) => x !== opt) : [...pre` | works |
| {opt} | AuthPage.tsx:1417 | `() => setServiceTypes((prev) => prev.includes(opt) ? prev.filter((x) => x !== opt) : [...p` | works |
| No preference Armed Unarmed | AuthPage.tsx:1454 | `(e) => setArmedPreference(e.target.value)` | works |
| {label} | AuthPage.tsx:1471 | `() => setServiceFrequencies((prev) => prev.includes(value) ? prev.filter((x) => x !== valu` | works |
| Prefer not to say Under $500 $500 – $2,000 $2,000 – $5,000 $5,000 – $15,000 $15,000+ Ongoi | AuthPage.tsx:1506 | `(e) => setBudgetRange(e.target.value)` | works |
| _(icon/unnamed)_ | AuthPage.tsx:1536 | `(e) => handleClientCityChange(e.target.value)` | works |
| {opt} | AuthPage.tsx:1568 | `() => setPropertyTypes((prev) => prev.includes(opt) ? prev.filter((x) => x !== opt) : [...` | works |
| {val === 'yes' ? 'Yes' : 'No'} | AuthPage.tsx:1594 | `() => setHasPriorSecurityService(hasPriorSecurityService === val ? '' : val)` | works |
| Select… | AuthPage.tsx:1685 | `(e) => setHowHeardAboutUs(e.target.value)` | works |
| "Close" | AuthPage.tsx:1788 | `handleAuthBack` | works |
| {onBackToRoleChoice ? 'Back to role selection' : 'Back to Home'} | AuthPage.tsx:1814 | `handleAuthBack` | works |
| _(icon/unnamed)_ | AuthPage.tsx:1851 | `onChangeTheme` | works |
| "Open guide" | AuthPage.tsx:1853 | `onOpenGuide` | works |
| backAriaLabel Back | auth/AuthFormChrome.tsx:23 | `() => { void triggerHaptic('light'); onBack(); }` | works |
| backAriaLabel Back | auth/AuthFormChrome.tsx:53 | `() => { void triggerHaptic('light'); onBack(); }` | works |
| {label} | auth/AuthFormChrome.tsx:246 | `() => onChange(id)` | works |
| {label} {showDescription && !selected ? null : null} | auth/AuthFormChrome.tsx:273 | `() => onChange(id)` | works |
| {title} {description} | auth/AuthRoleChoicePage.tsx:197 | `() => onSelect(id)` | works |
| {backLabel === 'Back' ? 'Back' : 'Back to Home'} | auth/AuthRoleChoicePage.tsx:345 | `onBack` | works |
| _(icon/unnamed)_ | auth/AuthRoleChoicePage.tsx:363 | `handleSelect` | works |
| _(icon/unnamed)_ | auth/AuthRoleChoicePage.tsx:485 | `handleSelect` | works |
| "Back" | auth/ChangePasswordPrompt.tsx:80 | `() => setMode('prompt')` | works |
| Yes, change now | auth/ChangePasswordPrompt.tsx:98 | `() => setMode('form')` | works |
| Do it later | auth/ChangePasswordPrompt.tsx:101 | `handleDismiss` | works |
| New password Confirm new password {error && <p className="text-sm text-red-400">{error}</p | auth/ChangePasswordPrompt.tsx:107 | `(e) => void handleSubmit(e)` | works |
| Apply to work at Guardr (staff) | auth/StaffSignupNotice.tsx:33 | `onApplyAsStaff` | works |
| Select… | auth/clientSignup/BusinessClientSignupIntake.tsx:34 | `(e) => props.onBusinessTypeChange(e.target.value)` | works |
| {opt} | auth/clientSignup/BusinessClientSignupIntake.tsx:55 | `() => props.onIndustriesChange( props.industries.includes(opt) ? props.industries.filter((` | works |
| {opt} | auth/clientSignup/ClientSignupSharedSections.tsx:81 | `() => props.onServiceTypesChange( props.serviceTypes.includes(opt) ? props.serviceTypes.fi` | works |
| No preference Armed Unarmed | auth/clientSignup/ClientSignupSharedSections.tsx:125 | `(e) => props.onArmedPreferenceChange(e.target.value)` | works |
| {label} | auth/clientSignup/ClientSignupSharedSections.tsx:145 | `() => props.onServiceFrequenciesChange( props.serviceFrequencies.includes(value) ? props.s` | works |
| Prefer not to say Under $500 $500 – $2,000 $2,000 – $5,000 $5,000 – $15,000 $15,000+ Ongoi | auth/clientSignup/ClientSignupSharedSections.tsx:185 | `(e) => props.onBudgetRangeChange(e.target.value)` | works |
| _(icon/unnamed)_ | auth/clientSignup/ClientSignupSharedSections.tsx:226 | `(e) => props.onServiceCityChange(e.target.value)` | works |
| {opt} | auth/clientSignup/ClientSignupSharedSections.tsx:266 | `() => props.onPropertyTypesChange( props.propertyTypes.includes(opt) ? props.propertyTypes` | works |
| {val === 'yes' ? 'Yes' : 'No'} | auth/clientSignup/ClientSignupSharedSections.tsx:311 | `() => props.onHasPriorSecurityServiceChange(props.hasPriorSecurityService === val ? '' : v` | works |
| Select… | auth/clientSignup/ClientSignupSharedSections.tsx:419 | `(e) => props.onHowHeardAboutUsChange(e.target.value)` | works |

### /legal/* (terms, privacy, ica, client-agreement, guard-conduct, equal-opportunity)
Components: `legal/LegalPage.tsx`, `legal/LegalAcceptanceModal.tsx`, `Logo.tsx`, `SignatureSecurityBrand.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| {submitting ? 'Saving…' : 'Accept and continue'} | legal/LegalAcceptanceModal.tsx:109 | `handleSubmit` | works (can be disabled) |
| "Back to Home" {compactBack ? 'Back' : 'Back to Home'} | legal/LegalPage.tsx:30 | `onBack` | works |
| {LEGAL_DOCUMENTS[sibling].title} | legal/LegalPage.tsx:93 | `() => onOpenLegal(sibling)` | works |

### /guide
Components: `docs/AppGuidePage.tsx`, `staff/RolePermissionsGuide.tsx`, `staff/StaffListFilterTabs.tsx`, `staff/StaffOpsPageShell.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| {sub.title} | docs/AppGuidePage.tsx:181 | `() => setOpen((o) => !o)` | works |
| {section.title} | docs/AppGuidePage.tsx:279 | `onClick` | works |
| {section.title} | docs/AppGuidePage.tsx:304 | `onClick` | works |
| {tutorialCompleted ? 'Restart tutorial' : 'Start tutorial'} | docs/AppGuidePage.tsx:365 | `onStartTutorial` | HIDDEN — callback never passed from App.tsx, control never shows |
| _(icon/unnamed)_ | docs/AppGuidePage.tsx:445 | `() => onSelect(section)` | works |
| "Back to list" | docs/AppGuidePage.tsx:619 | `handleBack` | works |

### /download
Components: `app/AppDownloadScreen.tsx`, `Logo.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| {apkActionLabel} {apkActionHint ? <span className="install-cta-sub">{apkActionHint}</span> | app/AppDownloadScreen.tsx:161 | `() => void handleApkAction()` | works (can be disabled) |
| Check again | app/AppDownloadScreen.tsx:182 | `() => void refresh()` | works (can be disabled) |
| Download {app.label} {app.file} | app/AppDownloadScreen.tsx:220 | `app.url` | works |
| Download all APKs (GitHub zip) | app/AppDownloadScreen.tsx:232 | `GITHUB_ALL_APKS_ZIP` | works |
| Download Messenger | app/AppDownloadScreen.tsx:235 | `GITHUB_MESSENGER_APP.url` | works |
| Try again | app/AppDownloadScreen.tsx:268 | `() => void refresh()` | works |
| Back | app/AppDownloadScreen.tsx:281 | `onBack` | works |
| Try again | app/AppDownloadScreen.tsx:323 | `() => void refresh()` | works |
| Open Guardr in browser | app/AppDownloadScreen.tsx:330 | `SITE_URL` | works |

### Company public placard
Components: `public/CompanyPublicPlacard.tsx`, `SignatureSecurityBrand.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| View document | public/CompanyPublicPlacard.tsx:82 | `() => setPreviewDoc(doc)` | works |
| `${previewDoc.title} document` {previewDoc.title} | public/CompanyPublicPlacard.tsx:98 | `() => setPreviewDoc(null)` | works |
| "Close" | public/CompanyPublicPlacard.tsx:111 | `() => setPreviewDoc(null)` | works |

## Website /account area (signed-in, browser)

### /account (home)

**Missing controls this page needs:**
- MISSING — "Open my workspace in this browser" for Active guards/customers — website always sends them to the app/APK (AUD-013/016)

Components: `website/WebsiteAccountHome.tsx`, `website/WebsiteAccountShell.tsx`, `apps/OpenAppCta.tsx`, `Logo.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| {copy.action} | apps/OpenAppCta.tsx:72 | `openNativeOrWeb` | works |
| Install {copy.action.replace(/^Open /, '')} | apps/OpenAppCta.tsx:76 | `installPathForApp(app)` | works |
| {copy.action} | apps/OpenAppCta.tsx:93 | `openNativeOrWeb` | works |
| Download {copy.action.replace(/^Open /, '')} | apps/OpenAppCta.tsx:98 | `installPathForApp(app)` | works |
| _(icon/unnamed)_ | website/WebsiteAccountHome.tsx:55 | `onOpenApp` | BROKEN — AUD-013/016/021: on the website an Active guard/client is bounced back to /account or to APK Downloads instead of opening the workspace |
| Edit profile | website/WebsiteAccountHome.tsx:59 | `onOpenProfile` | works |
| {role === 'staff' ? 'Operations' : onboardingOpen ? 'Application' : appLabel} {role === 's | website/WebsiteAccountHome.tsx:86 | `onOpenApp` | BROKEN — AUD-013/016/021: on the website an Active guard/client is bounced back to /account or to APK Downloads instead of opening the workspace |
| {role === 'guard' ? 'Payouts' : 'Billing'} Manage | website/WebsiteAccountHome.tsx:100 | `onOpenBilling` | works |
| Profile &amp; notifications Name, photo, and how we reach you {role === 'staff' ? '.' : '. | website/WebsiteAccountHome.tsx:112 | `onOpenProfile` | works |
| Guardr | website/WebsiteAccountShell.tsx:81 | `onBackToSite` | works |
| _(icon/unnamed)_ | website/WebsiteAccountShell.tsx:86 | `"/"` | works |
| _(icon/unnamed)_ | website/WebsiteAccountShell.tsx:93 | `onOpenApp` | works |
| {item.label} | website/WebsiteAccountShell.tsx:111 | `() => onNavigate(item.id)` | works |
| ONE_ROLE_SIGN_OUT_ONLY_COPY Sign out | website/WebsiteAccountShell.tsx:124 | `onSignOut` | works |
| {item.label} | website/WebsiteAccountShell.tsx:149 | `() => onNavigate(item.id)` | works |

### /account/profile
Components: `profile/UserProfileScreen.tsx`, `guard/GuardArmedStatusPill.tsx`, `profile/GuardResumeEditor.tsx`, `profile/GuardCredentialsPanel.tsx`, `profile/GuardInventoryPanel.tsx`, `guard/GuardTimesheetPanel.tsx`, `staff/StaffTimesheetsPanel.tsx`, `profile/StaffProfileSection.tsx`, `profile/GuardIdentityVerificationPanel.tsx`, `client/ClientAuthorizedContactsSection.tsx`, `client/ClientCredentialsSection.tsx`, `profile/GuardGearCarryPanel.tsx`, `guard/GuardPtaUofPanel.tsx`, `guard/GuardThirtyTwoHourPanel.tsx`, `profile/GuardCardPanel.tsx`, `profile/GuardCoiItemCard.tsx`, `profile/GuardVehicleInsuranceItemCard.tsx`, `profile/GuardIdItemCard.tsx`, `guard/GuardOptionalCredentialAddSheet.tsx`, `profile/inventory/GuardInventoryEquipmentCard.tsx`, `profile/inventory/GuardInventoryEquipmentForm.tsx`, `profile/inventory/GuardInventoryUniformCard.tsx`, `profile/inventory/GuardInventoryUniformForm.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| `Remove ${contact.name}` | client/ClientAuthorizedContactsSection.tsx:80 | `() => removeContact(contact.id)` | works |
| _(icon/unnamed)_ | client/ClientAuthorizedContactsSection.tsx:117 | `(e) => setDraftRole(e.target.value as typeof draftRole)` | works |
| Add contact | client/ClientAuthorizedContactsSection.tsx:128 | `addContact` | works (can be disabled) |
| _(icon/unnamed)_ | client/ClientCredentialsSection.tsx:151 | `(e) => setSelectedTypeId(e.target.value)` | works |
| Submit for verification | client/ClientCredentialsSection.tsx:175 | `() => void submitType(selectedTypeId, documentUrl, expirationDate)` | works (can be disabled) |
| {section.title} | guard/GuardOptionalCredentialAddSheet.tsx:161 | `() => openSection(section.id)` | works |
| {formError && <p className="text-xs text-red-400">{formError}</p>} Back {saving ? 'Uploadi | guard/GuardOptionalCredentialAddSheet.tsx:178 | `submitCert` | works |
| _(icon/unnamed)_ | guard/GuardOptionalCredentialAddSheet.tsx:180 | `(e) => setSelectedCatalogId(e.target.value)` | works |
| _(icon/unnamed)_ | guard/GuardOptionalCredentialAddSheet.tsx:203 | `(e) => setState(e.target.value)` | works |
| Back | guard/GuardOptionalCredentialAddSheet.tsx:251 | `backToSections` | works |
| {alternateLabel ?? 'Upload alternate part 2'} | guard/GuardPtaUofPanel.tsx:312 | `() => startAdd(alternateCatalogId)` | works |
| _(icon/unnamed)_ | guard/GuardPtaUofPanel.tsx:348 | `(path) => { if (!hasAnyCerts) setUploadPath(path); }` | works |
| _(icon/unnamed)_ | guard/GuardPtaUofPanel.tsx:363 | `() => startAdd(BSIS_PTA_UOF_COMBINED_ID)` | works |
| {formError && <p className="text-xs text-red-500">{formError}</p>} Back {saving ? 'Uploadi | guard/GuardPtaUofPanel.tsx:384 | `submitCert` | works |
| Back | guard/GuardPtaUofPanel.tsx:408 | `() => { setAddingCatalogId(null); setShowAddPicker(true); setIssuer(''); setNumber(''); se` | works |
| _(icon/unnamed)_ | guard/GuardPtaUofPanel.tsx:445 | `(payload) => onUpdateCertification(editingCert.id, payload)` | works |
| _(icon/unnamed)_ | guard/GuardPtaUofPanel.tsx:510 | `(payload) => onUpdateCertification(editingCert.id, payload)` | works |
| {formError && <p className="text-xs text-red-500">{formError}</p>} Back {saving ? 'Saving… | guard/GuardThirtyTwoHourPanel.tsx:257 | `submitCert` | works |
| Back | guard/GuardThirtyTwoHourPanel.tsx:281 | `() => { setAddingCatalogId(null); setShowAddPicker(true); setIssuer(''); setNumber(''); se` | works |
| {entry.name} | guard/GuardThirtyTwoHourPanel.tsx:310 | `() => startAdd(entry.id)` | works |
| _(icon/unnamed)_ | guard/GuardThirtyTwoHourPanel.tsx:358 | `(payload) => onUpdateCertification(editingCert.id, payload)` | works |
| _(icon/unnamed)_ | guard/GuardThirtyTwoHourPanel.tsx:423 | `(payload) => onUpdateCertification(editingCert.id, payload)` | works |
| {formError && <p className="text-xs text-red-400">{formError}</p>} Add | profile/GuardCardPanel.tsx:174 | `submitGuardCard` | works |
| _(icon/unnamed)_ | profile/GuardCardPanel.tsx:175 | `(e) => setState(e.target.value)` | works |
| _(icon/unnamed)_ | profile/GuardCardPanel.tsx:228 | `(payload) => onUpdateCertification(editingCert.id, payload)` | works |
| {title} {subtitle} Tap to view details | profile/GuardCoiItemCard.tsx:78 | `openDetail` | works |
| {formError && <p className="text-xs text-red-400">{formError}</p>} Add | profile/GuardCredentialsPanel.tsx:265 | `submitCert` | works |
| _(icon/unnamed)_ | profile/GuardCredentialsPanel.tsx:267 | `(e) => setSelectedCatalogId(e.target.value)` | works |
| _(icon/unnamed)_ | profile/GuardCredentialsPanel.tsx:290 | `(e) => setState(e.target.value)` | works |
| Add credential | profile/GuardCredentialsPanel.tsx:377 | `() => setOptionalAddOpen(true)` | works |
| _(icon/unnamed)_ | profile/GuardCredentialsPanel.tsx:412 | `onSubmitIdentityVerification` | works |
| {rule.label} {rule.description} {isOn ? <Check className="w-5 h-5 text-brand-primary shrin | profile/GuardGearCarryPanel.tsx:196 | `() => toggleEquipment(rule.id)` | works |
| _(icon/unnamed)_ | profile/GuardIdItemCard.tsx:63 | `onSubmit ?? (async () => ({ ok: true }))` | works |
| {formatIdSummaryLine(guard)} Tap to view details | profile/GuardIdItemCard.tsx:79 | `openDetail` | works |
| Government ID | profile/GuardIdItemCard.tsx:166 | `openDetail` | works |
| _(icon/unnamed)_ | profile/GuardIdentityVerificationPanel.tsx:62 | `onSubmit` | works |
| Add equipment | profile/GuardInventoryPanel.tsx:135 | `() => { setEditingEquipment(null); setEquipmentFormOpen(true); }` | works |
| Add uniform | profile/GuardInventoryPanel.tsx:187 | `() => { setEditingUniform(null); setUniformFormOpen(true); }` | works |
| {opt} | profile/GuardResumeEditor.tsx:243 | `() => toggleSpecialty(opt)` | works (can be disabled) |
| {city} | profile/GuardResumeEditor.tsx:265 | `() => toggleServiceArea(city)` | works (can be disabled) |
| Add experience | profile/GuardResumeEditor.tsx:353 | `submitExperience` | works |
| Add education | profile/GuardResumeEditor.tsx:367 | `submitEducation` | works |
| Add | profile/GuardResumeEditor.tsx:455 | `onAdd` | works |
| {hasOnFile ? (expired ? 'Renew' : 'Update') : 'Add'} | profile/GuardVehicleInsuranceItemCard.tsx:63 | `() => setShowUpload(true)` | works |
| {area} | profile/StaffProfileSection.tsx:106 | `() => toggleFocus(area)` | works |
| Remove photo | profile/UserProfileScreen.tsx:334 | `() => void handleRemovePhoto()` | works (can be disabled) |
| {editing ? (saving ? 'Saving…' : 'Save profile') : 'Edit profile'} | profile/UserProfileScreen.tsx:469 | `() => (editing ? void handleSave() : setEditing(true))` | works (can be disabled) |
| Cancel | profile/UserProfileScreen.tsx:480 | `() => setEditing(false)` | works |
| _(icon/unnamed)_ | profile/UserProfileScreen.tsx:569 | `onSubmitIdentityVerification!` | works |
| "Edit equipment" | profile/inventory/GuardInventoryEquipmentCard.tsx:35 | `onEdit` | works |
| "Remove equipment" | profile/inventory/GuardInventoryEquipmentCard.tsx:38 | `onDelete` | works |
| Equipment type Brand Model Condition Quantity Notes Additional photos Add photo {initial ? | profile/inventory/GuardInventoryEquipmentForm.tsx:93 | `handleSubmit` | works |
| _(icon/unnamed)_ | profile/inventory/GuardInventoryEquipmentForm.tsx:96 | `(event) => setForm((current) => ({ ...current, typeId: event.target.value as GuardInventor` | works |
| _(icon/unnamed)_ | profile/inventory/GuardInventoryEquipmentForm.tsx:150 | `(event) => setForm((current) => ({ ...current, condition: event.target.value as GuardInven` | works |
| Add photo | profile/inventory/GuardInventoryEquipmentForm.tsx:205 | `() => setForm((current) => ({ ...current, additionalImageUrls: [...current.additionalImage` | works |
| Remove photo | profile/inventory/GuardInventoryEquipmentForm.tsx:234 | `() => setForm((current) => ({ ...current, additionalImageUrls: current.additionalImageUrls` | works |
| Cancel | profile/inventory/GuardInventoryEquipmentForm.tsx:255 | `onClose` | works |
| "Edit uniform" | profile/inventory/GuardInventoryUniformCard.tsx:31 | `onEdit` | works |
| "Remove uniform" | profile/inventory/GuardInventoryUniformCard.tsx:34 | `onDelete` | works |
| Uniform type Outfit description {initial ? 'Save uniform' : 'Add uniform'} Cancel | profile/inventory/GuardInventoryUniformForm.tsx:72 | `handleSubmit` | works |
| _(icon/unnamed)_ | profile/inventory/GuardInventoryUniformForm.tsx:75 | `(event) => { const typeId = event.target.value as GuardInventoryUniformTypeId; const meta ` | works |
| Cancel | profile/inventory/GuardInventoryUniformForm.tsx:136 | `onClose` | works |

### /account/billing (client) | /account/payouts (guard)

**Missing controls this page needs:**
- MISSING — Guard payouts page on the website is only a text blurb + "Open Guard" button that loops back to /account (App.tsx ~line 14060)
- MISSING — Download tax form (1099) / annual earnings statement — not built

Components: `client/ClientInvoiceScreen.tsx`, `client/ClientCapabilitiesContext.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| _(icon/unnamed)_ | client/ClientInvoiceScreen.tsx:237 | `() => void handlePayWithStripe(request)` | works (can be disabled) |
| _(icon/unnamed)_ | client/ClientInvoiceScreen.tsx:255 | `() => void handlePayWithSquare(request)` | works (can be disabled) |
| Download invoice | client/ClientInvoiceScreen.tsx:283 | `() => downloadInvoicePdf(invoice, client)` | works |
| {invoice.invoiceNumber} {request?.title ?? 'Security services'} {invoiceStatusLabel(invoic | client/ClientInvoiceScreen.tsx:337 | `invoice.requestId ? onSelect : undefined` | works (can be disabled) |
| _(icon/unnamed)_ | client/ClientInvoiceScreen.tsx:484 | `() => void handlePayWithStripe(selectedRequest)` | works (can be disabled) |
| _(icon/unnamed)_ | client/ClientInvoiceScreen.tsx:502 | `() => void handlePayWithSquare(selectedRequest)` | works (can be disabled) |
| Download invoice | client/ClientInvoiceScreen.tsx:530 | `() => downloadInvoicePdf(selectedInvoice, client)` | works |
| {invoice.invoiceNumber} {request?.title ?? 'Security services'} {invoiceStatusLabel(invoic | client/ClientInvoiceScreen.tsx:573 | `invoice.requestId ? () => onSelectRequestId?.(invoice.requestId!) : undefined` | works |

### /account/downloads

**Known page-level defects:**
- BROKEN — "Open Customer"/"Open Downloads" land on the APK page while the URL stays /client/settings (AUD-021)

Components: `website/WebsiteAccountDownloads.tsx`

_No clickable controls found in these files (content/display only, or controls come from shared components)._

### /account/documents

**Known page-level defects:**
- BROKEN — Audit saw /account/documents render the Downloads page (AUD-009 note) — code maps it to WebsiteAccountDocuments; unverified on current build

Components: `website/WebsiteAccountDocuments.tsx`

_No clickable controls found in these files (content/display only, or controls come from shared components)._

### /account/settings

**Missing controls this page needs:**
- MISSING — "Delete my account" / request data deletion — not built (Google Play requires an in-app + web deletion path)
- MISSING — Email / SMS notification preferences — only push exists

Components: `profile/UserSettingsScreen.tsx`, `profile/PushNotificationsPanel.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Preview | profile/PushNotificationsPanel.tsx:402 | `() => void handlePreviewSound()` | works (can be disabled) |
| _(icon/unnamed)_ | profile/PushNotificationsPanel.tsx:472 | `() => void handleTogglePref(opt.key)` | works |
| Test notification | profile/PushNotificationsPanel.tsx:528 | `() => void handleTest()` | works (can be disabled) |

### /account/support
Components: `support/SupportScreen.tsx`, `support/SupportComposePage.tsx`, `support/SupportReportPage.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Subject Message Send to Guardr staff | support/SupportComposePage.tsx:41 | `(e) => void handleSubmit(e)` | works |
| Category Priority Subject Details Submit report to staff | support/SupportReportPage.tsx:60 | `(e) => void handleSubmit(e)` | works |
| _(icon/unnamed)_ | support/SupportReportPage.tsx:63 | `(e) => setCategory(e.target.value as SupportTicketCategory)` | works |
| _(icon/unnamed)_ | support/SupportReportPage.tsx:77 | `(e) => setPriority(e.target.value as SupportPriority)` | works |
| None | support/SupportReportPage.tsx:92 | `(e) => setRelatedRequestId(e.target.value)` | works |
| {activeChatTicket ? 'Continue support chat' : 'Contact support'} | support/SupportScreen.tsx:169 | `() => startChat()` | works |
| ticket.subject | support/SupportScreen.tsx:194 | `() => openThread(ticket.id)` | works |
| File a report Safety concern, dispute, or formal complaint. | support/SupportScreen.tsx:218 | `() => startReport()` | works |
| ticket.subject | support/SupportScreen.tsx:239 | `() => openThread(ticket.id)` | works |

### Pending-approval screen
Components: `account/AccountPendingScreen.tsx`, `guard/GuardActivationUploadChecklist.tsx`, `guard/GuardBsisRequirementsReference.tsx`, `profile/GuardIdentityVerificationPanel.tsx`, `profile/GuardIdDetailModal.tsx`, `profile/GuardCoiUploadSheet.tsx`, `profile/GuardCardPanel.tsx`, `guard/GuardPtaUofPanel.tsx`, `guard/GuardThirtyTwoHourPanel.tsx`, `guard/GuardOptionalCredentialAddSheet.tsx`, `guard/GuardCredentialResourceLinkList.tsx`, `profile/GuardIdItemCard.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Edit application details | account/AccountPendingScreen.tsx:144 | `onOpenApplicationProfile` | works |
| {hasActivationSupportChat ? 'Open activation support chat' : 'Contact support'} | account/AccountPendingScreen.tsx:187 | `onContactSupport` | works |
| {revisionOpen ? 'Edit application details' : 'View profile'} | account/AccountPendingScreen.tsx:236 | `onOpenProfile` | works |
| {actionLabel} | guard/GuardActivationUploadChecklist.tsx:108 | `onAction` | works |
| "1. Government ID — required to work" | guard/GuardActivationUploadChecklist.tsx:194 | `!guardHasVerifiedIdForWork(guard) && idCanUpload ? () => setOpenUpload('id') : undefined` | works |
| "2. Certificate of Insurance (COI) — required for profile approval" | guard/GuardActivationUploadChecklist.tsx:202 | `!coi.done && coiCanUpload ? () => setOpenUpload('coi') : undefined` | works |
| "3. BSIS Guard Card — required to work" | guard/GuardActivationUploadChecklist.tsx:210 | `guardCardCanUpload ? () => setOpenUpload('guardCard') : undefined` | works |
| "4. Mandatory training (PTA/UOF) — required to work" | guard/GuardActivationUploadChecklist.tsx:218 | `mandatoryCanUpload ? () => setOpenUpload('mandatoryTraining') : undefined` | works |
| "5. Continued Education (32-hour BSIS CE package) — required to work" | guard/GuardActivationUploadChecklist.tsx:232 | `ceCanUpload ? () => setOpenUpload('ce') : undefined` | works |
| _(icon/unnamed)_ | guard/GuardActivationUploadChecklist.tsx:264 | `() => setOpenUpload('optional')` | works |
| _(icon/unnamed)_ | guard/GuardActivationUploadChecklist.tsx:290 | `onSubmitIdentityVerification` | works |
| {MARKETPLACE_ELIGIBILITY_WHY_TITLE} | guard/GuardBsisRequirementsReference.tsx:59 | `() => setWhyOpen((value) => !value)` | works |
| What guards need — California BSIS + Guardr | guard/GuardBsisRequirementsReference.tsx:86 | `() => setOpen((value) => !value)` | works |
| Official BSIS guard training regulation | guard/GuardBsisRequirementsReference.tsx:143 | `BSIS_OFFICIAL_TRAINING_URL` | works |
| {formatCredentialLinkDisplay(link)} | guard/GuardCredentialResourceLinkList.tsx:33 | `link.url` | works |
| {summaryLabel} ( {links.length} options) | guard/GuardCredentialResourceLinkList.tsx:66 | `() => setOpen((value) => !value)` | works |
| Insurance carrier Policy number General liability limit (USD) Effective date Expiry date { | profile/GuardCoiUploadSheet.tsx:77 | `handleSubmit` | works |
| Edit | profile/GuardIdDetailModal.tsx:213 | `() => { onEditFullPage(); onClose(); }` | works |
| Edit | profile/GuardIdDetailModal.tsx:225 | `() => setEditing(true)` | works |
| "Close" | profile/GuardIdDetailModal.tsx:235 | `onClose` | works |
| "Government ID document type" Government ID Driver&apos;s license | profile/GuardIdDetailModal.tsx:261 | `(e) => setIdDocumentType(e.target.value as GovernmentIdDocumentType)` | works |
| "Driver license class" Select class | profile/GuardIdDetailModal.tsx:273 | `(e) => setIdLicenseClass(e.target.value)` | works |
| "ID issuing state" | profile/GuardIdDetailModal.tsx:290 | `(e) => setIdState(e.target.value)` | works |
| slotLabels.front | profile/GuardIdDetailModal.tsx:326 | `setFrontUrl` | works |
| slotLabels.back | profile/GuardIdDetailModal.tsx:333 | `setBackUrl` | works |
| slotLabels.selfie | profile/GuardIdDetailModal.tsx:340 | `setSelfieUrl` | works |
| {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {saving ? 'Saving…' : staff | profile/GuardIdDetailModal.tsx:355 | `() => void handleSave()` | works (can be disabled) |
| Cancel | profile/GuardIdDetailModal.tsx:364 | `handleCancelEdit` | works (can be disabled) |

## Guard app / PWA / APK

### /guard/activation

**Known page-level defects:**
- BROKEN — Progress header says "3 of 5 / 80%" while all 5 sections show on-file; previews render as gray squares (AUD-010 guard)
- BROKEN — Page stays on "awaiting verification" or spins after the guard is Active (AUD-009/AUD-012 guard)

Components: `guard/GuardActivationUploadChecklist.tsx`, `guard/GuardActivationChecklistView.tsx`, `profile/GuardIdentityVerificationPanel.tsx`, `profile/GuardIdDetailModal.tsx`, `profile/GuardCoiUploadSheet.tsx`, `profile/GuardCardPanel.tsx`, `guard/GuardPtaUofPanel.tsx`, `guard/GuardThirtyTwoHourPanel.tsx`, `guard/GuardOptionalCredentialAddSheet.tsx`, `guard/GuardCredentialResourceLinkList.tsx`, `profile/GuardIdItemCard.tsx`, `guard/CredentialStatusBadge.tsx`, `profile/GuardIdPhotoRow.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| {actionLabel} | guard/GuardActivationUploadChecklist.tsx:108 | `onAction` | works |
| "1. Government ID — required to work" | guard/GuardActivationUploadChecklist.tsx:194 | `!guardHasVerifiedIdForWork(guard) && idCanUpload ? () => setOpenUpload('id') : undefined` | works |
| "2. Certificate of Insurance (COI) — required for profile approval" | guard/GuardActivationUploadChecklist.tsx:202 | `!coi.done && coiCanUpload ? () => setOpenUpload('coi') : undefined` | works |
| "3. BSIS Guard Card — required to work" | guard/GuardActivationUploadChecklist.tsx:210 | `guardCardCanUpload ? () => setOpenUpload('guardCard') : undefined` | works |
| "4. Mandatory training (PTA/UOF) — required to work" | guard/GuardActivationUploadChecklist.tsx:218 | `mandatoryCanUpload ? () => setOpenUpload('mandatoryTraining') : undefined` | works |
| "5. Continued Education (32-hour BSIS CE package) — required to work" | guard/GuardActivationUploadChecklist.tsx:232 | `ceCanUpload ? () => setOpenUpload('ce') : undefined` | works |
| _(icon/unnamed)_ | guard/GuardActivationUploadChecklist.tsx:264 | `() => setOpenUpload('optional')` | works |
| _(icon/unnamed)_ | guard/GuardActivationUploadChecklist.tsx:290 | `onSubmitIdentityVerification` | works |
| {formatCredentialLinkDisplay(link)} | guard/GuardCredentialResourceLinkList.tsx:33 | `link.url` | works |
| {summaryLabel} ( {links.length} options) | guard/GuardCredentialResourceLinkList.tsx:66 | `() => setOpen((value) => !value)` | works |
| {section.title} | guard/GuardOptionalCredentialAddSheet.tsx:161 | `() => openSection(section.id)` | works |
| {formError && <p className="text-xs text-red-400">{formError}</p>} Back {saving ? 'Uploadi | guard/GuardOptionalCredentialAddSheet.tsx:178 | `submitCert` | works |
| _(icon/unnamed)_ | guard/GuardOptionalCredentialAddSheet.tsx:180 | `(e) => setSelectedCatalogId(e.target.value)` | works |
| _(icon/unnamed)_ | guard/GuardOptionalCredentialAddSheet.tsx:203 | `(e) => setState(e.target.value)` | works |
| Back | guard/GuardOptionalCredentialAddSheet.tsx:251 | `backToSections` | works |
| {alternateLabel ?? 'Upload alternate part 2'} | guard/GuardPtaUofPanel.tsx:312 | `() => startAdd(alternateCatalogId)` | works |
| _(icon/unnamed)_ | guard/GuardPtaUofPanel.tsx:348 | `(path) => { if (!hasAnyCerts) setUploadPath(path); }` | works |
| _(icon/unnamed)_ | guard/GuardPtaUofPanel.tsx:363 | `() => startAdd(BSIS_PTA_UOF_COMBINED_ID)` | works |
| {formError && <p className="text-xs text-red-500">{formError}</p>} Back {saving ? 'Uploadi | guard/GuardPtaUofPanel.tsx:384 | `submitCert` | works |
| Back | guard/GuardPtaUofPanel.tsx:408 | `() => { setAddingCatalogId(null); setShowAddPicker(true); setIssuer(''); setNumber(''); se` | works |
| _(icon/unnamed)_ | guard/GuardPtaUofPanel.tsx:445 | `(payload) => onUpdateCertification(editingCert.id, payload)` | works |
| _(icon/unnamed)_ | guard/GuardPtaUofPanel.tsx:510 | `(payload) => onUpdateCertification(editingCert.id, payload)` | works |
| {formError && <p className="text-xs text-red-500">{formError}</p>} Back {saving ? 'Saving… | guard/GuardThirtyTwoHourPanel.tsx:257 | `submitCert` | works |
| Back | guard/GuardThirtyTwoHourPanel.tsx:281 | `() => { setAddingCatalogId(null); setShowAddPicker(true); setIssuer(''); setNumber(''); se` | works |
| {entry.name} | guard/GuardThirtyTwoHourPanel.tsx:310 | `() => startAdd(entry.id)` | works |
| _(icon/unnamed)_ | guard/GuardThirtyTwoHourPanel.tsx:358 | `(payload) => onUpdateCertification(editingCert.id, payload)` | works |
| _(icon/unnamed)_ | guard/GuardThirtyTwoHourPanel.tsx:423 | `(payload) => onUpdateCertification(editingCert.id, payload)` | works |
| {formError && <p className="text-xs text-red-400">{formError}</p>} Add | profile/GuardCardPanel.tsx:174 | `submitGuardCard` | works |
| _(icon/unnamed)_ | profile/GuardCardPanel.tsx:175 | `(e) => setState(e.target.value)` | works |
| _(icon/unnamed)_ | profile/GuardCardPanel.tsx:228 | `(payload) => onUpdateCertification(editingCert.id, payload)` | works |
| Insurance carrier Policy number General liability limit (USD) Effective date Expiry date { | profile/GuardCoiUploadSheet.tsx:77 | `handleSubmit` | works |
| Edit | profile/GuardIdDetailModal.tsx:213 | `() => { onEditFullPage(); onClose(); }` | works |
| Edit | profile/GuardIdDetailModal.tsx:225 | `() => setEditing(true)` | works |
| "Close" | profile/GuardIdDetailModal.tsx:235 | `onClose` | works |
| "Government ID document type" Government ID Driver&apos;s license | profile/GuardIdDetailModal.tsx:261 | `(e) => setIdDocumentType(e.target.value as GovernmentIdDocumentType)` | works |
| "Driver license class" Select class | profile/GuardIdDetailModal.tsx:273 | `(e) => setIdLicenseClass(e.target.value)` | works |
| "ID issuing state" | profile/GuardIdDetailModal.tsx:290 | `(e) => setIdState(e.target.value)` | works |
| slotLabels.front | profile/GuardIdDetailModal.tsx:326 | `setFrontUrl` | works |
| slotLabels.back | profile/GuardIdDetailModal.tsx:333 | `setBackUrl` | works |
| slotLabels.selfie | profile/GuardIdDetailModal.tsx:340 | `setSelfieUrl` | works |
| {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {saving ? 'Saving…' : staff | profile/GuardIdDetailModal.tsx:355 | `() => void handleSave()` | works (can be disabled) |
| Cancel | profile/GuardIdDetailModal.tsx:364 | `handleCancelEdit` | works (can be disabled) |
| _(icon/unnamed)_ | profile/GuardIdItemCard.tsx:63 | `onSubmit ?? (async () => ({ ok: true }))` | works |
| {formatIdSummaryLine(guard)} Tap to view details | profile/GuardIdItemCard.tsx:79 | `openDetail` | works |
| Government ID | profile/GuardIdItemCard.tsx:166 | `openDetail` | works |
| {label} Tap to view photo | profile/GuardIdPhotoRow.tsx:73 | `() => setViewOpen(true)` | works |
| `View ${label}` | profile/GuardIdPhotoRow.tsx:102 | `() => setViewOpen(true)` | works |
| _(icon/unnamed)_ | profile/GuardIdPhotoRow.tsx:115 | `triggerUpload` | works (can be disabled) |
| Upload a photo instead | profile/GuardIdPhotoRow.tsx:135 | `() => inputRef.current?.click()` | works (can be disabled) |
| _(icon/unnamed)_ | profile/GuardIdentityVerificationPanel.tsx:62 | `onSubmit` | works |

### /guard/map ("Field") incl. job detail (?gj=) and active shift overlay

**Missing controls this page needs:**
- MISSING — "Withdraw my application" before the client decides — not built
- MISSING — "I can't make this shift" / call-off after being accepted — guard has no cancel control (only client-side replacement request exists)
- MISSING — "Apply as team lead" — built (onApplyAsTeamLead) but App.tsx never passes the handler, so it never appears


**Known page-level defects:**
- BROKEN — Map tiles watermarked "API KEY REQUIRED" (AUD-015; fix in open PR #1015)
- BROKEN — On the website (not installed) every /guard/* page bounces an Active guard to /account (AUD-007/013)

Components: `GuardDashboard.tsx`, `guard/GuardJobDetailView.tsx`, `guard/GuardActiveShift.tsx`, `guard/GuardSelfAuditModal.tsx`, `guard/GuardEndShiftCheckpointModal.tsx`, `guard/GuardIncidentReportModal.tsx`, `guard/LateClockOutPrompt.tsx`, `guard/GuardPreShiftBriefing.tsx`, `guard/GuardRatingModal.tsx`, `guard/ShiftMap.tsx`, `guard/GuardNextShiftCard.tsx`, `guard/ReplacementOfferCard.tsx`, `guard/MidShiftCheckInPanel.tsx`, `guard/GuardEarningsPanel.tsx`, `guard/GuardStripeConnectSheet.tsx`, `guard/GuardMyJobsPanel.tsx`, `guard/GuardBriefingAckGate.tsx`, `guard/GuardActivityLogModal.tsx`, `guard/GuardCompanyRosterPanel.tsx`, `guard/GuardPerformanceScreen.tsx`, `guard/GuardVehiclePanel.tsx`, `guard/GuardPreferencesScreen.tsx`, `guard/GuardAvailabilityScreen.tsx`, `account/AccountPendingScreen.tsx`, `guard/GuardMessagesPanel.tsx`, `guard/GuardCredentialGraceBanner.tsx`, `guard/GuardJobCard.tsx`, `guard/GuardMyJobDetail.tsx`, `shift/ShiftPeriodStatusBar.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| _(icon/unnamed)_ | GuardDashboard.tsx:1798 | `handleSelfAuditSubmit` | works |
| _(icon/unnamed)_ | GuardDashboard.tsx:1813 | `handleEndCheckpointSubmit` | works |
| _(icon/unnamed)_ | GuardDashboard.tsx:1822 | `handleLateClockOutConfirm` | works |
| _(icon/unnamed)_ | GuardDashboard.tsx:1830 | `(rating, note) => { if (!ratingJob) return; const existing = ratingJob.checkOutAudit; onUp` | works |
| _(icon/unnamed)_ | GuardDashboard.tsx:1854 | `async (input) => { if (!onSubmitIncidentReport) { throw new Error('Incident reporting is n` | works |
| _(icon/unnamed)_ | GuardDashboard.tsx:1877 | `async (report) => { const queued = await captureGuardActivityOffline(guard.id, activeShift` | works |
| Edit application details | account/AccountPendingScreen.tsx:144 | `onOpenApplicationProfile` | works |
| {hasActivationSupportChat ? 'Open activation support chat' : 'Contact support'} | account/AccountPendingScreen.tsx:187 | `onContactSupport` | works |
| {revisionOpen ? 'Edit application details' : 'View profile'} | account/AccountPendingScreen.tsx:236 | `onOpenProfile` | works |
| gpsRequired && !onSite ? 'Must be on site to arrive' : 'Slide to arrive on site' | guard/GuardActiveShift.tsx:266 | `onArrived` | works (can be disabled) |
| "Slide to start job" | guard/GuardActiveShift.tsx:284 | `onBeginAudit` | works (can be disabled) |
| Skip self audit · start job | guard/GuardActiveShift.tsx:291 | `onSkipAudit` | works (can be disabled) |
| gpsRequired ? 'Must be on site to arrive' : 'Slide to arrive on site' | guard/GuardActiveShift.tsx:304 | `onArrived` | works (can be disabled) |
| "Slide to start job" | guard/GuardActiveShift.tsx:334 | `onBeginAudit` | works (can be disabled) |
| Skip self audit · start job | guard/GuardActiveShift.tsx:345 | `onSkipAudit` | works (can be disabled) |
| _(icon/unnamed)_ | guard/GuardActiveShift.tsx:367 | `onMidShiftCheckIn` | works |
| End break · resume job | guard/GuardActiveShift.tsx:399 | `onEndBreak` | works (can be disabled) |
| Start break | guard/GuardActiveShift.tsx:408 | `onStartBreak` | works (can be disabled) |
| Report incident | guard/GuardActiveShift.tsx:423 | `onIncidentReport` | works |
| Activity report | guard/GuardActiveShift.tsx:426 | `onActivityReport` | works |
| Message customer | guard/GuardActiveShift.tsx:430 | `onOpenJobChat` | works (can be disabled) |
| "Slide to complete job" | guard/GuardActiveShift.tsx:441 | `onEndShift` | works (can be disabled) |
| Cancel {saving ? 'Saving…' : 'Save entry'} | guard/GuardActivityLogModal.tsx:34 | `handleSubmit` | works |
| Cancel | guard/GuardActivityLogModal.tsx:44 | `onClose` | works |
| "I have read the site briefing" | guard/GuardBriefingAckGate.tsx:40 | `() => void onAcknowledge()` | works |
| Send to my bank | guard/GuardEarningsPanel.tsx:87 | `() => void onRequestStripePayout?.()` | works (can be disabled) |
| _(icon/unnamed)_ | guard/GuardEarningsPanel.tsx:131 | `onConnectStripe` | works (can be disabled) |
| Capture end selfie | guard/GuardEndShiftCheckpointModal.tsx:74 | `() => void capture('selfie')` | works (can be disabled) |
| Photo of post / site | guard/GuardEndShiftCheckpointModal.tsx:94 | `() => void capture('location')` | works (can be disabled) |
| "Slide to complete shift" | guard/GuardEndShiftCheckpointModal.tsx:120 | `handleSubmit` | works |
| Skip all and end shift | guard/GuardEndShiftCheckpointModal.tsx:121 | `onSkip` | works |
| Incident type Priority When did it occur? Where on site? What happened? Who was involved?  | guard/GuardIncidentReportModal.tsx:69 | `handleSubmit` | works |
| _(icon/unnamed)_ | guard/GuardIncidentReportModal.tsx:79 | `(e) => update('incidentType', e.target.value as IncidentReportFormInput['incidentType'])` | works |
| _(icon/unnamed)_ | guard/GuardIncidentReportModal.tsx:94 | `(e) => update('priority', e.target.value as IncidentReportFormInput['priority'])` | works |
| Cancel | guard/GuardIncidentReportModal.tsx:277 | `handleClose` | works (can be disabled) |
| {JOB_TYPE_LABELS[job.type]} {job.armedRequired && <WfBadge tone="warning">Armed</WfBadge>} | guard/GuardJobCard.tsx:76 | `onSelect` | works |
| row.title | guard/GuardMessagesPanel.tsx:362 | `() => openRow(row)` | works |
| _(icon/unnamed)_ | guard/GuardMyJobDetail.tsx:104 | `() => onViewBriefing!(job.id)` | works |
| _(icon/unnamed)_ | guard/GuardMyJobDetail.tsx:123 | `async () => { setOvertimeApproveId(job.id); try { await onApproveOvertime(job.id); } final` | works (can be disabled) |
| {chatEligible ? 'Message customer' : 'View job chat'} | guard/GuardMyJobDetail.tsx:145 | `() => onOpenMessages(job.id)` | works |
| {job.title} {formatShiftRange(job.startDate, job.endDate)} {timeUntil ? ` · ${timeUntil}`  | guard/GuardMyJobsPanel.tsx:96 | `onSelect` | works |
| _(icon/unnamed)_ | guard/GuardMyJobsPanel.tsx:373 | `onSelect` | works |
| _(icon/unnamed)_ | guard/GuardMyJobsPanel.tsx:467 | `() => updateSelectedId(job.id)` | works |
| Next Job {job.title} {location} {countdownActive ? 'See full details · start heading' : 'S | guard/GuardNextShiftCard.tsx:31 | `onOpen` | works |
| "Close briefing" | guard/GuardPreShiftBriefing.tsx:75 | `onClose` | works |
| "I have read the post orders" | guard/GuardPreShiftBriefing.tsx:133 | `() => void onAckPostOrders()` | works |
| "I have read the site briefing" | guard/GuardPreShiftBriefing.tsx:149 | `() => void onAckBriefing()` | works |
| "Slide to start heading to site" | guard/GuardPreShiftBriefing.tsx:172 | `() => void onStartEnRoute()` | works (can be disabled) |
| `${s} stars` | guard/GuardRatingModal.tsx:32 | `() => setRating(s)` | works |
| Skip | guard/GuardRatingModal.tsx:49 | `onSkip` | works (can be disabled) |
| Submit | guard/GuardRatingModal.tsx:52 | `() => { if (submitted) return; setSubmitted(true); onSubmit(rating, note \|\| 'Good assign` | works (can be disabled) |
| {uniform[key] && <Check className="w-3 h-3 text-white" />} | guard/GuardSelfAuditModal.tsx:81 | `() => setUniform((p) => ({ ...p, [key]: !p[key] }))` | works |
| _(icon/unnamed)_ | guard/GuardSelfAuditModal.tsx:108 | `() => void handleCapture(kind)` | works (can be disabled) |
| _(icon/unnamed)_ | guard/GuardSelfAuditModal.tsx:140 | `() => void handleCapture('location')` | works (can be disabled) |
| "Slide to start job" | guard/GuardSelfAuditModal.tsx:158 | `handleSubmit` | works (can be disabled) |
| _(icon/unnamed)_ | guard/GuardStripeConnectSheet.tsx:47 | `() => void onContinue()` | works (can be disabled) |
| Not now | guard/GuardStripeConnectSheet.tsx:65 | `onClose` | works (can be disabled) |
| _(icon/unnamed)_ | guard/GuardVehiclePanel.tsx:205 | `(e) => setPlateState(e.target.value)` | works (can be disabled) |
| {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save draft | guard/GuardVehiclePanel.tsx:233 | `() => void handleSave()` | works (can be disabled) |
| {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Submit for approval | guard/GuardVehiclePanel.tsx:242 | `() => void handleSubmit()` | works (can be disabled) |
| I stayed — complete job now | guard/LateClockOutPrompt.tsx:105 | `handleStayed` | works |
| Set when I left | guard/LateClockOutPrompt.tsx:108 | `() => setStep('adjust')` | works |
| I left at scheduled end — forgot to complete | guard/LateClockOutPrompt.tsx:111 | `handleLeftOnTime` | works |
| Cancel | guard/LateClockOutPrompt.tsx:114 | `onClose` | works |
| Use this time | guard/LateClockOutPrompt.tsx:143 | `handleUseAdjustedTime` | works |
| Back | guard/LateClockOutPrompt.tsx:146 | `() => setStep('choice')` | works |
| "Slide to check in" | guard/MidShiftCheckInPanel.tsx:90 | `() => void handleSubmit()` | works |
| Accept mission | guard/ReplacementOfferCard.tsx:40 | `() => void handleAccept()` | works (can be disabled) |
| "Center map on my location" | guard/ShiftMap.tsx:402 | `() => recenterRef.current?.()` | works |

### /guard/my-jobs ("Shifts", ?bt=available|scheduled|completed|missed)
Components: `guard/GuardMyJobsPanel.tsx`, `guard/GuardMyJobsDesktop.tsx`, `guard/GuardJobDetailView.tsx`, `guard/GuardMyJobDetail.tsx`, `guard/GuardJobCard.tsx`, `reports/IncidentReportDetailView.tsx`, `guard/ViewPreShiftBriefingButton.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| _(icon/unnamed)_ | guard/GuardMyJobsDesktop.tsx:233 | `setActiveTab` | works |
| View briefing | guard/ViewPreShiftBriefingButton.tsx:14 | `onClick` | works |

### /guard/payments ("Pay")

**Missing controls this page needs:**
- MISSING — Payout history export / 1099 download — not built
- MISSING — Payout failure / bank-problem notice — webhook ignores account.updated & payout.failed


**Known page-level defects:**
- BROKEN — Guard notifications: 14 stale "Credential Pending" alerts after verification (AUD-008 guard)

Components: `guard/GuardEarningsPanel.tsx`, `guard/GuardEarningsDesktop.tsx`, `guard/GuardStripeConnectSheet.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Send to bank | guard/GuardEarningsDesktop.tsx:116 | `() => void onRequestStripePayout?.()` | works (can be disabled) |
| {stripeConnected ? 'Finish bank setup' : 'Connect bank account'} | guard/GuardEarningsDesktop.tsx:135 | `onConnectStripe` | works (can be disabled) |

### /guard/messages
Components: `guard/GuardMessagesPanel.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|

### /guard/support
Components: `support/SupportComposePage.tsx`, `support/SupportReportPage.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Subject Message Send to Guardr staff | support/SupportComposePage.tsx:41 | `(e) => void handleSubmit(e)` | works |
| Category Priority Subject Details Submit report to staff | support/SupportReportPage.tsx:60 | `(e) => void handleSubmit(e)` | works |
| _(icon/unnamed)_ | support/SupportReportPage.tsx:63 | `(e) => setCategory(e.target.value as SupportTicketCategory)` | works |
| _(icon/unnamed)_ | support/SupportReportPage.tsx:77 | `(e) => setPriority(e.target.value as SupportPriority)` | works |
| None | support/SupportReportPage.tsx:92 | `(e) => setRelatedRequestId(e.target.value)` | works |

### /guard/profile (credentials, ?gtab=)
Components: `profile/GuardCredentialsPanel.tsx`, `profile/GuardCardPanel.tsx`, `profile/GuardCoiUploadSheet.tsx`, `profile/GuardIdentityVerificationPanel.tsx`, `profile/GuardResumeEditor.tsx`, `profile/GuardInventoryPanel.tsx`, `profile/GuardGearCarryPanel.tsx`, `guard/GuardTimesheetPanel.tsx`, `guard/GuardPtaUofPanel.tsx`, `guard/GuardThirtyTwoHourPanel.tsx`, `profile/GuardCoiItemCard.tsx`, `profile/GuardVehicleInsuranceItemCard.tsx`, `profile/GuardIdItemCard.tsx`, `guard/GuardOptionalCredentialAddSheet.tsx`, `guard/GuardArmedStatusPill.tsx`, `profile/inventory/GuardInventoryEquipmentCard.tsx`, `profile/inventory/GuardInventoryEquipmentForm.tsx`, `profile/inventory/GuardInventoryUniformCard.tsx`, `profile/inventory/GuardInventoryUniformForm.tsx`, `guard/CredentialStatusBadge.tsx`, `profile/GuardCoiDetailModal.tsx`, `profile/GuardVehicleInsuranceUploadSheet.tsx`, `profile/GuardIdDetailModal.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Edit | profile/GuardCoiDetailModal.tsx:154 | `() => { if (onEditFullPage) { onEditFullPage(); onClose(); } else { setEditing(true); ` | works |
| "Close" | profile/GuardCoiDetailModal.tsx:170 | `onClose` | works |
| "Certificate of Insurance" | profile/GuardCoiDetailModal.tsx:244 | `setDocumentUrl` | works |
| {saving ? 'Saving…' : staffMode ? 'Save credential' : 'Submit for review'} | profile/GuardCoiDetailModal.tsx:253 | `handleSave` | works (can be disabled) |
| Cancel | profile/GuardCoiDetailModal.tsx:261 | `handleCancelEdit` | works (can be disabled) |
| Verify insurance | profile/GuardCoiDetailModal.tsx:328 | `() => { if (saving) return; setSaving(true); void onReview('verified') .catch((err) => sho` | works (can be disabled) |
| Reject | profile/GuardCoiDetailModal.tsx:350 | `() => { if (saving) return; setSaving(true); void onReview('rejected', rejectionReason.tri` | works (can be disabled) |
| {title} {subtitle} Tap to view details | profile/GuardCoiItemCard.tsx:78 | `openDetail` | works |
| {formError && <p className="text-xs text-red-400">{formError}</p>} Add | profile/GuardCredentialsPanel.tsx:265 | `submitCert` | works |
| _(icon/unnamed)_ | profile/GuardCredentialsPanel.tsx:267 | `(e) => setSelectedCatalogId(e.target.value)` | works |
| _(icon/unnamed)_ | profile/GuardCredentialsPanel.tsx:290 | `(e) => setState(e.target.value)` | works |
| Add credential | profile/GuardCredentialsPanel.tsx:377 | `() => setOptionalAddOpen(true)` | works |
| _(icon/unnamed)_ | profile/GuardCredentialsPanel.tsx:412 | `onSubmitIdentityVerification` | works |
| {rule.label} {rule.description} {isOn ? <Check className="w-5 h-5 text-brand-primary shrin | profile/GuardGearCarryPanel.tsx:196 | `() => toggleEquipment(rule.id)` | works |
| Add equipment | profile/GuardInventoryPanel.tsx:135 | `() => { setEditingEquipment(null); setEquipmentFormOpen(true); }` | works |
| Add uniform | profile/GuardInventoryPanel.tsx:187 | `() => { setEditingUniform(null); setUniformFormOpen(true); }` | works |
| {opt} | profile/GuardResumeEditor.tsx:243 | `() => toggleSpecialty(opt)` | works (can be disabled) |
| {city} | profile/GuardResumeEditor.tsx:265 | `() => toggleServiceArea(city)` | works (can be disabled) |
| Add experience | profile/GuardResumeEditor.tsx:353 | `submitExperience` | works |
| Add education | profile/GuardResumeEditor.tsx:367 | `submitEducation` | works |
| Add | profile/GuardResumeEditor.tsx:455 | `onAdd` | works |
| {hasOnFile ? (expired ? 'Renew' : 'Update') : 'Add'} | profile/GuardVehicleInsuranceItemCard.tsx:63 | `() => setShowUpload(true)` | works |
| Insurance carrier Policy number Effective date Expiry date {formError ? <p className="text | profile/GuardVehicleInsuranceUploadSheet.tsx:73 | `handleSubmit` | works |
| "Edit equipment" | profile/inventory/GuardInventoryEquipmentCard.tsx:35 | `onEdit` | works |
| "Remove equipment" | profile/inventory/GuardInventoryEquipmentCard.tsx:38 | `onDelete` | works |
| Equipment type Brand Model Condition Quantity Notes Additional photos Add photo {initial ? | profile/inventory/GuardInventoryEquipmentForm.tsx:93 | `handleSubmit` | works |
| _(icon/unnamed)_ | profile/inventory/GuardInventoryEquipmentForm.tsx:96 | `(event) => setForm((current) => ({ ...current, typeId: event.target.value as GuardInventor` | works |
| _(icon/unnamed)_ | profile/inventory/GuardInventoryEquipmentForm.tsx:150 | `(event) => setForm((current) => ({ ...current, condition: event.target.value as GuardInven` | works |
| Add photo | profile/inventory/GuardInventoryEquipmentForm.tsx:205 | `() => setForm((current) => ({ ...current, additionalImageUrls: [...current.additionalImage` | works |
| Remove photo | profile/inventory/GuardInventoryEquipmentForm.tsx:234 | `() => setForm((current) => ({ ...current, additionalImageUrls: current.additionalImageUrls` | works |
| Cancel | profile/inventory/GuardInventoryEquipmentForm.tsx:255 | `onClose` | works |
| "Edit uniform" | profile/inventory/GuardInventoryUniformCard.tsx:31 | `onEdit` | works |
| "Remove uniform" | profile/inventory/GuardInventoryUniformCard.tsx:34 | `onDelete` | works |
| Uniform type Outfit description {initial ? 'Save uniform' : 'Add uniform'} Cancel | profile/inventory/GuardInventoryUniformForm.tsx:72 | `handleSubmit` | works |
| _(icon/unnamed)_ | profile/inventory/GuardInventoryUniformForm.tsx:75 | `(event) => { const typeId = event.target.value as GuardInventoryUniformTypeId; const meta ` | works |
| Cancel | profile/inventory/GuardInventoryUniformForm.tsx:136 | `onClose` | works |

### /guard/availability ("Schedule")

**Missing controls this page needs:**
- MISSING — Save availability to the server — current Save only writes to this device (see BROKEN row)

Components: `guard/GuardAvailabilityScreen.tsx`, `guard/GuardAvailabilityCalendar.tsx`, `guard/GuardAvailabilityDatesPanel.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| `${dayLabelFull(day)}${enabled ? ', available' : ', unavailable'}` readOnly ? dayLabel(day | guard/GuardAvailabilityCalendar.tsx:173 | `() => handleToggleDay(day)` | works (can be disabled) |
| Remove | guard/GuardAvailabilityCalendar.tsx:216 | `() => handleToggleDay(day)` | works |
| `Remove ${dayLabel(day)} availability slot` | guard/GuardAvailabilityCalendar.tsx:251 | `() => removeSlot(day, slot.id)` | works |
| Add another window | guard/GuardAvailabilityCalendar.tsx:272 | `() => addSlot(day)` | works |
| {saving ? 'Saving…' : dirty ? 'Save availability' : 'Saved'} | guard/GuardAvailabilityCalendar.tsx:295 | `() => void handleSave()` | BROKEN — saves to this browser only (localStorage); server job-alert matching reads a DB table the UI never writes (can be disabled) |
| Mark day off | guard/GuardAvailabilityDatesPanel.tsx:128 | `addOffDay` | works |
| `Remove off day for ${formatDisplayDate(override.date)}` | guard/GuardAvailabilityDatesPanel.tsx:146 | `() => removeOverride(override.id)` | works |
| {saving ? 'Saving…' : 'Save off days'} | guard/GuardAvailabilityDatesPanel.tsx:172 | `handleSave` | BROKEN — saves to this browser only (localStorage); server job-alert matching reads a DB table the UI never writes (can be disabled) |

### /guard/preferences
Components: `guard/GuardPreferencesScreen.tsx`, `guard/GuardJobPreferencesPanel.tsx`, `guard/JobTypeOnboardingSheet.tsx`, `guard/guardJobTypeIcons.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| {welcomeExpanded ? 'Read less' : 'Read more'} | guard/GuardJobPreferencesPanel.tsx:191 | `() => setWelcomeExpanded((open) => !open)` | works |
| _(icon/unnamed)_ | guard/GuardJobPreferencesPanel.tsx:249 | `() => handleToggle(type)` | works (can be disabled) |
| Complete onboarding to enable | guard/GuardJobPreferencesPanel.tsx:264 | `() => setOnboardingType(type)` | works (can be disabled) |
| "Pause briefing" Pause | guard/JobTypeOnboardingSheet.tsx:104 | `reader.pause` | works |
| "Play briefing" {reader.isPaused ? 'Resume' : 'Play'} | guard/JobTypeOnboardingSheet.tsx:114 | `reader.play` | works |
| reader.isMuted ? 'Unmute briefing' : 'Mute briefing' {reader.isMuted ? 'Unmute' : 'Mute'} | guard/JobTypeOnboardingSheet.tsx:125 | `reader.toggleMute` | works |
| {saving ? 'Saving…' : 'Complete onboarding'} | guard/JobTypeOnboardingSheet.tsx:182 | `() => void onComplete(jobType)` | works (can be disabled) |

### /guard/performance ("Standing")
Components: `guard/GuardPerformanceScreen.tsx`, `guard/GuardRatingSection.tsx`, `guard/GuardModalityPrioritySection.tsx`, `guard/GuardPerformanceFactorDetail.tsx`, `guard/GuardModalityMetricDetail.tsx`, `guard/GuardContractViolationDetail.tsx`, `guard/GuardContractViolationsList.tsx`, `guard/GuardPerformanceRewards.tsx`, `guard/ModalityRewardsInfoSheet.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| How to avoid this violation | guard/GuardContractViolationDetail.tsx:80 | `() => setAvoidOpen((open) => !open)` | works |
| {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit dispute'} | guard/GuardContractViolationDetail.tsx:120 | `() => { if (!violation.requestId \|\| !violation.violationId) return; setSubmitting(true);` | works (can be disabled) |
| View dispute status | guard/GuardContractViolationDetail.tsx:138 | `onOpenDisputeStatus` | works |
| Got it | guard/GuardContractViolationDetail.tsx:199 | `onBack` | works |
| Violation details | guard/GuardContractViolationDetail.tsx:202 | `onOpenDetails` | works |
| {violation.title} {formatViolationListDate(violation.occurredAt)} {violation.jobTitle} | guard/GuardContractViolationsList.tsx:62 | `() => onSelect(violation.id)` | works |
| {content} | guard/GuardModalityPrioritySection.tsx:87 | `() => onSelect?.(card.id, card)` | works |
| `How ${displayName.toLowerCase()} rewards work` | guard/GuardModalityPrioritySection.tsx:140 | `() => setRewardsInfoOpen(true)` | works |
| View {displayName} rewards | guard/GuardModalityPrioritySection.tsx:155 | `() => setRewardsInfoOpen(true)` | works |
| _(icon/unnamed)_ | guard/GuardModalityPrioritySection.tsx:190 | `onMetricSelect && isJobTypeMetricId(card.id) ? onMetricSelect : undefined` | works |
| {row.label} {row.count} | guard/GuardPerformanceFactorDetail.tsx:199 | `() => undefined` | STUB — no-op handler |
| {item.title} {item.subtitle} {item.outcomeLabel} | guard/GuardPerformanceFactorDetail.tsx:249 | `() => onOpenHistoryItem?.(item.id)` | works (can be disabled) |
| {content} | guard/GuardRatingSection.tsx:179 | `() => onSelect?.(factor)` | works |
| {summary} | guard/GuardRatingSection.tsx:205 | `onOpen` | works |
| _(icon/unnamed)_ | guard/GuardRatingSection.tsx:335 | `onFactorSelect` | works |
| View my rewards | guard/GuardRatingSection.tsx:368 | `onViewRewards` | works |
| _(icon/unnamed)_ | guard/GuardRatingSection.tsx:388 | `onFactorSelect` | works |
| {copy.ctaLabel} | guard/ModalityRewardsInfoSheet.tsx:45 | `onClose` | works |

### /guard/vehicle
Components: `guard/GuardVehiclePanel.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|

### /guard/settings

**Known page-level defects:**
- BROKEN — Copy points to "Preferences" and "Availability" in the sidebar; the nav item is called "Schedule" and on the website those routes redirect to /account (AUD-010 guard)

Components: `guard/GuardCompanyRosterPanel.tsx`

_No clickable controls found in these files (content/display only, or controls come from shared components)._

## Customer app (Personal / Business / PPO security company)

### /client/home ("Overview")

**Known page-level defects:**
- BROKEN — On the website (not installed) an Active customer is redirected to /account (AUD-016)

Components: `client/ClientHomeScreen.tsx`, `client/ClientHomeDesktop.tsx`, `client/ClientCapabilitiesContext.tsx`, `staff/overview/OverviewCharts.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Review profile | client/ClientHomeDesktop.tsx:219 | `onOpenProfile` | works |
| "Jobs" | client/ClientHomeDesktop.tsx:233 | `() => run('requests')` | works |
| "Needs action" | client/ClientHomeDesktop.tsx:236 | `pendingActions > 0 ? () => run('requests') : undefined` | works |
| {item.label} {item.description} | client/ClientHomeDesktop.tsx:248 | `item.action` | works |
| {caps.isPersonal ? 'View all' : 'Browse all'} | client/ClientHomeDesktop.tsx:267 | `() => run('guards')` | works |
| {guard.name} {guard.rating.toFixed(1)} | client/ClientHomeDesktop.tsx:274 | `() => runProtected(() => onViewGuard?.(guard))` | works (can be disabled) |
| {caps.isPersonal ? 'Request again' : 'Hire again'} | client/ClientHomeDesktop.tsx:288 | `() => runProtected(() => onHireGuard(guard))` | works (can be disabled) |
| All statuses Open Scheduled In progress Completed | client/ClientHomeDesktop.tsx:314 | `(event) => setStatusFilter(event.target.value as typeof statusFilter)` | works |
| All locations | client/ClientHomeDesktop.tsx:326 | `() => run('map')` | works |
| {job.title \|\| job.contactName \|\| 'Security job'} {job.siteName \|\| job.location} {assigned? | client/ClientHomeDesktop.tsx:358 | `() => openJob(job.id)` | works |
| View all jobs | client/ClientHomeDesktop.tsx:395 | `() => run('requests')` | works |
| View reports | client/ClientHomeDesktop.tsx:439 | `() => run('reports')` | works |
| {coverage.activeAssignments} live | client/ClientHomeScreen.tsx:156 | `() => runAction('map')` | works |
| {pendingActions} Needs review Approvals on the map | client/ClientHomeScreen.tsx:170 | `() => runAction('map')` | works |
| {recentReports.length} Reports Recent activity | client/ClientHomeScreen.tsx:181 | `() => runAction('reports')` | works |
| {hasLiveCoverage ? coverage.guardsOnDuty : 0} On duty Open map | client/ClientHomeScreen.tsx:192 | `() => runAction('map')` | works |
| Review profile | client/ClientHomeScreen.tsx:219 | `onOpenProfile` | works |
| {openRequestCount} Open jobs Active requests | client/ClientHomeScreen.tsx:233 | `() => runAction('requests')` | works |
| {upcoming.length} Scheduled Upcoming shifts | client/ClientHomeScreen.tsx:243 | `() => runAction('requests')` | works |
| {coverage.activeAssignments} Coverage Guards on duty | client/ClientHomeScreen.tsx:254 | `() => runAction('map')` | works |
| + {caps.isPersonal ? 'Request' : 'Post a job'} {caps.isPersonal ? 'Request security' : 'Po | client/ClientHomeScreen.tsx:265 | `() => runAction('request')` | works |
| Live now Map {coverage.activeAssignments} Active {coverage.guardsOnDuty} On duty {coverage | client/ClientHomeScreen.tsx:286 | `() => runAction('map')` | works |
| {caps.isPersonal ? 'Request security' : 'Post job offer'} | client/ClientHomeScreen.tsx:361 | `() => runAction('request')` | works |
| Open map | client/ClientHomeScreen.tsx:364 | `() => runAction('map')` | works |
| All jobs | client/ClientHomeScreen.tsx:379 | `() => runAction('requests')` | works |
| {req.title} {formatCoverageDateLabel(req.startDate)} {formatShiftTimeRange(req.startDate,  | client/ClientHomeScreen.tsx:393 | `() => runAction('requests')` | works |
| action.label | client/ClientHomeScreen.tsx:416 | `() => runAction(action.id)` | works (can be disabled) |
| View all | client/ClientHomeScreen.tsx:434 | `() => runAction('reports')` | works |
| {REPORT_TYPE_LABEL[report.type]} {report.title} {report.summary} | client/ClientHomeScreen.tsx:446 | `() => runAction('reports')` | works |
| {caps.isPersonal ? 'View all' : 'Browse all'} | client/ClientHomeScreen.tsx:459 | `() => runAction('guards')` | works |
| {guard.name} {guard.rating.toFixed(1)} | client/ClientHomeScreen.tsx:469 | `() => runProtectedCallback(() => onViewGuard?.(guard))` | works |
| {caps.isPersonal ? 'Request again' : 'Hire again'} | client/ClientHomeScreen.tsx:484 | `() => runProtectedCallback(() => onHireGuard(guard))` | works (can be disabled) |
| {caps.isPersonal ? 'View all' : 'Browse all'} | client/ClientHomeScreen.tsx:506 | `() => runAction('guards')` | works |
| {guard.name} {guard.rating.toFixed(1)} | client/ClientHomeScreen.tsx:516 | `() => runProtectedCallback(() => onViewGuard?.(guard))` | works |
| {caps.isPersonal ? 'Request again' : 'Hire again'} | client/ClientHomeScreen.tsx:531 | `() => runProtectedCallback(() => onHireGuard(guard))` | works (can be disabled) |
| Review profile | client/ClientHomeScreen.tsx:566 | `onOpenProfile` | works |
| Live now Map {coverage.activeAssignments} Active {coverage.guardsOnDuty} On duty {coverage | client/ClientHomeScreen.tsx:581 | `() => runAction('map')` | works |
| {caps.isPersonal ? 'Request security' : 'Post job offer'} | client/ClientHomeScreen.tsx:656 | `() => runAction('request')` | works |
| Open map | client/ClientHomeScreen.tsx:659 | `() => runAction('map')` | works |
| "Open jobs" | client/ClientHomeScreen.tsx:672 | `() => runAction('requests')` | works |
| "Scheduled" | client/ClientHomeScreen.tsx:679 | `() => runAction('requests')` | works |
| "Coverage" | client/ClientHomeScreen.tsx:686 | `() => runAction('map')` | works |
| action.label | client/ClientHomeScreen.tsx:700 | `() => runAction(action.id)` | works (can be disabled) |
| {guard.name} {guard.rating.toFixed(1)} | client/ClientHomeScreen.tsx:721 | `() => runProtectedCallback(() => onViewGuard?.(guard))` | works |
| {caps.isPersonal ? 'Request again' : 'Hire again'} | client/ClientHomeScreen.tsx:736 | `() => runProtectedCallback(() => onHireGuard(guard))` | works (can be disabled) |
| {req.title} {formatCoverageDateLabel(req.startDate)} {formatShiftTimeRange(req.startDate,  | client/ClientHomeScreen.tsx:767 | `() => runAction('requests')` | works |
| {REPORT_TYPE_LABEL[report.type]} {report.title} {report.summary} | client/ClientHomeScreen.tsx:797 | `() => runAction('reports')` | works |

### /client/request (9-step "Request security"/"Post job")

**Missing controls this page needs:**
- MISSING — "Save as draft" — Slide to post publishes immediately (AUD-020)
- MISSING — Post a job that starts now/in the past for urgent coverage — blocked by "Job cannot start in the past" (AUD-014; product decision)


**Known page-level defects:**
- BROKEN — Business accounts blocked at Step 9 even with staff-Verified credentials (AUD-009/016). Gate (lib/clientCredentials.ts) also requires a document URL, exact credential type and no expiry — likely mismatch with what staff marked Verified (unverified root cause)

Components: `client/RequestSecurityFlow.tsx`, `client/JobCertRequirementsPicker.tsx`, `client/ClientCapabilitiesContext.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| {GUARD_PATHWAY_STATUS_LABELS[level]} {GUARD_PATHWAY_STATUS_DESCRIPTIONS[level]} {active && | client/JobCertRequirementsPicker.tsx:50 | `() => onMinQualificationChange(level)` | works |
| {opt.label} {opt.description} {active && <Check className="w-5 h-5 text-brand-primary shri | client/JobCertRequirementsPicker.tsx:92 | `() => toggle(opt.id)` | works |
| step === 1 ? 'Back to Home' : `Back to ${STEP_LABELS[step - 2]}` | client/RequestSecurityFlow.tsx:347 | `goBack` | works |
| {opt.emoji} {opt.label} {opt.description} | client/RequestSecurityFlow.tsx:385 | `() => selectService(opt.id)` | works |
| Skip for now — describe in listing details | client/RequestSecurityFlow.tsx:423 | `skipServiceStep` | works |
| _(icon/unnamed)_ | client/RequestSecurityFlow.tsx:462 | `(e) => setJobState(resolveJobCity(e.target.value))` | works |
| Enter a new address | client/RequestSecurityFlow.tsx:488 | `(e) => { const id = e.target.value \|\| null; setSelectedLocationId(id); setSelectedFamili` | works |
| Enter a new address | client/RequestSecurityFlow.tsx:516 | `(e) => { const id = e.target.value \|\| null; setSelectedFamiliarId(id); setSelectedLocati` | works |
| One-time shift | client/RequestSecurityFlow.tsx:560 | `() => setScheduleType('one-time')` | works |
| Recurring coverage | client/RequestSecurityFlow.tsx:569 | `() => setScheduleType('recurring')` | STUB — recurring days/end date are stored on the one job but no future shifts are ever generated (lib/recurringShifts.ts is unused, no cron) |
| {label} | client/RequestSecurityFlow.tsx:585 | `() => toggleRecurringDay(day)` | STUB — recurring days/end date are stored on the one job but no future shifts are ever generated (lib/recurringShifts.ts is unused, no cron) |
| {minutes === 0 ? 'None' : `${minutes}m`} | client/RequestSecurityFlow.tsx:658 | `() => { setBreakMinutes(minutes); setCustomBreakMinutes(''); }` | works |
| {n} | client/RequestSecurityFlow.tsx:708 | `() => { setGuardsNeeded(n); setCustomGuards(''); }` | works |
| {g.name} {getGuardDisplayHeadline(g)} | client/RequestSecurityFlow.tsx:750 | `() => setSelectedFavoriteGuardId(isSelected ? null : g.id)` | works |
| {opt.label} {opt.description} | client/RequestSecurityFlow.tsx:783 | `() => setAssignmentMode(opt.id)` | works |
| Continue | client/RequestSecurityFlow.tsx:953 | `goNext` | works (can be disabled) |
| "Slide to post job offer" | client/RequestSecurityFlow.tsx:962 | `handleSubmit` | PARTIAL — posts immediately, no save-as-draft (AUD-020); Business gate can block even after Verified (AUD-009/016) |

### /client/requests ("Coverage"/"Jobs", ?jt=, ?cj=) + job actions

**Missing controls this page needs:**
- MISSING — "Duplicate / post again" for a past job — not built
- MISSING — "Extend shift now" while on duty — only the slower schedule-change request exists
- MISSING — "Request refund / dispute this charge" for anything other than overtime — not built (only overtime dispute + Report violation)
- MISSING — Expired state: unpaid/unfilled jobs past end time still show Pay/Edit/Cancel (AUD-019) — needs auto-expire + "Repost"
- MISSING — "Approve full team" / "Deny full team" for multi-guard jobs — built but never wired from App.tsx

Components: `client/ClientRequestsList.tsx`, `client/ClientRequestsDesktop.tsx`, `client/ClientJobActionsPanel.tsx`, `client/EditRequestForm.tsx`, `client/ReplacementRequestPanel.tsx`, `client/ClientViolationReportSheet.tsx`, `client/ClientShiftStartVerification.tsx`, `client/ClientShiftEndVerification.tsx`, `guard/GuardArmedStatusPill.tsx`, `guard/GuardMatchScoreRow.tsx`, `client/ClientCapabilitiesContext.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Review & request | client/ClientJobActionsPanel.tsx:395 | `() => void onRequestSuggestedGuard(req.id, suggested.id)` | works |
| Dismiss | client/ClientJobActionsPanel.tsx:404 | `() => void onDismissGuardSuggestion(req.id, suggestion.id)` | works |
| _(icon/unnamed)_ | client/ClientJobActionsPanel.tsx:428 | `() => onRequestEdit(req.id)` | works |
| Cancel | client/ClientJobActionsPanel.tsx:441 | `() => { void (async () => { if ( await showAppConfirm({ title: 'Cancel job?', message: `Ca` | works |
| _(icon/unnamed)_ | client/ClientJobActionsPanel.tsx:522 | `async () => { setPendingGuardActionId(req.id); try { await onApprovePendingGuard(req.id); ` | works (can be disabled) |
| Decline guard | client/ClientJobActionsPanel.tsx:541 | `async () => { setPendingGuardActionId(req.id); try { await onDenyPendingGuard(req.id); } f` | works (can be disabled) |
| _(icon/unnamed)_ | client/ClientJobActionsPanel.tsx:585 | `() => void handlePayNow()` | WORKS but UNSAFE — browser sends the charge amount; still offered after shift end (AUD-019); live-mode only (AUD-017) (can be disabled) |
| _(icon/unnamed)_ | client/ClientJobActionsPanel.tsx:599 | `() => void handlePayWithSquare()` | WORKS but UNSAFE — browser sends the charge amount; still offered after shift end (AUD-019); live-mode only (AUD-017) (can be disabled) |
| Message guard | client/ClientJobActionsPanel.tsx:629 | `() => onOpenJobChat(req.id)` | works |
| _(icon/unnamed)_ | client/ClientJobActionsPanel.tsx:691 | `async () => { setOvertimeApproveJobId(req.id); try { await onApproveOvertime(req.id); } fi` | works (can be disabled) |
| Dispute charge | client/ClientJobActionsPanel.tsx:712 | `openDispute` | works (can be disabled) |
| _(icon/unnamed)_ | client/ClientJobActionsPanel.tsx:728 | `() => void handlePayOvertime()` | WORKS but UNSAFE — browser sends the charge amount; still offered after shift end (AUD-019); live-mode only (AUD-017) (can be disabled) |
| _(icon/unnamed)_ | client/ClientJobActionsPanel.tsx:743 | `() => void handlePayOvertimeWithSquare()` | WORKS but UNSAFE — browser sends the charge amount; still offered after shift end (AUD-019); live-mode only (AUD-017) (can be disabled) |
| _(icon/unnamed)_ | client/ClientJobActionsPanel.tsx:789 | `async () => { setScheduleApproveJobId(req.id); try { await onApproveScheduleChange(req.id)` | works (can be disabled) |
| _(icon/unnamed)_ | client/ClientJobActionsPanel.tsx:809 | `async () => { setScheduleRejectJobId(req.id); try { await onRejectScheduleChange(req.id); ` | works (can be disabled) |
| _(icon/unnamed)_ | client/ClientJobActionsPanel.tsx:833 | `() => void handlePayScheduleExtension()` | WORKS but UNSAFE — browser sends the charge amount; still offered after shift end (AUD-019); live-mode only (AUD-017) (can be disabled) |
| Complete job | client/ClientJobActionsPanel.tsx:867 | `() => onUpdateStatus(req.id, 'completed')` | works |
| Message guard on shift | client/ClientJobActionsPanel.tsx:884 | `() => onOpenJobChat(req.id)` | works |
| View job chat history | client/ClientJobActionsPanel.tsx:898 | `() => onOpenJobChat(req.id)` | works |
| Rate guard | client/ClientJobActionsPanel.tsx:917 | `openReviewSheet` | works |
| Report violation | client/ClientJobActionsPanel.tsx:931 | `() => setViolationOpen(true)` | works |
| Cancel | client/ClientJobActionsPanel.tsx:988 | `() => setOvertimeDisputeOpen(false)` | works (can be disabled) |
| _(icon/unnamed)_ | client/ClientJobActionsPanel.tsx:996 | `async () => { if (!onDisputeOvertime \|\| !disputeClockOutIso) return; setOvertimeDisputin` | works (can be disabled) |
| `${s} star${s === 1 ? '' : 's'}` | client/ClientJobActionsPanel.tsx:1033 | `() => setReviewRating(s)` | works |
| No tip | client/ClientJobActionsPanel.tsx:1057 | `() => { setSelectedTipCents(0); setCustomTip(''); }` | works |
| {formatTipAmountCents(cents)} | client/ClientJobActionsPanel.tsx:1068 | `() => { setSelectedTipCents(cents); setCustomTip(''); }` | works |
| _(icon/unnamed)_ | client/ClientJobActionsPanel.tsx:1100 | `async () => { if (reviewSubmitting) return; setReviewSubmitting(true); try { const tipCent` | works (can be disabled) |
| _(icon/unnamed)_ | client/ClientJobActionsPanel.tsx:1146 | `onReportViolation` | works |
| _(icon/unnamed)_ | client/ClientRequestsDesktop.tsx:270 | `setActiveTab` | works |
| Post a job | client/ClientRequestsDesktop.tsx:286 | `onRequestNew` | works |
| {job.title} {formatShiftRange(job.startDate, job.endDate)} | client/ClientRequestsList.tsx:105 | `onSelect` | works |
| Post a job | client/ClientRequestsList.tsx:420 | `onRequestNew` | works |
| Post a job | client/ClientRequestsList.tsx:436 | `onRequestNew` | works |
| _(icon/unnamed)_ | client/ClientRequestsList.tsx:464 | `onSelect` | works |
| Post a job | client/ClientRequestsList.tsx:556 | `onRequestNew` | works |
| _(icon/unnamed)_ | client/ClientRequestsList.tsx:571 | `() => updateSelectedId(job.id)` | works |
| _(icon/unnamed)_ | client/ClientRequestsList.tsx:595 | `() => updateSelectedId(job.id)` | works |
| _(icon/unnamed)_ | client/ClientRequestsList.tsx:619 | `() => updateSelectedId(job.id)` | works |
| _(icon/unnamed)_ | client/ClientRequestsList.tsx:638 | `() => updateSelectedId(job.id)` | works |
| Verify end of shift | client/ClientShiftEndVerification.tsx:145 | `() => void handleVerify()` | works (can be disabled) |
| Flag issue | client/ClientShiftEndVerification.tsx:156 | `() => setShowFlagForm(true)` | works |
| _(icon/unnamed)_ | client/ClientShiftEndVerification.tsx:168 | `(e) => setFlagCategory(e.target.value)` | works |
| Cancel | client/ClientShiftEndVerification.tsx:188 | `() => setShowFlagForm(false)` | works |
| Submit flag | client/ClientShiftEndVerification.tsx:195 | `() => void handleFlag()` | works (can be disabled) |
| Verify start of shift | client/ClientShiftStartVerification.tsx:120 | `() => void handleVerify()` | works (can be disabled) |
| Flag issue | client/ClientShiftStartVerification.tsx:131 | `() => setShowFlagForm(true)` | works |
| _(icon/unnamed)_ | client/ClientShiftStartVerification.tsx:143 | `(e) => setFlagCategory(e.target.value)` | works |
| Cancel | client/ClientShiftStartVerification.tsx:163 | `() => setShowFlagForm(false)` | works |
| Submit flag | client/ClientShiftStartVerification.tsx:170 | `() => void handleFlag()` | works (can be disabled) |
| {option.label} {option.description} | client/ClientViolationReportSheet.tsx:141 | `() => setTarget(option.id)` | works |
| {option.label} | client/ClientViolationReportSheet.tsx:173 | `() => setCategory(option.value)` | works |
| _(icon/unnamed)_ | client/ClientViolationReportSheet.tsx:199 | `() => void handleSubmit()` | works (can be disabled) |
| Title Site name City Address {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :  | client/EditRequestForm.tsx:167 | `handleSubmit` | works |
| _(icon/unnamed)_ | client/EditRequestForm.tsx:203 | `(e) => setState(resolveJobCity(e.target.value))` | works |
| Cancel | client/EditRequestForm.tsx:312 | `onCancel` | works |
| Request replacement | client/ReplacementRequestPanel.tsx:64 | `() => void onRequestReplacement(request.id, note.trim() \|\| undefined)` | works (can be disabled) |

### /client/map ("Activity") + live shift

**Known page-level defects:**
- BROKEN — Map tiles watermarked "API KEY REQUIRED" (AUD-015)

Components: `client/ClientMapScreen.tsx`, `client/ClientActiveShift.tsx`, `guard/ShiftMap.tsx`, `client/ClientJobActionsPanel.tsx`, `client/ClientMapBrowseDock.tsx`, `mission/MissionTimeline.tsx`, `guard/GuardArmedStatusPill.tsx`, `guard/GuardRatingSection.tsx`, `shift/ShiftPeriodStatusBar.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Message | client/ClientActiveShift.tsx:152 | `onOpenJobChat` | works |
| {job.title} {CLIENT_SHIFT_PHASE_LABELS[inferClientShiftPhase(job)]} | client/ClientActiveShift.tsx:250 | `() => onSwitchJob(job.id)` | works |
| Post job offer | client/ClientMapBrowseDock.tsx:24 | `() => runAction(onPostJob)` | DEAD CODE — component is never rendered |
| Request a guard | client/ClientMapBrowseDock.tsx:28 | `() => runAction(onRequestGuard)` | DEAD CODE — component is never rendered |
| menuOpen ? 'Close new job menu' : 'New job or guard request' {menuOpen ? <X className="w-5 | client/ClientMapBrowseDock.tsx:35 | `() => setMenuOpen((v) => !v)` | DEAD CODE — component is never rendered |
| {content} | guard/GuardRatingSection.tsx:179 | `() => onSelect?.(factor)` | works |
| {summary} | guard/GuardRatingSection.tsx:205 | `onOpen` | works |
| _(icon/unnamed)_ | guard/GuardRatingSection.tsx:335 | `onFactorSelect` | works |
| View my rewards | guard/GuardRatingSection.tsx:368 | `onViewRewards` | works |
| _(icon/unnamed)_ | guard/GuardRatingSection.tsx:388 | `onFactorSelect` | works |
| "Center map on my location" | guard/ShiftMap.tsx:402 | `() => recenterRef.current?.()` | works |

### /client/guards ("Guards"/"Marketplace") + guard profile (?pg=) + direct request (?dr=)
Components: `client/GuardDirectoryScreen.tsx`, `client/GuardProfileScreen.tsx`, `client/DirectGuardRequestFlow.tsx`, `guard/CertBadgeRow.tsx`, `guard/GuardArmedStatusPill.tsx`, `profile/GuardInventoryPanel.tsx`, `guard/GuardRatingSection.tsx`, `client/JobCertRequirementsPicker.tsx`, `client/ClientCapabilitiesContext.tsx`, `profile/inventory/GuardInventoryEquipmentCard.tsx`, `profile/inventory/GuardInventoryEquipmentForm.tsx`, `profile/inventory/GuardInventoryUniformCard.tsx`, `profile/inventory/GuardInventoryUniformForm.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| step === 1 ? 'Back to Guards' : `Back to ${STEP_LABELS[step - 2]}` | client/DirectGuardRequestFlow.tsx:256 | `goBack` | works |
| {opt.emoji} {opt.label} {opt.description} | client/DirectGuardRequestFlow.tsx:283 | `() => selectService(opt.id)` | works |
| _(icon/unnamed)_ | client/DirectGuardRequestFlow.tsx:346 | `(e) => setJobState(resolveJobCity(e.target.value))` | works |
| {minutes === 0 ? 'None' : `${minutes}m`} | client/DirectGuardRequestFlow.tsx:404 | `() => { setBreakMinutes(minutes); setCustomBreakMinutes(''); }` | works |
| Continue | client/DirectGuardRequestFlow.tsx:537 | `goNext` | works (can be disabled) |
| `Slide to send request to ${guard.name.split(' ')[0]}` | client/DirectGuardRequestFlow.tsx:541 | `handleSubmit` | works |
| "Filters" | client/GuardDirectoryScreen.tsx:236 | `() => { setShowFilterPanel((v) => !v); setShowSortMenu(false); }` | works |
| Clear filters | client/GuardDirectoryScreen.tsx:263 | `clearAllFilters` | works |
| Favourites {favCount > 0 ? ` (${favCount})` : ''} | client/GuardDirectoryScreen.tsx:274 | `() => updateFilter('favoritesOnly', !filters.favoritesOnly)` | works |
| {currentSort.label} | client/GuardDirectoryScreen.tsx:289 | `() => { setShowSortMenu((v) => !v); setShowFilterPanel(false); }` | works |
| {opt.label} | client/GuardDirectoryScreen.tsx:300 | `() => { updateFilter('sortBy', opt.id); setShowSortMenu(false); }` | works |
| "Armed guards only" | client/GuardDirectoryScreen.tsx:357 | `(v) => updateFilter('armedOnly', v)` | works |
| "Verified guards only" | client/GuardDirectoryScreen.tsx:366 | `(v) => updateFilter('verifiedOnly', v)` | works |
| "Trusted guards only" | client/GuardDirectoryScreen.tsx:375 | `(v) => updateFilter('trustedOnly', v)` | works |
| "Previously worked with" | client/GuardDirectoryScreen.tsx:385 | `(v) => updateFilter('previouslyWorkedWith', v)` | works |
| {opt.label} | client/GuardDirectoryScreen.tsx:402 | `() => updateFilter('minRating', opt.value)` | works |
| {opt.label} | client/GuardDirectoryScreen.tsx:426 | `() => updateFilter('minExperience', opt.value)` | works |
| {spec} | client/GuardDirectoryScreen.tsx:452 | `() => toggleSpecialty(spec)` | works |
| Clear all | client/GuardDirectoryScreen.tsx:471 | `clearAllFilters` | works |
| Show {filtered.length} guard {filtered.length !== 1 ? 's' : ''} | client/GuardDirectoryScreen.tsx:474 | `() => setShowFilterPanel(false)` | works |
|  <span className="flex items-center gap-2 flex-wrap"> {guard.name} {isGuardTrusted(guard)  | client/GuardDirectoryScreen.tsx:504 | `() => onSelectGuard(guard)` | works |
| `Remove ${label} filter` | client/GuardDirectoryScreen.tsx:608 | `onRemove` | works |
| {icon} {label} {description} | client/GuardDirectoryScreen.tsx:634 | `() => onChange(!checked)` | works |
| Clear all filters | client/GuardDirectoryScreen.tsx:698 | `onClearFilters` | works |
| isFavorite ? 'Remove from favourites' : 'Add to favourites' | client/GuardProfileScreen.tsx:156 | `() => void onToggleFavorite()` | works |
| isFavorite ? 'Remove from favourites' : 'Add to favourites' | client/GuardProfileScreen.tsx:199 | `() => void onToggleFavorite()` | works |
| {item.title} {STATUS_LABEL[item.status]} {item.location} {formatShiftRange(item.startDate, | client/GuardProfileScreen.tsx:382 | `historyChatOpen ? () => openJobChat(item.requestId) : undefined` | works |
| {jobChatActionLabel(messageableRequest)} | client/GuardProfileScreen.tsx:453 | `() => openJobChat(messageableRequest.id)` | works |
| Send assignment request to {guardFirstName} | client/GuardProfileScreen.tsx:462 | `() => onRequestGuard(guard)` | works |
| Add equipment | profile/GuardInventoryPanel.tsx:135 | `() => { setEditingEquipment(null); setEquipmentFormOpen(true); }` | works |
| Add uniform | profile/GuardInventoryPanel.tsx:187 | `() => { setEditingUniform(null); setUniformFormOpen(true); }` | works |
| "Edit equipment" | profile/inventory/GuardInventoryEquipmentCard.tsx:35 | `onEdit` | works |
| "Remove equipment" | profile/inventory/GuardInventoryEquipmentCard.tsx:38 | `onDelete` | works |
| Equipment type Brand Model Condition Quantity Notes Additional photos Add photo {initial ? | profile/inventory/GuardInventoryEquipmentForm.tsx:93 | `handleSubmit` | works |
| _(icon/unnamed)_ | profile/inventory/GuardInventoryEquipmentForm.tsx:96 | `(event) => setForm((current) => ({ ...current, typeId: event.target.value as GuardInventor` | works |
| _(icon/unnamed)_ | profile/inventory/GuardInventoryEquipmentForm.tsx:150 | `(event) => setForm((current) => ({ ...current, condition: event.target.value as GuardInven` | works |
| Add photo | profile/inventory/GuardInventoryEquipmentForm.tsx:205 | `() => setForm((current) => ({ ...current, additionalImageUrls: [...current.additionalImage` | works |
| Remove photo | profile/inventory/GuardInventoryEquipmentForm.tsx:234 | `() => setForm((current) => ({ ...current, additionalImageUrls: current.additionalImageUrls` | works |
| Cancel | profile/inventory/GuardInventoryEquipmentForm.tsx:255 | `onClose` | works |
| "Edit uniform" | profile/inventory/GuardInventoryUniformCard.tsx:31 | `onEdit` | works |
| "Remove uniform" | profile/inventory/GuardInventoryUniformCard.tsx:34 | `onDelete` | works |
| Uniform type Outfit description {initial ? 'Save uniform' : 'Add uniform'} Cancel | profile/inventory/GuardInventoryUniformForm.tsx:72 | `handleSubmit` | works |
| _(icon/unnamed)_ | profile/inventory/GuardInventoryUniformForm.tsx:75 | `(event) => { const typeId = event.target.value as GuardInventoryUniformTypeId; const meta ` | works |
| Cancel | profile/inventory/GuardInventoryUniformForm.tsx:136 | `onClose` | works |

### /client/locations ("Locations"/"Sites"/"Client sites")

**Missing controls this page needs:**
- MISSING — Working /client/sites URL — nav says "Sites" but the route is /client/locations; /client/sites falls back to home (AUD-018)

Components: `client/ClientLocationsPanel.tsx`, `client/ClientCapabilitiesContext.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| _(icon/unnamed)_ | client/ClientLocationsPanel.tsx:169 | `(e) => setState(resolveJobCity(e.target.value))` | works |
| {opt.label} | client/ClientLocationsPanel.tsx:185 | `() => setRiskLevel(opt.id)` | works |
| {saving ? 'Saving…' : caps.isPersonal ? 'Save location' : 'Save site'} | client/ClientLocationsPanel.tsx:209 | `() => void handleAdd()` | works (can be disabled) |
| Approve | client/ClientLocationsPanel.tsx:292 | `() => void onApprove(loc.id)` | works |
| Reject | client/ClientLocationsPanel.tsx:295 | `() => void onReject(loc.id)` | works |

### /client/payments ("Payments"/"Billing")
Components: `client/ClientInvoiceScreen.tsx`, `client/ClientInvoicePanel.tsx`, `client/ClientCapabilitiesContext.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Generate for {r.title?.slice(0, 24) \|\| 'job'} | client/ClientInvoicePanel.tsx:51 | `() => generateForJob(r)` | works |
| Download | client/ClientInvoicePanel.tsx:80 | `() => downloadInvoicePdf(inv, client)` | works |
| _(icon/unnamed)_ | client/ClientInvoiceScreen.tsx:237 | `() => void handlePayWithStripe(request)` | works (can be disabled) |
| _(icon/unnamed)_ | client/ClientInvoiceScreen.tsx:255 | `() => void handlePayWithSquare(request)` | works (can be disabled) |
| Download invoice | client/ClientInvoiceScreen.tsx:283 | `() => downloadInvoicePdf(invoice, client)` | works |
| {invoice.invoiceNumber} {request?.title ?? 'Security services'} {invoiceStatusLabel(invoic | client/ClientInvoiceScreen.tsx:337 | `invoice.requestId ? onSelect : undefined` | works (can be disabled) |
| _(icon/unnamed)_ | client/ClientInvoiceScreen.tsx:484 | `() => void handlePayWithStripe(selectedRequest)` | works (can be disabled) |
| _(icon/unnamed)_ | client/ClientInvoiceScreen.tsx:502 | `() => void handlePayWithSquare(selectedRequest)` | works (can be disabled) |
| Download invoice | client/ClientInvoiceScreen.tsx:530 | `() => downloadInvoicePdf(selectedInvoice, client)` | works |
| {invoice.invoiceNumber} {request?.title ?? 'Security services'} {invoiceStatusLabel(invoic | client/ClientInvoiceScreen.tsx:573 | `invoice.requestId ? () => onSelectRequestId?.(invoice.requestId!) : undefined` | works |

### /client/reports (Business/PPO)
Components: `client/ClientReportsScreen.tsx`, `client/ClientReportsDesktop.tsx`, `reports/IncidentReportDetailView.tsx`, `staff/StaffListFilterTabs.tsx`, `client/ClientInvoicePanel.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| _(icon/unnamed)_ | client/ClientReportsDesktop.tsx:92 | `setTab` | works |
| report.title | client/ClientReportsScreen.tsx:114 | `onSelect` | works |
| {report.title} {report.siteName} {meta.emoji} {meta.label} {report.summary} | client/ClientReportsScreen.tsx:200 | `isIncident ? () => onSelectIncident(report.incidentId!) : undefined` | works |

### /client/roster (PPO only)

**Missing controls this page needs:**
- MISSING — Invite/onboard the company's OWN guards (roster can only add existing marketplace guards)
- MISSING — Assign/dispatch a roster guard to a shift directly (only "Request guard" = marketplace direct request)

Components: `client/SecurityCompanyRosterScreen.tsx`, `guard/CertBadgeRow.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Post overflow job | client/SecurityCompanyRosterScreen.tsx:94 | `() => onRequestGuard(guard)` | works |
| Remove | client/SecurityCompanyRosterScreen.tsx:98 | `() => void onRemoveFromRoster(guard.id)` | works |
| Add | client/SecurityCompanyRosterScreen.tsx:140 | `() => void onAddToRoster(guard.id)` | works |

### /client/operations ("Live ops", PPO only)

**Missing controls this page needs:**
- MISSING — Any action other than "Open job" — no reassign, message-all, or escalate from Live ops

Components: `client/SecurityCompanyOperationsScreen.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Open job | client/SecurityCompanyOperationsScreen.tsx:103 | `() => onOpenJob(row.job.id)` | works |

### /client/messages
Components: `client/ClientMessagesPanel.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| row.title | client/ClientMessagesPanel.tsx:399 | `() => openRow(row)` | works |

### /client/profile (credentials, authorized contacts)

**Missing controls this page needs:**
- MISSING — Upload button on the read-only "Pending upload" credential cards — upload only works via Edit profile → Credentials (AUD-009)
- MISSING — Separate logins for Business/PPO team members — "Authorized contacts" are just names/phones, not users

Components: `client/ClientCredentialsSection.tsx`, `client/ClientAuthorizedContactsSection.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| `Remove ${contact.name}` | client/ClientAuthorizedContactsSection.tsx:80 | `() => removeContact(contact.id)` | works |
| _(icon/unnamed)_ | client/ClientAuthorizedContactsSection.tsx:117 | `(e) => setDraftRole(e.target.value as typeof draftRole)` | works |
| Add contact | client/ClientAuthorizedContactsSection.tsx:128 | `addContact` | works (can be disabled) |
| _(icon/unnamed)_ | client/ClientCredentialsSection.tsx:151 | `(e) => setSelectedTypeId(e.target.value)` | works |
| Submit for verification | client/ClientCredentialsSection.tsx:175 | `() => void submitType(selectedTypeId, documentUrl, expirationDate)` | works (can be disabled) |

### /client/settings
Components: `profile/UserSettingsScreen.tsx`

_No clickable controls found in these files (content/display only, or controls come from shared components)._

## Staff app (browser/PWA/APK; visibility depends on role)

### /staff/overview
Components: `staff/StaffOverview.tsx`, `staff/StaffOverviewDesktop.tsx`, `staff/StaffSlaDashboard.tsx`, `staff/StaffSummaryCell.tsx`, `staff/overview/OverviewCharts.tsx`, `staff/overview/StaffOverviewLayouts.tsx`, `staff/overview/StaffOverviewShellParts.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| item.title | staff/StaffOverviewDesktop.tsx:260 | `() => onNavigate(item.section, resolveOverviewActionSelection(item, { requests, guards, cl` | works |
| job.title | staff/StaffOverviewDesktop.tsx:285 | `() => (onOpenJob && canUpdateJobs ? onOpenJob(job.id) : onNavigate('jobs'))` | works |
| item.title | staff/overview/StaffOverviewShellParts.tsx:242 | `item.onClick` | works |
| item.label | staff/overview/StaffOverviewShellParts.tsx:264 | `item.onClick` | works |
| {copy} | staff/overview/StaffOverviewShellParts.tsx:313 | `onReview` | works |
| {actionLabel} | staff/overview/StaffOverviewShellParts.tsx:334 | `onAction` | works |
| {icon ? <span className="staff-overview-list-row-icon">{icon}</span> : null} {title} {badg | staff/overview/StaffOverviewShellParts.tsx:398 | `onClick` | works (can be disabled) |
| {title} | staff/overview/StaffOverviewShellParts.tsx:430 | `onClick` | works |
| {healthy ? 'All clear' : `${pendingReviews} need review`} | staff/overview/StaffOverviewShellParts.tsx:480 | `onReview` | works (can be disabled) |
| {metric.value} {metric.label} {metric.sub} | staff/overview/StaffOverviewShellParts.tsx:509 | `metric.navigateTo && onNavigate ? () => onNavigate(metric.navigateTo!) : undefined` | works (can be disabled) |
| metric.label | staff/overview/StaffOverviewShellParts.tsx:538 | `metric.navigateTo && onNavigate ? () => onNavigate(metric.navigateTo!) : undefined` | works |
| {row.count} {row.label} {row.description} | staff/overview/StaffOverviewShellParts.tsx:634 | `() => onNavigate(row.section)` | works |
| {metric.value} {metric.label} | staff/overview/StaffOverviewShellParts.tsx:700 | `metric.navigateTo && onNavigate ? () => onNavigate(metric.navigateTo!) : undefined` | works (can be disabled) |

### /staff/applications

**Missing controls this page needs:**
- MISSING — One-role hold "Allow permanently / trust this device" — Ignore does not stick (AUD-008)
- MISSING — Applications page reliability — rendered blank for staff@ during audit (AUD-003)


**Known page-level defects:**
- BROKEN — Blank for staff@ during audit (AUD-003); manager@ application missing from lists (AUD-002)

Components: `staff/StaffApplications.tsx`, `staff/StaffOneRoleHolds.tsx`, `staff/StaffGuardApplicationReviewPanel.tsx`, `staff/StaffClientApplicationReviewPanel.tsx`, `staff/StaffActivationReviewDetail.tsx`, `staff/StaffAddGuardForm.tsx`, `staff/StaffAddClientForm.tsx`, `staff/StaffListFilterTabs.tsx`, `staff/StaffOpsPageShell.tsx`, `staff/GuardRosterStatusBadges.tsx`, `staff/StaffGuardApplicationSummary.tsx`, `staff/StaffDetailProfileHeader.tsx`, `staff/StaffAccountAccessSection.tsx`, `staff/StaffGuardActivationChecklistView.tsx`, `staff/StaffApplicationCredentialViewModal.tsx`, `guard/GuardArmedStatusPill.tsx`, `staff/StaffClientApplicationSummary.tsx`, `staff/StaffCredentialReviewDetail.tsx`, `profile/GuardCoiDetailModal.tsx`, `profile/GuardIdDetailModal.tsx`, `staff/StaffPersonalClientApplication.tsx`, `staff/StaffBusinessClientApplication.tsx`, `staff/StaffSecurityCompanyApplication.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Edit | profile/GuardCoiDetailModal.tsx:154 | `() => { if (onEditFullPage) { onEditFullPage(); onClose(); } else { setEditing(true); ` | works |
| "Close" | profile/GuardCoiDetailModal.tsx:170 | `onClose` | works |
| "Certificate of Insurance" | profile/GuardCoiDetailModal.tsx:244 | `setDocumentUrl` | works |
| {saving ? 'Saving…' : staffMode ? 'Save credential' : 'Submit for review'} | profile/GuardCoiDetailModal.tsx:253 | `handleSave` | works (can be disabled) |
| Cancel | profile/GuardCoiDetailModal.tsx:261 | `handleCancelEdit` | works (can be disabled) |
| Verify insurance | profile/GuardCoiDetailModal.tsx:328 | `() => { if (saving) return; setSaving(true); void onReview('verified') .catch((err) => sho` | works (can be disabled) |
| Reject | profile/GuardCoiDetailModal.tsx:350 | `() => { if (saving) return; setSaving(true); void onReview('rejected', rejectionReason.tri` | works (can be disabled) |
| Edit | profile/GuardIdDetailModal.tsx:213 | `() => { onEditFullPage(); onClose(); }` | works |
| Edit | profile/GuardIdDetailModal.tsx:225 | `() => setEditing(true)` | works |
| "Close" | profile/GuardIdDetailModal.tsx:235 | `onClose` | works |
| "Government ID document type" Government ID Driver&apos;s license | profile/GuardIdDetailModal.tsx:261 | `(e) => setIdDocumentType(e.target.value as GovernmentIdDocumentType)` | works |
| "Driver license class" Select class | profile/GuardIdDetailModal.tsx:273 | `(e) => setIdLicenseClass(e.target.value)` | works |
| "ID issuing state" | profile/GuardIdDetailModal.tsx:290 | `(e) => setIdState(e.target.value)` | works |
| slotLabels.front | profile/GuardIdDetailModal.tsx:326 | `setFrontUrl` | works |
| slotLabels.back | profile/GuardIdDetailModal.tsx:333 | `setBackUrl` | works |
| slotLabels.selfie | profile/GuardIdDetailModal.tsx:340 | `setSelfieUrl` | works |
| {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {saving ? 'Saving…' : staff | profile/GuardIdDetailModal.tsx:355 | `() => void handleSave()` | works (can be disabled) |
| Cancel | profile/GuardIdDetailModal.tsx:364 | `handleCancelEdit` | works (can be disabled) |
| Add customer | staff/StaffAddClientForm.tsx:102 | `() => setOpen(true)` | works |
| Who is hiring? Personal is billed to the individual. Business and security companies bill  | staff/StaffAddClientForm.tsx:118 | `handleSubmit` | works |
| {clientTypeLabel(kind)} | staff/StaffAddClientForm.tsx:137 | `() => setClientType(kind)` | works |
| Cancel | staff/StaffAddClientForm.tsx:198 | `closeForm` | works |
| Add guard | staff/StaffAddGuardForm.tsx:96 | `() => setOpen(true)` | works |
| Email Phone {GUARD_ICN_LABEL} Hourly rate ($) {error && <p className="text-sm text-red-400 | staff/StaffAddGuardForm.tsx:112 | `handleSubmit` | works |
| Cancel | staff/StaffAddGuardForm.tsx:174 | `closeForm` | works |
| _(icon/unnamed)_ | staff/StaffApplicationCredentialViewModal.tsx:36 | `async () => ({ ok: true })` | works |
| {kind === 'guard' ? 'Guard' : kind === 'staff' ? 'Staff' : 'Customer'} {item.title} {item. | staff/StaffApplications.tsx:148 | `onSelect` | works |
| _(icon/unnamed)_ | staff/StaffApplications.tsx:719 | `onSelect` | works |
| {client.website} | staff/StaffBusinessClientApplication.tsx:29 | `client.website.startsWith('http') ? client.website : `https://${client.website}`` | works |
| View full client profile | staff/StaffClientApplicationReviewPanel.tsx:122 | `() => onOpenClientProfile(client.id)` | works |
| Approve application | staff/StaffClientApplicationReviewPanel.tsx:138 | `() => void handleApproveClient()` | works (can be disabled) |
| Deny application | staff/StaffClientApplicationReviewPanel.tsx:154 | `() => void handleDenyClient()` | works (can be disabled) |
| Request revision | staff/StaffClientApplicationReviewPanel.tsx:165 | `() => void handleRequestRevision()` | works (can be disabled) |
| Revoke application | staff/StaffClientApplicationReviewPanel.tsx:176 | `() => void handleRevokeClient()` | works (can be disabled) |
| View full guard profile → | staff/StaffCredentialReviewDetail.tsx:108 | `onOpenGuardProfile` | works |
| `View full screen ${primaryPhoto.label}` View full screen | staff/StaffCredentialReviewDetail.tsx:128 | `() => openLightbox(primaryPhoto.url, primaryPhoto.alt)` | works |
| `View full screen ${photo.label}` {photo.label} | staff/StaffCredentialReviewDetail.tsx:144 | `() => openLightbox(photo.url, photo.alt)` | works |
| `View full screen document from ${item.label}` | staff/StaffCredentialReviewDetail.tsx:170 | `() => openHistoryItem(item)` | works |
| {item.label} | staff/StaffCredentialReviewDetail.tsx:182 | `() => openHistoryItem(item)` | works |
| {content} | staff/StaffGuardActivationChecklistView.tsx:67 | `onView` | works |
| View full guard profile | staff/StaffGuardApplicationReviewPanel.tsx:117 | `() => onOpenGuardProfile(guard.id)` | works |
|  activationChecklist.staffApprovalBlockers.length > 0 ? activationChecklist.staffApprovalB | staff/StaffGuardApplicationReviewPanel.tsx:133 | `() => void handleApproveProfile()` | works (can be disabled) |
| Deny application | staff/StaffGuardApplicationReviewPanel.tsx:154 | `() => void handleDenyApplication()` | works (can be disabled) |
| Request revision | staff/StaffGuardApplicationReviewPanel.tsx:165 | `() => void handleRequestRevision()` | works (can be disabled) |
| Ignore hold | staff/StaffOneRoleHolds.tsx:82 | `() => onIgnore(item.id)` | BROKEN — AUD-008: clear is saved but sign-in re-detects the same device/email conflict and opens a new hold |
| Block both accounts | staff/StaffOneRoleHolds.tsx:85 | `() => onBlock(item.id)` | works |
| {client.website} | staff/StaffSecurityCompanyApplication.tsx:19 | `client.website.startsWith('http') ? client.website : `https://${client.website}`` | works |

### /staff/credentials

**Missing controls this page needs:**
- MISSING — Staff "Upload on behalf" / "Waive" for a customer credential that is Pending upload (AUD-009 staff side)
- MISSING — Automated BSIS guard-card lookup — staff verify by eye; the only BSIS link is a static resource link

Components: `staff/StaffCredentials.tsx`, `staff/StaffCertReviewDetail.tsx`, `staff/StaffCoiReviewDetail.tsx`, `staff/StaffGovIdReviewDetail.tsx`, `staff/StaffClientCredentialReviewDetail.tsx`, `staff/StaffCredentialReviewDetail.tsx`, `staff/StaffActivationReviewDetail.tsx`, `staff/StaffIdReviewSection.tsx`, `staff/StaffListFilterTabs.tsx`, `staff/StaffOpsPageShell.tsx`, `staff/StaffCredentialAddForGuardForm.tsx`, `guard/CredentialStatusBadge.tsx`, `profile/GuardIdentityVerificationPanel.tsx`, `staff/StaffShellCreateContext.tsx`, `staff/StaffGuardCredentialAddWizard.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| _(icon/unnamed)_ | profile/GuardIdentityVerificationPanel.tsx:62 | `onSubmit` | works |
| {feedTitle ?? `${clientDisplayName(client)} — ${type.name}`} | staff/StaffClientCredentialReviewDetail.tsx:46 | `onOpenClientProfile` | works |
| Verify | staff/StaffClientCredentialReviewDetail.tsx:84 | `() => void onApprove?.()` | works |
| Reject | staff/StaffClientCredentialReviewDetail.tsx:92 | `() => void onReject?.()` | works |
| Request resubmit | staff/StaffClientCredentialReviewDetail.tsx:104 | `() => void onReject?.()` | works |
| Change | staff/StaffCredentialAddForGuardForm.tsx:48 | `onChange` | works |
| Add credential | staff/StaffCredentialAddForGuardForm.tsx:148 | `openFlow` | works |
| {section.title} | staff/StaffCredentialAddForGuardForm.tsx:162 | `() => selectCredential(section.id)` | works |
| {guard.name} {guard.badgeNumber} · {guard.email} | staff/StaffCredentialAddForGuardForm.tsx:198 | `() => selectGuard(guard.id)` | works |
| {item.title} {item.statusLabel} {item.subtitle && <p className="uber-feed-row-subtitle mt- | staff/StaffCredentials.tsx:134 | `onSelect` | works |
| Reject update | staff/StaffCredentials.tsx:307 | `() => onRejectCert(guard.id, cert.id)` | works |
| staffVerifyCertificationBlocker(cert, guard) ?? 'Verify updated credential' Verify update | staff/StaffCredentials.tsx:315 | `() => { void (async () => { try { await onApproveCert(guard.id, cert.id); } catch (err) { ` | works (can be disabled) |
| Request clearer photo | staff/StaffCredentials.tsx:350 | `() => requestCertResubmit(guard, cert)` | works |
| Reject | staff/StaffCredentials.tsx:359 | `() => onRejectCert(guard.id, cert.id)` | works |
| staffVerifyCertificationBlocker(cert, guard) ?? 'Verify credential' Verify | staff/StaffCredentials.tsx:367 | `() => { void (async () => { try { await onApproveCert(guard.id, cert.id); } catch (err) { ` | works (can be disabled) |
| Request update | staff/StaffCredentials.tsx:399 | `() => requestCertUpdate(guard, cert)` | works |
| Verify insurance | staff/StaffCredentials.tsx:423 | `() => void onReviewGuardInsurance(guard.id, 'verified')` | works |
| Reject | staff/StaffCredentials.tsx:430 | `() => void onReviewGuardInsurance(guard.id, 'rejected', 'Document incomplete or expired')` | works |
| Request update | staff/StaffCredentials.tsx:474 | `() => { void (async () => { const note = await promptStaffCredentialUpdateNote('Certificat` | works |
| Request update | staff/StaffCredentials.tsx:502 | `() => { void (async () => { const note = await promptStaffCredentialUpdateNote('Government` | works |
| _(icon/unnamed)_ | staff/StaffCredentials.tsx:841 | `onSelect` | works |
| Change | staff/StaffGuardCredentialAddWizard.tsx:46 | `onChangeGuard` | works |
| _(icon/unnamed)_ | staff/StaffGuardCredentialAddWizard.tsx:76 | `onBack` | works |
| {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {submitting ? 'Adding…' | staff/StaffGuardCredentialAddWizard.tsx:81 | `onSubmit` | works (can be disabled) |
| {nextLabel} | staff/StaffGuardCredentialAddWizard.tsx:91 | `onNext` | works (can be disabled) |
| {section.title} | staff/StaffGuardCredentialAddWizard.tsx:337 | `() => selectSection(section.id)` | works |
| _(icon/unnamed)_ | staff/StaffGuardCredentialAddWizard.tsx:360 | `(e) => setSelectedCatalogId(e.target.value)` | works |
| _(icon/unnamed)_ | staff/StaffGuardCredentialAddWizard.tsx:389 | `(e) => setState(e.target.value)` | works |
| _(icon/unnamed)_ | staff/StaffGuardCredentialAddWizard.tsx:524 | `() => void handleAdd()` | works |
| "Government ID document type" Select type… Government ID Driver’s license | staff/StaffIdReviewSection.tsx:175 | `(e) => { const next = e.target.value as GovernmentIdDocumentType \| ''; setIdDocumentType(` | works |
| "Driver license class" Select class… | staff/StaffIdReviewSection.tsx:193 | `(e) => setIdLicenseClass(e.target.value)` | works |
| {savingType ? 'Saving…' : 'Save document type'} | staff/StaffIdReviewSection.tsx:208 | `() => void saveDocumentType()` | works (can be disabled) |
| {approveActionLabel} | staff/StaffIdReviewSection.tsx:226 | `() => { if (actionPending) return; setActionPending(true); void (async () => { try { await` | works (can be disabled) |
| {approveActionLabel} | staff/StaffIdReviewSection.tsx:253 | `() => void onApprove(guard.id)` | works |
| Resubmit ID front | staff/StaffIdReviewSection.tsx:264 | `() => requestSlot('front')` | works |
| Resubmit ID back | staff/StaffIdReviewSection.tsx:267 | `() => requestSlot('back')` | works |
| Resubmit selfie | staff/StaffIdReviewSection.tsx:270 | `() => requestSlot('selfie')` | works |
| Resubmit all ID photos | staff/StaffIdReviewSection.tsx:273 | `requestAll` | works |

### /staff/jobs

**Missing controls this page needs:**
- MISSING — Mark job expired / close stale Open jobs — no control and no automatic expiry (AUD-019)
- MISSING — Assign or reassign a guard to an existing job — only possible when staff create a new job

Components: `staff/StaffJobsPanel.tsx`, `staff/StaffJobDetailPanel.tsx`, `staff/StaffJobActionsBar.tsx`, `staff/StaffCreateJobForm.tsx`, `staff/StaffListFilterTabs.tsx`, `staff/StaffOpsPageShell.tsx`, `guard/GuardMatchScoreRow.tsx`, `staff/StaffDetailProfileHeader.tsx`, `guard/GuardArmedStatusPill.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Create job | staff/StaffCreateJobForm.tsx:250 | `() => setOpen(true)` | works |
| Customer Select client… Service type Site name Address City Guards needed Start End Schedu | staff/StaffCreateJobForm.tsx:265 | `handleSubmit` | works |
| Select client… | staff/StaffCreateJobForm.tsx:269 | `(e) => { setClientId(e.target.value); setAssignGuardId(''); }` | works |
| _(icon/unnamed)_ | staff/StaffCreateJobForm.tsx:289 | `(e) => { const id = e.target.value as ClientServiceId; setServiceId(id); }` | works |
| _(icon/unnamed)_ | staff/StaffCreateJobForm.tsx:352 | `(e) => setJobState(resolveJobCity(e.target.value))` | works |
| {minutes === 0 ? 'None' : `${minutes}m`} | staff/StaffCreateJobForm.tsx:411 | `() => { setBreakMinutes(minutes); setCustomBreakMinutes(''); }` | works |
| _(icon/unnamed)_ | staff/StaffCreateJobForm.tsx:457 | `(e) => setAssignGuardId(e.target.value)` | works (can be disabled) |
| Cancel | staff/StaffCreateJobForm.tsx:517 | `closeForm` | works |
| {scheduleLocked ? 'Edit title & location' : 'Edit job listing'} | staff/StaffJobActionsBar.tsx:29 | `onStartEdit` | works |
| Back to Jobs | staff/StaffJobDetailPanel.tsx:107 | `onBack` | works |
| Decline | staff/StaffJobDetailPanel.tsx:171 | `() => void onRejectScheduleChange(req.id)` | works |
|  scheduleChangeBilling ? 'Slide to confirm billing & publish' : 'Slide to approve new time | staff/StaffJobDetailPanel.tsx:180 | `() => scheduleChangeBilling ? onApproveScheduleChangeBilling?.(req.id) : onApproveSchedule` | works |
| coordsMissing ? 'Add map coordinates before approving' : undefined Approve Job | staff/StaffJobDetailPanel.tsx:258 | `() => onApproveRequest(req.id)` | works (can be disabled) |
| Cancel | staff/StaffJobDetailPanel.tsx:269 | `() => onDenyRequest(req.id)` | works |
| req.title | staff/StaffJobsPanel.tsx:319 | `onSelect` | works |

### /staff/map
Components: `staff/StaffOpsMapScreen.tsx`, `guard/ShiftMap.tsx`, `staff/StaffJobDetailPanel.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| "Center map on my location" | guard/ShiftMap.tsx:402 | `() => recenterRef.current?.()` | works |

### /staff/guards

**Missing controls this page needs:**
- MISSING — Full cascade delete (credentials, messages, payouts, applications) — AUD-011
- MISSING — Run a background check — only a manual "Mark background checked" toggle

Components: `staff/StaffGuardsPanel.tsx`, `staff/StaffGuardDetailPanel.tsx`, `staff/StaffGuardAccountControls.tsx`, `staff/StaffAddGuardForm.tsx`, `staff/GuardRosterStatusBadges.tsx`, `staff/StaffAddClientForm.tsx`, `staff/StaffOpsPageShell.tsx`, `staff/StaffListFilterTabs.tsx`, `guard/CertBadgeRow.tsx`, `profile/GuardCredentialsPanel.tsx`, `profile/GuardInventoryPanel.tsx`, `staff/StaffGuardPerformancePanel.tsx`, `profile/GuardResumeEditor.tsx`, `guard/GuardArmedStatusPill.tsx`, `staff/StaffIdReviewSection.tsx`, `staff/StaffVehicleReviewSection.tsx`, `guard/GuardTimesheetPanel.tsx`, `staff/StaffAccountAccessSection.tsx`, `guard/GuardPtaUofPanel.tsx`, `guard/GuardThirtyTwoHourPanel.tsx`, `profile/GuardCardPanel.tsx`, `profile/GuardCoiItemCard.tsx`, `profile/GuardVehicleInsuranceItemCard.tsx`, `profile/GuardIdItemCard.tsx`, `profile/GuardIdentityVerificationPanel.tsx`, `guard/GuardOptionalCredentialAddSheet.tsx`, `profile/inventory/GuardInventoryEquipmentCard.tsx`, `profile/inventory/GuardInventoryEquipmentForm.tsx`, `profile/inventory/GuardInventoryUniformCard.tsx`, `profile/inventory/GuardInventoryUniformForm.tsx`, `guard/GuardRatingSection.tsx`, `guard/GuardPerformanceFactorDetail.tsx`, `profile/GuardGearCarryPanel.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| {section.title} | guard/GuardOptionalCredentialAddSheet.tsx:161 | `() => openSection(section.id)` | works |
| {formError && <p className="text-xs text-red-400">{formError}</p>} Back {saving ? 'Uploadi | guard/GuardOptionalCredentialAddSheet.tsx:178 | `submitCert` | works |
| _(icon/unnamed)_ | guard/GuardOptionalCredentialAddSheet.tsx:180 | `(e) => setSelectedCatalogId(e.target.value)` | works |
| _(icon/unnamed)_ | guard/GuardOptionalCredentialAddSheet.tsx:203 | `(e) => setState(e.target.value)` | works |
| Back | guard/GuardOptionalCredentialAddSheet.tsx:251 | `backToSections` | works |
| {row.label} {row.count} | guard/GuardPerformanceFactorDetail.tsx:199 | `() => undefined` | STUB — no-op handler |
| {item.title} {item.subtitle} {item.outcomeLabel} | guard/GuardPerformanceFactorDetail.tsx:249 | `() => onOpenHistoryItem?.(item.id)` | works (can be disabled) |
| {alternateLabel ?? 'Upload alternate part 2'} | guard/GuardPtaUofPanel.tsx:312 | `() => startAdd(alternateCatalogId)` | works |
| _(icon/unnamed)_ | guard/GuardPtaUofPanel.tsx:348 | `(path) => { if (!hasAnyCerts) setUploadPath(path); }` | works |
| _(icon/unnamed)_ | guard/GuardPtaUofPanel.tsx:363 | `() => startAdd(BSIS_PTA_UOF_COMBINED_ID)` | works |
| {formError && <p className="text-xs text-red-500">{formError}</p>} Back {saving ? 'Uploadi | guard/GuardPtaUofPanel.tsx:384 | `submitCert` | works |
| Back | guard/GuardPtaUofPanel.tsx:408 | `() => { setAddingCatalogId(null); setShowAddPicker(true); setIssuer(''); setNumber(''); se` | works |
| _(icon/unnamed)_ | guard/GuardPtaUofPanel.tsx:445 | `(payload) => onUpdateCertification(editingCert.id, payload)` | works |
| _(icon/unnamed)_ | guard/GuardPtaUofPanel.tsx:510 | `(payload) => onUpdateCertification(editingCert.id, payload)` | works |
| {content} | guard/GuardRatingSection.tsx:179 | `() => onSelect?.(factor)` | works |
| {summary} | guard/GuardRatingSection.tsx:205 | `onOpen` | works |
| _(icon/unnamed)_ | guard/GuardRatingSection.tsx:335 | `onFactorSelect` | works |
| View my rewards | guard/GuardRatingSection.tsx:368 | `onViewRewards` | works |
| _(icon/unnamed)_ | guard/GuardRatingSection.tsx:388 | `onFactorSelect` | works |
| {formError && <p className="text-xs text-red-500">{formError}</p>} Back {saving ? 'Saving… | guard/GuardThirtyTwoHourPanel.tsx:257 | `submitCert` | works |
| Back | guard/GuardThirtyTwoHourPanel.tsx:281 | `() => { setAddingCatalogId(null); setShowAddPicker(true); setIssuer(''); setNumber(''); se` | works |
| {entry.name} | guard/GuardThirtyTwoHourPanel.tsx:310 | `() => startAdd(entry.id)` | works |
| _(icon/unnamed)_ | guard/GuardThirtyTwoHourPanel.tsx:358 | `(payload) => onUpdateCertification(editingCert.id, payload)` | works |
| _(icon/unnamed)_ | guard/GuardThirtyTwoHourPanel.tsx:423 | `(payload) => onUpdateCertification(editingCert.id, payload)` | works |
| {formError && <p className="text-xs text-red-400">{formError}</p>} Add | profile/GuardCardPanel.tsx:174 | `submitGuardCard` | works |
| _(icon/unnamed)_ | profile/GuardCardPanel.tsx:175 | `(e) => setState(e.target.value)` | works |
| _(icon/unnamed)_ | profile/GuardCardPanel.tsx:228 | `(payload) => onUpdateCertification(editingCert.id, payload)` | works |
| {title} {subtitle} Tap to view details | profile/GuardCoiItemCard.tsx:78 | `openDetail` | works |
| {formError && <p className="text-xs text-red-400">{formError}</p>} Add | profile/GuardCredentialsPanel.tsx:265 | `submitCert` | works |
| _(icon/unnamed)_ | profile/GuardCredentialsPanel.tsx:267 | `(e) => setSelectedCatalogId(e.target.value)` | works |
| _(icon/unnamed)_ | profile/GuardCredentialsPanel.tsx:290 | `(e) => setState(e.target.value)` | works |
| Add credential | profile/GuardCredentialsPanel.tsx:377 | `() => setOptionalAddOpen(true)` | works |
| _(icon/unnamed)_ | profile/GuardCredentialsPanel.tsx:412 | `onSubmitIdentityVerification` | works |
| {rule.label} {rule.description} {isOn ? <Check className="w-5 h-5 text-brand-primary shrin | profile/GuardGearCarryPanel.tsx:196 | `() => toggleEquipment(rule.id)` | works |
| _(icon/unnamed)_ | profile/GuardIdItemCard.tsx:63 | `onSubmit ?? (async () => ({ ok: true }))` | works |
| {formatIdSummaryLine(guard)} Tap to view details | profile/GuardIdItemCard.tsx:79 | `openDetail` | works |
| Government ID | profile/GuardIdItemCard.tsx:166 | `openDetail` | works |
| Add equipment | profile/GuardInventoryPanel.tsx:135 | `() => { setEditingEquipment(null); setEquipmentFormOpen(true); }` | works |
| Add uniform | profile/GuardInventoryPanel.tsx:187 | `() => { setEditingUniform(null); setUniformFormOpen(true); }` | works |
| {opt} | profile/GuardResumeEditor.tsx:243 | `() => toggleSpecialty(opt)` | works (can be disabled) |
| {city} | profile/GuardResumeEditor.tsx:265 | `() => toggleServiceArea(city)` | works (can be disabled) |
| Add experience | profile/GuardResumeEditor.tsx:353 | `submitExperience` | works |
| Add education | profile/GuardResumeEditor.tsx:367 | `submitEducation` | works |
| Add | profile/GuardResumeEditor.tsx:455 | `onAdd` | works |
| {hasOnFile ? (expired ? 'Renew' : 'Update') : 'Add'} | profile/GuardVehicleInsuranceItemCard.tsx:63 | `() => setShowUpload(true)` | works |
| "Edit equipment" | profile/inventory/GuardInventoryEquipmentCard.tsx:35 | `onEdit` | works |
| "Remove equipment" | profile/inventory/GuardInventoryEquipmentCard.tsx:38 | `onDelete` | works |
| Equipment type Brand Model Condition Quantity Notes Additional photos Add photo {initial ? | profile/inventory/GuardInventoryEquipmentForm.tsx:93 | `handleSubmit` | works |
| _(icon/unnamed)_ | profile/inventory/GuardInventoryEquipmentForm.tsx:96 | `(event) => setForm((current) => ({ ...current, typeId: event.target.value as GuardInventor` | works |
| _(icon/unnamed)_ | profile/inventory/GuardInventoryEquipmentForm.tsx:150 | `(event) => setForm((current) => ({ ...current, condition: event.target.value as GuardInven` | works |
| Add photo | profile/inventory/GuardInventoryEquipmentForm.tsx:205 | `() => setForm((current) => ({ ...current, additionalImageUrls: [...current.additionalImage` | works |
| Remove photo | profile/inventory/GuardInventoryEquipmentForm.tsx:234 | `() => setForm((current) => ({ ...current, additionalImageUrls: current.additionalImageUrls` | works |
| Cancel | profile/inventory/GuardInventoryEquipmentForm.tsx:255 | `onClose` | works |
| "Edit uniform" | profile/inventory/GuardInventoryUniformCard.tsx:31 | `onEdit` | works |
| "Remove uniform" | profile/inventory/GuardInventoryUniformCard.tsx:34 | `onDelete` | works |
| Uniform type Outfit description {initial ? 'Save uniform' : 'Add uniform'} Cancel | profile/inventory/GuardInventoryUniformForm.tsx:72 | `handleSubmit` | works |
| _(icon/unnamed)_ | profile/inventory/GuardInventoryUniformForm.tsx:75 | `(event) => { const typeId = event.target.value as GuardInventoryUniformTypeId; const meta ` | works |
| Cancel | profile/inventory/GuardInventoryUniformForm.tsx:136 | `onClose` | works |
| Deny application | staff/StaffGuardAccountControls.tsx:125 | `() => void runDenyApplication()` | works (can be disabled) |
| "Activate marketplace access — all five credentials are verified" Activate account | staff/StaffGuardAccountControls.tsx:136 | `() => void runActivateAccount()` | works (can be disabled) |
| "Temporarily deactivate marketplace access — guard can be restored later" Deactivate | staff/StaffGuardAccountControls.tsx:148 | `() => void runStatusUpdate('suspended')` | works (can be disabled) |
| "Block platform access until staff restores the account" Block | staff/StaffGuardAccountControls.tsx:160 | `() => void runStatusUpdate('blocked')` | works (can be disabled) |
| Restore access | staff/StaffGuardAccountControls.tsx:172 | `() => void runStatusUpdate('active')` | works (can be disabled) |
| {editing ? (saving ? 'Saving…' : 'Save changes') : editLabel} | staff/StaffGuardDetailPanel.tsx:332 | `() => (editing ? void handleSave() : setEditing(true))` | works (can be disabled) |
| Cancel | staff/StaffGuardDetailPanel.tsx:342 | `handleCancelEdit` | works |
|  onOpenGuardApplication ? 'Open this application in Applications to review and approve' :  | staff/StaffGuardDetailPanel.tsx:368 | `() => { if (onOpenGuardApplication) { onOpenGuardApplication(guard.id); return; } void han` | works (can be disabled) |
| {deleting ? 'Deleting…' : 'Delete account'} | staff/StaffGuardDetailPanel.tsx:392 | `() => void handleDeleteGuard()` | PARTIAL — AUD-011: delete does not cascade to credentials/messages/payouts; same-rank staff blocked (can be disabled) |
| Clear violations ( {guard.failedAudits} /3) | staff/StaffGuardDetailPanel.tsx:403 | `() => void handleResetAuditFailures()` | works |
| {guard.backgroundChecked ? 'Clear background check' : 'Mark background checked'} | staff/StaffGuardDetailPanel.tsx:413 | `() => void handleBackgroundCheckToggle()` | MANUAL — "Mark background checked" toggle only; no Checkr/Live Scan integration |
|  guard.trusted ? 'Remove trusted status — guard will require Guardr applicant review' : 'M | staff/StaffGuardDetailPanel.tsx:423 | `() => void handleToggleTrusted()` | works |
| Review credential | staff/StaffGuardDetailPanel.tsx:535 | `() => onOpenGuardCredential(guard.id, cert.id)` | works |
| Request clearer photo | staff/StaffGuardDetailPanel.tsx:550 | `() => requestCertResubmit(cert)` | works |
| Reject | staff/StaffGuardDetailPanel.tsx:558 | `() => onRejectCert(guard.id, cert.id)` | works |
| staffVerifyCertificationBlocker(cert, guard) ?? 'Verify credential' Verify | staff/StaffGuardDetailPanel.tsx:566 | `() => { void (async () => { try { await onApproveCert(guard.id, cert.id); } catch (err) { ` | works (can be disabled) |
| Back to Guards | staff/StaffGuardDetailPanel.tsx:598 | `onBack` | works |
| _(icon/unnamed)_ | staff/StaffGuardDetailPanel.tsx:826 | `onOpenJob ? () => onOpenJob(job.id) : undefined` | works |
| guard.name | staff/StaffGuardsPanel.tsx:448 | `onSelect` | works |
| Approve vehicle | staff/StaffVehicleReviewSection.tsx:44 | `() => { setActionPending(true); void Promise.resolve(onApprove?.(guard.id)).finally(() => ` | works (can be disabled) |
| Reject | staff/StaffVehicleReviewSection.tsx:56 | `() => { void (async () => { const reason = await promptRejectGuardApplicationNote(); if (r` | works (can be disabled) |

### /staff/team

**Missing controls this page needs:**
- MISSING — Set Director role from the role picker for all operators (AUD-012)

Components: `staff/StaffTeamPanel.tsx`, `staff/StaffTeamDetailPanel.tsx`, `staff/StaffAddStaffForm.tsx`, `staff/StaffAccountAccessSection.tsx`, `staff/StaffOperationsAccessPicker.tsx`, `staff/StaffListFilterTabs.tsx`, `staff/StaffOpsPageShell.tsx`, `profile/StaffProfileSection.tsx`, `staff/StaffStaffApplicationSummary.tsx`, `staff/StaffTimesheetsPanel.tsx`, `staff/StaffDetailProfileHeader.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| {area} | profile/StaffProfileSection.tsx:106 | `() => toggleFocus(area)` | works |
| Add staff | staff/StaffAddStaffForm.tsx:207 | `() => setOpen(true)` | works |
| Staff ID Use next Work email Personal email Optional contact email. Work email is used to  | staff/StaffAddStaffForm.tsx:227 | `handleSubmit` | works |
| Use next | staff/StaffAddStaffForm.tsx:249 | `applySuggestedBadge` | works |
| _(icon/unnamed)_ | staff/StaffAddStaffForm.tsx:328 | `(e) => { const nextRole = e.target.value as StaffRole; setRole(nextRole); if (nextRole ===` | PARTIAL — AUD-012: role picker lacks Director for some operators |
| _(icon/unnamed)_ | staff/StaffAddStaffForm.tsx:371 | `(e) => setAssignedManagerIds( Array.from(e.target.selectedOptions).map((option) => option.` | works |
| Cancel | staff/StaffAddStaffForm.tsx:397 | `closeForm` | works |
| Clear all | staff/StaffOperationsAccessPicker.tsx:61 | `() => onChange([])` | works |
| Back to Team | staff/StaffTeamDetailPanel.tsx:358 | `onBack` | works |
| Personal · {member.personalEmail} | staff/StaffTeamDetailPanel.tsx:387 | ``mailto:${member.personalEmail}`` | works |
| {member.phone} | staff/StaffTeamDetailPanel.tsx:396 | ``tel:${member.phone}`` | works |
| Edit details | staff/StaffTeamDetailPanel.tsx:419 | `() => setEditingProfile(true)` | works |
| {profileSaving ? 'Saving…' : 'Save changes'} | staff/StaffTeamDetailPanel.tsx:445 | `() => void handleProfileSave()` | works (can be disabled) |
| Approve application | staff/StaffTeamDetailPanel.tsx:456 | `() => void handleApproveApplication()` | works (can be disabled) |
| Restore account | staff/StaffTeamDetailPanel.tsx:467 | `() => void handleUpdateUserStatus('active')` | works |
| Cancel | staff/StaffTeamDetailPanel.tsx:480 | `() => { setEditingProfile(false); setProfileError(''); setPhone(member.phone ?? ''); setPe` | works (can be disabled) |
| Deny application | staff/StaffTeamDetailPanel.tsx:501 | `() => void handleRejectApplication()` | works (can be disabled) |
| Deactivate | staff/StaffTeamDetailPanel.tsx:513 | `() => void handleUpdateUserStatus('suspended')` | works |
| Block | staff/StaffTeamDetailPanel.tsx:523 | `() => void handleUpdateUserStatus('blocked')` | works |
| _(icon/unnamed)_ | staff/StaffTeamDetailPanel.tsx:616 | `(e) => setRole(e.target.value as StaffRole \| '')` | works |
| {savingRole ? 'Saving…' : 'Save role'} | staff/StaffTeamDetailPanel.tsx:647 | `handleRoleSave` | works (can be disabled) |
| _(icon/unnamed)_ | staff/StaffTeamDetailPanel.tsx:696 | `(e) => setAssignedManagerIds( Array.from(e.target.selectedOptions).map((option) => option.` | works |
| {savingCities ? 'Saving…' : 'Save Service Areas access'} | staff/StaffTeamDetailPanel.tsx:714 | `() => void handleCityAccessSave()` | works (can be disabled) |
| displayName | staff/StaffTeamPanel.tsx:340 | `onSelect` | works |

### /staff/management
Components: `staff/StaffMgmtSection.tsx`

_No clickable controls found in these files (content/display only, or controls come from shared components)._

### /staff/clients
Components: `staff/StaffClientsPanel.tsx`, `staff/StaffClientDetailPanel.tsx`, `staff/StaffAddClientForm.tsx`, `staff/StaffListFilterTabs.tsx`, `staff/StaffOpsPageShell.tsx`, `staff/StaffClientApplicationSummary.tsx`, `staff/StaffDetailProfileHeader.tsx`, `staff/StaffAccountAccessSection.tsx`, `staff/StaffPersonalClientApplication.tsx`, `staff/StaffBusinessClientApplication.tsx`, `staff/StaffSecurityCompanyApplication.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Back to Clients | staff/StaffClientDetailPanel.tsx:118 | `onBack` | works |
| Approve customer | staff/StaffClientDetailPanel.tsx:168 | `() => void handleApproveClient()` | works |
| Restore customer | staff/StaffClientDetailPanel.tsx:172 | `() => void handleRestoreClient()` | works |
| Suspend customer | staff/StaffClientDetailPanel.tsx:179 | `() => void handleSuspendClient()` | works |
|  client.trusted ? 'Remove trusted status — customer jobs will require staff approval' : 'M | staff/StaffClientDetailPanel.tsx:184 | `() => void handleToggleTrusted()` | works |
| {deleting ? 'Deleting…' : 'Delete account'} | staff/StaffClientDetailPanel.tsx:199 | `() => void handleDelete()` | PARTIAL — AUD-011: delete does not cascade to credentials/messages/payouts; same-rank staff blocked (can be disabled) |
| _(icon/unnamed)_ | staff/StaffClientDetailPanel.tsx:230 | `onOpenJob ? () => onOpenJob(job.id) : undefined` | works |
| clientDisplayName(client) | staff/StaffClientsPanel.tsx:289 | `onSelect` | works |

### /staff/incidents

**Missing controls this page needs:**
- MISSING — Incident status (open → investigating → closed), assign-to-staff, or escalate — page is list + "Open job" only

Components: `staff/StaffIncidentsPanel.tsx`, `reports/IncidentReportDetailView.tsx`, `staff/StaffOpsPageShell.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Open job | staff/StaffIncidentsPanel.tsx:120 | `() => onOpenJob(inc.requestId)` | works |
| Open job | staff/StaffIncidentsPanel.tsx:163 | `() => onOpenJob(selectedIncident.requestId)` | works |
| {inc.location} {inc.severity} {inc.guardName} · {' '} | staff/StaffIncidentsPanel.tsx:198 | `onSelect` | works (can be disabled) |

### /staff/messages/support

**Missing controls this page needs:**
- MISSING — Staff "New ticket on behalf of user" — onCreateSupportTicket is never passed to StaffDashboard

Components: `staff/StaffMessagesPanel.tsx`, `staff/StaffSupportPanel.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| row.title | staff/StaffMessagesPanel.tsx:306 | `() => selectRow(row)` | works |
| "Delete resolved conversation" "Delete resolved conversation" | staff/StaffSupportPanel.tsx:140 | `() => void onDeleteSupportTicket?.(ticket.id)` | works |
| _(icon/unnamed)_ | staff/StaffSupportPanel.tsx:150 | `(e) => void onUpdateStatus(ticket.id, e.target.value as SupportTicketStatus)` | works |
| ticket.subject | staff/StaffSupportPanel.tsx:253 | `() => setSelectedId(ticket.id)` | works |

### /staff/payments

**Missing controls this page needs:**
- MISSING — "Mark as paid" / "Waive" for an unpaid client bill (AUD-017; cash handlers in App.tsx are toast-only and never wired)
- MISSING — Partial refund — only full refund exists
- MISSING — Chargeback / dispute inbox — webhook ignores charge.dispute.created and charge.refunded
- MISSING — Labels on the summary money tiles (staff-payments-tour.png shows bare $0.00 / $33.75 numbers)

Components: `staff/StaffPaymentsPanel.tsx`, `staff/JobPaymentRow.tsx`, `staff/StaffListFilterTabs.tsx`, `staff/StaffOpsPageShell.tsx`, `staff/StaffPaymentSummary.tsx`, `staff/StaffPayoutInvoiceRow.tsx`, `staff/JobPaymentShiftDetails.tsx`, `staff/StaffSummaryCell.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Release overtime $ {overtimeGuardAmount.toFixed(2)} | staff/JobPaymentRow.tsx:155 | `() => run('releaseOvertime', onMakeOvertimeGuardPayoutAvailable)` | WORKS but UNSAFE — /api/stripe/payout/release has no auth and accepts force:true + caller-supplied amount/destination (can be disabled) |
| {guardDepositLabel} | staff/JobPaymentRow.tsx:167 | `() => run('release', onMakeGuardPayoutAvailable)` | WORKS but UNSAFE — /api/stripe/payout/release has no auth and accepts force:true + caller-supplied amount/destination (can be disabled) |
| Refund client | staff/JobPaymentRow.tsx:179 | `() => run('refund', onRefundPayment)` | WORKS but UNSAFE — /api/stripe/payment/refund has no auth; full refunds only (can be disabled) |
| {expanded ? 'Show fewer' : `Show all ${items.length}`} | staff/StaffPaymentsPanel.tsx:130 | `() => setExpanded((prev) => !prev)` | works |
| Export payouts CSV | staff/StaffPaymentsPanel.tsx:287 | `() => downloadPayoutCsv(buildPayoutExportRows(requests, guards, payments))` | works |
| Export payouts CSV | staff/StaffPaymentsPanel.tsx:296 | `() => downloadPayoutCsv(buildPayoutExportRows(requests, guards, payments))` | works |
| {queueItemPrimary(item)} {queueItemSecondary(item, guards)} {queueItemLabel(item)} · {queu | staff/StaffPaymentsPanel.tsx:530 | `onSelect` | works |
|  guard?.stripeConnectAccountId ? 'Send payout via Stripe' : 'Guard has no Stripe account c | staff/StaffPayoutInvoiceRow.tsx:87 | `() => onReleasePayout(line.jobId)` | works (can be disabled) |
| Mark invoice completed | staff/StaffPayoutInvoiceRow.tsx:109 | `() => onCompleteInvoice(invoice.id)` | works |

### /staff/platform-fees
Components: `staff/PlatformFeeScheduleEditor.tsx`, `staff/StaffPlatformFeesPanel.tsx`, `staff/StaffMgmtSection.tsx`, `staff/StaffOpsPageShell.tsx`, `staff/staffFinanceSettingsControls.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Flat rate ($/hr) Percentage of client charge | staff/PlatformFeeScheduleEditor.tsx:85 | `(e) => setModel(e.target.value as PlatformFeeModel)` | works (can be disabled) |
| Personal | staff/StaffPlatformFeesPanel.tsx:79 | `() => setFeeAccountKind('personal')` | works |
| Business | staff/StaffPlatformFeesPanel.tsx:88 | `() => setFeeAccountKind('business')` | works |
| {busy ? busyLabel : label} | staff/staffFinanceSettingsControls.tsx:29 | `onSave` | works (can be disabled) |
| Discard changes | staff/staffFinanceSettingsControls.tsx:33 | `onDiscard` | works |
| {busy ? busyLabel : label} | staff/staffFinanceSettingsControls.tsx:43 | `onSave` | works (can be disabled) |
| Discard changes | staff/staffFinanceSettingsControls.tsx:52 | `onDiscard` | works |

### /staff/staff-compensation
Components: `staff/StaffCompensationPage.tsx`, `staff/StaffCompensationPanel.tsx`, `staff/StaffCompensationSettings.tsx`, `staff/StaffTimeAdjustmentsPanel.tsx`, `staff/StaffOpsPageShell.tsx`, `staff/StaffMgmtSection.tsx`, `staff/staffFinanceSettingsControls.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| {busy ? 'Confirming…' : 'Confirm adjustments'} | staff/StaffCompensationPanel.tsx:488 | `() => void handleConfirmAdjustments(preview)` | works (can be disabled) |
| Enabled Disabled | staff/StaffCompensationSettings.tsx:103 | `(e) => setCompDraft((prev) => ({ ...prev, enabled: e.target.value === 'yes' }))` | works (can be disabled) |
| Weekly Monthly | staff/StaffCompensationSettings.tsx:115 | `(e) => setCompDraft((prev) => ({ ...prev, cadence: e.target.value as StaffCompensationCade` | works (can be disabled) |
| Add time entry | staff/StaffTimeAdjustmentsPanel.tsx:202 | `startCreate` | works (can be disabled) |
| All staff | staff/StaffTimeAdjustmentsPanel.tsx:210 | `(e) => setFilterStaffId(e.target.value)` | works |
| _(icon/unnamed)_ | staff/StaffTimeAdjustmentsPanel.tsx:233 | `(e) => setDraft((prev) => ({ ...prev, staffId: e.target.value }))` | works (can be disabled) |
| {busy ? 'Saving…' : 'Save'} | staff/StaffTimeAdjustmentsPanel.tsx:280 | `() => void saveDraft()` | works (can be disabled) |
| Cancel | staff/StaffTimeAdjustmentsPanel.tsx:283 | `cancelEdit` | works (can be disabled) |
| Edit | staff/StaffTimeAdjustmentsPanel.tsx:329 | `() => startEdit(entry)` | works (can be disabled) |
| Delete | staff/StaffTimeAdjustmentsPanel.tsx:338 | `() => void handleDelete(entry)` | works (can be disabled) |

### /staff/violations
Components: `staff/StaffViolationsPanel.tsx`, `staff/StaffListFilterTabs.tsx`, `staff/StaffOpsPageShell.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Side with guard'} | staff/StaffViolationsPanel.tsx:187 | `() => { setResolvingId(v.id); void Promise.resolve( onResolveAuditViolation!( v.requestId,` | works (can be disabled) |
| {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Uphold customer'} | staff/StaffViolationsPanel.tsx:210 | `() => { setResolvingId(v.id); void Promise.resolve( onResolveAuditViolation!( v.requestId,` | works (can be disabled) |
| Open job | staff/StaffViolationsPanel.tsx:238 | `() => onOpenJob(v.requestId)` | works |
| {v.label} {statusLabel(status)} {v.jobTitle} · {v.guardName} {formatWhen(v.createdAt)} | staff/StaffViolationsPanel.tsx:376 | `onSelect` | works |

### /staff/stats
Components: `staff/StaffStatsPanel.tsx`, `staff/StaffListFilterTabs.tsx`, `staff/StaffOpsPageShell.tsx`, `staff/overview/PerformanceTierProgressBars.tsx`, `staff/overview/OverviewCharts.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| {staffGuardEligibilityKindLabel(rec.kind)} {rec.guardName} {rec.badgeNumber} · {rec.tierNa | staff/StaffStatsPanel.tsx:73 | `() => onOpenGuard?.(rec.guardId)` | works |
| {row.guardName} {row.badgeNumber} {row.tier.name} {row.overallRating > 0 ? row.overallRati | staff/StaffStatsPanel.tsx:187 | `() => onOpenGuard?.(row.guardId)` | works |
| {row.guardName} {row.tier.name} · Rating {row.overallRating > 0 ? row.overallRating : '—'} | staff/StaffStatsPanel.tsx:225 | `() => onOpenGuard?.(row.guardId)` | works |
| Clear selection | staff/StaffStatsPanel.tsx:468 | `() => setSelectedIds(new Set())` | works |
| Open violations inbox | staff/StaffStatsPanel.tsx:496 | `onOpenViolations` | works |

### /staff/disputes

**Missing controls this page needs:**
- MISSING — Real money outcomes for non-overtime disputes — Partial/Cancel payout buttons only send a notification

Components: `staff/StaffDisputesPanel.tsx`, `staff/StaffListFilterTabs.tsx`, `staff/StaffOpsPageShell.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Waive charge'} | staff/StaffDisputesPanel.tsx:325 | `() => void resolveOvertime(d, 'waive')` | works (can be disabled) |
| {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Uphold original'} | staff/StaffDisputesPanel.tsx:333 | `() => void resolveOvertime(d, 'uphold')` | works (can be disabled) |
| {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply adjustment'} | staff/StaffDisputesPanel.tsx:341 | `() => void resolveOvertime(d, 'adjust', adjustedHours)` | works (can be disabled) |
| Approve Payout | staff/StaffDisputesPanel.tsx:355 | `() => resolveTicketDispute(d, 'resolved', 'approve_payout', 'Payout approved.')` | STUB — general dispute actions only send a notification/ticket status; no money moves (App.tsx handleResolveDispute) |
| Hold Funds | staff/StaffDisputesPanel.tsx:362 | `() => resolveTicketDispute(d, 'held', 'hold_funds', 'Funds held pending review.')` | STUB — general dispute actions only send a notification/ticket status; no money moves (App.tsx handleResolveDispute) |
| Partial Payout | staff/StaffDisputesPanel.tsx:369 | `() => resolveTicketDispute(d, 'resolved', 'partial_payout', 'Partial payout issued.')` | STUB — general dispute actions only send a notification/ticket status; no money moves (App.tsx handleResolveDispute) |
| Cancel Payout | staff/StaffDisputesPanel.tsx:376 | `() => resolveTicketDispute(d, 'resolved', 'cancel_payout', 'Job payout cancelled.')` | STUB — general dispute actions only send a notification/ticket status; no money moves (App.tsx handleResolveDispute) |
| {d.jobTitle} {statusLabel(status)} {d.type === 'overtime' ? 'Overtime' : d.type.replace('- | staff/StaffDisputesPanel.tsx:502 | `onSelect` | works |

### /staff/analytics

**Missing controls this page needs:**
- MISSING — Export (CSV) and date-range filters — view-only

Components: `staff/StaffAnalyticsPanel.tsx`, `staff/StaffAnalyticsInsightsPanel.tsx`, `staff/StaffMgmtSection.tsx`, `staff/StaffListFilterTabs.tsx`, `staff/StaffOpsPageShell.tsx`

_No clickable controls found in these files (content/display only, or controls come from shared components)._

### /staff/agreements
Components: `staff/StaffLegalCompliancePanel.tsx`, `staff/StaffListFilterTabs.tsx`, `staff/StaffOpsPageShell.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Back to Agreements | staff/StaffLegalCompliancePanel.tsx:44 | `onBack` | works |
| row.name | staff/StaffLegalCompliancePanel.tsx:229 | `onSelect` | works |
| row.name | staff/StaffLegalCompliancePanel.tsx:265 | `onSelect` | works |

### /staff/audit-log
Components: `staff/StaffAuditLogPanel.tsx`, `staff/StaffOpsPageShell.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Refresh | staff/StaffAuditLogPanel.tsx:80 | `() => void refresh()` | works |
| Refresh | staff/StaffAuditLogPanel.tsx:84 | `() => void refresh()` | works |

### /staff/cities

**Missing controls this page needs:**
- MISSING — Edit city staff cap (minStaffSlotsPerOpenCity / marketplaceUsersPerStaffSlot) — displayed, not editable (AUD-006)


**Known page-level defects:**
- BROKEN — Assigning Sacramento to administrator@ failed at cap 2/2 (AUD-006)

Components: `staff/StaffCitiesPanel.tsx`, `staff/CityManagerPicker.tsx`, `staff/CityCredentialLinksEditor.tsx`, `staff/StaffListFilterTabs.tsx`, `staff/StaffOpsPageShell.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Add link | staff/CityCredentialLinksEditor.tsx:224 | `() => addRow(key)` | works (can be disabled) |
| {entry.label \|\| entry.url} {entry.price ? ` (${entry.price})` : ''} | staff/CityCredentialLinksEditor.tsx:240 | `entry.url` | works |
| `Remove link ${index + 1}` | staff/CityCredentialLinksEditor.tsx:266 | `() => removeRow(key, index)` | works (can be disabled) |
| {saving ? 'Saving…' : 'Save credential links'} | staff/CityCredentialLinksEditor.tsx:325 | `() => void handleSave()` | works (can be disabled) |
| Clear city overrides | staff/CityCredentialLinksEditor.tsx:334 | `() => void handleClear()` | works (can be disabled) |
| No city manager assigned | staff/CityManagerPicker.tsx:58 | `(e) => void handleChange(e.target.value)` | works (can be disabled) |
| _(icon/unnamed)_ | staff/StaffCitiesPanel.tsx:199 | `(e) => { const next = e.target.value as DirectorActionValue; if (next === directorValue) r` | works (can be disabled) |
| _(icon/unnamed)_ | staff/StaffCitiesPanel.tsx:219 | `(e) => { const next = e.target.value as ManagerActionValue; if (next === managerValue) ret` | works (can be disabled) |
| "Sort cities" | staff/StaffCitiesPanel.tsx:427 | `(e) => setSort(e.target.value as CityMarketSort)` | works |
| "Sort cities" | staff/StaffCitiesPanel.tsx:512 | `(e) => setSort(e.target.value as CityMarketSort)` | works |
| {city.name} {city.stateCode} {CITY_STATUS_LABELS[city.status]} {city.recommendOpen && <WfB | staff/StaffCitiesPanel.tsx:562 | `onSelect` | works |
| _(icon/unnamed)_ | staff/StaffCitiesPanel.tsx:578 | `(e) => { const next = e.target.value as DirectorActionValue; if (next === directorValue) r` | works (can be disabled) |
| _(icon/unnamed)_ | staff/StaffCitiesPanel.tsx:600 | `(e) => { const next = e.target.value as ManagerActionValue; if (next === managerValue) ret` | works (can be disabled) |

### /staff/locations
Components: `staff/StaffLocationsPanel.tsx`, `staff/StaffListFilterTabs.tsx`, `staff/StaffOpsPageShell.tsx`, `staff/StaffShellCreateContext.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| _(icon/unnamed)_ | staff/StaffLocationsPanel.tsx:399 | `(e) => setDraft((prev) => ({ ...prev, state: resolveJobCity(e.target.value) }))` | works |
| {opt.label} | staff/StaffLocationsPanel.tsx:416 | `() => setDraft((prev) => ({ ...prev, riskLevel: opt.id }))` | works |
| {busy ? 'Saving…' : 'Save location'} | staff/StaffLocationsPanel.tsx:505 | `() => void handleCreate()` | works (can be disabled) |
| {busy ? 'Saving…' : 'Save changes'} | staff/StaffLocationsPanel.tsx:510 | `() => void handleUpdate()` | works (can be disabled) |
| Reject address | staff/StaffLocationsPanel.tsx:514 | `() => void handleReject()` | works (can be disabled) |
| Archive | staff/StaffLocationsPanel.tsx:519 | `() => void handleArchive()` | works (can be disabled) |
| Activate | staff/StaffLocationsPanel.tsx:524 | `() => void handleApprove()` | works (can be disabled) |
| Reactivate | staff/StaffLocationsPanel.tsx:529 | `() => void handleReactivate()` | works (can be disabled) |
| Cancel | staff/StaffLocationsPanel.tsx:536 | `() => { setCreating(false); setDraft(emptyDraft()); setError(''); }` | works (can be disabled) |
| {loc.name} {!isLocationListed(loc) ? <WfBadge tone="muted">Private</WfBadge> : null} {loc. | staff/StaffLocationsPanel.tsx:609 | `() => { setCreating(false); setSelectedId(loc.id); }` | works |
| Add location | staff/StaffLocationsPanel.tsx:718 | `startCreate` | works |
| Add location | staff/StaffLocationsPanel.tsx:779 | `startCreate` | works |

### /staff/permissions
Components: `staff/StaffPermissionsPanel.tsx`, `staff/StaffMgmtSection.tsx`, `staff/StaffListFilterTabs.tsx`, `staff/StaffOpsPageShell.tsx`, `staff/StaffJobApprovalSettings.tsx`, `staff/ClientCredentialLibraryEditor.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| Save library | staff/ClientCredentialLibraryEditor.tsx:192 | `() => onChange(draft)` | works |
| Discard | staff/ClientCredentialLibraryEditor.tsx:195 | `() => setDraft(rules)` | works |
| All jobs require staff review Trusted clients auto-publish (with coordinates) No review —  | staff/StaffJobApprovalSettings.tsx:35 | `(e) => { const jobReviewMode = e.target.value as PlatformSettings['jobReviewMode']; void p` | works (can be disabled) |
| Reset to defaults | staff/StaffPermissionsPanel.tsx:102 | `resetToDefaults` | works |

### /staff/settings

**Missing controls this page needs:**
- MISSING — Stripe test-mode / sandbox switch or staging environment link (AUD-017)

Components: `staff/StaffSettingsPanel.tsx`, `staff/StaffJobApprovalSettings.tsx`, `staff/ClientCredentialLibraryEditor.tsx`, `staff/StaffCompanyPlacardPanel.tsx`, `staff/StaffMgmtSection.tsx`, `staff/StaffOpsPageShell.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| {label} {detail} | staff/StaffCompanyPlacardPanel.tsx:63 | `onToggle` | works |
| _(icon/unnamed)_ | staff/StaffCompanyPlacardPanel.tsx:149 | `(checked) => void onSetPublicEnabled(checked)` | works (can be disabled) |
| _(icon/unnamed)_ | staff/StaffCompanyPlacardPanel.tsx:302 | `setDisplayOnHomepage` | works |
| {saving ? 'Saving…' : 'Save credential'} | staff/StaffCompanyPlacardPanel.tsx:319 | `handleSave` | works (can be disabled) |
| Broadcast | staff/StaffSettingsPanel.tsx:112 | `() => void handleBroadcast()` | works (can be disabled) |

### /staff/integrations

**Missing controls this page needs:**
- MISSING — Actually connect Twilio / Checkr / insurance verification — page only reports whether env keys exist; no code calls these services

Components: `staff/StaffIntegrationsPanel.tsx`, `staff/StaffMgmtSection.tsx`, `staff/StaffOpsPageShell.tsx`

| Control (label / aria) | Where | Handler → effect | Status |
|---|---|---|---|
| _(icon/unnamed)_ | staff/StaffIntegrationsPanel.tsx:159 | `() => onToggle()` | works (can be disabled) |

### /staff/profile
Components: `staff/StaffTimesheetsPanel.tsx`

_No clickable controls found in these files (content/display only, or controls come from shared components)._

---

## Appendix A — Components that are built but never shown (dead code)

- `src/components/baseui/GuardrAvatar.tsx`
- `src/components/baseui/GuardrBadge.tsx`
- `src/components/baseui/GuardrFormControl.tsx`
- `src/components/baseui/GuardrNotification.tsx`
- `src/components/baseui/GuardrProgressBar.tsx`
- `src/components/baseui/GuardrSkeleton.tsx`
- `src/components/baseui/GuardrSpinner.tsx`
- `src/components/baseui/GuardrTabs.tsx`
- `src/components/baseui/GuardrTooltip.tsx`
- `src/components/baseui/layout/GuardrDrawerShell.tsx`
- `src/components/client/ClientMapBrowseDock.tsx`
- `src/components/client/ClientSelfAuditConfirm.tsx`
- `src/components/credentials/CredentialRevisionTimeline.tsx`
- `src/components/guard/GuardJobTypeMetricDetail.tsx`
- `src/components/guard/GuardJobTypeRatingSection.tsx`
- `src/components/guard/GuardJobsPanelContent.tsx`
- `src/components/guard/GuardMessengerPanel.tsx`
- `src/components/guard/GuardShiftAuditDisputes.tsx`
- `src/components/guard/PostOrdersAckPanel.tsx`
- `src/components/landing/shared/LandingSections.tsx`
- `src/components/layouts/BottomNavBar.tsx`
- `src/components/layouts/MobileDrawerIdentity.tsx`
- `src/components/legal/JobServiceAgreementCard.tsx`
- `src/components/map/MapJobsBrowseSheet.tsx`
- `src/components/notifications/NotificationBellMenu.tsx`
- `src/components/profile/GuardEquipmentGearPanel.tsx`
- `src/components/profile/GuardWeaponGearPanel.tsx`
- `src/components/staff/CityStaffAccessPicker.tsx`
- `src/components/staff/GuardMissingCredentialsBadge.tsx`
- `src/components/staff/RolePermissionsGuide.tsx`
- `src/components/staff/StaffActivationCredentialSection.tsx`
- `src/components/staff/StaffBulkActionsBar.tsx`
- `src/components/staff/StaffJobChatsPanel.tsx`
- `src/components/staff/StaffMessengerPanel.tsx`
- `src/components/staff/StaffReportsPanel.tsx`
- `src/components/staff/StaffSidebarNav.tsx`
- `src/components/ui/desktop/DesktopStatusPanel.tsx`
- `src/surfaces/SurfacePage.tsx`

## Appendix B — Raw scan: optional callbacks never passed by any parent (possible hidden controls; only the ClientDashboard/GuardDashboard/StaffDashboard rows were checked by hand)

| Component | Callback | Rendered from |
|---|---|---|
| ClientDashboard | onApproveFullTeam | src/App.tsx |
| ClientDashboard | onDenyFullTeam | src/App.tsx |
| ClientDashboard | onStartTutorial | src/App.tsx |
| GuardDashboard | onApplyAsTeamLead | src/App.tsx |
| GuardDashboard | onStartTutorial | src/App.tsx |
| StaffDashboard | onCreateSupportTicket | src/App.tsx |
| StaffDashboard | onStartTutorial | src/App.tsx |
| ClientHomeDesktop | onOpenProfile | ClientDashboard.tsx |
| ClientHomeDesktop | onOpenRequest | ClientDashboard.tsx |
| ClientHomeDesktop | onHireGuard | ClientDashboard.tsx |
| ClientHomeDesktop | onViewGuard | ClientDashboard.tsx |
| ClientHomeScreen | onOpenProfile | ClientDashboard.tsx |
| ClientHomeScreen | onHireGuard | ClientDashboard.tsx |
| ClientHomeScreen | onViewGuard | ClientDashboard.tsx |
| ClientInvoiceScreen | onBack | src/App.tsx, ClientDashboard.tsx |
| ClientJobActionsPanel | onEditRequest | client/ClientActiveShift.tsx, client/ClientMapScreen.tsx, client/ClientRequestsDesktop.tsx, client/ClientRequestsList.ts |
| GuardDirectoryScreen | onBack | ClientDashboard.tsx |
| GuardCredentialsView | onDeleteCertification | client/GuardProfileScreen.tsx |
| GuardCredentialsView | onAttachCertificationImage | client/GuardProfileScreen.tsx |
| GuardAvailabilityCalendar | onSave | guard/GuardAvailabilityScreen.tsx |
| GuardAvailabilityDatesPanel | onSave | guard/GuardAvailabilityCalendar.tsx |
| GuardMyJobDetail | onSuggestGuard | guard/GuardJobDetailView.tsx |
| JobTeamRoster | onStaffApproveSlot | client/ClientJobActionsPanel.tsx, guard/GuardJobSlotPanel.tsx |
| JobTeamRoster | onStaffDenySlot | client/ClientJobActionsPanel.tsx, guard/GuardJobSlotPanel.tsx |
| JobTeamRoster | onStaffRemoveFromSlot | client/ClientJobActionsPanel.tsx, guard/GuardJobSlotPanel.tsx |
| MapSelectionExperience | onPrimaryAction | GuardDashboard.tsx, client/ClientMapScreen.tsx, staff/StaffOpsMapScreen.tsx |
| StaffGuardDetailPanel | onDeleteCertification | staff/StaffGuardsPanel.tsx |
| StaffGuardDetailPanel | onAttachCertificationImage | staff/StaffGuardsPanel.tsx |
| SupportScreen | onOpenCompose | src/App.tsx |
| SupportScreen | onOpenReport | src/App.tsx |
| WebsiteAccountShell | onBackToSite | src/App.tsx |

_Note: StaffGuardDetailPanel shows up as "unwired" in raw scans, but it gets its props through a spread (`buildDetailProps`), so it is wired. Where there are several render sites, some pass the callback and others don't. Those were spot-checked: the high-impact ones are the first four rows (team approve/deny, team lead, staff create-ticket)._
