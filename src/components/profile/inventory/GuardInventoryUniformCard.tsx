import React from 'react';
import type { GuardInventoryUniform } from '../../../types';
import { getInventoryUniformTypeMeta } from '../../../lib/guardInventoryCatalog';
import { inventoryUniformDisplayLabel } from '../../../lib/guardInventory';
import { Pencil, Trash2 } from 'lucide-react';

interface GuardInventoryUniformCardProps {
  uniform: GuardInventoryUniform;
  editing?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function GuardInventoryUniformCard({
  uniform,
  editing = false,
  onEdit,
  onDelete,
}: GuardInventoryUniformCardProps) {
  const meta = getInventoryUniformTypeMeta(uniform.typeId);

  return (
    <article className="wf-list-card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-text">{inventoryUniformDisplayLabel(uniform)}</p>
          <p className="text-xs text-brand-text-muted mt-0.5">{meta?.label}</p>
        </div>
        {editing && (
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" className="text-brand-primary" onClick={onEdit} aria-label="Edit uniform">
              <Pencil className="w-4 h-4" />
            </button>
            <button type="button" className="text-red-400" onClick={onDelete} aria-label="Remove uniform">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <p className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">{uniform.description}</p>

      {uniform.previewImageUrl && (
        <img
          src={uniform.previewImageUrl}
          alt={`${inventoryUniformDisplayLabel(uniform)} preview`}
          className="w-full max-h-80 object-contain rounded-lg border border-brand-border bg-brand-bg-sec"
        />
      )}
    </article>
  );
}
