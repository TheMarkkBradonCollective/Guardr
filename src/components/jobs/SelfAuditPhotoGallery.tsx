import React from 'react';
import { SecurityRequest } from '../../types';
import { getSelfAuditPhoto, SELF_AUDIT_PHOTO_LABELS, SelfAuditPhotoKind } from '../../lib/selfAuditPhotos';

const KINDS: SelfAuditPhotoKind[] = ['self', 'uniform', 'shoes'];

export function SelfAuditPhotoGallery({ audit }: { audit: SecurityRequest['checkInAudit'] }) {
  if (!audit) return null;

  const items = KINDS.map((kind) => ({
    kind,
    url: getSelfAuditPhoto(audit, kind),
  })).filter((item) => !!item.url);

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {items.map(({ kind, url }) => (
        <div key={kind}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mb-1">
            {SELF_AUDIT_PHOTO_LABELS[kind]}
          </p>
          <img src={url} alt={SELF_AUDIT_PHOTO_LABELS[kind]} className="w-full h-24 object-cover rounded-lg border border-brand-border" />
        </div>
      ))}
    </div>
  );
}
