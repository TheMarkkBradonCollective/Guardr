import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, RefreshCw, Search, ShieldCheck, X } from 'lucide-react';
import { Certification, SecurityGuard } from '../../types';
import { loadAuditLog } from '../../lib/auditLog';
import {
  buildStaffApprovalsFeed,
  filterApprovalsFeedByQueue,
  findFeedItem,
  formatApprovalTimestamp,
  countPendingCredentialReviews,
  countPendingCredentialUploads,
  countRejectedCredentials,
  resolveApprovalFocusItemId,
  resolveCredentialFeedContext,
  credentialFeedThumbnailUrl,
  type ApprovalFeedItem,
} from '../../lib/staffApprovalsFeed';
import {
  staffCanVerifyCertification,
  staffVerifyCertificationBlocker,
} from '../../lib/certImagePolicy';
import { approvalFeedItemMatchesSearch } from '../../lib/credentialSearch';
import {
  matchesCredentialStatusFilter,
  type CredentialStatusFilter,
} from '../../lib/staffListFilters';
import { certDisplayName } from '../../lib/certCatalog';
import { getGuardIdVerificationStatus } from '../../lib/guardIdentityVerification';
import { resolveInsuranceStatus } from '../../lib/guardInsurance';
import { promptStaffCredentialUpdateNote, promptStaffResubmitNote } from '../../lib/staffDocumentReview';
import { certHasPendingUpdate } from '../../lib/certRevisionHistory';
import { StaffCertReviewDetail } from './StaffCertReviewDetail';
import { StaffCoiReviewDetail } from './StaffCoiReviewDetail';
import { StaffGovIdReviewDetail } from './StaffGovIdReviewDetail';
import { StaffActivationReviewDetail } from './StaffActivationReviewDetail';
import { StaffIdReviewSection } from './StaffIdReviewSection';
import { AppEmptyState, AppItemCard, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { AppButton } from '../ui/AppButton';
import { AppBlockedAccessScreen } from '../ui/app/AppBlockedAccess';
import { STAFF_SECTION_ACCESS_MESSAGES } from '../../lib/staffNavAccess';
import { ListDetailLayout, useSplitListDetail } from '../ui/app/ListDetailLayout';
import { WfBadge, WfSearchBar } from '../ui/wireframe';
import { showAppToast } from '../ui/AppToast';
import { StaffListFilterTabs } from './StaffListFilterTabs';
import { StaffOpsPageShell } from './StaffOpsPageShell';
import { StaffCredentialAddForGuardForm } from './StaffCredentialAddForGuardForm';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import { useDevice } from '../../lib/platform';
import { StatusChip, type StatusTone } from '../baseui/StatusChip';
import { UberDataTable, type UberTableColumn } from '../baseui/UberDataTable';
import {
  WorkbenchEmpty,
  WorkbenchPage,
  WorkbenchPanel,
  WorkbenchSplit,
} from '../baseui/layout/WorkbenchLayout';

interface StaffCredentialsProps {
  guards: SecurityGuard[];
  canVerifyCredentials: boolean;
  initialItemId?: string | null;
  initialGuardId?: string | null;
  onItemIdChange?: (itemId: string | null) => void;
  onApproveCert: (guardId: string, certId: string) => void | Promise<void>;
  onRejectCert: (guardId: string, certId: string) => void | Promise<void>;
  onRequestCertUpdate?: (guardId: string, certId: string, staffNote?: string) => void | Promise<void>;
  onRequestCertImageResubmit?: (guardId: string, certId: string, staffNote?: string) => void | Promise<void>;
  onApproveIdentityVerification?: (guardId: string) => void | Promise<void>;
  onRejectIdentityVerification?: (guardId: string, reason?: string) => void | Promise<void>;
  onRevokeIdentityVerification?: (guardId: string) => void | Promise<void>;
  onRequestIdentityResubmit?: (
    guardId: string,
    slots: import('../../lib/staffDocumentReview').IdVerificationSlot[],
    staffNote?: string
  ) => void | Promise<void>;
  onReviewGuardInsurance?: (
    guardId: string,
    status: 'verified' | 'rejected' | 'pending',
    rejectionReason?: string
  ) => void | Promise<void>;
  onRequestCoiUpdate?: (guardId: string, staffNote?: string) => void | Promise<void>;
  onOpenGuardProfile?: (guardId: string) => void;
  onUpdateGuardIdImages?: (
    guardId: string,
    payload: import('../profile/GuardIdentityVerificationPanel').GuardIdentityVerificationPayload
  ) => Promise<import('../profile/GuardIdentityVerificationPanel').IdentityVerificationSubmitResult>;
  onAddCertification?: (guardId: string, cert: Partial<Certification>) => Promise<AddCertificationResult>;
}

function credentialStatusTone(status: ApprovalFeedItem['status']): StatusTone {
  if (status === 'pending' || status === 'in_review') return 'warning';
  if (status === 'approved' || status === 'active') return 'positive';
  if (status === 'denied' || status === 'rejected') return 'negative';
  return 'neutral';
}

function CredentialFeedRow({
  item,
  guards,
  isSelected,
  onSelect,
}: {
  item: ApprovalFeedItem;
  guards: SecurityGuard[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const tone =
    item.status === 'pending' || item.status === 'in_review'
      ? 'warning'
      : item.status === 'approved' || item.status === 'active'
        ? 'success'
        : 'danger';
  const thumbnailUrl = credentialFeedThumbnailUrl(guards, item.id);
  const pending = item.status === 'pending' || item.status === 'in_review';

  return (
    <AppItemCard onClick={onSelect} className={isSelected ? 'app-item-card-selected' : ''}>
      <div className="flex items-start gap-3 w-full text-left">
        {thumbnailUrl ? (
          <img
            key={`${item.id}:${thumbnailUrl}`}
            src={thumbnailUrl}
            alt={item.title}
            className={`w-11 h-11 rounded-lg object-cover shrink-0 box-border bg-transparent ${
              pending
                ? 'border-2 border-amber-500/50'
                : 'border border-brand-border'
            }`}
          />
        ) : (
          <span
            className={`w-11 h-11 rounded-lg shrink-0 box-border bg-transparent ${
              pending
                ? 'border-2 border-dashed border-amber-500/50'
                : 'border border-dashed border-brand-border'
            }`}
            aria-hidden
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="uber-feed-row-title">{item.title}</p>
            <WfBadge tone={tone}>{item.statusLabel}</WfBadge>
          </div>
          {item.subtitle && <p className="uber-feed-row-subtitle mt-1">{item.subtitle}</p>}
          {item.submittedAt && (item.status === 'pending' || item.status === 'in_review') && (
            <p className="text-[11px] text-brand-text-muted mt-1">
              Submitted {formatApprovalTimestamp(item.submittedAt)}
            </p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-brand-text-muted shrink-0 mt-0.5" />
      </div>
    </AppItemCard>
  );
}

export function StaffCredentials({
  guards,
  canVerifyCredentials,
  initialItemId = null,
  initialGuardId = null,
  onItemIdChange,
  onApproveCert,
  onRejectCert,
  onRequestCertUpdate,
  onRequestCertImageResubmit,
  onApproveIdentityVerification,
  onRejectIdentityVerification,
  onRevokeIdentityVerification,
  onRequestIdentityResubmit,
  onReviewGuardInsurance,
  onRequestCoiUpdate,
  onOpenGuardProfile,
  onUpdateGuardIdImages,
  onAddCertification,
}: StaffCredentialsProps) {
  const { formFactor } = useDevice();
  const [filter, setFilter] = useState<CredentialStatusFilter>('all');
  const [search, setSearch] = useState('');
  const [activeItemId, setActiveItemId] = useState<string | null>(initialItemId);
  const [auditLog, setAuditLog] = useState<Awaited<ReturnType<typeof loadAuditLog>>>([]);

  useEffect(() => {
    let cancelled = false;
    void loadAuditLog(400).then((entries) => {
      if (!cancelled) setAuditLog(entries);
    });
    return () => {
      cancelled = true;
    };
  }, [guards]);

  const credentialFeed = useMemo(() => {
    const feed = buildStaffApprovalsFeed({ requests: [], guards, clients: [], auditLog });
    return filterApprovalsFeedByQueue(feed, 'credentials');
  }, [guards, auditLog]);

  const visibleFeed = useMemo(() => {
    return credentialFeed.filter((item) => matchesCredentialStatusFilter(item, filter));
  }, [credentialFeed, filter]);

  const filteredFeed = useMemo(() => {
    return visibleFeed.filter((item) => approvalFeedItemMatchesSearch(item, search));
  }, [visibleFeed, search]);

  const openItem = (itemId: string | null) => {
    setActiveItemId(itemId);
    onItemIdChange?.(itemId);
  };

  useEffect(() => {
    if (initialItemId) {
      setActiveItemId(initialItemId);
      return;
    }
    if (initialGuardId && credentialFeed.length > 0) {
      const focused = resolveApprovalFocusItemId(credentialFeed, 'credentials', initialGuardId, guards);
      if (focused) openItem(focused);
    }
  }, [initialItemId, initialGuardId, credentialFeed, guards]);

  useEffect(() => {
    if (!activeItemId) return;
    if (!findFeedItem(credentialFeed, activeItemId)) openItem(null);
  }, [activeItemId, credentialFeed]);

  const requestCertResubmit = (guard: SecurityGuard, cert: Certification) => {
    if (!onRequestCertImageResubmit) return;
    void (async () => {
      const note = await promptStaffResubmitNote(`${certDisplayName(cert)} photo`);
      if (note === null) return;
      void onRequestCertImageResubmit(guard.id, cert.id, note);
    })();
  };

  const requestCertUpdate = (guard: SecurityGuard, cert: Certification) => {
    if (!onRequestCertUpdate) return;
    void (async () => {
      const note = await promptStaffCredentialUpdateNote(certDisplayName(cert));
      if (note === null) return;
      try {
        await onRequestCertUpdate(guard.id, cert.id, note);
      } catch (err) {
        showAppToast(err instanceof Error ? err.message : 'Could not request credential update.', {
          tone: 'error',
        });
      }
    })();
  };

  const renderCertActions = (guard: SecurityGuard, cert: Certification) => {
    if (!canVerifyCredentials) return null;

    if (certHasPendingUpdate(cert)) {
      return (
        <div className="flex flex-col items-stretch gap-1.5 w-full">
          <p className="text-xs text-brand-text-muted leading-relaxed">
            Updated document pending review — verified copy stays on file until you approve this version.
          </p>
          <div className="app-action-row--equal w-full">
            <AppButton
              variant="danger"
              size="sm"
              onClick={() => onRejectCert(guard.id, cert.id)}
              startEnhancer={<X className="w-3 h-3" />}
            >
              Reject update
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              disabled={!staffCanVerifyCertification(cert, guard)}
              title={staffVerifyCertificationBlocker(cert, guard) ?? 'Verify updated credential'}
              onClick={() => {
                void (async () => {
                  try {
                    await onApproveCert(guard.id, cert.id);
                  } catch (err) {
                    showAppToast(err instanceof Error ? err.message : 'Could not verify credential update.', {
                      tone: 'error',
                    });
                  }
                })();
              }}
              startEnhancer={<Check className="w-3 h-3" />}
            >
              Verify update
            </AppButton>
          </div>
          {staffVerifyCertificationBlocker(cert, guard) && (
            <p className="text-xs text-amber-500 leading-relaxed break-words">
              {staffVerifyCertificationBlocker(cert, guard)}
            </p>
          )}
        </div>
      );
    }

    if (cert.status === 'pending') {
      return (
        <div className="flex flex-col items-stretch gap-1.5 w-full">
          <div className="app-action-row--equal w-full">
            {cert.imageUrl && onRequestCertImageResubmit && (
              <AppButton
                variant="outline"
                size="sm"
                onClick={() => requestCertResubmit(guard, cert)}
                startEnhancer={<RefreshCw className="w-3 h-3" />}
              >
                Request clearer photo
              </AppButton>
            )}
            <AppButton
              variant="danger"
              size="sm"
              onClick={() => onRejectCert(guard.id, cert.id)}
              startEnhancer={<X className="w-3 h-3" />}
            >
              Reject
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              disabled={!staffCanVerifyCertification(cert, guard)}
              title={staffVerifyCertificationBlocker(cert, guard) ?? 'Verify credential'}
              onClick={() => {
                void (async () => {
                  try {
                    await onApproveCert(guard.id, cert.id);
                  } catch (err) {
                    showAppToast(err instanceof Error ? err.message : 'Could not verify credential.', {
                      tone: 'error',
                    });
                  }
                })();
              }}
              startEnhancer={<Check className="w-3 h-3" />}
            >
              Verify
            </AppButton>
          </div>
          {staffVerifyCertificationBlocker(cert, guard) && (
            <p className="text-xs text-amber-500 leading-relaxed break-words">
              {staffVerifyCertificationBlocker(cert, guard)}
            </p>
          )}
        </div>
      );
    }

    if (cert.status === 'verified' && onRequestCertUpdate) {
      return (
        <AppButton
          variant="outline"
          size="sm"
          className="text-amber-500 border-amber-500/40"
          onClick={() => requestCertUpdate(guard, cert)}
          startEnhancer={<RefreshCw className="w-3 h-3" />}
        >
          Request update
        </AppButton>
      );
    }

    return null;
  };

  const renderCoiActions = (guard: SecurityGuard) => {
    if (!canVerifyCredentials || !onReviewGuardInsurance) return null;
    const policy = guard.insurancePolicy;
    if (!policy) return null;
    const status = resolveInsuranceStatus(policy);

    if (status === 'pending') {
      return (
        <div className="flex flex-wrap gap-2 pt-2">
          <AppButton
            variant="primary"
            size="sm"
            onClick={() => void onReviewGuardInsurance(guard.id, 'verified')}
          >
            Verify insurance
          </AppButton>
          <AppButton
            variant="danger"
            size="sm"
            onClick={() =>
              void onReviewGuardInsurance(guard.id, 'rejected', 'Document incomplete or expired')
            }
          >
            Reject
          </AppButton>
        </div>
      );
    }

    if (status === 'verified') {
      return null;
    }

    return null;
  };

  const renderGovIdActions = (guard: SecurityGuard) => (
    <StaffIdReviewSection
      guard={guard}
      canManage={canVerifyCredentials}
      documentTypeEdit="inline"
      onApprove={onApproveIdentityVerification}
      onRequestResubmit={onRequestIdentityResubmit}
      onUpdateImages={
        onUpdateGuardIdImages
          ? (payload) => onUpdateGuardIdImages(guard.id, payload)
          : undefined
      }
    />
  );

  const renderCoiUpdateRequest = (guard: SecurityGuard) => {
    if (!canVerifyCredentials || !onRequestCoiUpdate) return null;
    const policy = guard.insurancePolicy;
    if (!policy) return null;
    const status = resolveInsuranceStatus(policy);
    if (status !== 'verified' && status !== 'pending') return null;
    if (status === 'pending' && !policy.documentUrl?.trim()) return null;
    if (policy.updateRequestedAt) return null;
    return (
      <AppButton
        variant="outline"
        size="sm"
        className="text-amber-500 border-amber-500/40"
        onClick={() => {
          void (async () => {
            const note = await promptStaffCredentialUpdateNote('Certificate of Insurance');
            if (note === null) return;
            try {
              await onRequestCoiUpdate(guard.id, note);
            } catch (err) {
              showAppToast(err instanceof Error ? err.message : 'Could not request COI update.', {
                tone: 'error',
              });
            }
          })();
        }}
        startEnhancer={<RefreshCw className="w-3 h-3" />}
      >
        Request update
      </AppButton>
    );
  };

  const renderGovIdUpdateRequest = (guard: SecurityGuard) => {
    if (!canVerifyCredentials || !onRequestIdentityResubmit) return null;
    if (getGuardIdVerificationStatus(guard) !== 'verified') return null;
    return (
      <AppButton
        variant="outline"
        size="sm"
        className="text-amber-500 border-amber-500/40"
        onClick={() => {
          void (async () => {
            const note = await promptStaffCredentialUpdateNote('Government ID');
            if (note === null) return;
            await onRequestIdentityResubmit(guard.id, ['front', 'back', 'selfie'], note);
          })();
        }}
        startEnhancer={<RefreshCw className="w-3 h-3" />}
      >
        Request update
      </AppButton>
    );
  };

  const pendingUploadCount = useMemo(
    () => countPendingCredentialUploads(guards),
    [guards]
  );
  const pendingReviewCount = useMemo(
    () => countPendingCredentialReviews(guards),
    [guards]
  );
  const rejectedCount = useMemo(
    () => countRejectedCredentials(guards),
    [guards]
  );

  const { showDetailOnly } = useSplitListDetail(activeItemId, 'page');
  const activeItem = activeItemId ? findFeedItem(filteredFeed, activeItemId) ?? null : null;

  useEffect(() => {
    if (formFactor === 'mobile') return;
    if (filteredFeed.length === 0) {
      if (activeItemId) openItem(null);
      return;
    }
    const stillVisible = activeItemId ? filteredFeed.some((item) => item.id === activeItemId) : false;
    if (!stillVisible) openItem(filteredFeed[0].id);
  }, [filter, filteredFeed, activeItemId, formFactor]);

  const credentialColumns: UberTableColumn<ApprovalFeedItem>[] = useMemo(
    () => [
      {
        id: 'credential',
        header: 'Credential',
        grow: true,
        sortValue: (item) => item.title.toLowerCase(),
        render: (item) => (
          <>
            <p className="uber-workbench-table-primary">{item.title}</p>
            {item.subtitle ? <p className="uber-workbench-table-secondary">{item.subtitle}</p> : null}
          </>
        ),
      },
      {
        id: 'submitted',
        header: 'Submitted',
        hideOnNarrow: true,
        sortValue: (item) => item.submittedAt ?? '',
        render: (item) =>
          item.submittedAt && (item.status === 'pending' || item.status === 'in_review')
            ? formatApprovalTimestamp(item.submittedAt)
            : '—',
      },
      {
        id: 'status',
        header: 'Status',
        sortValue: (item) => item.status,
        render: (item) => (
          <StatusChip tone={credentialStatusTone(item.status)}>{item.statusLabel}</StatusChip>
        ),
      },
    ],
    [],
  );

  if (!canVerifyCredentials) {
    return (
      <AppBlockedAccessScreen
        title={STAFF_SECTION_ACCESS_MESSAGES.credentials!.title}
        message={STAFF_SECTION_ACCESS_MESSAGES.credentials!.message}
        placeholders={['Search credentials', 'Pending review', 'Pending upload', 'All credentials']}
      />
    );
  }

  const renderCredentialDetail = (item: ApprovalFeedItem, options?: { onBack?: () => void }) => {
    const feedItem = findFeedItem(credentialFeed, item.id) ?? item;
    const context = resolveCredentialFeedContext(guards, item.id);
    if (!context) return null;

    const { guard } = context;
    const profileLink = onOpenGuardProfile ? () => onOpenGuardProfile(guard.id) : undefined;

    const detailBody =
      context.kind === 'cert' ? (
        <StaffCertReviewDetail
          cert={context.cert}
          feedItem={feedItem}
          guardName={guard.name}
          onOpenGuardProfile={profileLink}
          actions={renderCertActions(guard, context.cert)}
        />
      ) : context.kind === 'coi' ? (
        <StaffCoiReviewDetail
          guard={guard}
          feedItem={feedItem}
          guardName={guard.name}
          onOpenGuardProfile={profileLink}
          actions={
            <>
              {renderCoiActions(guard)}
              {renderCoiUpdateRequest(guard)}
            </>
          }
        />
      ) : context.kind === 'gov-id' ? (
        <StaffGovIdReviewDetail
          guard={guard}
          feedItem={feedItem}
          guardName={guard.name}
          onOpenGuardProfile={profileLink}
          actions={
            <>
              {renderGovIdActions(guard)}
              {renderGovIdUpdateRequest(guard)}
            </>
          }
        />
      ) : (
        <StaffActivationReviewDetail
          guard={guard}
          stepKey={context.stepKey}
          feedItem={feedItem}
          guardName={guard.name}
          onOpenGuardProfile={profileLink}
        />
      );

    if (options?.onBack) {
      return (
        <div className="app-full-page-detail animate-fade-in min-w-0 max-w-full">
          <AppSubScreenHeader
            title={feedItem.title ?? 'Credential review'}
            onBack={options.onBack}
            backLabel="Credentials"
            hideTitle
          />
          <div className="pb-8 min-w-0">{detailBody}</div>
        </div>
      );
    }

    return (
      <div className="animate-fade-in">
        <div className="app-dashboard-zone-head !px-0 !mb-3">
          <h2 className="app-dashboard-zone-title break-words">{feedItem.title ?? 'Credential review'}</h2>
        </div>
        {detailBody}
      </div>
    );
  };

  const toolbar = !showDetailOnly ? (
    <>
      {onAddCertification ? (
        <div className="staff-ops-cta-stack">
          <StaffCredentialAddForGuardForm
            guards={guards}
            onAddCertification={onAddCertification}
            onCredentialAdded={(guardId) => onOpenGuardProfile?.(guardId)}
          />
        </div>
      ) : null}
      <WfSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search credentials..."
        className="max-w-md"
      />
      <StaffListFilterTabs
        aria-label="Credential status"
        activeId={filter}
        onChange={(id) => setFilter(id as CredentialStatusFilter)}
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'pending_review', label: 'Pending review', count: pendingReviewCount },
          { id: 'pending_upload', label: 'Pending upload', count: pendingUploadCount },
          { id: 'verified', label: 'Verified' },
          { id: 'rejected', label: 'Rejected', count: rejectedCount },
        ]}
      />
    </>
  ) : null;

  if (formFactor === 'desktop') {
    return (
      <WorkbenchPage className="staff-roster-panel" data-tour="staff-credentials">
        {toolbar}
        <WorkbenchPanel padding={false}>
          <WorkbenchSplit
            list={
              filteredFeed.length === 0 ? (
                <WorkbenchEmpty
                  icon={search ? Search : ShieldCheck}
                  message={search.trim() ? 'No credentials match your search' : 'No credentials in this view'}
                />
              ) : (
                <UberDataTable
                  columns={credentialColumns}
                  rows={filteredFeed}
                  rowKey={(item) => item.id}
                  selectedKey={activeItemId ?? undefined}
                  onRowClick={(item) => openItem(item.id)}
                  caption="Credentials"
                  cardLayout={{ title: 'credential', subtitle: 'submitted', trailing: 'status' }}
                />
              )
            }
            detail={
              activeItem ? (
                renderCredentialDetail(activeItem)
              ) : (
                <WorkbenchEmpty icon={ShieldCheck} message="Select a credential to review" variant="detail" />
              )
            }
          />
        </WorkbenchPanel>
      </WorkbenchPage>
    );
  }

  return (
    <StaffOpsPageShell toolbar={toolbar} className="staff-roster-panel" data-tour="staff-credentials">
      {filteredFeed.length === 0 ? (
        <AppEmptyState dashed icon={<ShieldCheck className="w-5 h-5" />} title={
          search.trim()
            ? 'No credentials match your search'
            : filter === 'pending_upload'
              ? 'No pending uploads'
              : filter === 'pending_review'
                ? 'All clear'
                : filter === 'verified'
                  ? 'No verified credentials'
                  : filter === 'rejected'
                    ? 'No rejected credentials'
                    : 'No credentials yet'
        }>
          {search.trim()
            ? 'Try adjusting your search term.'
            : filter === 'pending_upload'
              ? 'No credentials waiting for guard upload.'
              : filter === 'pending_review'
                ? 'No credentials waiting for staff review.'
                : filter === 'verified'
                  ? 'No verified credentials on file yet.'
                  : filter === 'rejected'
                    ? 'No rejected credentials on file.'
                    : 'No credential submissions on file yet.'}
        </AppEmptyState>
      ) : (
        <ListDetailLayout
          items={filteredFeed}
          selectedId={activeItemId}
          onSelectId={openItem}
          getItemId={(item) => item.id}
          listScrollClassName="max-h-[75vh] overflow-y-auto pr-1"
          detailClassName="staff-detail-pane"
          mobilePresentation="page"
          emptyDetail={
            <div className="flex items-center justify-center h-full min-h-[40vh] p-8 text-center">
              <p className="text-sm text-brand-text-muted">Select a credential to review</p>
            </div>
          }
          renderItem={(item, isSelected, onSelect) => (
            <CredentialFeedRow item={item} guards={guards} isSelected={isSelected} onSelect={onSelect} />
          )}
          renderDetail={(item, options) => renderCredentialDetail(item, options)}
        />
      )}
    </StaffOpsPageShell>
  );
}
