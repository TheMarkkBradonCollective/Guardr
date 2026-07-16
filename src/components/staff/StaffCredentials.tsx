import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { Certification, SecurityGuard } from '../../types';
import { loadAuditLog } from '../../lib/auditLog';
import {
  buildStaffApprovalsFeed,
  filterApprovalsFeedByQueue,
  findFeedItem,
  formatApprovalTimestamp,
  countPendingCredentialReviews,
  countPendingCredentialUploads,
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
import { CertItemCard } from '../credentials/CertItemCard';
import { GuardCoiItemCard } from '../profile/GuardCoiItemCard';
import { GuardIdItemCard } from '../profile/GuardIdItemCard';
import { StaffIdReviewSection } from './StaffIdReviewSection';
import { AppEmptyState, AppItemCard, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { AppBlockedAccessScreen } from '../ui/app/AppBlockedAccess';
import { StaffActivationCredentialSection } from './StaffActivationCredentialSection';
import { STAFF_SECTION_ACCESS_MESSAGES } from '../../lib/staffNavAccess';
import { ListDetailLayout, useSplitListDetail } from '../ui/app/ListDetailLayout';
import { StaffCredentialAddForGuardForm } from './StaffCredentialAddForGuardForm';
import { WfBadge, WfSearchBar } from '../ui/wireframe';
import { showAppToast } from '../ui/AppToast';
import type { AddCertificationResult } from '../../lib/certUniqueness';
import type { CertUpdatePayload, CertUpdateResult } from '../credentials/CertDetailModal';

import { StaffListFilterTabs } from './StaffListFilterTabs';
import { StaffOpsPageShell } from './StaffOpsPageShell';

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
  onUpdateCertification?: (
    guardId: string,
    certId: string,
    payload: CertUpdatePayload
  ) => Promise<CertUpdateResult>;
  onOpenGuardProfile?: (guardId: string) => void;
  onAddCredentialForGuard?: (guardId: string) => void;
  onEditGuardProfile?: (guardId: string) => void;
  onAddCertification?: (
    guardId: string,
    cert: Partial<Certification>
  ) => Promise<AddCertificationResult>;
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
            src={thumbnailUrl}
            alt={item.title}
            className={`w-11 h-11 rounded-lg object-cover shrink-0 box-border bg-brand-bg-sec ${
              pending
                ? 'border-2 border-amber-500/50'
                : 'border border-brand-border'
            }`}
          />
        ) : (
          <span
            className={`w-11 h-11 rounded-lg shrink-0 box-border bg-brand-bg-sec ${
              pending
                ? 'border-2 border-dashed border-amber-500/50'
                : 'border border-dashed border-brand-border'
            }`}
            aria-hidden
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold truncate">{item.title}</p>
            <WfBadge tone={tone}>{item.statusLabel}</WfBadge>
          </div>
          {item.subtitle && <p className="text-xs text-brand-text-muted mt-1 truncate">{item.subtitle}</p>}
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

function CredentialReviewMeta({ item }: { item?: ApprovalFeedItem }) {
  if (!item) return null;
  const reviewer = item.reviewedByName || item.reviewedByEmail;
  return (
    <div className="app-list-subrow text-xs space-y-1 !pt-0">
      <p>
        <span className="detail-field-label !mb-0">Status</span>
        <span className="text-sm font-medium">{item.statusLabel}</span>
      </p>
      {item.submittedAt && (
        <p>
          <span className="detail-field-label !mb-0">Submitted</span>
          <span className="text-sm">{formatApprovalTimestamp(item.submittedAt)}</span>
        </p>
      )}
      {item.reviewedAt && (
        <p>
          <span className="detail-field-label !mb-0">Reviewed</span>
          <span className="text-sm">{formatApprovalTimestamp(item.reviewedAt)}</span>
        </p>
      )}
      {reviewer && (
        <p>
          <span className="detail-field-label !mb-0">By</span>
          <span className="text-sm">{reviewer}</span>
        </p>
      )}
    </div>
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
  onUpdateCertification,
  onOpenGuardProfile,
  onAddCredentialForGuard,
  onEditGuardProfile,
  onAddCertification,
}: StaffCredentialsProps) {
  const [filter, setFilter] = useState<CredentialStatusFilter>('pending_review');
  const [search, setSearch] = useState('');
  const [activeItemId, setActiveItemId] = useState<string | null>(initialItemId);
  const [auditLog, setAuditLog] = useState<Awaited<ReturnType<typeof loadAuditLog>>>([]);
  const [pendingFocusGuardId, setPendingFocusGuardId] = useState<string | null>(null);

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
    if (!pendingFocusGuardId) return;
    const focused = resolveApprovalFocusItemId(credentialFeed, 'credentials', pendingFocusGuardId, guards);
    if (focused) {
      openItem(focused);
      setPendingFocusGuardId(null);
    }
  }, [pendingFocusGuardId, credentialFeed, guards]);

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
            <button
              type="button"
              onClick={() => onRejectCert(guard.id, cert.id)}
              className="app-button-outline app-btn-sm text-red-400 border-red-500/40 gap-1"
            >
              <X className="w-3 h-3" /> Reject update
            </button>
            <button
              type="button"
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
              className="app-button-primary app-btn-sm gap-1 disabled:opacity-50"
            >
              <Check className="w-3 h-3" /> Verify update
            </button>
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
              <button
                type="button"
                onClick={() => requestCertResubmit(guard, cert)}
                className="app-button-outline app-btn-sm gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Request clearer photo
              </button>
            )}
            <button
              type="button"
              onClick={() => onRejectCert(guard.id, cert.id)}
              className="app-button-outline app-btn-sm text-red-400 border-red-500/40 gap-1"
            >
              <X className="w-3 h-3" /> Reject
            </button>
            <button
              type="button"
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
              className="app-button-primary app-btn-sm gap-1 disabled:opacity-50"
            >
              <Check className="w-3 h-3" /> Verify
            </button>
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
        <button
          type="button"
          onClick={() => requestCertUpdate(guard, cert)}
          className="app-button-outline app-btn-sm gap-1 text-amber-500 border-amber-500/40"
        >
          <RefreshCw className="w-3 h-3" /> Request update
        </button>
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
          <button
            type="button"
            className="app-button-primary app-btn-sm"
            onClick={() => void onReviewGuardInsurance(guard.id, 'verified')}
          >
            Verify insurance
          </button>
          <button
            type="button"
            className="app-button-outline app-btn-sm text-red-400 border-red-500/40"
            onClick={() =>
              void onReviewGuardInsurance(guard.id, 'rejected', 'Document incomplete or expired')
            }
          >
            Reject
          </button>
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
      onApprove={onApproveIdentityVerification}
      onReject={onRejectIdentityVerification}
      onRequestResubmit={onRequestIdentityResubmit}
    />
  );

  const renderCoiUpdateRequest = (guard: SecurityGuard) => {
    if (!canVerifyCredentials || !onRequestCoiUpdate) return null;
    const policy = guard.insurancePolicy;
    if (!policy || resolveInsuranceStatus(policy) !== 'verified') return null;
    if (policy.updateRequestedAt) return null;
    return (
      <button
        type="button"
        className="app-button-outline app-btn-sm gap-1 text-amber-500 border-amber-500/40"
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
      >
        <RefreshCw className="w-3 h-3" /> Request update
      </button>
    );
  };

  const renderGovIdUpdateRequest = (guard: SecurityGuard) => {
    if (!canVerifyCredentials || !onRequestIdentityResubmit) return null;
    if (getGuardIdVerificationStatus(guard) !== 'verified') return null;
    return (
      <button
        type="button"
        className="app-button-outline app-btn-sm gap-1 text-amber-500 border-amber-500/40"
        onClick={() => {
          void (async () => {
            const note = await promptStaffCredentialUpdateNote('Government ID');
            if (note === null) return;
            await onRequestIdentityResubmit(guard.id, ['front', 'back', 'selfie'], note);
          })();
        }}
      >
        <RefreshCw className="w-3 h-3" /> Request update
      </button>
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

  const { showDetailOnly } = useSplitListDetail(activeItemId, 'page');

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

    const detailBody = (
      <div className="staff-detail-pane space-y-4">
        <CredentialReviewMeta item={feedItem} />
        {onOpenGuardProfile && (
          <button
            type="button"
            onClick={() => onOpenGuardProfile(guard.id)}
            className="text-xs font-semibold text-brand-primary hover:underline"
          >
            View full guard profile →
          </button>
        )}

        {context.kind === 'cert' && (
          <div className="space-y-3">
            <CertItemCard
              cert={context.cert}
              guardName={guard.name}
              staffMode
              onUpdate={
                onUpdateCertification
                  ? (payload) => onUpdateCertification(guard.id, context.cert.id, payload)
                  : undefined
              }
              onEditFullPage={
                onEditGuardProfile ? () => onEditGuardProfile(guard.id) : undefined
              }
            />
            {renderCertActions(guard, context.cert)}
          </div>
        )}

        {context.kind === 'coi' && (
          <div className="space-y-3">
            <GuardCoiItemCard
              guard={guard}
              staffMode
              onReview={
                onReviewGuardInsurance
                  ? async (status, rejectionReason) => {
                      await onReviewGuardInsurance(guard.id, status, rejectionReason);
                    }
                  : undefined
              }
              onEditFullPage={
                onEditGuardProfile ? () => onEditGuardProfile(guard.id) : undefined
              }
            />
            {renderCoiActions(guard)}
            {renderCoiUpdateRequest(guard)}
          </div>
        )}

        {context.kind === 'gov-id' && (
          <div className="space-y-3">
            <GuardIdItemCard
              guard={guard}
              staffMode
              asCredentialSection
              onEditFullPage={
                onEditGuardProfile ? () => onEditGuardProfile(guard.id) : undefined
              }
            />
            {renderGovIdActions(guard)}
            {renderGovIdUpdateRequest(guard)}
          </div>
        )}

        {context.kind === 'activation-pending' && (
          <StaffActivationCredentialSection guard={guard} stepKey={context.stepKey} />
        )}
      </div>
    );

    if (options?.onBack) {
      return (
        <div className="-mx-4 sm:-mx-5 app-full-page-detail animate-fade-in">
          <AppSubScreenHeader
            title={feedItem.title ?? 'Credential review'}
            onBack={options.onBack}
            backLabel="Credentials"
          />
          {detailBody}
        </div>
      );
    }

    return (
      <div className="animate-fade-in">
        <div className="app-dashboard-zone-head !px-0 !mb-3">
          <h2 className="app-dashboard-zone-title truncate">{feedItem.title ?? 'Credential review'}</h2>
        </div>
        {detailBody}
      </div>
    );
  };

  const toolbar = !showDetailOnly ? (
    <>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        {onAddCertification && (
          <StaffCredentialAddForGuardForm
            guards={guards}
            onAddCertification={onAddCertification}
            onCredentialAdded={(guardId) => {
              setFilter('pending_upload');
              setPendingFocusGuardId(guardId);
            }}
          />
        )}
      </div>
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
          { id: 'pending_review', label: 'Pending review', count: pendingReviewCount },
          { id: 'verified', label: 'Verified' },
          { id: 'pending_upload', label: 'Pending upload', count: pendingUploadCount },
          { id: 'all', label: 'All' },
        ]}
      />
    </>
  ) : null;

  return (
    <StaffOpsPageShell toolbar={toolbar} className="staff-roster-panel" data-tour="staff-credentials">
      {filteredFeed.length === 0 ? (
        <AppEmptyState dashed icon={<ShieldCheck className="w-5 h-5" />} title="All clear">
          {search.trim()
            ? 'No credentials match your search.'
            : filter === 'pending_upload'
              ? 'No credentials waiting for guard upload.'
              : filter === 'pending_review'
                ? 'No credentials waiting for staff review.'
                : filter === 'verified'
                  ? 'No verified credentials on file yet.'
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
