import React from 'react';
import type { GuardInventoryEquipmentItem } from '../../../types';
import {
  GUARD_INVENTORY_CONDITION_LABELS,
  getInventoryEquipmentTypeMeta,
} from '../../../lib/guardInventoryCatalog';
import { inventoryEquipmentDisplayLabel } from '../../../lib/guardInventory';
import { Pencil, Trash2 } from 'lucide-react';

interface GuardInventoryEquipmentCardProps {
  item: GuardInventoryEquipmentItem;
  editing?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function GuardInventoryEquipmentCard({
  item,
  editing = false,
  onEdit,
  onDelete,
}: GuardInventoryEquipmentCardProps) {
  const meta = getInventoryEquipmentTypeMeta(item.typeId);
  const photos = [item.primaryImageUrl, ...(item.additionalImageUrls ?? [])].filter(Boolean) as string[];

  return (
    <article className="wf-list-card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-text">{inventoryEquipmentDisplayLabel(item)}</p>
          <p className="text-xs text-brand-text-muted mt-0.5">{meta?.shortLabel ?? meta?.label}</p>
        </div>
        {editing && (
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" className="text-brand-primary" onClick={onEdit} aria-label="Edit equipment">
              <Pencil className="w-4 h-4" />
            </button>
            <button type="button" className="text-red-400" onClick={onDelete} aria-label="Remove equipment">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {item.condition && (
          <p>
            <span className="text-brand-text-muted">Condition:</span>{' '}
            <span className="text-brand-text">{GUARD_INVENTORY_CONDITION_LABELS[item.condition]}</span>
          </p>
        )}
        <p>
          <span className="text-brand-text-muted">Qty:</span>{' '}
          <span className="text-brand-text">{item.quantity}</span>
        </p>
      </div>

      {item.notes && (
        <p className="text-xs text-brand-text-muted leading-relaxed whitespace-pre-wrap">{item.notes}</p>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {photos.map((url, index) => (
            <img
              key={`${item.id}-photo-${index}`}
              src={url}
              alt={`${meta?.label ?? 'Equipment'} photo ${index + 1}`}
              className="w-full aspect-[4/3] object-cover rounded-lg border border-brand-border bg-brand-bg-sec"
            />
          ))}
        </div>
      )}
    </article>
  );
}
