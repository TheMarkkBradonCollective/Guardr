import React, { useState } from 'react';
import type {
  GuardInventoryEquipmentCondition,
  GuardInventoryEquipmentItem,
  GuardInventoryEquipmentTypeId,
  SecurityGuard,
} from '../../types';
import {
  GUARD_INVENTORY_CONDITION_LABELS,
  GUARD_INVENTORY_EQUIPMENT_TYPES,
} from '../../lib/guardInventoryCatalog';
import { guardCanListInventoryEquipmentType } from '../../lib/guardInventory';
import { DocumentPhotoUploadField } from '../../credentials/DocumentPhotoUploadField';
import { AppFormSheet } from '../../ui/app/AppFormSheet';
import { AppButton } from '../../ui/AppButton';
import { Plus, Trash2 } from 'lucide-react';

interface GuardInventoryEquipmentFormProps {
  open: boolean;
  onClose: () => void;
  guard: SecurityGuard;
  initial?: GuardInventoryEquipmentItem | null;
  onSave: (item: GuardInventoryEquipmentItem) => void;
}

const EMPTY_FORM = {
  typeId: 'body-camera' as GuardInventoryEquipmentTypeId,
  brand: '',
  model: '',
  condition: 'good' as GuardInventoryEquipmentCondition,
  quantity: 1,
  notes: '',
  primaryImageUrl: undefined as string | undefined,
  additionalImageUrls: [] as string[],
};

export function GuardInventoryEquipmentForm({
  open,
  onClose,
  guard,
  initial,
  onSave,
}: GuardInventoryEquipmentFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);

  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        typeId: initial.typeId,
        brand: initial.brand ?? '',
        model: initial.model ?? '',
        condition: initial.condition ?? 'good',
        quantity: initial.quantity,
        notes: initial.notes ?? '',
        primaryImageUrl: initial.primaryImageUrl,
        additionalImageUrls: initial.additionalImageUrls ?? [],
      });
      return;
    }
    setForm(EMPTY_FORM);
  }, [open, initial]);

  const selectedMeta = GUARD_INVENTORY_EQUIPMENT_TYPES.find((entry) => entry.id === form.typeId);
  const canListType = selectedMeta ? guardCanListInventoryEquipmentType(guard, form.typeId) : false;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canListType) return;
    onSave({
      id: initial?.id ?? '',
      typeId: form.typeId,
      brand: form.brand.trim() || undefined,
      model: form.model.trim() || undefined,
      condition: form.condition,
      quantity: Math.max(1, form.quantity),
      notes: form.notes.trim() || undefined,
      primaryImageUrl: form.primaryImageUrl,
      additionalImageUrls: form.additionalImageUrls.filter(Boolean),
      createdAt: initial?.createdAt,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <AppFormSheet
      open={open}
      onClose={onClose}
      title={initial ? 'Edit equipment' : 'Add equipment'}
      subtitle="Include type, make, model, and photos so clients know what you carry."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="uber-label">Equipment type</span>
          <select
            className="app-input w-full"
            value={form.typeId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                typeId: event.target.value as GuardInventoryEquipmentTypeId,
              }))
            }
          >
            {GUARD_INVENTORY_EQUIPMENT_TYPES.map((entry) => {
              const eligible = guardCanListInventoryEquipmentType(guard, entry.id);
              return (
                <option key={entry.id} value={entry.id} disabled={!eligible}>
                  {entry.label}
                  {!eligible ? ' — credentials required' : ''}
                </option>
              );
            })}
          </select>
          {selectedMeta && (
            <p className="text-xs text-brand-text-muted leading-relaxed">{selectedMeta.description}</p>
          )}
          {!canListType && (
            <p className="text-xs text-amber-400">
              Upload and verify the required credentials on the Credentials tab before adding this equipment.
            </p>
          )}
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="uber-label">Brand</span>
            <input
              className="app-input w-full"
              value={form.brand}
              onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))}
              placeholder="e.g. Axon"
            />
          </label>
          <label className="block space-y-1">
            <span className="uber-label">Model</span>
            <input
              className="app-input w-full"
              value={form.model}
              onChange={(event) => setForm((current) => ({ ...current, model: event.target.value }))}
              placeholder="e.g. Body 4"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="uber-label">Condition</span>
            <select
              className="app-input w-full"
              value={form.condition}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  condition: event.target.value as GuardInventoryEquipmentCondition,
                }))
              }
            >
              {Object.entries(GUARD_INVENTORY_CONDITION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="uber-label">Quantity</span>
            <input
              type="number"
              min={1}
              max={99}
              className="app-input w-full"
              value={form.quantity}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  quantity: Math.max(1, Number(event.target.value) || 1),
                }))
              }
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="uber-label">Notes</span>
          <textarea
            className="app-input w-full min-h-[72px]"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Serial number, holster compatibility, accessories, etc."
          />
        </label>

        <DocumentPhotoUploadField
          label="Primary preview photo"
          imageUrl={form.primaryImageUrl}
          onImageUrlChange={(primaryImageUrl) => setForm((current) => ({ ...current, primaryImageUrl }))}
          previewAlt="Equipment preview"
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="uber-label">Additional photos</p>
            <button
              type="button"
              className="text-xs font-semibold text-brand-primary inline-flex items-center gap-1"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  additionalImageUrls: [...current.additionalImageUrls, ''],
                }))
              }
            >
              <Plus className="w-3.5 h-3.5" />
              Add photo
            </button>
          </div>
          {form.additionalImageUrls.map((url, index) => (
            <div key={`extra-${index}`} className="space-y-2">
              <DocumentPhotoUploadField
                label={`Photo ${index + 2}`}
                imageUrl={url || undefined}
                onImageUrlChange={(nextUrl) =>
                  setForm((current) => ({
                    ...current,
                    additionalImageUrls: current.additionalImageUrls.map((entry, entryIndex) =>
                      entryIndex === index ? nextUrl : entry
                    ),
                  }))
                }
                previewAlt={`Equipment photo ${index + 2}`}
              />
              <button
                type="button"
                className="text-xs text-red-400 inline-flex items-center gap-1"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    additionalImageUrls: current.additionalImageUrls.filter((_, entryIndex) => entryIndex !== index),
                  }))
                }
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove photo
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <AppButton type="submit" variant="primary" disabled={!canListType}>
            {initial ? 'Save equipment' : 'Add equipment'}
          </AppButton>
          <AppButton type="button" variant="outline" onClick={onClose}>
            Cancel
          </AppButton>
        </div>
      </form>
    </AppFormSheet>
  );
}
