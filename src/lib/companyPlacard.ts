import { LEGAL_ENTITY_NAME } from './siteConfig';

/** Catalog ids for company credentials shown on the public placard. */
export type CompanyDocumentTypeId =
  | 'business_entity_registration'
  | 'general_liability_insurance'
  | 'professional_liability_insurance'
  | 'workers_comp_insurance'
  | 'business_license';

export interface CompanyDocumentTypeDef {
  id: CompanyDocumentTypeId;
  title: string;
  description: string;
  required: boolean;
  numberLabel: string;
  issuerLabel: string;
}

export interface CompanyPublicDocument {
  id: string;
  documentType: CompanyDocumentTypeId;
  title: string;
  documentNumber?: string;
  issuer?: string;
  issuedDate?: string;
  expiryDate?: string;
  imageUrl?: string;
  displayOnHomepage: boolean;
  notes?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  updatedAt?: string;
}

export type CompanyPlacardItemStatus = 'on_file' | 'missing' | 'expiring_soon' | 'expired';

export interface CompanyPlacardChecklistItem {
  type: CompanyDocumentTypeDef;
  document?: CompanyPublicDocument;
  status: CompanyPlacardItemStatus;
  detail: string;
}

export const COMPANY_DOCUMENT_TYPES: CompanyDocumentTypeDef[] = [
  {
    id: 'business_entity_registration',
    title: 'Business Entity Registration',
    description:
      'State filing confirming Signature Security Specialist, LLC — Guardr is a technology marketplace, not a licensed security company.',
    required: true,
    numberLabel: 'Entity / filing number',
    issuerLabel: 'State of formation',
  },
  {
    id: 'general_liability_insurance',
    title: 'General Liability Insurance (COI)',
    description: 'Certificate of insurance covering general liability for platform operations.',
    required: true,
    numberLabel: 'Policy number',
    issuerLabel: 'Insurance carrier',
  },
  {
    id: 'professional_liability_insurance',
    title: 'Professional / E&O Liability Insurance',
    description: 'Technology or errors-and-omissions coverage for the Guardr platform (optional).',
    required: false,
    numberLabel: 'Policy number',
    issuerLabel: 'Insurance carrier',
  },
  {
    id: 'workers_comp_insurance',
    title: "Workers' Compensation Insurance",
    description: 'Required when the company has W-2 employees. Mark optional if not applicable.',
    required: false,
    numberLabel: 'Policy number',
    issuerLabel: 'Insurance carrier',
  },
  {
    id: 'business_license',
    title: 'City / County Business License',
    description: 'Local business operating license for your primary place of business.',
    required: false,
    numberLabel: 'License number',
    issuerLabel: 'Issuing city or county',
  },
];

const EXPIRING_SOON_DAYS = 45;

/** Alert tiers used for executive notifications (cron + inbox). */
export type CompanyPlacardAlertTier = 'missing' | 'expired' | '45' | '30' | '14' | '7' | '1';

