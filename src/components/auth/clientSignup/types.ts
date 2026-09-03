import type { RefObject } from 'react';
import type { ClientType } from '../../../types';
import type { SecurityGuard } from '../../../types';

export interface ReferralPerson {
  id: string;
  name: string;
  role: 'guard' | 'staff';
}

export interface ClientSignupFormState {
  clientKind: ClientType;
  phone: string;
  clientCompanyName: string;
  businessType: string;
  industries: string[];
  businessLicense: string;
  website: string;
  serviceDescription: string;
  serviceTypes: string[];
  estimatedGuardsNeeded: string;
  armedPreference: string;
  serviceFrequencies: string[];
  estimatedStartDate: string;
  budgetRange: string;
  serviceCity: string;
  propertyTypes: string[];
  referredByText: string;
  referredById: string;
  referralSuggestionsOpen: boolean;
  howHeardAboutUs: string;
  hasPriorSecurityService: '' | 'yes' | 'no';
  priorSecurityProvider: string;
  specialRequirements: string;
}

export interface ClientSignupIntakeProps extends ClientSignupFormState {
  clientSignupCities: string[];
  clientCityAccessMsg: string;
  guardsList: SecurityGuard[];
  referralRef: RefObject<HTMLDivElement | null>;
  onPhoneChange: (value: string) => void;
  onClientCompanyNameChange: (value: string) => void;
  onBusinessTypeChange: (value: string) => void;
  onIndustriesChange: (value: string[]) => void;
  onBusinessLicenseChange: (value: string) => void;
  onWebsiteChange: (value: string) => void;
  onServiceDescriptionChange: (value: string) => void;
  onServiceTypesChange: (value: string[]) => void;
  onEstimatedGuardsNeededChange: (value: string) => void;
  onArmedPreferenceChange: (value: string) => void;
  onServiceFrequenciesChange: (value: string[]) => void;
  onEstimatedStartDateChange: (value: string) => void;
  onBudgetRangeChange: (value: string) => void;
  onServiceCityChange: (city: string) => void;
  onPropertyTypesChange: (value: string[]) => void;
  onReferredByTextChange: (value: string) => void;
  onReferredByIdChange: (value: string) => void;
  onReferralSuggestionsOpenChange: (open: boolean) => void;
  onHowHeardAboutUsChange: (value: string) => void;
  onHasPriorSecurityServiceChange: (value: '' | 'yes' | 'no') => void;
  onPriorSecurityProviderChange: (value: string) => void;
  onSpecialRequirementsChange: (value: string) => void;
}
