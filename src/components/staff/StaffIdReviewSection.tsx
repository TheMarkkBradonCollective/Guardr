import { showAppToast } from '../ui/AppToast';
import React, { useEffect, useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { DRIVER_LICENSE_CLASSES, SecurityGuard, type GovernmentIdDocumentType } from '../../types';
import {
  getGuardIdVerificationStatus,
  guardGovIdNeedsDocumentTypeSelection,
  guardHasGovernmentIdOnFile,
  guardIdVerificationPhotosComplete,
  guardIdVerificationResubmitPending,
  ID_VERIFICATION_SLOT_LABELS,
  staffApproveIdVerificationBlocker,
  staffCanApproveIdVerification,
  staffCanRequestIdResubmit,
} from '../../lib/guardIdentityVerification';
import {
  IdVerificationSlot,
  promptStaffResubmitNote,
} from '../../lib/staffDocumentReview';
import { AppButton } from '../ui/AppButton';
import type { GuardIdentityVerificationPayload, IdentityVerificationSubmitResult } from '../profile/GuardIdentityVerificationPanel';
import { userFacingError } from '../../lib/userFacingError';

interface StaffIdReviewSectionProps {
  guard: SecurityGuard;
  canManage?: boolean;
  onApprove?: (guardId: string) => void | Promise<void>;
  approveActionLabel?: string;
  onRequestResubmit?: (guardId: string, slots: IdVerificationSlot[], staffNote?: string) => void | Promise<void>;
  /** When set, staff can set Government ID vs driver’s license inline (Credentials review only). */
  onUpdateImages?: (payload: GuardIdentityVerificationPayload) => Promise<IdentityVerificationSubmitResult>;
  /**
   * Guard profile: show a flag only and send staff to Credentials pending review.
   * Credentials queue: allow inline document-type correction.
   */
  documentTypeEdit?: 'inline' | 'credentials-flag';
}

/** Staff approve / resubmit actions for government ID — status is shown on the ID credential card. */
export function StaffIdReviewSection({
  guard,
  canManage = false,
  onApprove,
  approveActionLabel = 'Approve ID',
  onRequestResubmit,
  onUpdateImages,
  documentTypeEdit = onUpdateImages ? 'inline' : 'credentials-flag',
}: StaffIdReviewSectionProps) {
  const status = getGuardIdVerificationStatus(guard);
  const applicationVerifyBlocker = staffApproveIdVerificationBlocker(guard);
  const resubmitPending = guardIdVerificationResubmitPending(guard);
  const canApprove = staffCanApproveIdVerification(guard);
  const canRequestResubmit = staffCanRequestIdResubmit(guard);
  // Prevents a fast double-click from firing duplicate approve/reject writes.
  const [actionPending, setActionPending] = useState(false);
  const [savingType, setSavingType] = useState(false);
  const [idDocumentType, setIdDocumentType] = useState<GovernmentIdDocumentType | ''>(
    guard.idDocumentType ?? ''
  );
  const [idLicenseClass, setIdLicenseClass] = useState(guard.idLicenseClass ?? '');

  useEffect(() => {
    setIdDocumentType(guard.idDocumentType ?? '');
    setIdLicenseClass(guard.idLicenseClass ?? '');
  }, [guard.id, guard.idDocumentType, guard.idLicenseClass]);

  if (!canManage) return null;
  // Photos on file with status still not_submitted still need staff classification / review.
  if (
    status === 'not_submitted' &&
    !guardIdVerificationPhotosComplete(guard) &&
    !guardHasGovernmentIdOnFile(guard)
  ) {
    return null;
  }

  const needsDocumentType =
    guardGovIdNeedsDocumentTypeSelection(guard) && status !== 'verified';
  const showInlineDocumentTypeEdit =
    needsDocumentType && documentTypeEdit === 'inline' && Boolean(onUpdateImages);

  const saveDocumentType = async () => {
    if (!onUpdateImages) return;
    if (!idDocumentType) {
      showAppToast('Select Government ID or Driver’s license.', { tone: 'error' });
      return;
    }
    if (idDocumentType === 'drivers_license' && !idLicenseClass.trim()) {
      showAppToast('Select the driver’s license class.', { tone: 'error' });
      return;
    }
    const front = (guard.idFrontUrl ?? '').trim();
    const back = (guard.idBackUrl ?? '').trim();
    const selfie = (guard.idSelfieUrl ?? '').trim();
    const idState = (guard.idState ?? '').trim();
    const idNumber = (guard.idNumber ?? '').trim();
    const idExpiryDate = (guard.idExpiryDate ?? '').trim();
    if (!front || !back || !selfie) {
      showAppToast('ID front, back, and selfie must be on file before saving document type.', {
        tone: 'error',
      });
      return;
    }
    if (!idState || !idNumber || !idExpiryDate) {
      showAppToast('Open Credentials pending review to finish ID details, then save document type.', {
        tone: 'error',
      });
      return;
    }
    setSavingType(true);
    try {
      const result = await onUpdateImages({
        idDocumentType,
        idLicenseClass: idDocumentType === 'drivers_license' ? idLicenseClass.trim() : undefined,
        idState,
        idNumber,
        idExpiryDate,
        idFrontUrl: front,
        idBackUrl: back,
        idSelfieUrl: selfie,
      });
      if (!result.ok) {
        showAppToast('error' in result ? result.error : 'Could not save document type.', {
          tone: 'error',
        });
        return;
      }
      showAppToast('Document type saved. You can approve the ID now.', { tone: 'success' });
    } catch (err) {
      showAppToast(userFacingError(err, 'Could not save document type.'), {
        tone: 'error',
      });
    } finally {
      setSavingType(false);
    }
  };

  const requestSlot = (slot: IdVerificationSlot) => {
    if (!onRequestResubmit) return;
    void (async () => {
      const note = await promptStaffResubmitNote(ID_VERIFICATION_SLOT_LABELS[slot]);
      if (note === null) return;
      void onRequestResubmit(guard.id, [slot], note);
    })();
  };

  const requestAll = () => {
    if (!onRequestResubmit) return;
    void (async () => {
      const note = await promptStaffResubmitNote('ID front, ID back, and identity selfie');
      if (note === null) return;
      void onRequestResubmit(guard.id, ['front', 'back', 'selfie'], note);
    })();
  };

  const documentTypeFlag =
    needsDocumentType && !showInlineDocumentTypeEdit
      ? 'Document type required — open Credentials → Pending review to select Government ID or driver’s license.'
      : null;

  const bannerText = documentTypeFlag ?? applicationVerifyBlocker;

  return (
    <div className="space-y-3">
      {bannerText && (
        <p className="text-xs text-amber-600 leading-relaxed border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2">
          {bannerText}
        </p>
      )}

      {showInlineDocumentTypeEdit ? (
        <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="text-xs font-semibold text-brand-text">Set document type to continue</p>
          <label className="block space-y-1.5">
            <span className="uber-label">Document type</span>
            <select
              value={idDocumentType}
              onChange={(e) => {
                const next = e.target.value as GovernmentIdDocumentType | '';
                setIdDocumentType(next);
                if (next !== 'drivers_license') setIdLicenseClass('');
              }}
              className="uber-select w-full"
              aria-label="Government ID document type"
            >
              <option value="">Select type…</option>
              <option value="state_id">Government ID</option>
              <option value="drivers_license">Driver’s license</option>
            </select>
          </label>
          {idDocumentType === 'drivers_license' ? (
            <label className="block space-y-1.5">
              <span className="uber-label">License class</span>
              <select
                value={idLicenseClass}
                onChange={(e) => setIdLicenseClass(e.target.value)}
                className="uber-select w-full"
                aria-label="Driver license class"
              >
                <option value="">Select class…</option>
                {DRIVER_LICENSE_CLASSES.map((licenseClass) => (
                  <option key={licenseClass} value={licenseClass}>
                    {licenseClass}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <AppButton
            variant="primary"
            size="sm"
            disabled={savingType || !idDocumentType}
            onClick={() => void saveDocumentType()}
          >
            {savingType ? 'Saving…' : 'Save document type'}
          </AppButton>
        </div>
      ) : null}

      {resubmitPending && guard.idVerificationRejectionReason && (
        <p className="text-sm text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2 leading-relaxed">
          Awaiting guard resubmit — approval on hold. {guard.idVerificationRejectionReason}
        </p>
      )}
      <div className="app-action-row--equal">
        {canApprove && onApprove && (
          <AppButton
            variant="primary"
            size="sm"
            disabled={actionPending}
            onClick={() => {
              if (actionPending) return;
              setActionPending(true);
              void (async () => {
                try {
                  await onApprove(guard.id);
                } catch (err) {
                  showAppToast(userFacingError(err, 'Could not approve ID.'), { tone: 'error' });
                } finally {
                  setActionPending(false);
                }
              })();
            }}
            startEnhancer={<Check className="w-3.5 h-3.5" />}
          >
            {approveActionLabel}
          </AppButton>
        )}
        {needsDocumentType &&
          !canApprove &&
          onApprove &&
          documentTypeEdit === 'credentials-flag' &&
          approveActionLabel !== 'Approve ID' && (
          <AppButton
            variant="primary"
            size="sm"
            onClick={() => void onApprove(guard.id)}
            startEnhancer={<Check className="w-3.5 h-3.5" />}
          >
            {approveActionLabel}
          </AppButton>
        )}
        {onRequestResubmit && canRequestResubmit && (
          <>
            <AppButton variant="outline" size="sm" onClick={() => requestSlot('front')} startEnhancer={<RefreshCw className="w-3.5 h-3.5" />}>
              Resubmit ID front
            </AppButton>
            <AppButton variant="outline" size="sm" onClick={() => requestSlot('back')} startEnhancer={<RefreshCw className="w-3.5 h-3.5" />}>
              Resubmit ID back
            </AppButton>
            <AppButton variant="outline" size="sm" onClick={() => requestSlot('selfie')} startEnhancer={<RefreshCw className="w-3.5 h-3.5" />}>
              Resubmit selfie
            </AppButton>
            <AppButton
              variant="outline"
              size="sm"
              className="text-amber-500 border-amber-500/40"
              onClick={requestAll}
              startEnhancer={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Resubmit all ID photos
            </AppButton>
          </>
        )}
      </div>
    </div>
  );
}
