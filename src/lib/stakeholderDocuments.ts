import { apiUrl } from './siteConfig';

/** Management+ printable stakeholder documents — counsel, advisors, investors. */

export const STAKEHOLDER_DOCS_BASE_PATH = '/stakeholder';
export const STAKEHOLDER_DOWNLOAD_PAGE_PATH = '/stakeholder/';

export type StakeholderDocumentId =
  | 'executive-summary'
  | 'company-package'
  | 'counsel-intake';

export interface StakeholderDocument {
  id: StakeholderDocumentId;
  title: string;
  description: string;
  fileName: string;
  href: string;
  /** In-app markdown source (if viewable in browser) */
  markdownSource?: 'executive-summary' | 'company-package';
  /** Open HTML intake form in new tab for digital fill-in */
  htmlPath?: string;
}

export const STAKEHOLDER_DOCUMENTS: StakeholderDocument[] = [
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    description: 'One-page printable briefing — company, market, model, funding.',
    fileName: 'Guardr-Executive-Summary.pdf',
    href: `${STAKEHOLDER_DOCS_BASE_PATH}/Guardr-Executive-Summary.pdf`,
    markdownSource: 'executive-summary',
  },
  {
    id: 'company-package',
    title: 'Company Information Package',
    description: 'Full head-to-toe stakeholder briefing (legal, advisors, investors).',
    fileName: 'Guardr-Company-Information-Package.pdf',
    href: `${STAKEHOLDER_DOCS_BASE_PATH}/Guardr-Company-Information-Package.pdf`,
    markdownSource: 'company-package',
  },
  {
    id: 'counsel-intake',
    title: 'Legal Counsel Intake Form',
    description: 'Fillable form for external legal advisors — complete before consultation.',
    fileName: 'Guardr-Counsel-Intake-Form.pdf',
    href: `${STAKEHOLDER_DOCS_BASE_PATH}/Guardr-Counsel-Intake-Form.pdf`,
    htmlPath: '/stakeholder/Guardr-Counsel-Intake-Form.html',
  },
];

export function resolveStakeholderPdfUrl(hrefOrFileName: string): string {
  const path = hrefOrFileName.startsWith('/')
    ? hrefOrFileName
    : `${STAKEHOLDER_DOCS_BASE_PATH}/${hrefOrFileName.replace(/^\/+/, '')}`;
  return apiUrl(path);
}

/** Public website download hub — /stakeholder/ */
export function resolveStakeholderDownloadPageUrl(): string {
  return apiUrl(STAKEHOLDER_DOWNLOAD_PAGE_PATH);
}
