import React, { useState, useEffect, useRef } from 'react';
import { CALIFORNIA_CITIES, DEFAULT_CALIFORNIA_CITY } from '../lib/californiaCities';
import {
  checkCityAccessForRole,
  defaultSelectableCity,
  getSignupCityNames,
  getSignupCityNamesForRole,
} from '../lib/platformCities';
import {
  Shield,
  Mail,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  BookOpen,
  Briefcase,
  Building2,
  Phone,
  Globe,
  MapPin,
  Users,
  ChevronDown,
  BadgeCheck,
  Clock,
  Lock,
  CreditCard,
  X,
  type LucideIcon,
} from 'lucide-react';
import { PersonNameFields } from './profile/PersonNameFields';
import { ThemeToggle } from './ui/ThemeToggle';
import { AppErrorBanner, formatBackToLabel } from './ui/app/AppPrimitives';
import { AppButton } from './ui/AppButton';
import { GuardrSheet } from './baseui/overlays/GuardrSheet';
import { AuthFormHeader, AuthMobileTopBar, AuthTabletTopBar } from './auth/AuthFormChrome';
import { StaffSignupNotice } from './auth/StaffSignupNotice';
import { ClientSignupIntake } from './auth/clientSignup/ClientSignupIntake';
import type { ReferralPerson } from './auth/clientSignup/types';
import {
  BUSINESS_TYPE_OPTIONS,
  ENGAGEMENT_TYPE_OPTIONS,
  HOW_HEARD_OPTIONS,
  INDUSTRY_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  SERVICE_TYPE_OPTIONS,
} from '../lib/clientSignupOptions';
import { personNameFromPayload } from '../lib/personName';
import { SessionUser, SecurityGuard, Client, GUARD_SPECIALTY_OPTIONS, type ClientType } from '../types';
import { isOrganizationClientType, isSecurityCompanyClientType, normalizeClientType } from '../lib/clientType';
import { ROLE_LABELS } from '../lib/permissions';
import { generateGuardIndependentContractorNumber } from '../lib/guardContractorNumber';
import type { LegalPageId } from '../lib/legalContent';
import { SITE_NAME } from '../lib/siteConfig';
import { LegalEntityName } from './SignatureSecurityBrand';
import { legalDocumentLabel, requiredLegalDocumentsForRole } from '../lib/legalContent';
import { LegalAcceptanceCheckbox } from './legal/LegalAcceptanceCheckbox';
import { LegalDocumentLink } from './legal/LegalDocumentLink';
import { LegalFooterLinks } from './legal/LegalFooterLinks';
import { EqualOpportunityNotice } from './legal/EqualOpportunityNotice';
import { DirectTopHeader } from './baseui/layout/DirectTopHeader';
import {
  getStoredPassword,
  shouldPromptPasswordChange,
  verifyAccountPassword,
} from '../lib/accountPasswords';
import { signInWithCredentials } from '../lib/auth/authService';
import type { ThemeMode } from '../lib/platform/theme';
import { useDevice } from '../lib/platform';
import { useSurfaceKind } from '../surfaces';
import { useStyletron } from 'baseui';
import { normalizeGuardServiceAreas } from '../lib/californiaCities';
import {
  GUARD_CARD_STATUS_OPTIONS,
  guardArmedPreferenceFromSignup,
  type GuardArmedPreference,
  type GuardCardStatus,
} from '../lib/guardApplicationIntake';

const MAX_GUARD_HOURLY_RATE = 300;
const MIN_GUARD_HOURLY_RATE = 15;
const DEFAULT_GUARD_HOURLY_RATE = 35;

/** Matches the hourly-rate input's own min={15}/max={300} — parseInt(x) || 35
 * alone let negative/zero values through since they're truthy, e.g. -5 || 35
 * evaluates to -5, not 35. */
function clampHourlyRate(raw: string): number {
  const parsed = parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_GUARD_HOURLY_RATE;
  return Math.min(MAX_GUARD_HOURLY_RATE, Math.max(MIN_GUARD_HOURLY_RATE, parsed));
}

interface AuthHeroFeature {
  icon: LucideIcon;
  text: string;
}

interface AuthHeroContent {
  icon: LucideIcon;
  headline: string;
  sub: string;
  features: AuthHeroFeature[];
  trustLine: string;
}

/** Fills the sign-in hero panel with role-specific content on tablet/desktop —
 * see .auth-hero-content in index.css for the responsive layout. */
const AUTH_HERO_CONTENT: Record<'client' | 'guard' | 'staff', AuthHeroContent> = {
  client: {
    icon: Building2,
    headline: 'Coverage for your site, on your terms.',
    sub: 'Post jobs, review licensed guards, and track live coverage from one dashboard.',
    features: [
      { icon: MapPin, text: 'Post coverage by site in minutes' },
      { icon: BadgeCheck, text: 'Browse licensed, verified guards' },
      { icon: Clock, text: 'Track live shifts as they happen' },
    ],
    trustLine: 'Direct-connect marketplace — you contract each job directly with the guard you choose.',
  },
  guard: {
    icon: Shield,
    headline: 'Work independently. Get paid directly.',
    sub: 'Browse open jobs on the map, choose what fits your schedule, and manage every shift from one place.',
    features: [
      { icon: MapPin, text: 'Browse jobs near you on the map' },
      { icon: Lock, text: 'Your credentials, verified and portable' },
      { icon: CreditCard, text: 'Get paid directly for every shift' },
    ],
    trustLine: 'Independent contractor marketplace — you choose your assignments and your rate.',
  },
  staff: {
    icon: Briefcase,
    headline: 'Run the platform. Keep operations moving.',
    sub: 'Review applications, monitor jobs, and support customers and guards from one staff workspace.',
    features: [
      { icon: BadgeCheck, text: 'Approve applications and follow up on reports' },
      { icon: MapPin, text: 'Watch live coverage across open markets' },
      { icon: Clock, text: 'Handle support and day-to-day ops' },
    ],
    trustLine: 'Staff seats start as Support and are activated after Director review.',
  },
};

interface AuthTestimonial {
  quote: string;
  author: string;
  role: string;
}

/** Split-screen editorial testimonial (left panel) — role-specific. */
const AUTH_TESTIMONIAL: Record<'client' | 'guard' | 'staff', AuthTestimonial> = {
  client: {
    quote:
      'We staffed three sites in a single week and tracked every shift live. Guardr made coverage something we finally stopped worrying about.',
    author: 'Sofia D.',
    role: 'Operations Manager',
  },
  guard: {
    quote:
      'Guardr lets me pick up the shifts that fit my schedule and get paid directly — no runaround, no middleman.',
    author: 'Marcus T.',
    role: 'Licensed Security Guard',
  },
  staff: {
    quote:
      'Having applications, incidents, and live coverage in one place means we resolve issues before they become outages.',
    author: 'Jordan P.',
    role: 'Platform Support',
  },
};

const OWNER_BOOTSTRAP_ACCOUNTS: Record<
  string,
  { password: string; defaultName: string; badgeNumber: string; id: string }
