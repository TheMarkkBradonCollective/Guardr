import React from 'react';
import businessPlanMarkdown from '../../../docs/business-plan.md?raw';
import { MarkdownDoc } from './MarkdownDoc';
import { AppScreen, AppScreenTitle } from '../ui/app/AppPrimitives';
import { StaffOpsPageShell } from '../staff/StaffOpsPageShell';
import { useLayoutFormFactor } from '../../surfaces';

export function BusinessPlanPage() {
  const formFactor = useLayoutFormFactor();
  const isDesktop = formFactor === 'desktop';

  const mobileContent = (
    <>
      <AppScreenTitle>Business plan</AppScreenTitle>
      <div className="px-4 pb-8">
        <p className="text-sm text-brand-text-muted mb-6 leading-relaxed">
          Signature Security Specialist, LLC — strategic plan for Guardr. Manager roles and above only.
        </p>
        <MarkdownDoc source={businessPlanMarkdown} />
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <StaffOpsPageShell
        className="staff-mgmt-panel staff-roster-panel adm-platform-page adm-business-plan-page"
        toolbar={
          <div>
            <p className="adm-card-eyebrow">Executive</p>
            <p className="uber-workbench-subtitle">
              Market analysis, unit economics, go-to-market strategy, and financial projections.
            </p>
          </div>
        }
      >
        <div className="adm-business-plan-doc max-w-4xl">
          <MarkdownDoc source={businessPlanMarkdown} />
        </div>
      </StaffOpsPageShell>
    );
  }

  if (formFactor === 'tablet') {
    return (
      <StaffOpsPageShell className="sft-business-plan">
        <div className="sft-business-plan-main px-4 pb-8">
          <p className="text-sm text-brand-text-muted mb-6 leading-relaxed">
            Signature Security Specialist, LLC — strategic plan for Guardr. Manager roles and above only.
          </p>
          <MarkdownDoc source={businessPlanMarkdown} />
        </div>
      </StaffOpsPageShell>
    );
  }

  return (
    <AppScreen className="h-full overflow-y-auto overscroll-contain max-w-3xl">
      {mobileContent}
    </AppScreen>
  );
}
