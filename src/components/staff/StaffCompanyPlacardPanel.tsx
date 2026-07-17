import React, { useMemo, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { SessionUser } from '../../types';
import { hasExecutivePaymentControls } from '../../lib/permissions';
import {
  buildCompanyPlacardChecklist,
  companyDocumentTypeById,
  companyPlacardChecklistSummary,
  newCompanyPublicDocumentId,
  type CompanyDocumentTypeId,
  type CompanyPublicDocument,
} from '../../lib/companyPlacard';
import { MetricCell, MetricStrip } from '../baseui/dashboard';
import { GuardrButton } from '../baseui/GuardrButton';
import { DocumentPhotoUploadField } from '../credentials/DocumentPhotoUploadField';
import { AppFormSection } from '../ui/app/AppPrimitives';
import { AppSwitch } from '../ui/AppSwitch';
import { showAppToast } from '../ui/AppToast';

interface StaffCompanyPlacardPanelProps {
  currentUser: SessionUser;
  documents: CompanyPublicDocument[];
  publicEnabled: boolean;
  onSaveDocument: (doc: CompanyPublicDocument) => Promise<void>;
  onSetPublicEnabled: (enabled: boolean) => Promise<void>;
  variant?: 'mobile' | 'desktop';
}

function statusTone(status: string): string {
  switch (status) {
    case 'on_file':
      return 'text-emerald-500';
    case 'expiring_soon':
      return 'text-amber-500';
    case 'expired':
      return 'text-red-400';
    default:
      return 'text-brand-text-muted';
  }
}

function ChecklistRow({
  done,
  label,
  detail,
  required,
  status,
  expanded,
  onToggle,
  children,
}: {
  done: boolean;
  label: string;
  detail: string;
  required: boolean;
  status: string;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-brand-border overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-brand-surface-elevated/50 transition-colors"
      >
        <span className="shrink-0 mt-0.5">
          {done ? (
            <span className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </span>
          ) : (
            <span className="w-5 h-5 rounded-full border-2 border-brand-border block" />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold tracking-tight text-brand-text">{label}</p>
            {required ? (
              <span className="text-[10px] font-bold uppercase tracking-wide text-brand-primary">
                Required
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wide text-brand-text-muted">
                Optional
              </span>
            )}
          </div>
          <p className={`text-xs mt-0.5 ${statusTone(status)}`}>{detail}</p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 shrink-0 text-brand-text-muted mt-1" />
        ) : (
          <ChevronDown className="w-4 h-4 shrink-0 text-brand-text-muted mt-1" />
        )}
      </button>
      {expanded && children && (
        <div className="border-t border-brand-border p-4 bg-brand-bg-sec/50 space-y-4">{children}</div>
      )}
    </div>
  );
}

export function StaffCompanyPlacardPanel({
  currentUser,
  documents,
  publicEnabled,
  onSaveDocument,
  onSetPublicEnabled,
  variant = 'mobile',
}: StaffCompanyPlacardPanelProps) {
  const canEdit = hasExecutivePaymentControls(currentUser);
  const checklist = useMemo(() => buildCompanyPlacardChecklist(documents), [documents]);
  const summary = useMemo(() => companyPlacardChecklistSummary(checklist), [checklist]);
  const [expandedType, setExpandedType] = useState<CompanyDocumentTypeId | null>(null);
  const [savingType, setSavingType] = useState<CompanyDocumentTypeId | null>(null);
  const isDesktop = variant === 'desktop';

  const toggleExpanded = (typeId: CompanyDocumentTypeId) => {
    setExpandedType((prev) => (prev === typeId ? null : typeId));
  };

  const content = (
      <div className={isDesktop ? 'space-y-5' : 'pb-6 space-y-5'}>
        <p className="text-sm text-brand-text-muted leading-relaxed">
          Upload company registration and insurance for the public homepage — like a placard on the
          business wall. Guardr is a technology marketplace, not a licensed security company. This is
          display-only and does not block platform operations.
        </p>

        <MetricStrip className="!px-0">
          <MetricCell label="Required on file" value={`${summary.requiredOnFile}/${summary.requiredTotal}`} />
          <MetricCell label="Still needed" value={String(summary.requiredMissing)} accent={summary.requiredMissing > 0} />
          <MetricCell label="Expiring / expired" value={String(summary.expiringOrExpired)} accent={summary.expiringOrExpired > 0} />
          <MetricCell label="On homepage" value={String(documents.filter((d) => d.displayOnHomepage).length)} />
        </MetricStrip>

        {summary.expiringOrExpired > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Some credentials are expiring or expired. Update them so the public placard stays current.</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 text-sm">
          <span>Show company placard on public homepage</span>
          <AppSwitch
            checked={publicEnabled}
            disabled={!canEdit}
            onChange={(checked) => void onSetPublicEnabled(checked)}
            ariaLabel="Show company placard on public homepage"
          />
        </div>

        <div className="space-y-3">
          {checklist.map((item) => (
            <ChecklistRow
              key={item.type.id}
              done={item.status === 'on_file' || item.status === 'expiring_soon'}
              label={item.type.title}
              detail={item.detail}
              required={item.type.required}
              status={item.status}
              expanded={expandedType === item.type.id}
              onToggle={() => canEdit && toggleExpanded(item.type.id)}
            >
              {canEdit && expandedType === item.type.id && (
                <CompanyDocumentEditor
                  typeId={item.type.id}
                  document={item.document}
                  saving={savingType === item.type.id}
                  variant={variant}
                  onSave={async (next) => {
                    setSavingType(item.type.id);
                    try {
                      await onSaveDocument(next);
                      showAppToast('Company credential saved.', { tone: 'success' });
                    } catch (err) {
                      showAppToast(
                        err instanceof Error ? err.message : 'Could not save credential.',
                        { tone: 'error' }
                      );
                    } finally {
                      setSavingType(null);
                    }
                  }}
                />
              )}
            </ChecklistRow>
          ))}
        </div>

        {!canEdit && (
          <p className="text-xs text-brand-text-muted">
            View-only — Manager access or above is required to upload or edit company placard credentials.
          </p>
        )}
      </div>
  );

  if (isDesktop) {
    return content;
  }

  return <AppFormSection title="Company public placard">{content}</AppFormSection>;
}

function CompanyDocumentEditor({
  typeId,
  document,
  saving,
  variant = 'mobile',
  onSave,
}: {
  typeId: CompanyDocumentTypeId;
  document?: CompanyPublicDocument;
  saving: boolean;
  variant?: 'mobile' | 'desktop';
  onSave: (doc: CompanyPublicDocument) => Promise<void>;
}) {
  const typeDef = companyDocumentTypeById(typeId)!;
  const [documentNumber, setDocumentNumber] = useState(document?.documentNumber ?? '');
  const [issuer, setIssuer] = useState(document?.issuer ?? '');
  const [issuedDate, setIssuedDate] = useState(document?.issuedDate ?? '');
  const [expiryDate, setExpiryDate] = useState(document?.expiryDate ?? '');
  const [imageUrl, setImageUrl] = useState(document?.imageUrl ?? '');
  const [displayOnHomepage, setDisplayOnHomepage] = useState(document?.displayOnHomepage !== false);
  const [notes, setNotes] = useState(document?.notes ?? '');

  const handleSave = () => {
    const now = new Date().toISOString();
    const next: CompanyPublicDocument = {
      id: document?.id ?? newCompanyPublicDocumentId(),
      documentType: typeId,
      title: typeDef.title,
      documentNumber: documentNumber.trim() || undefined,
      issuer: issuer.trim() || undefined,
      issuedDate: issuedDate.trim() || undefined,
      expiryDate: expiryDate.trim() || undefined,
      imageUrl: imageUrl || undefined,
      displayOnHomepage,
      notes: notes.trim() || undefined,
      uploadedAt: document?.uploadedAt ?? now,
      updatedAt: now,
    };
    void onSave(next);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-brand-text-muted leading-relaxed">{typeDef.description}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block space-y-1">
          <span className="uber-label">{typeDef.numberLabel}</span>
          <input
            className="uber-input w-full"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            placeholder="Enter number"
          />
        </label>
        <label className="block space-y-1">
          <span className="uber-label">{typeDef.issuerLabel}</span>
          <input
            className="uber-input w-full"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder="Carrier, city, or authority"
          />
        </label>
        <label className="block space-y-1">
          <span className="uber-label">Issued date</span>
          <input
            type="date"
            className="uber-input w-full"
            value={issuedDate}
            onChange={(e) => setIssuedDate(e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="uber-label">Expiry date</span>
          <input
            type="date"
            className="uber-input w-full"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </label>
      </div>
      <DocumentPhotoUploadField
        imageUrl={imageUrl || undefined}
        onImageUrlChange={setImageUrl}
        label="Document photo (registration, COI, or certificate)"
        previewAlt={`${typeDef.title} preview`}
      />
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>Show on public homepage placard</span>
        <AppSwitch
          checked={displayOnHomepage}
          onChange={setDisplayOnHomepage}
          ariaLabel="Show on public homepage placard"
        />
      </div>
      <label className="block space-y-1">
        <span className="uber-label">Internal notes (staff only)</span>
        <textarea
          className="uber-input w-full resize-y"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Renewal reminders, filing location, etc."
        />
      </label>
      <GuardrButton type="button" kind="primary" size="compact" disabled={saving} onClick={handleSave}>
        {saving ? 'Saving…' : 'Save credential'}
      </GuardrButton>
    </div>
  );
}
