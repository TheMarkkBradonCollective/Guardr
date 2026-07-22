import React, { useState, useEffect, useRef } from 'react';
import { CALIFORNIA_CITIES, DEFAULT_CALIFORNIA_CITY } from '../lib/californiaCities';
import {
  checkCityAccessForRole,
  defaultSelectableCity,
  getSignupCityNames,
} from '../lib/platformCities';
import { Logo } from './Logo';
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
import { AppErrorBanner } from './ui/app/AppPrimitives';
import { AppButton } from './ui/AppButton';
import { GuardrSheet } from './baseui/overlays/GuardrSheet';
import { AuthFormHeader } from './auth/AuthFormChrome';
import { personNameFromPayload } from '../lib/personName';
import { SessionUser, SecurityGuard, Client, GUARD_SPECIALTY_OPTIONS } from '../types';
import { ROLE_LABELS } from '../lib/permissions';
import type { LegalPageId } from '../lib/legalContent';
import { LEGAL_ENTITY_NAME, SITE_NAME } from '../lib/siteConfig';
import { legalDocumentLabel, requiredLegalDocumentsForRole } from '../lib/legalContent';
import { LegalFooterLinks } from './legal/LegalFooterLinks';
import { UberDirectTopHeader } from './baseui/layout/UberDirectTopHeader';
import {
  getStoredPassword,
  shouldPromptPasswordChange,
  verifyAccountPassword,
} from '../lib/accountPasswords';
import { signInWithCredentials } from '../lib/auth/authService';
import type { ThemeMode } from '../lib/platform/theme';
import { useDevice } from '../lib/platform';
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

const SERVICE_TYPE_OPTIONS = [
  'Event security',
  'Site patrol',
  'Access control',
  'Executive protection',
  'Armed transport',
  'Loss prevention / retail',
  'Construction site',
  'Residential / HOA',
  'Corporate / office',
  'Hospital / healthcare',
  'School / campus',
  'Fire watch',
  'Other',
] as const;

const PROPERTY_TYPE_OPTIONS = [
  'Retail storefront',
  'Office building',
  'Warehouse / industrial',
  'Residential / HOA',
  'Event venue',
  'Construction site',
  'Hospital / healthcare',
  'School / campus',
  'Restaurant / bar',
  'Hotel / hospitality',
  'Other',
] as const;

const INDUSTRY_OPTIONS = [
  'Retail',
  'Hospitality & events',
  'Construction',
  'Healthcare',
  'Education',
  'Corporate / office',
  'Government',
  'Logistics / warehouse',
  'Entertainment & nightlife',
  'Real estate / property',
  'Non-profit',
  'Other',
] as const;

const ENGAGEMENT_TYPE_OPTIONS = [
  { value: 'one-time', label: 'One-time event' },
  { value: 'recurring', label: 'Ongoing / recurring' },
  { value: 'temporary', label: 'Temporary / short-term' },
] as const;

const BUSINESS_TYPE_OPTIONS = [
  'LLC',
  'Corporation',
  'Sole Proprietor',
  'Partnership',
  'Non-profit',
  'Government / Public agency',
  'Individual',
  'Other',
] as const;

const HOW_HEARD_OPTIONS = [
  'Referred by a guard or staff member',
  'Google / web search',
  'Social media',
  'Word of mouth',
  'Industry event',
  'Advertisement',
  'Other',
] as const;

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
    sub: 'Review applications, monitor jobs, and support clients and guards from one staff workspace.',
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
  onOpenLegal?: (page: LegalPageId) => void;
  onOpenGuide?: () => void;
  onAuthModeChange?: (mode: 'sign-in' | 'sign-up') => void;
  onAuthRoleChange?: (role: 'guard' | 'client' | 'staff') => void;
  initialRole?: 'guard' | 'client' | 'staff';
  initialMode?: 'sign-in' | 'sign-up';
  themeMode?: ThemeMode;
  onChangeTheme?: (mode: ThemeMode) => void;
  isDbConnected?: boolean;
  isAppLoading?: boolean;
  /** Full-page auth (browser) or bottom sheet over app home (PWA/APK). */
  presentation?: 'page' | 'sheet';
  /** Sheet visibility — only used when presentation is sheet. */
  open?: boolean;
}

