import React, { useEffect, useMemo, useState } from 'react';
import { Check, Eye, RefreshCw, ShieldCheck, Undo2, X } from 'lucide-react';
import { Certification, SecurityGuard } from '../../types';
import { loadAuditLog } from '../../lib/auditLog';
import {
  buildStaffApprovalsFeed,
  filterApprovalsFeedByQueue,
  findFeedItem,
  formatApprovalTimestamp,
  resolveApprovalFocusItemId,
  resolveCredentialFeedContext,
  type ApprovalFeedItem,
} from '../../lib/staffApprovalsFeed';
import {
  staffCanVerifyCertification,
  staffVerifyCertificationBlocker,
} from '../../lib/certImagePolicy';
import { certDisplayName } from '../../lib/certCatalog';
import { getGuardIdVerificationStatus } from '../../lib/guardIdentityVerification';
import { resolveInsuranceStatus } from '../../lib/guardInsurance';
import { promptStaffResubmitNote } from '../../lib/staffDocumentReview';
import { CertItemCard } from '../credentials/CertItemCard';
import { GuardCoiDetailModal } from '../profile/GuardCoiDetailModal';
import { GuardCoiItemCard } from '../profile/GuardCoiItemCard';
import { GuardIdItemCard } from '../profile/GuardIdItemCard';
import { StaffIdReviewSection } from './StaffIdReviewSection';
import { AppEmptyState, AppItemCardStack, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { WfBadge } from '../ui/wireframe';
import { showAppToast } from '../ui/AppToast';
import type { CertUpdatePayload, CertUpdateResult } from '../credentials/CertDetailModal';

type CredentialFilter = 'pending' | 'all';

interface StaffCredentialsProps {
  guards: SecurityGuard[];
  canVerifyCredentials: boolean;
  initialItemId?: string | null;
  initialGuardId?: string | null;
  onItemIdChange?: (itemId: string | null) => void;
  onApproveCert: (guardId: string, certId: string) => void | Promise<void>;
  onRejectCert: (guardId: string, certId: string) => void | Promise<void>;
  onUnverifyCert?: (guardId: string, certId: string) => void | Promise<void>;
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
  onUpdateCertification?: (
    guardId: string,
    certId: string,
    payload: CertUpdatePayload
  ) => Promise<CertUpdateResult>;
  onOpenGuardProfile?: (guardId: string) => void;
}

function CredentialFeedRow({
  item,
  onReview,
}: {
  item: ApprovalFeedItem;
  onReview: () => void;
}) {
  const tone =
    item.status === 'pending' || item.status === 'in_review'
      ? 'warning'
      : item.status === 'approved' || item.status === 'active'
        ? 'success'
        : 'danger';

  return (
    <div className="app-item-card flex-col !items-stretch gap-2.5 !cursor-default">
      <div className="min-w-0 text-left w-full">
        <p className="font-semibold text-sm truncate">{item.title}</p>
        {item.subtitle && <p className="text-xs text-brand-text-muted mt-0.5 truncate">{item.subtitle}</p>}
        <div className="mt-1.5 space-y-1">
          <WfBadge tone={tone}>{item.statusLabel}</WfBadge>
          {item.submittedAt && (item.status === 'pending' || item.status === 'in_review') && (
            <p className="text-[11px] text-brand-text-muted">
              Submitted {formatApprovalTimestamp(item.submittedAt)}
            </p>
          )}
        </div>
      </div>
      <button type="button" onClick={onReview} className="app-button-outline app-btn-sm gap-1.5 w-fit">
        <Eye className="w-3.5 h-3.5" />
        Review
      </button>
    </div>
  );
}

function CredentialReviewMeta({ item }: { item?: ApprovalFeedItem }) {
  if (!item) return null;
  const reviewer = item.reviewedByName || item.reviewedByEmail;
  return (
    <div className="rounded-lg border border-brand-border bg-brand-bg-sec/40 px-3 py-2.5 text-xs space-y-1">
      <p>
        <span className="font-semibold text-brand-text">Status: </span>
        {item.statusLabel}
      </p>
      {item.submittedAt && (
        <p>
          <span className="font-semibold text-brand-text">Submitted: </span>
          {formatApprovalTimestamp(item.submittedAt)}
        </p>
      )}
      {item.reviewedAt && (
        <p>
          <span className="font-semibold text-brand-text">Reviewed: </span>
          {formatApprovalTimestamp(item.reviewedAt)}
        </p>
      )}
      {reviewer && (
        <p>
          <span className="font-semibold text-brand-text">By: </span>
          {reviewer}
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
  onUnverifyCert,
  onRequestCertImageResubmit,
  onApproveIdentityVerification,
  onRejectIdentityVerification,
  onRevokeIdentityVerification,
  onRequestIdentityResubmit,
  onReviewGuardInsurance,
  onUpdateCertification,
  onOpenGuardProfile,
}: StaffCredentialsProps) {
  const [filter, setFilter] = useState<CredentialFilter>('pending');
  const [activeItemId, setActiveItemId] = useState<string | null>(initialItemId);
  const [coiModalOpen, setCoiModalOpen] = useState(false);
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
    if (filter === 'all') return credentialFeed;
    return credentialFeed.filter((item) => item.status === 'pending' || item.status === 'in_review');
  }, [credentialFeed, filter]);

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

  const renderCertActions = (guard: SecurityGuard, cert: Certification) => {
    if (!canVerifyCredentials) return null;

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

    if (cert.status === 'verified' && onUnverifyCert) {
      return (
        <button
          type="button"
          onClick={() => {
            void (async () => {
              try {
                await onUnverifyCert(guard.id, cert.id);
              } catch (err) {
                showAppToast(err instanceof Error ? err.message : 'Could not unverify credential.', {
                  tone: 'error',
                });
              }
            })();
          }}
          className="app-button-outline app-btn-sm gap-1 text-amber-500 border-amber-500/40"
        >
          <Undo2 className="w-3 h-3" /> Unverify
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
      return (
        <button
          type="button"
          className="app-button-outline app-btn-sm gap-1 text-amber-500 border-amber-500/40"
          onClick={() => void onReviewGuardInsurance(guard.id, 'pending')}
        >
          <Undo2 className="w-3 h-3" /> Unverify
        </button>
      );
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

  const renderGovIdUnverify = (guard: SecurityGuard) => {
    if (!canVerifyCredentials || !onRevokeIdentityVerification) return null;
    if (getGuardIdVerificationStatus(guard) !== 'verified') return null;
    return (
      <button
        type="button"
        className="app-button-outline app-btn-sm gap-1 text-amber-500 border-amber-500/40"
        onClick={() => void onRevokeIdentityVerification(guard.id)}
      >
        <Undo2 className="w-3 h-3" /> Unverify ID
      </button>
    );
  };

  if (!canVerifyCredentials) {
    return (
      <AppEmptyState dashed icon={<ShieldCheck className="w-5 h-5" />} title="No access">
        Your role cannot verify guard credentials.
      </AppEmptyState>
    );
  }

  if (activeItemId) {
    const feedItem = findFeedItem(credentialFeed, activeItemId);
    const context = resolveCredentialFeedContext(guards, activeItemId);
    if (!context) return null;

    const { guard } = context;

    return (
      <div className="-mx-4 sm:-mx-5 app-full-page-detail animate-fade-in" data-tour="staff-credentials">
        <AppSubScreenHeader
          title={feedItem?.title ?? 'Credential review'}
          onBack={() => openItem(null)}
          backLabel="Credentials"
        />
        <div className="px-4 sm:px-5 pb-8 space-y-4">
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
                      ? (status, rejectionReason) =>
                          onReviewGuardInsurance(guard.id, status, rejectionReason)
                      : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setCoiModalOpen(true)}
                  className="app-button-outline app-btn-sm gap-1.5 w-fit"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Open COI document
                </button>
                {renderCoiActions(guard)}
                {coiModalOpen && (
                  <GuardCoiDetailModal
                    guard={guard}
                    onClose={() => setCoiModalOpen(false)}
                    staffMode
                    onReview={
                      onReviewGuardInsurance
                        ? (status, rejectionReason) =>
                            onReviewGuardInsurance(guard.id, status, rejectionReason)
                        : undefined
                    }
                  />
                )}
              </div>
            )}

            {context.kind === 'gov-id' && (
              <div className="space-y-3">
                <GuardIdItemCard guard={guard} staffMode asCredentialSection />
                {renderGovIdActions(guard)}
                {renderGovIdUnverify(guard)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = credentialFeed.filter(
    (item) => item.status === 'pending' || item.status === 'in_review'
  ).length;

  return (
    <div className="animate-fade-in space-y-4" data-tour="staff-credentials">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`app-button-outline app-btn-sm ${filter === 'pending' ? '!border-brand-primary !text-brand-primary' : ''}`}
        >
          Pending{pendingCount > 0 ? ` (${pendingCount})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`app-button-outline app-btn-sm ${filter === 'all' ? '!border-brand-primary !text-brand-primary' : ''}`}
        >
          All ({credentialFeed.length})
        </button>
      </div>

      {visibleFeed.length === 0 ? (
        <AppEmptyState dashed icon={<ShieldCheck className="w-5 h-5" />} title="All clear">
          {filter === 'pending'
            ? 'No guard credentials waiting for review.'
            : 'No credential submissions on file yet.'}
        </AppEmptyState>
      ) : (
        <AppItemCardStack>
          {visibleFeed.map((item) => (
            <CredentialFeedRow key={item.id} item={item} onReview={() => openItem(item.id)} />
          ))}
        </AppItemCardStack>
      )}
    </div>
  );
}