export function companyPlacardDaysUntilExpiry(expiryDate: string, now = new Date()): number | null {
  const expiry = new Date(`${expiryDate}T23:59:59`);
  if (Number.isNaN(expiry.getTime())) return null;
  return (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
}

export function companyPlacardExpiryAlertTier(
  expiryDate: string | undefined,
  hasContent: boolean,
  required: boolean,
  now = new Date()
): CompanyPlacardAlertTier | null {
  if (!hasContent && required) return 'missing';
  if (!expiryDate?.trim()) return null;
  const daysUntil = companyPlacardDaysUntilExpiry(expiryDate, now);
  if (daysUntil == null) return null;
  if (daysUntil < 0) return 'expired';
  if (daysUntil <= 1) return '1';
  if (daysUntil <= 7) return '7';
  if (daysUntil <= 14) return '14';
  if (daysUntil <= 30) return '30';
  if (daysUntil <= EXPIRING_SOON_DAYS) return '45';
  return null;
}

export function companyPlacardAlertCopy(
  documentTitle: string,
  tier: CompanyPlacardAlertTier,
  expiryDate?: string
): { title: string; body: string; priority: 'normal' | 'high' } {
  const formattedExpiry = expiryDate ? formatPlacardDate(expiryDate) : undefined;
  switch (tier) {
    case 'missing':
      return {
        title: 'Company placard item needed',
        body: `${documentTitle} is required for the public company placard but has not been uploaded yet.`,
        priority: 'high',
      };
    case 'expired':
      return {
        title: 'Company credential expired',
        body: formattedExpiry
          ? `${documentTitle} expired on ${formattedExpiry}. Update it in Staff Settings.`
          : `${documentTitle} has expired. Update it in Staff Settings.`,
        priority: 'high',
      };
    case '1':
      return {
        title: 'Company credential expires tomorrow',
        body: formattedExpiry
          ? `${documentTitle} expires on ${formattedExpiry}.`
          : `${documentTitle} expires within 1 day.`,
        priority: 'high',
      };
    case '7':
      return {
        title: 'Company credential expiring soon',
        body: formattedExpiry
          ? `${documentTitle} expires on ${formattedExpiry} (within 7 days).`
          : `${documentTitle} expires within 7 days.`,
        priority: 'high',
      };
    case '14':
    case '30':
    case '45':
      return {
        title: 'Company credential renewal reminder',
        body: formattedExpiry
          ? `${documentTitle} expires on ${formattedExpiry}.`
          : `${documentTitle} is approaching its expiry date.`,
        priority: tier === '14' ? 'normal' : 'normal',
      };
    default:
      return {
        title: 'Company placard update',
        body: `${documentTitle} needs attention in Staff Settings.`,
        priority: 'normal',
      };
  }
}

export function companyDocumentTypeById(id: string): CompanyDocumentTypeDef | undefined {
  return COMPANY_DOCUMENT_TYPES.find((t) => t.id === id);
}

export function companyDocumentHasContent(doc: CompanyPublicDocument | undefined): boolean {
  if (!doc) return false;
  return Boolean(
    doc.documentNumber?.trim() ||
      doc.issuer?.trim() ||
      doc.imageUrl?.trim() ||
      doc.expiryDate?.trim()
  );
}

export function companyDocumentExpiryStatus(
  expiryDate?: string,
  now = new Date()
): 'valid' | 'expiring_soon' | 'expired' | 'none' {
  if (!expiryDate?.trim()) return 'none';
  const expiry = new Date(`${expiryDate}T23:59:59`);
  if (Number.isNaN(expiry.getTime())) return 'none';
  const msUntil = expiry.getTime() - now.getTime();
  if (msUntil < 0) return 'expired';
  const daysUntil = msUntil / (1000 * 60 * 60 * 24);
  if (daysUntil <= EXPIRING_SOON_DAYS) return 'expiring_soon';
  return 'valid';
}

export function companyPlacardItemStatus(
  doc: CompanyPublicDocument | undefined,
  required: boolean,
  now = new Date()
): CompanyPlacardItemStatus {
  if (!companyDocumentHasContent(doc)) {
    return required ? 'missing' : 'missing';
  }
  const expiry = companyDocumentExpiryStatus(doc?.expiryDate, now);
  if (expiry === 'expired') return 'expired';
  if (expiry === 'expiring_soon') return 'expiring_soon';
  return 'on_file';
}

export function companyPlacardStatusDetail(
  status: CompanyPlacardItemStatus,
  doc?: CompanyPublicDocument
): string {
  switch (status) {
    case 'on_file':
      if (doc?.expiryDate) {
        return `On file · expires ${formatPlacardDate(doc.expiryDate)}`;
      }
      return 'On file';
    case 'expiring_soon':
      return doc?.expiryDate
        ? `Expires ${formatPlacardDate(doc.expiryDate)} — renew soon`
        : 'Expiring soon';
    case 'expired':
      return doc?.expiryDate
        ? `Expired ${formatPlacardDate(doc.expiryDate)}`
        : 'Expired — update required';
    case 'missing':
    default:
      return 'Not uploaded yet';
  }
}

export function buildCompanyPlacardChecklist(
  documents: CompanyPublicDocument[],
  now = new Date()
): CompanyPlacardChecklistItem[] {
  const byType = new Map(documents.map((d) => [d.documentType, d]));
  return COMPANY_DOCUMENT_TYPES.map((type) => {
    const document = byType.get(type.id);
    const status = companyPlacardItemStatus(document, type.required, now);
    return {
      type,
      document,
      status,
      detail: companyPlacardStatusDetail(status, document),
    };
  });
}

export function companyPlacardChecklistSummary(checklist: CompanyPlacardChecklistItem[]): {
  requiredTotal: number;
  requiredOnFile: number;
  requiredMissing: number;
  expiringOrExpired: number;
} {
  const required = checklist.filter((item) => item.type.required);
  const requiredOnFile = required.filter((item) => item.status === 'on_file').length;
  const requiredMissing = required.filter(
    (item) => item.status === 'missing' || item.status === 'expired'
  ).length;
  const expiringOrExpired = checklist.filter(
    (item) => item.status === 'expiring_soon' || item.status === 'expired'
  ).length;
  return {
    requiredTotal: required.length,
    requiredOnFile,
    requiredMissing,
    expiringOrExpired,
  };
}

export function getCompanyPlacardPublicItems(
  documents: CompanyPublicDocument[],
  publicEnabled: boolean,
  now = new Date()
): CompanyPublicDocument[] {
  if (!publicEnabled) return [];
  return documents
    .filter(
      (doc) =>
        doc.displayOnHomepage &&
        companyDocumentHasContent(doc) &&
        companyDocumentExpiryStatus(doc.expiryDate, now) !== 'expired'
    )
    .sort((a, b) => {
      const aOrder = COMPANY_DOCUMENT_TYPES.findIndex((t) => t.id === a.documentType);
      const bOrder = COMPANY_DOCUMENT_TYPES.findIndex((t) => t.id === b.documentType);
      return aOrder - bOrder;
    });
}

export function shouldShowCompanyPlacard(
  documents: CompanyPublicDocument[],
  publicEnabled: boolean
): boolean {
  if (!publicEnabled) return false;
  return getCompanyPlacardPublicItems(documents, true).length > 0;
}

export function formatPlacardDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function companyPlacardHeadline(): string {
  return `${LEGAL_ENTITY_NAME} — Registered & insured`;
}

export function companyPublicDocumentFromRow(row: Record<string, unknown>): CompanyPublicDocument {
  return {
    id: String(row.id),
    documentType: String(row.document_type) as CompanyDocumentTypeId,
    title: String(row.title ?? ''),
    documentNumber: row.document_number ? String(row.document_number) : undefined,
    issuer: row.issuer ? String(row.issuer) : undefined,
    issuedDate: row.issued_date ? String(row.issued_date).slice(0, 10) : undefined,
    expiryDate: row.expiry_date ? String(row.expiry_date).slice(0, 10) : undefined,
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    displayOnHomepage: row.display_on_homepage !== false,
    notes: row.notes ? String(row.notes) : undefined,
    uploadedAt: row.uploaded_at ? String(row.uploaded_at) : undefined,
    uploadedBy: row.uploaded_by ? String(row.uploaded_by) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export function companyPublicDocumentToDbRow(
  doc: CompanyPublicDocument
): Record<string, unknown> {
  return {
    id: doc.id,
    document_type: doc.documentType,
    title: doc.title,
    document_number: doc.documentNumber?.trim() || null,
    issuer: doc.issuer?.trim() || null,
    issued_date: doc.issuedDate?.trim() || null,
    expiry_date: doc.expiryDate?.trim() || null,
    image_url: doc.imageUrl || null,
    display_on_homepage: doc.displayOnHomepage,
    notes: doc.notes?.trim() || '',
    uploaded_at: doc.uploadedAt || null,
    uploaded_by: doc.uploadedBy || null,
    updated_at: doc.updatedAt || new Date().toISOString(),
  };
}

export function newCompanyPublicDocumentId(): string {
  return `cpd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