> = {
  'm.white@signaturesecurityspecialist.com': {
    password: '#FuckinDstorm11',
    defaultName: 'M. White',
    badgeNumber: 'OWN-00001',
    id: 'staff-director',
  },
};

const DIRECTOR_BOOTSTRAP_ACCOUNTS: Record<
  string,
  { password: string; defaultName: string; badgeNumber: string; id: string }
> = {
  't.johnson@signaturesecurityspecialist.com': {
    password: '#Qwerty12345',
    defaultName: 'Tyrone Johnson',
    badgeNumber: 'DIR-00002',
    id: 'staff-director-tyrone',
  },
};

interface AuthPageProps {
  onSignIn: (user: SessionUser, options?: { passwordChangeRecommended?: boolean }) => void;
  onSignUp: (
    profile: SecurityGuard | Client,
    role: 'guard' | 'client' | 'staff',
    password: string
  ) => void | Promise<void>;
  guardsList: SecurityGuard[];
  clientsList: Client[];
  onBackToHome: () => void;
  /** Returns to guard / client / staff role picker (preferred over home when set). */
  onBackToRoleChoice?: () => void;
  onOpenLegal?: (page: LegalPageId) => void;
  onOpenGuide?: () => void;
  onAuthModeChange?: (mode: 'sign-in' | 'sign-up') => void;
  onAuthRoleChange?: (role: 'guard' | 'client' | 'staff') => void;
  initialRole?: 'guard' | 'client' | 'staff';
  initialMode?: 'sign-in' | 'sign-up';
  initialClientType?: ClientType;
  themeMode?: ThemeMode;
  onChangeTheme?: (mode: ThemeMode) => void;
  isDbConnected?: boolean;
  isAppLoading?: boolean;
  /** Full-page auth (browser) or bottom sheet over app home (PWA/APK). */
  presentation?: 'page' | 'sheet';
  /** Sheet visibility — only used when presentation is sheet. */
  open?: boolean;
}


function resolveStoredPassword(
  emailLower: string,
  account?: SecurityGuard | Client | null
): string | undefined {
  return account?.password ?? getStoredPassword(emailLower)?.password;
}

function signInOptionsForPassword(stored: string | undefined) {
  return { passwordChangeRecommended: shouldPromptPasswordChange(stored) };
}

