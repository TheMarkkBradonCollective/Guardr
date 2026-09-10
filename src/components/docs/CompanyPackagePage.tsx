import React, { useCallback, useState } from 'react';
import companyPackageMarkdown from '../../../docs/company-information-package.md?raw';
import executiveSummaryMarkdown from '../../../docs/executive-summary.md?raw';
import { MarkdownDoc } from './MarkdownDoc';
import { StakeholderDocumentDownloads } from './StakeholderDocumentDownloads';
import { AppScreen, AppScreenTitle } from '../ui/app/AppPrimitives';
import { StaffOpsPageShell } from '../staff/StaffOpsPageShell';
import { useLayoutFormFactor } from '../../surfaces';

type PackageView = 'package' | 'executive-summary' | 'downloads';

const VIEW_TITLES: Record<PackageView, string> = {
  package: 'Company information package',
  'executive-summary': 'Executive summary',
  downloads: 'Print & download',
};

export function CompanyPackagePage() {
  const formFactor = useLayoutFormFactor();
  const isDesktop = formFactor === 'desktop';
  const [view, setView] = useState<PackageView>('downloads');

  const onViewMarkdown = useCallback((source: 'executive-summary' | 'company-package') => {
    setView(source === 'executive-summary' ? 'executive-summary' : 'package');
  }, []);

  const tabBar = (
    <div className="flex flex-wrap gap-2 mb-4">
      {(['downloads', 'executive-summary', 'package'] as PackageView[]).map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => setView(id)}
          className={
            view === id
              ? 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary text-white'
              : 'px-3 py-1.5 rounded-lg text-xs font-semibold border border-brand-border text-brand-text hover:bg-brand-bg-sec'
          }
        >
          {VIEW_TITLES[id]}
        </button>
      ))}
    </div>
  );

  const body = (
    <>
      {tabBar}
      {view === 'downloads' ? (
        <StakeholderDocumentDownloads variant="embedded" onViewMarkdown={onViewMarkdown} />
      ) : null}
      {view === 'executive-summary' ? (
        <div className="company-package-print-area">
          <MarkdownDoc source={executiveSummaryMarkdown} />
        </div>
      ) : null}
      {view === 'package' ? (
        <div className="company-package-print-area">
          <MarkdownDoc source={companyPackageMarkdown} />
        </div>
      ) : null}
    </>
  );

  const intro = (
    <p className="text-sm text-brand-text-muted mb-4 leading-relaxed">
      Signature Security Specialist, LLC — stakeholder briefing materials for legal counsel, advisors,
      and investors. Manager roles and above only.
    </p>
  );

  if (isDesktop) {
    return (
      <StaffOpsPageShell
        className="staff-mgmt-panel staff-roster-panel adm-platform-page adm-company-package-page"
        toolbar={
          <div>
            <p className="adm-card-eyebrow">Executive</p>
            <p className="uber-workbench-subtitle">
              Company package, one-page executive summary, and legal counsel intake form.
            </p>
          </div>
        }
      >
        <div className="adm-business-plan-doc max-w-4xl">
          {intro}
          {body}
        </div>
      </StaffOpsPageShell>
    );
  }

  if (formFactor === 'tablet') {
    return (
      <StaffOpsPageShell className="sft-company-package">
        <div className="sft-company-package-main px-4 pb-8">
          {intro}
          {body}
        </div>
      </StaffOpsPageShell>
    );
  }

  return (
    <AppScreen className="h-full overflow-y-auto overscroll-contain max-w-3xl">
      <AppScreenTitle>Company package</AppScreenTitle>
      <div className="px-4 pb-8">
        {intro}
        {body}
      </div>
    </AppScreen>
  );
}
