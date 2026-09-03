export const SERVICE_TYPE_OPTIONS = [
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

export const SECURITY_COMPANY_SERVICE_TYPE_OPTIONS = [
  'Mobile patrol',
  'Standing guard',
  'Event staffing',
  'Executive protection',
  'Construction / site security',
  'Alarm response',
  'Retail / loss prevention',
  'Other',
] as const;

export const PROPERTY_TYPE_OPTIONS = [
  'Home / residence',
  'Private event',
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
  'Nightclub / bar',
  'Other',
] as const;

export const INDUSTRY_OPTIONS = [
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

export const ENGAGEMENT_TYPE_OPTIONS = [
  { value: 'one-time', label: 'One-time event' },
  { value: 'recurring', label: 'Ongoing / recurring' },
  { value: 'temporary', label: 'Temporary / short-term' },
] as const;

export const BUSINESS_TYPE_OPTIONS = [
  'LLC',
  'Corporation',
  'Sole Proprietor',
  'Partnership',
  'Non-profit',
  'Government / Public agency',
  'Individual',
  'Other',
] as const;

export const HOW_HEARD_OPTIONS = [
  'Referred by a guard or staff member',
  'Google / web search',
  'Social media',
  'Word of mouth',
  'Industry event',
  'Advertisement',
  'Other',
] as const;