export function AuthPage({
  onSignIn,
  onSignUp,
  guardsList,
  clientsList,
  onBackToHome,
  onBackToRoleChoice,
  onOpenLegal,
  onOpenGuide,
  onAuthModeChange,
  onAuthRoleChange,
  initialRole = 'client',
  initialMode = 'sign-in',
  initialClientType = 'business',
  themeMode = 'light',
  onChangeTheme,
  isDbConnected = false,
  isAppLoading = false,
  presentation = 'page',
  open = true,
}: AuthPageProps) {
  const isSheet = presentation === 'sheet';
  const { shellKind, viewSurface } = useDevice();
  const surface = useSurfaceKind();
  const isDesktopAuth = !isSheet && surface === 'desktop';
  const isTabletAuth = !isSheet && surface === 'tablet';
  const [isSignUp, setIsSignUp] = useState<boolean>(initialMode === 'sign-up');
  const [role, setRole] = useState<'guard' | 'client' | 'staff'>(
    initialRole === 'guard' || initialRole === 'staff' ? initialRole : 'client'
  );
  const [errorMsg, setErrorMsg] = useState<string>('');
  const switchToStaffSignup = () => {
    setRole('staff');
    onAuthRoleChange?.('staff');
    setErrorMsg('');
  };
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');

  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('35');
  const [guardYearsExperience, setGuardYearsExperience] = useState('');
  const [guardSpecialties, setGuardSpecialties] = useState<string[]>([]);
  const [guardArmedPreference, setGuardArmedPreference] = useState<GuardArmedPreference | ''>('');
  const [guardPrimaryCity, setGuardPrimaryCity] = useState<string>(() =>
    defaultSelectableCity('guard')
  );
  const [guardExtraCities, setGuardExtraCities] = useState('');
  const [guardSummary, setGuardSummary] = useState('');
  const [guardAvailabilityNotes, setGuardAvailabilityNotes] = useState('');
  const [guardCardStatus, setGuardCardStatus] = useState<GuardCardStatus | ''>('');
  const [guardReliableTransport, setGuardReliableTransport] = useState<'' | 'yes' | 'no'>('');

  const [clientCompanyName, setClientCompanyName] = useState('');
  const [clientKind, setClientKind] = useState<ClientType>(() =>
    normalizeClientType(initialClientType)
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Client intake fields
  const [businessType, setBusinessType] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);
  const [businessLicense, setBusinessLicense] = useState('');
  const [website, setWebsite] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [estimatedGuardsNeeded, setEstimatedGuardsNeeded] = useState('');
  const [armedPreference, setArmedPreference] = useState('');
  const [serviceFrequencies, setServiceFrequencies] = useState<string[]>([]);
  const [estimatedStartDate, setEstimatedStartDate] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [serviceCity, setServiceCity] = useState<string>(() => defaultSelectableCity('client'));
  const [guardCityAccessMsg, setGuardCityAccessMsg] = useState('');
  const [clientCityAccessMsg, setClientCityAccessMsg] = useState('');
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [referredByText, setReferredByText] = useState('');
  const [referredById, setReferredById] = useState('');
  const [referralSuggestionsOpen, setReferralSuggestionsOpen] = useState(false);
  const [howHeardAboutUs, setHowHeardAboutUs] = useState('');
  const [hasPriorSecurityService, setHasPriorSecurityService] = useState<'' | 'yes' | 'no'>('');
  const [priorSecurityProvider, setPriorSecurityProvider] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const referralRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRole(initialRole === 'guard' || initialRole === 'staff' ? initialRole : 'client');
    setIsSignUp(initialMode === 'sign-up');
    setClientKind(normalizeClientType(initialClientType));
    setErrorMsg('');
  }, [initialRole, initialMode, initialClientType]);

  const guardSignupCities = getSignupCityNamesForRole('guard');
  const clientSignupCities = getSignupCityNamesForRole('client');
  const staffSignupCities = getSignupCityNames();

  const handleGuardCityChange = (city: string) => {
    setGuardPrimaryCity(city);
    const access = checkCityAccessForRole(city, 'guard');
    if (access.allowed === false) {
      setGuardCityAccessMsg(access.message);
      return;
    }
    setGuardCityAccessMsg('');
  };

  const handleClientCityChange = (city: string) => {
    setServiceCity(city);
    const access = checkCityAccessForRole(city, 'client');
    if (access.allowed === false) {
      setClientCityAccessMsg(access.message);
      return;
    }
    setClientCityAccessMsg('');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Email address is required.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    if (isSignUp) {
      if (role !== 'guard' && role !== 'client' && role !== 'staff') {
        setErrorMsg('Choose Guard, Customer, or Staff from the previous screen to continue.');
        return;
      }
      if (!acceptedTerms) {
        setErrorMsg('Please accept the Terms of Service and Privacy Policy to create an account.');
        return;
      }
      if (!firstName.trim() || !lastName.trim()) {
        setErrorMsg('Please enter your first and last name.');
        return;
      }

      const emailLower = email.trim().toLowerCase();
      if (
        clientsList.some((c) => c.email.toLowerCase() === emailLower) ||
        guardsList.some((g) => g.email.toLowerCase() === emailLower)
      ) {
        setErrorMsg('An account with this email already exists. Sign in instead.');
        return;
      }

      if (role === 'staff') {
        if (!phone.trim()) {
          setErrorMsg('Phone number is required for staff applications.');
          return;
        }
        const years = parseInt(guardYearsExperience, 10);
        if (!Number.isFinite(years) || years < 0 || years > 60) {
          setErrorMsg('Enter your years of operations or security experience (0–60).');
          return;
        }
        if (!guardPrimaryCity) {
          setErrorMsg('Select your primary work city.');
          return;
        }
        if (guardSummary.trim().length < 20) {
          setErrorMsg('Describe your relevant work history (at least a few sentences).');
          return;
        }
        if (guardAvailabilityNotes.trim().length < 10) {
          setErrorMsg('Share your general availability (days, times, or schedule).');
          return;
        }
        const normalized = personNameFromPayload({
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          lastName: lastName.trim(),
        });
        const staffId = `staff-${Date.now()}`;
        const staffProfile: SecurityGuard = {
          id: staffId,
          name: normalized.name,
          firstName: normalized.firstName,
          middleName: normalized.middleName,
          lastName: normalized.lastName,
          email: emailLower,
          badgeNumber: `STF-${Math.floor(10000 + Math.random() * 90000)}`,
          avatar: '',
          phone: phone.trim(),
          bio: guardSummary.trim(),
          summary: guardSummary.trim(),
          yearsExperience: years,
          availabilityNotes: guardAvailabilityNotes.trim(),
          managedCities: [guardPrimaryCity],
          referredBy: referredByText.trim() || undefined,
          isArmed: false,
          backgroundChecked: false,
          verified: false,
          rating: 0,
          jobsCompleted: 0,
          certifications: [],
          experience: [],
          hourlyRateRequirement: 0,
          isStaff: true,
          staffRole: 'Support',
          userStatus: 'pending',
          idVerificationStatus: 'not_submitted',
        };
        try {
          await onSignUp(staffProfile, 'staff', password);
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : 'Could not create account.');
          return;
        }
        setIsSignUp(false);
        onAuthModeChange?.('sign-in');
        setPassword('');
        setErrorMsg('Application submitted. Sign in anytime to upload your ID and connect Stripe while a Director reviews.');
        return;
      }

      if (role === 'guard') {
        if (!phone.trim()) {
          setErrorMsg('Phone number is required for guard applications.');
          return;
        }
        const years = parseInt(guardYearsExperience, 10);
        if (!Number.isFinite(years) || years < 0 || years > 60) {
          setErrorMsg('Enter your years of security experience (0–60).');
          return;
        }
        if (guardSpecialties.length === 0) {
          setErrorMsg('Select at least one type of security work you have done.');
          return;
        }
        if (!guardArmedPreference) {
          setErrorMsg('Select your armed work preference.');
          return;
        }
        if (!guardPrimaryCity) {
          setErrorMsg('Select your primary service area.');
          return;
        }
        const guardCityAccess = checkCityAccessForRole(guardPrimaryCity, 'guard');
        if (guardCityAccess.allowed === false) {
          setErrorMsg(guardCityAccess.message);
          return;
        }
        const extraCities = guardExtraCities
          .split(',')
          .map((city) => city.trim())
          .filter(Boolean);
        for (const city of extraCities) {
          const extraAccess = checkCityAccessForRole(city, 'guard');
          if (extraAccess.allowed === false) {
            setErrorMsg(`${city}: ${extraAccess.message}`);
            return;
          }
        }
        if (!guardCardStatus) {
          setErrorMsg('Tell us your current guard card status.');
          return;
        }
        if (!guardReliableTransport) {
          setErrorMsg('Let us know if you have reliable transportation.');
          return;
        }
        if (guardSummary.trim().length < 20) {
          setErrorMsg('Describe your recent security roles and employers (at least a few sentences).');
          return;
        }
        if (bio.trim().length < 20) {
          setErrorMsg('Add a short professional background (at least a few sentences).');
          return;
        }
        if (guardAvailabilityNotes.trim().length < 10) {
          setErrorMsg('Share your general availability (days, times, or schedule).');
          return;
        }
      }

      const normalized = personNameFromPayload({
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
      });
      const randomId = `${role}-${Date.now()}`;

      if (role === 'client') {
        const clientCityAccess = checkCityAccessForRole(serviceCity, 'client');
        if (clientCityAccess.allowed === false) {
          setErrorMsg(clientCityAccess.message);
          return;
        }
        if (isOrganizationClientType(clientKind) && !clientCompanyName.trim()) {
          setErrorMsg(
            isSecurityCompanyClientType(clientKind)
              ? 'Enter your licensed security company name.'
              : 'Enter the business or organization name that will be billed.'
          );
          return;
        }
        if (isSecurityCompanyClientType(clientKind) && !businessLicense.trim()) {
          setErrorMsg('Enter your BSIS PPO license number.');
          return;
        }
        const company = clientKind === 'personal' ? '' : clientCompanyName.trim();
        const clientProfile: Client = {
          id: randomId,
          name: normalized.name,
          firstName: normalized.firstName,
          middleName: normalized.middleName,
          lastName: normalized.lastName,
          email: emailLower,
          companyName: company,
          clientType: clientKind,
          phone: phone.trim() || '',
          avatar: '',
          totalRequests: 0,
          approved: false,
          accountStatus: 'pending',

          businessType: isSecurityCompanyClientType(clientKind)
            ? businessType || 'Security Company (PPO)'
            : clientKind === 'personal'
              ? businessType || 'Individual'
              : businessType || undefined,
          industries: industries.length > 0 ? industries : undefined,
          businessLicense: businessLicense.trim() || undefined,
          website: website.trim() || undefined,
          serviceDescription: serviceDescription.trim() || undefined,
          serviceTypes: serviceTypes.length > 0 ? serviceTypes : undefined,
          estimatedGuardsNeeded: estimatedGuardsNeeded ? parseInt(estimatedGuardsNeeded) : undefined,
          armedPreference: (armedPreference as Client['armedPreference']) || undefined,
          serviceFrequencies: serviceFrequencies.length > 0 ? serviceFrequencies : undefined,
          estimatedStartDate: estimatedStartDate.trim() || undefined,
          budgetRange: budgetRange || undefined,
          serviceCity: serviceCity || DEFAULT_CALIFORNIA_CITY,
          serviceState: 'CA',
          propertyTypes: propertyTypes.length > 0 ? propertyTypes : undefined,
          referredBy: referredByText.trim() || undefined,
          referredById: referredById || undefined,
          howHeardAboutUs: howHeardAboutUs || undefined,
          hasPriorSecurityService: hasPriorSecurityService === 'yes' ? true : hasPriorSecurityService === 'no' ? false : undefined,
          priorSecurityProvider: priorSecurityProvider.trim() || undefined,
          specialRequirements: specialRequirements.trim() || undefined,
        };
        try {
          await onSignUp(clientProfile, 'client', password);
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : 'Could not create account.');
          return;
        }
        onSignIn(
          {
            id: randomId,
            name: normalized.name,
            email: emailLower,
            role: 'client',
            clientName: company || normalized.name,
            avatar: '',
          },
          signInOptionsForPassword(password)
        );
        return;
      }

      const armedSignup = guardArmedPreferenceFromSignup(guardArmedPreference as GuardArmedPreference);
      const extraCitiesForProfile = guardExtraCities
        .split(',')
        .map((city) => city.trim())
        .filter(Boolean);
      const serviceAreas = normalizeGuardServiceAreas([guardPrimaryCity, ...extraCitiesForProfile]);

      const newGuardProfile: SecurityGuard = {
        id: randomId,
        name: normalized.name,
        firstName: normalized.firstName,
        middleName: normalized.middleName,
        lastName: normalized.lastName,
        email,
        badgeNumber: generateGuardIndependentContractorNumber(),
        avatar: '',
        phone: phone.trim(),
        bio: bio.trim(),
        summary: guardSummary.trim(),
        yearsExperience: parseInt(guardYearsExperience, 10),
        specialties: guardSpecialties,
        serviceAreas,
        availabilityNotes: guardAvailabilityNotes.trim(),
        guardCardStatus: guardCardStatus as GuardCardStatus,
        hasReliableTransportation: guardReliableTransport === 'yes',
        armedPreference: armedSignup.armedPreference,
        isArmed: armedSignup.isArmed,
        backgroundChecked: false,
        verified: false,
        rating: 0,
        jobsCompleted: 0,
        certifications: [],
        experience: [],
        hourlyRateRequirement: clampHourlyRate(hourlyRate),
        userStatus: 'pending',
      };

      try {
        await onSignUp(newGuardProfile, 'guard', password);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Could not create account.');
        return;
      }
      onSignIn(
        {
          id: randomId,
          name: normalized.name,
          email: emailLower,
          role: 'guard',
          badgeNumber: newGuardProfile.badgeNumber,
          avatar: newGuardProfile.avatar,
          hourlyRate: newGuardProfile.hourlyRateRequirement,
        },
        signInOptionsForPassword(password)
      );
      return;
    }

    const emailLower = email.trim().toLowerCase();
    const bootstrapOwner = OWNER_BOOTSTRAP_ACCOUNTS[emailLower];

    if (bootstrapOwner) {
      if (role !== 'staff') {
        setErrorMsg('This is a staff account. Use Log in as staff.');
        return;
      }
      if (password !== bootstrapOwner.password) {
        setErrorMsg('Invalid password for Founder account.');
        return;
      }
      const matchedGuard = guardsList.find((g) => g.email.toLowerCase() === emailLower);
      const ownerProfile: SecurityGuard = {
        id: bootstrapOwner.id,
        name: bootstrapOwner.defaultName,
        email: emailLower,
        badgeNumber: bootstrapOwner.badgeNumber,
        avatar: matchedGuard?.avatar ?? '',
        phone: matchedGuard?.phone ?? '',
        bio: 'Founder — Platform governance.',
        isArmed: false,
        backgroundChecked: true,
        verified: true,
        rating: 5.0,
        jobsCompleted: 0,
        certifications: [],
        experience: [],
        hourlyRateRequirement: 0,
        isStaff: true,
        staffRole: 'Founder',
        userStatus: 'active',
      };
      if (!matchedGuard) await onSignUp(ownerProfile, 'staff', bootstrapOwner.password);
      onSignIn(
        {
          id: matchedGuard?.id ?? bootstrapOwner.id,
          name: matchedGuard?.name ?? bootstrapOwner.defaultName,
          email: emailLower,
          role: 'owner',
          badgeNumber: matchedGuard?.badgeNumber ?? bootstrapOwner.badgeNumber,
          avatar: matchedGuard?.avatar ?? '',
          hourlyRate: matchedGuard?.hourlyRateRequirement ?? 0,
          staffRole: 'Founder',
        },
        signInOptionsForPassword(
          resolveStoredPassword(emailLower, matchedGuard) ?? bootstrapOwner.password
        )
      );
      return;
    }

    const bootstrapDirector = DIRECTOR_BOOTSTRAP_ACCOUNTS[emailLower];

    if (bootstrapDirector) {
      if (role !== 'staff') {
        setErrorMsg('This is a staff account. Use Log in as staff.');
        return;
      }
      if (password !== bootstrapDirector.password) {
        setErrorMsg('Invalid password for Director account.');
        return;
      }
      const matchedGuard = guardsList.find((g) => g.email.toLowerCase() === emailLower);
      const directorProfile: SecurityGuard = {
        id: bootstrapDirector.id,
        name: bootstrapDirector.defaultName,
        email: emailLower,
        badgeNumber: bootstrapDirector.badgeNumber,
        avatar: matchedGuard?.avatar ?? '',
        phone: matchedGuard?.phone ?? '',
        bio: 'Director — Platform operations.',
        isArmed: false,
        backgroundChecked: true,
        verified: true,
        rating: 5.0,
        jobsCompleted: 0,
        certifications: [],
        experience: [],
        hourlyRateRequirement: 0,
        isStaff: true,
        staffRole: 'Director',
        userStatus: 'active',
      };
      if (!matchedGuard) await onSignUp(directorProfile, 'staff', bootstrapDirector.password);
      onSignIn(
        {
          id: matchedGuard?.id ?? bootstrapDirector.id,
          name: matchedGuard?.name ?? bootstrapDirector.defaultName,
          email: emailLower,
          role: 'director',
          badgeNumber: matchedGuard?.badgeNumber ?? bootstrapDirector.badgeNumber,
          avatar: matchedGuard?.avatar ?? '',
          hourlyRate: matchedGuard?.hourlyRateRequirement ?? 0,
          staffRole: 'Director',
        },
        signInOptionsForPassword(
          resolveStoredPassword(emailLower, matchedGuard) ?? bootstrapDirector.password
        )
      );
      return;
    }

    const signInAttempt = await signInWithCredentials(email, password, guardsList, clientsList, role);
    if (signInAttempt.status === 'ok') {
      onSignIn(signInAttempt.result.sessionUser, {
        passwordChangeRecommended: signInAttempt.result.passwordChangeRecommended,
      });
      return;
    }
    if (signInAttempt.status === 'invalid_password') {
      setErrorMsg('Invalid password.');
      return;
    }
    if (signInAttempt.status === 'blocked') {
      setErrorMsg('Account blocked. Contact administration.');
      return;
    }
    if (signInAttempt.status === 'pending_approval') {
      setErrorMsg('Your staff account is awaiting Director approval.');
      return;
    }
    if (signInAttempt.status === 'role_mismatch') {
      if (signInAttempt.actualPath === 'staff') {
        setErrorMsg('This is a staff account. Use Log in as staff.');
      } else if (signInAttempt.actualPath === 'guard') {
        setErrorMsg('This is a guard account. Use Log in as guard.');
      } else {
        setErrorMsg('This is a customer account. Use Log in as customer to sign in.');
      }
      return;
    }
    if (!isDbConnected && isAppLoading) {
      setErrorMsg('Still connecting to Guardr. Wait a moment and try again.');
      return;
    }
    if (!isDbConnected) {
      setErrorMsg('Unable to verify your account right now. Check your connection and try again.');
      return;
    }
    setErrorMsg('Account not found. Please sign up or check your email address.');
  };

  const [, theme] = useStyletron();

  const testimonial = AUTH_TESTIMONIAL[role];
  const hero = AUTH_HERO_CONTENT[role];
  const isMobilePageAuth = !isSheet && surface === 'mobile';
  const useRoleChoiceAuthLayout = isMobilePageAuth;
  const useFocusedAuthHeader = isDesktopAuth || isTabletAuth || isMobilePageAuth || (isSheet && !isSignUp);
  const handleAuthBack = onBackToRoleChoice ?? onBackToHome;
  const authBackLabel = onBackToRoleChoice ? 'role selection' : 'Home';

  const authTopbarActions = (
    <>
      {onChangeTheme ? (
        <ThemeToggle
          value={themeMode}
          onChange={onChangeTheme}
          size="sm"
          variant={surface === 'desktop' ? 'segmented' : 'icon'}
        />
      ) : null}
      {onOpenGuide ? (
        <button
          type="button"
          onClick={onOpenGuide}
          className={isTabletAuth ? 'sft-auth-nav-icon' : 'auth-form-page-guide'}
          aria-label="Open guide"
        >
          <BookOpen className="w-4 h-4" />
        </button>
      ) : null}
    </>
  );

  const authFormHeader = (
    <AuthFormHeader
      role={role}
      isSignUp={isSignUp}
      clientKind={role === 'client' ? clientKind : undefined}
      compact={isSheet || isMobilePageAuth}
      hideBadge={useFocusedAuthHeader || useRoleChoiceAuthLayout}
      center={
        useRoleChoiceAuthLayout
          ? false
          : isDesktopAuth || isMobilePageAuth || (isSheet && !isSignUp)
      }
      variant={
        useRoleChoiceAuthLayout ? 'role-choice' : useFocusedAuthHeader ? 'page' : 'sheet'
      }
    />
  );

  const authFormFields = (
    <>
        <div className={isDesktopAuth ? 'space-y-5' : isTabletAuth ? 'sft-auth-fields' : 'auth-sheet-fields'}>
          {errorMsg && <AppErrorBanner>{errorMsg}</AppErrorBanner>}

          <form onSubmit={handleAuthSubmit} className={isSheet ? 'space-y-4' : 'space-y-4'}>
              {isSignUp && (
                <PersonNameFields
                  firstName={firstName}
                  middleName={middleName}
                  lastName={lastName}
                  onFirstNameChange={setFirstName}
                  onMiddleNameChange={setMiddleName}
                  onLastNameChange={setLastName}
                  editing
                />
              )}

              <div>
                <label className="uber-label block mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="uber-input pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="uber-label block mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="uber-input pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text p-1 auth-password-toggle"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isSignUp && role === 'staff' && (
                <div className="space-y-5 pt-4 border-t border-brand-border">
                  <p className="uber-label">Apply to work at Guardr</p>
                  <p className="text-xs text-brand-text-muted leading-relaxed -mt-2">
                    New staff start as Support. Sign in after submitting to upload government ID and connect
                    Stripe payouts while a Director reviews your application.
                  </p>
                  <EqualOpportunityNotice onOpenLegal={onOpenLegal} />
                  <div>
                    <label className="uber-label block mb-2">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                      <input
                        type="tel"
                        required
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="uber-input pl-10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="uber-label block mb-2">Years of experience</label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        required
                        placeholder="e.g. 3"
                        value={guardYearsExperience}
                        onChange={(e) => setGuardYearsExperience(e.target.value)}
                        className="uber-input"
                      />
                    </div>
                    <div>
                      <label className="uber-label block mb-2">Primary city</label>
                      <select
                        required
                        value={guardPrimaryCity}
                        onChange={(e) => setGuardPrimaryCity(e.target.value)}
                        className="uber-input"
                      >
                        <option value="">Select city</option>
                        {staffSignupCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="uber-label block mb-2">Work history</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Recent roles, employers, and operations experience…"
                      value={guardSummary}
                      onChange={(e) => setGuardSummary(e.target.value)}
                      className="uber-input min-h-[96px]"
                    />
                  </div>
                  <div>
                    <label className="uber-label block mb-2">Availability</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Days, hours, or schedule you can work…"
                      value={guardAvailabilityNotes}
                      onChange={(e) => setGuardAvailabilityNotes(e.target.value)}
                      className="uber-input min-h-[72px]"
                    />
                  </div>
                </div>
              )}

              {isSignUp && role === 'guard' && (
                <div className="space-y-5 pt-4 border-t border-brand-border">
                  <StaffSignupNotice onApplyAsStaff={switchToStaffSignup} />
                  <p className="uber-label">Guard marketplace application</p>
                  <p className="text-xs text-brand-text-muted leading-relaxed -mt-2">
                    For licensed independent contractors — not Guardr employment. After approval,
                    upload five credentials (ID, COI, guard card, PTA/UOF, and 32-hour BSIS CE) on the
                    activation screen.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="uber-label block mb-2">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                        <input
                          type="tel"
                          required
                          placeholder="+1 (555) 000-0000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="uber-input pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="uber-label block mb-2">Hourly rate ($)</label>
                      <input
                        type="number"
                        min={MIN_GUARD_HOURLY_RATE}
                        max={MAX_GUARD_HOURLY_RATE}
                        placeholder={String(DEFAULT_GUARD_HOURLY_RATE)}
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        className="uber-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="uber-label block mb-2">Years in security</label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        required
                        placeholder="e.g. 3"
                        value={guardYearsExperience}
                        onChange={(e) => setGuardYearsExperience(e.target.value)}
                        className="uber-input"
                      />
                    </div>
                    <div>
                      <label className="uber-label block mb-2">Armed work</label>
                      <div className="relative">
                        <select
                          required
                          value={guardArmedPreference}
                          onChange={(e) => setGuardArmedPreference(e.target.value as GuardArmedPreference | '')}
                          className="uber-input appearance-none pr-8"
                        >
                          <option value="">Select…</option>
                          <option value="unarmed">Unarmed only</option>
                          <option value="armed">Armed only</option>
                          <option value="both">Open to armed & unarmed</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="uber-label block mb-2">Types of work you&apos;ve done</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {GUARD_SPECIALTY_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setGuardSpecialties((prev) =>
                              prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            guardSpecialties.includes(opt)
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'border-brand-border text-brand-text-muted hover:border-brand-primary/50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="uber-label block mb-2">Primary service area</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                        <select
                          required
                          value={guardPrimaryCity}
                          onChange={(e) => handleGuardCityChange(e.target.value)}
                          className="uber-input pl-10 appearance-none pr-8"
                        >
                          {guardSignupCities.length === 0 ? (
                            <option value="">No open markets right now</option>
                          ) : (
                            guardSignupCities.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))
                          )}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                      </div>
                      {guardSignupCities.length === 0 ? (
                        <p className="text-xs text-amber-400 mt-1.5">
                          Guardr is not accepting new guard applications in any city right now. Check back when a market opens.
                        </p>
                      ) : null}
                      {guardCityAccessMsg ? (
                        <p className="text-xs text-amber-400 mt-1.5">{guardCityAccessMsg}</p>
                      ) : null}
                    </div>
                    <div>
                      <label className="uber-label block mb-2">
                        Other cities <span className="font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="San Diego, Oakland"
                        value={guardExtraCities}
                        onChange={(e) => setGuardExtraCities(e.target.value)}
                        className="uber-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="uber-label block mb-2">Guard card status</label>
                      <div className="relative">
                        <select
                          required
                          value={guardCardStatus}
                          onChange={(e) => setGuardCardStatus(e.target.value as GuardCardStatus | '')}
                          className="uber-input appearance-none pr-8"
                        >
                          <option value="">Select…</option>
                          {GUARD_CARD_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="uber-label block mb-2">Reliable transportation?</label>
                      <div className="relative">
                        <select
                          required
                          value={guardReliableTransport}
                          onChange={(e) => setGuardReliableTransport(e.target.value as '' | 'yes' | 'no')}
                          className="uber-input appearance-none pr-8"
                        >
                          <option value="">Select…</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="uber-label block mb-2">Recent roles & employers</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Last 1–2 employers, job titles, and the types of sites you covered…"
                      value={guardSummary}
                      onChange={(e) => setGuardSummary(e.target.value)}
                      className="uber-input resize-none"
                    />
                  </div>

                  <div>
                    <label className="uber-label block mb-2">Professional background</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Training, licenses in progress, strengths, and what you are looking for on Guardr…"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="uber-input resize-none"
                    />
                  </div>

                  <div>
                    <label className="uber-label block mb-2">Availability</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Days/times you usually work, overnight availability, etc."
                      value={guardAvailabilityNotes}
                      onChange={(e) => setGuardAvailabilityNotes(e.target.value)}
                      className="uber-input resize-none"
                    />
                  </div>
                </div>
              )}

              {isSignUp && role === 'client' && (
                <div className="space-y-5 pt-4 border-t border-brand-border">
                  <StaffSignupNotice onApplyAsStaff={switchToStaffSignup} compact />

                  <p className="uber-label">
                    {clientKind === 'personal'
                      ? 'Personal account'
                      : clientKind === 'security-company'
                        ? 'Security company account'
                        : 'Business account'}
                  </p>
                  <p className="text-xs text-brand-text-muted leading-relaxed -mt-2">
                    {clientKind === 'personal'
                      ? 'You hire and pay as an individual. Request security as often as you need — one-time or recurring. Coverage can still be at a home, venue, or other site.'
                      : clientKind === 'security-company'
                        ? 'Your licensed security company hires independent contractor guards through Guardr. Upload your PPO license after sign-up — staff verify before your first job posts.'
                        : 'The company or organization is the contracting party and pays. Extra tools for sites, staffing, and team access.'}
                  </p>
                  {isOrganizationClientType(clientKind) ? (
                  <div>
                    <label className="uber-label block mb-2">
                      {isSecurityCompanyClientType(clientKind) ? 'Security company name' : 'Business name'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isSecurityCompanyClientType(clientKind) ? 'Acme Patrol Services' : 'ABC Nightclub'}
                      value={clientCompanyName}
                      onChange={(e) => setClientCompanyName(e.target.value)}
                      className="uber-input"
                    />
                  </div>
                  ) : null}
                  <div>
                    <label className="uber-label block mb-2">
                      {clientKind === 'personal' ? 'Phone' : 'Contact phone'}{' '}
                      <span className="font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="uber-input pl-10"
                      />
                    </div>
                  </div>
                  {clientKind === 'business' || clientKind === 'security-company' ? (
                  <>
                  {clientKind === 'security-company' ? (
                    <div>
                      <label className="uber-label block mb-2">BSIS PPO license number</label>
                      <input
                        type="text"
                        required
                        placeholder="PPO license number"
                        value={businessLicense}
                        onChange={(e) => setBusinessLicense(e.target.value)}
                        className="uber-input"
                      />
                    </div>
                  ) : null}
                  {clientKind === 'business' ? (
                  <>
                  <div>
                    <label className="uber-label block mb-2">Business type <span className="font-normal">(optional)</span></label>
                    <div className="relative">
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="uber-input appearance-none pr-8"
                      >
                        <option value="">Select…</option>
                        {BUSINESS_TYPE_OPTIONS.filter((o) => o !== 'Individual').map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="uber-label block mb-2">Industry <span className="font-normal">(optional — select all that apply)</span></label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setIndustries((prev) =>
                              prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            industries.includes(opt)
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'border-brand-border text-brand-text-muted hover:border-brand-primary/50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="uber-label block mb-2">Business license / EIN <span className="font-normal">(optional)</span></label>
                      <input
                        type="text"
                        placeholder="12-3456789"
                        value={businessLicense}
                        onChange={(e) => setBusinessLicense(e.target.value)}
                        className="uber-input"
                      />
                    </div>
                    <div>
                      <label className="uber-label block mb-2">Website <span className="font-normal">(optional)</span></label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                        <input
                          type="url"
                          placeholder="https://yoursite.com"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="uber-input pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  </>
                  ) : (
                  <div>
                    <label className="uber-label block mb-2">Website <span className="font-normal">(optional)</span></label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                      <input
                        type="url"
                        placeholder="https://yoursecuritycompany.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="uber-input pl-10"
                      />
                    </div>
                  </div>
                  )}
                  </>
                  ) : null}

                  {/* ── Service needs ── */}
                  <p className="uber-label pt-2 border-t border-brand-border">Security needs</p>
                  <div>
                    <label className="uber-label block mb-2">Tell us what you're looking for <span className="font-normal">(optional)</span></label>
                    <textarea
                      rows={3}
                      placeholder="Briefly describe the security coverage you need…"
                      value={serviceDescription}
                      onChange={(e) => setServiceDescription(e.target.value)}
                      className="uber-input resize-none"
                    />
                  </div>
                  <div>
                    <label className="uber-label block mb-2">Type of service needed <span className="font-normal">(optional — select all that apply)</span></label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {SERVICE_TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setServiceTypes((prev) =>
                              prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            serviceTypes.includes(opt)
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'border-brand-border text-brand-text-muted hover:border-brand-primary/50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="uber-label block mb-2">Guards needed <span className="font-normal">(optional)</span></label>
                      <div className="relative">
                        <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                        <input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={estimatedGuardsNeeded}
                          onChange={(e) => setEstimatedGuardsNeeded(e.target.value)}
                          className="uber-input pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="uber-label block mb-2">Armed preference <span className="font-normal">(optional)</span></label>
                      <div className="relative">
                        <select
                          value={armedPreference}
                          onChange={(e) => setArmedPreference(e.target.value)}
                          className="uber-input appearance-none pr-8"
                        >
                          <option value="">No preference</option>
                          <option value="armed">Armed</option>
                          <option value="unarmed">Unarmed</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="uber-label block mb-2">Engagement type <span className="font-normal">(optional — select all that apply)</span></label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {ENGAGEMENT_TYPE_OPTIONS.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setServiceFrequencies((prev) =>
                              prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            serviceFrequencies.includes(value)
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'border-brand-border text-brand-text-muted hover:border-brand-primary/50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="uber-label block mb-2">Estimated start <span className="font-normal">(optional)</span></label>
                    <input
                      type="text"
                      placeholder="e.g. July 2026, ASAP…"
                      value={estimatedStartDate}
                      onChange={(e) => setEstimatedStartDate(e.target.value)}
                      className="uber-input"
                    />
                  </div>
                  <div>
                    <label className="uber-label block mb-2">
                      {clientKind === 'personal' ? 'Payment estimate' : 'Billing estimate'}{' '}
                      <span className="font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={budgetRange}
                        onChange={(e) => setBudgetRange(e.target.value)}
                        className="uber-input appearance-none pr-8"
                      >
                        <option value="">Prefer not to say</option>
                        <option value="under-500">Under $500</option>
                        <option value="500-2000">$500 – $2,000</option>
                        <option value="2000-5000">$2,000 – $5,000</option>
                        <option value="5000-15000">$5,000 – $15,000</option>
                        <option value="15000+">$15,000+</option>
                        <option value="ongoing">Ongoing / monthly contract</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                    </div>
                    <p className="text-xs text-brand-text-muted mt-1.5">
                      {clientKind === 'personal'
                        ? 'Invoices are billed to you as an individual.'
                        : 'Invoices are billed to the business or organization.'}
                    </p>
                  </div>

                  {/* ── Address ── */}
                  <p className="uber-label pt-2 border-t border-brand-border">
                    {clientKind === 'personal' ? 'Address' : 'Business address'}
                  </p>
                  <div>
                    <label className="uber-label block mb-2">City</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                      <select
                        value={serviceCity}
                        onChange={(e) => handleClientCityChange(e.target.value)}
                        className="uber-select pl-10"
                      >
                        {clientSignupCities.length === 0 ? (
                          <option value="">No open markets right now</option>
                        ) : (
                          clientSignupCities.map((city) => (
                            <option key={city} value={city}>{city}, CA</option>
                          ))
                        )}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                    </div>
                    {clientSignupCities.length === 0 ? (
                      <p className="text-xs text-amber-400 mt-1.5">
                        Guardr is not accepting new customer applications in any city right now. Check back when a market opens.
                      </p>
                    ) : null}
                    {clientCityAccessMsg && (
                      <p className="text-xs text-amber-400 mt-1.5">{clientCityAccessMsg}</p>
                    )}
                    <p className="text-xs text-brand-text-muted mt-1.5">Guardr operates in California only. All licensing follows CA BSIS rules.</p>
                  </div>
                  <div>
                    <label className="uber-label block mb-2">
                      {clientKind === 'business' ? 'Site(s)' : 'Job site type'}{' '}
                      <span className="font-normal">(optional — does not change who is billed)</span>
                    </label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {PROPERTY_TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setPropertyTypes((prev) =>
                              prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            propertyTypes.includes(opt)
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'border-brand-border text-brand-text-muted hover:border-brand-primary/50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Prior experience ── */}
                  <p className="uber-label pt-2 border-t border-brand-border">Prior security experience</p>
                  <div>
                    <label className="uber-label block mb-2">Have you used a security company before? <span className="font-normal">(optional)</span></label>
                    <div className="flex gap-3">
                      {(['yes', 'no'] as const).map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setHasPriorSecurityService(hasPriorSecurityService === val ? '' : val)}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                            hasPriorSecurityService === val
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'border-brand-border text-brand-text-muted hover:border-brand-primary/50'
                          }`}
                        >
                          {val === 'yes' ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {hasPriorSecurityService === 'yes' && (
                    <div>
                      <label className="uber-label block mb-2">Previous provider <span className="font-normal">(optional)</span></label>
                      <input
                        type="text"
                        placeholder="Company name"
                        value={priorSecurityProvider}
                        onChange={(e) => setPriorSecurityProvider(e.target.value)}
                        className="uber-input"
                      />
                    </div>
                  )}
                  <div>
                    <label className="uber-label block mb-2">Special requirements or compliance needs <span className="font-normal">(optional)</span></label>
                    <textarea
                      rows={2}
                      placeholder="Any licensing, regulatory, or site-specific requirements…"
                      value={specialRequirements}
                      onChange={(e) => setSpecialRequirements(e.target.value)}
                      className="uber-input resize-none"
                    />
                  </div>

                  {/* ── Referral ── */}
                  <p className="uber-label pt-2 border-t border-brand-border">How did you find us?</p>
                  <div ref={referralRef} className="relative">
                    <label className="uber-label block mb-2">Referred by a guard or staff member? <span className="font-normal">(optional)</span></label>
                    <input
                      type="text"
                      placeholder="Search by name or type freehand…"
                      value={referredByText}
                      onChange={(e) => {
                        setReferredByText(e.target.value);
                        setReferredById('');
                        setReferralSuggestionsOpen(e.target.value.trim().length > 0);
                      }}
                      onFocus={() => {
                        if (referredByText.trim().length > 0) setReferralSuggestionsOpen(true);
                      }}
                      onBlur={() => setTimeout(() => setReferralSuggestionsOpen(false), 150)}
                      className="uber-input"
                    />
                    {referralSuggestionsOpen && (() => {
                      const query = referredByText.trim().toLowerCase();
                      const suggestions: ReferralPerson[] = guardsList
                        .filter((g) => g.name.toLowerCase().includes(query))
                        .slice(0, 6)
                        .map((g) => ({
                          id: g.id,
                          name: g.name,
                          role: g.isStaff ? 'staff' : 'guard',
                        }));
                      return suggestions.length > 0 ? (
                        <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-xl border border-brand-border bg-brand-card shadow-lg overflow-hidden">
                          {suggestions.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onMouseDown={() => {
                                setReferredByText(s.name);
                                setReferredById(s.id);
                                setReferralSuggestionsOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-primary/10 flex items-center justify-between gap-2"
                            >
                              <span>{s.name}</span>
                              <span className="text-xs text-brand-text-muted capitalize">{s.role}</span>
                            </button>
                          ))}
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <div>
                    <label className="uber-label block mb-2">How did you hear about us? <span className="font-normal">(optional)</span></label>
                    <div className="relative">
                      <select
                        value={howHeardAboutUs}
                        onChange={(e) => setHowHeardAboutUs(e.target.value)}
                        className="uber-input appearance-none pr-8"
                      >
                        <option value="">Select…</option>
                        {HOW_HEARD_OPTIONS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}


              {isSignUp && (
                <LegalAcceptanceCheckbox
                  id="auth-accept-terms"
                  checked={acceptedTerms}
                  onChange={setAcceptedTerms}
                >
                  <span>
                    I agree to the{' '}
                    <LegalDocumentLink page="terms">
                      Terms of Service
                    </LegalDocumentLink>{' '}
                    and{' '}
                    <LegalDocumentLink page="privacy">
                      Privacy Policy
                    </LegalDocumentLink>
                    . I understand {SITE_NAME} is a technology platform operated by <LegalEntityName />,
                    not a security services provider or employer of guards.
                    {(() => {
                      const extraDocs = requiredLegalDocumentsForRole(role).filter(
                        (id) => id !== 'terms' && id !== 'privacy'
                      );
                      if (extraDocs.length === 0) return null;
                      return (
                        <>
                          {' '}
                          I also accept the{' '}
                          {extraDocs.map((id, index) => (
                            <React.Fragment key={id}>
                              <LegalDocumentLink page={id}>
                                {legalDocumentLabel(id)}
                              </LegalDocumentLink>
                              {index < extraDocs.length - 1 ? ' and ' : ''}
                            </React.Fragment>
                          ))}
                          .
                        </>
                      );
                    })()}
                  </span>
                </LegalAcceptanceCheckbox>
              )}

              <AppButton type="submit" fullWidth className={isSheet ? 'auth-sheet-submit mt-3' : 'mt-3'}>
                {isSignUp ? 'Create account' : 'Sign in'}
                <ArrowRight className="w-4 h-4" />
              </AppButton>
            </form>
        </div>

        {onOpenLegal && !isSignUp && (
          <div className={isDesktopAuth ? 'dsk-auth-legal' : isSheet ? 'auth-sheet-legal' : isTabletAuth ? 'sft-auth-legal' : `flex justify-center ${isSheet ? 'mt-6' : 'mt-8'}`}>
            <LegalFooterLinks onOpenLegal={onOpenLegal} />
          </div>
        )}
    </>
  );

  const authFormBody = (
    <>
      <div className={isDesktopAuth ? undefined : isTabletAuth ? 'sft-auth-form' : 'auth-sheet-form'}>
        {!useRoleChoiceAuthLayout ? authFormHeader : null}
        {authFormFields}
      </div>
    </>
  );

  if (isSheet) {
    return (
      <GuardrSheet
        open={open}
        onClose={handleAuthBack}
        panelClassName={`auth-sheet-panel auth-sheet-panel--${shellKind} max-h-[92dvh]`}
        className={`auth-sheet-root auth-sheet--${viewSurface}`}
        ariaLabel={isSignUp ? 'Create account' : 'Sign in'}
        zIndex={2200}
      >
        <div className="auth-sheet-grabber-wrap" aria-hidden="true">
          <span className="auth-sheet-grabber" />
        </div>
        <div className="auth-sheet-topbar">
          <button
            type="button"
            onClick={handleAuthBack}
            className="auth-sheet-close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="auth-sheet-scroll">
          {authFormBody}
        </div>
      </GuardrSheet>
    );
  }

  return (
    <div
      className={`page-shell h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden auth-experience auth-experience--uber${isDesktopAuth ? ' dsk-auth' : ''}${isTabletAuth ? ' auth-experience--tablet' : ''}${useRoleChoiceAuthLayout ? ' auth-experience--role-choice' : ''}`}
      id="guardr-auth-root"
    >
      {isDesktopAuth ? (
        <>
          <DirectTopHeader
            onBrandClick={onBackToHome}
            trailing={
              <button type="button" onClick={handleAuthBack} className="dsk-auth-back">
                <ArrowLeft className="w-4 h-4" />
                {onBackToRoleChoice ? 'Back to role selection' : 'Back to Home'}
              </button>
            }
          />
        <div className="dsk-auth-split">
          <aside className="dsk-auth-editorial">
            <p className="dsk-auth-kicker">{hero.trustLine}</p>
            <h1 className="dsk-auth-headline">{hero.headline}</h1>
            <p className="dsk-auth-sub">{hero.sub}</p>
            <ul className="dsk-auth-features">
              {hero.features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.text} className="dsk-auth-feature">
                    <span className="dsk-auth-feature-icon" aria-hidden>
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <span>{feature.text}</span>
                  </li>
                );
              })}
            </ul>
            <div className="dsk-auth-editorial-spacer" aria-hidden />
            <blockquote className="dsk-auth-quote">
              <p className="dsk-auth-quote-text">&ldquo;{testimonial.quote}&rdquo;</p>
              <footer className="dsk-auth-quote-author">
                {testimonial.author}
                <span className="dsk-auth-quote-role"> · {testimonial.role}</span>
              </footer>
            </blockquote>
          </aside>

          <section className="dsk-auth-form-panel" aria-label="Sign in or sign up">
            <div className="dsk-auth-form-topbar">
              <div className="dsk-auth-topbar-actions">
                {onChangeTheme ? <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" /> : null}
                {onOpenGuide ? (
                  <button type="button" onClick={onOpenGuide} className="dsk-auth-back" aria-label="Open guide">
                    <BookOpen className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="dsk-auth-form-scroll">
              <div className={`dsk-auth-form-inner animate-fade-in${isSignUp ? ' dsk-auth-form-inner--wide' : ''}`}>
                {authFormBody}
              </div>
            </div>
          </section>
        </div>
        </>
      ) : isTabletAuth ? (
        <div className="sft-auth">
          <AuthTabletTopBar
            onBack={handleAuthBack}
            backAriaLabel={formatBackToLabel(authBackLabel)}
            trailing={authTopbarActions}
          />
          <div className="sft-auth-split">
            <aside className="sft-auth-editorial">
              <p className="sft-auth-kicker">{hero.trustLine}</p>
              <h1 className="sft-auth-headline">{hero.headline}</h1>
              <p className="sft-auth-sub">{hero.sub}</p>
              <ul className="sft-auth-features">
                {hero.features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <li key={feature.text} className="sft-auth-feature">
                      <span className="sft-auth-feature-icon" aria-hidden>
                        <Icon size={18} strokeWidth={2} />
                      </span>
                      <span>{feature.text}</span>
                    </li>
                  );
                })}
              </ul>
              <blockquote className="sft-auth-quote">
                <p className="sft-auth-quote-text">&ldquo;{testimonial.quote}&rdquo;</p>
                <footer className="sft-auth-quote-author">
                  {testimonial.author}
                  <span className="sft-auth-quote-role"> · {testimonial.role}</span>
                </footer>
              </blockquote>
            </aside>
            <section
              className={`sft-auth-form-panel${isSignUp ? ' sft-auth-form-panel--wide' : ''}`}
              aria-label={isSignUp ? 'Create account' : 'Sign in'}
            >
              <div className="sft-auth-form-card animate-fade-in">{authFormBody}</div>
            </section>
          </div>
        </div>
      ) : (
        <div className="auth-role-choice-page auth-form-page">
          <AuthMobileTopBar
            onBack={handleAuthBack}
            backAriaLabel={formatBackToLabel(authBackLabel)}
            trailing={authTopbarActions}
          />
          <main className="auth-role-choice-main">
            <section
              className="auth-role-choice-hero auth-form-page-hero"
              aria-label={isSignUp ? 'Create account' : 'Sign in'}
            >
              <div className="auth-form-page-hero-inner">{authFormHeader}</div>
            </section>
            <section className="auth-role-choice-options auth-form-page-options">
              <div className="auth-form-page-form w-full animate-fade-in">{authFormFields}</div>
            </section>
          </main>
        </div>
      )}
    </div>
  );
}