/** Lightweight person entry for the referredBy autocomplete */
interface ReferralPerson {
  id: string;
  name: string;
  role: 'guard' | 'staff';
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
  onOpenLegal,
  onOpenGuide,
  onAuthModeChange,
  onAuthRoleChange,
  initialRole = 'client',
  initialMode = 'sign-in',
  themeMode = 'light',
  onChangeTheme,
  isDbConnected = false,
  isAppLoading = false,
  presentation = 'page',
  open = true,
}: AuthPageProps) {
  const isSheet = presentation === 'sheet';
  const { formFactor, shellKind, viewSurface } = useDevice();
  const isDesktopAuth = !isSheet && formFactor === 'desktop';
  const [isSignUp, setIsSignUp] = useState<boolean>(initialMode === 'sign-up');
  const [role, setRole] = useState<'guard' | 'client' | 'staff'>(
    initialRole === 'guard' || initialRole === 'staff' ? initialRole : 'client'
  );
  const [errorMsg, setErrorMsg] = useState<string>('');
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
    setErrorMsg('');
  }, [initialRole, initialMode]);

  const signupCities = getSignupCityNames();

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
        setErrorMsg('Choose Guard, Client, or Staff from the previous screen to continue.');
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
          bio: 'Support — Platform operations.',
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
        setErrorMsg('Staff application submitted. A Director will review your account before you can sign in.');
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
        const company = clientCompanyName.trim();
        const clientProfile: Client = {
          id: randomId,
          name: normalized.name,
          firstName: normalized.firstName,
          middleName: normalized.middleName,
          lastName: normalized.lastName,
          email: emailLower,
          companyName: company,
          phone: phone.trim() || '',
          avatar: '',
          totalRequests: 0,
          approved: false,
          accountStatus: 'pending',

          businessType: businessType || undefined,
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
      const extraCities = guardExtraCities
        .split(',')
        .map((city) => city.trim())
        .filter(Boolean);
      const serviceAreas = normalizeGuardServiceAreas([guardPrimaryCity, ...extraCities]);

      const newGuardProfile: SecurityGuard = {
        id: randomId,
        name: normalized.name,
        firstName: normalized.firstName,
        middleName: normalized.middleName,
        lastName: normalized.lastName,
        email,
        badgeNumber: `GR-${Math.floor(10000 + Math.random() * 90000)}`,
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
        setErrorMsg('This is a client account. Use Log in as client.');
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

  const heroContent = AUTH_HERO_CONTENT[role];
  const testimonial = AUTH_TESTIMONIAL[role];
  const isMobilePageAuth = !isSheet && !isDesktopAuth;
  const useMobileLogoLayout = isMobilePageAuth && formFactor === 'mobile';
  const useFocusedAuthHeader = isDesktopAuth || isMobilePageAuth || (isSheet && !isSignUp);

  const authFormBody = (
    <>
      <div className={!isDesktopAuth ? 'auth-sheet-form' : undefined}>
        <AuthFormHeader
          role={role}
          isSignUp={isSignUp}
          compact={isSheet || isMobilePageAuth}
          hideBadge={useFocusedAuthHeader}
          center={isDesktopAuth || isMobilePageAuth || (isSheet && !isSignUp)}
          variant={useFocusedAuthHeader ? 'page' : 'sheet'}
        />

        <div className={!isDesktopAuth ? 'auth-sheet-fields' : 'space-y-5'}>
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
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isSignUp && role === 'staff' && (
                <div className="space-y-5 pt-4 border-t border-brand-border">
                  <p className="uber-label">Staff application</p>
                  <p className="text-xs text-brand-text-muted leading-relaxed -mt-2">
                    New staff start as Support. A Director reviews your application before you can sign in.
                  </p>
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
                </div>
              )}

              {isSignUp && role === 'guard' && (
                <div className="space-y-5 pt-4 border-t border-brand-border">
                  <p className="uber-label">Guard application</p>
                  <p className="text-xs text-brand-text-muted leading-relaxed -mt-2">
                    A short application so staff can review your fit before you upload credentials.
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
                          {signupCities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                      </div>
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

                  {/* ── Contact & Business ── */}
                  <p className="uber-label">Business &amp; contact</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="uber-label block mb-2">Phone <span className="font-normal">(optional)</span></label>
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
                    <div>
                      <label className="uber-label block mb-2">Company name <span className="font-normal">(optional)</span></label>
                      <input
                        type="text"
                        placeholder="Acme Corp"
                        value={clientCompanyName}
                        onChange={(e) => setClientCompanyName(e.target.value)}
                        className="uber-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="uber-label block mb-2">Business type <span className="font-normal">(optional)</span></label>
                    <div className="relative">
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="uber-input appearance-none pr-8"
                      >
                        <option value="">Select…</option>
                        {BUSINESS_TYPE_OPTIONS.map((o) => (
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
                    <label className="uber-label block mb-2">Budget range <span className="font-normal">(optional)</span></label>
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
                  </div>

                  {/* ── Location ── */}
                  <p className="uber-label pt-2 border-t border-brand-border">Location</p>
                  <div>
                    <label className="uber-label block mb-2">Primary city of operations</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                      <select
                        value={serviceCity}
                        onChange={(e) => handleClientCityChange(e.target.value)}
                        className="uber-select pl-10"
                      >
                        {signupCities.map((city) => (
                          <option key={city} value={city}>{city}, CA</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                    </div>
                    {clientCityAccessMsg && (
                      <p className="text-xs text-amber-400 mt-1.5">{clientCityAccessMsg}</p>
                    )}
                    <p className="text-xs text-brand-text-muted mt-1.5">Guardr operates in California only. All licensing follows CA BSIS rules.</p>
                  </div>
                  <div>
                    <label className="uber-label block mb-2">Property type <span className="font-normal">(optional — select all that apply)</span></label>
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
                <label className="legal-accept-row cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="app-checkbox mt-0.5"
                  />
                  <span>
                    I agree to the{' '}
                    {onOpenLegal ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenLegal('terms')}
                          className="font-semibold text-brand-primary hover:underline"
                        >
                          Terms of Service
                        </button>{' '}
                        and{' '}
                        <button
                          type="button"
                          onClick={() => onOpenLegal('privacy')}
                          className="font-semibold text-brand-primary hover:underline"
                        >
                          Privacy Policy
                        </button>
                      </>
                    ) : (
                      'Terms of Service and Privacy Policy'
                    )}
                    . I understand {SITE_NAME} is a technology platform operated by {LEGAL_ENTITY_NAME},
                    not a security services provider or employer of guards. I also accept the{' '}
                    {requiredLegalDocumentsForRole(role)
                      .filter((id) => id !== 'terms' && id !== 'privacy')
                      .map((id, index, arr) => (
                        <React.Fragment key={id}>
                          {onOpenLegal ? (
                            <button
                              type="button"
                              onClick={() => onOpenLegal(id)}
                              className="font-semibold text-brand-primary hover:underline"
                            >
                              {legalDocumentLabel(id)}
                            </button>
                          ) : (
                            legalDocumentLabel(id)
                          )}
                          {index < arr.length - 1 ? ' and ' : ''}
                        </React.Fragment>
                      ))}
                    .
                  </span>
                </label>
              )}

              <AppButton type="submit" fullWidth className={isSheet ? 'auth-sheet-submit mt-3' : 'mt-3'}>
                {isSignUp ? 'Create account' : 'Sign in'}
                <ArrowRight className="w-4 h-4" />
              </AppButton>
            </form>
        </div>

        {onOpenLegal && !isDesktopAuth && (
          <div className={isSheet ? 'auth-sheet-legal' : `flex justify-center ${isSheet ? 'mt-6' : 'mt-8'}`}>
            <LegalFooterLinks onOpenLegal={onOpenLegal} />
          </div>
        )}
      </div>
    </>
  );

  if (isSheet) {
    return (
      <GuardrSheet
        open={open}
        onClose={onBackToHome}
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
            onClick={onBackToHome}
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
      className={`page-shell h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden auth-experience auth-experience--uber${isDesktopAuth ? ' dsk-auth' : ''}${useMobileLogoLayout ? ' auth-experience--mobile-page' : ''}`}
      id="guardr-auth-root"
    >
      {isDesktopAuth ? (
        <>
          <UberDirectTopHeader
            onBrandClick={onBackToHome}
            trailing={
              <button type="button" onClick={onBackToHome} className="dsk-auth-back">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </button>
            }
          />
        <div className="dsk-auth-split">
          <aside className="dsk-auth-editorial">
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
              <div className="dsk-auth-form-inner animate-fade-in">
                {authFormBody}
              </div>
            </div>
          </section>
        </div>
        </>
      ) : useMobileLogoLayout ? (
        <div className="auth-mobile-page">
          <header className="auth-mobile-page-topbar">
            <button
              type="button"
              onClick={onBackToHome}
              className="auth-mobile-page-back"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden />
              Back to Home
            </button>
            <div className="auth-mobile-page-topbar-actions">
              {onChangeTheme ? <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" /> : null}
              {onOpenGuide ? (
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="auth-mobile-page-guide"
                  aria-label="Open guide"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </header>

          <div className="auth-mobile-page-scroll">
            <div className="auth-mobile-page-logo-wrap" aria-hidden>
              <Logo variant="wordmark" size={88} className="auth-mobile-page-logo" />
            </div>
            <div className="auth-mobile-page-form w-full max-w-md mx-auto animate-fade-in">
              {authFormBody}
            </div>
          </div>
        </div>
      ) : (
        <>
      <div className="auth-hero relative h-44 sm:h-52 shrink-0 overflow-hidden">
        <div className="auth-hero-curve absolute inset-x-0 -bottom-px h-3 bg-brand-bg" />
        <header className="relative z-10 px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-white/75 hover:text-white transition-colors text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="flex items-center gap-2 text-white">
            <Logo size={26} className="text-white" />
            <span className="font-black text-lg tracking-[-0.04em]">Guardr</span>
          </div>
          <div className="w-14 flex justify-end items-center gap-1">
            {onChangeTheme && (
              <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" />
            )}
            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                className="inline-flex items-center gap-1 text-white/75 hover:text-white transition-colors text-xs font-semibold"
                aria-label="Open guide"
              >
                <BookOpen className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, color-mix(in srgb, ${theme.colors.accent} 45%, transparent) 0%, transparent 70%)` }}
          />
        </div>
        <heroContent.icon className="auth-hero-watermark" strokeWidth={1} aria-hidden="true" />
        <div className="auth-hero-content">
          <span className="auth-hero-icon-badge shrink-0">
            <heroContent.icon className="w-6 h-6" strokeWidth={1.75} />
          </span>
          <div className="auth-hero-headline-block">
            <h2 className="auth-hero-headline">{heroContent.headline}</h2>
            <p className="auth-hero-sub">{heroContent.sub}</p>
          </div>
          <ul className="auth-hero-feature-list" role="list">
            {heroContent.features.map(({ icon: Icon, text }) => (
              <li key={text} className="auth-hero-feature">
                <span className="auth-hero-feature-icon">
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                </span>
                <span className="auth-hero-feature-text">{text}</span>
              </li>
            ))}
          </ul>
          <p className="auth-hero-trust-line">{heroContent.trustLine}</p>
        </div>
      </div>

      <div className="auth-form-scroll flex flex-1 min-h-0 items-start justify-center px-5 py-6 sm:py-10">
        <div className="auth-form-surface-flat w-full max-w-md animate-fade-in">
          {authFormBody}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
