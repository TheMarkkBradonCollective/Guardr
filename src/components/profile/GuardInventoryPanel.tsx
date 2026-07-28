import React, { useMemo, useState } from 'react';
import type { GuardInventoryEquipmentItem, GuardInventoryUniform, SecurityGuard } from '../../types';
import {
  createInventoryItemId,
  getClientVisibleInventoryEquipment,
  getClientVisibleInventoryUniforms,
  normalizeInventoryEquipment,
  normalizeInventoryUniforms,
} from '../../lib/guardInventory';
import { computeGuardArmedStatus } from '../../lib/guardArmedStatus';
import { GuardArmedStatusPill } from '../guard/GuardArmedStatusPill';
import { AppButton } from '../ui/AppButton';
import { Package, Plus, Shirt } from 'lucide-react';
import { GuardInventoryEquipmentCard } from './inventory/GuardInventoryEquipmentCard';
import { GuardInventoryEquipmentForm } from './inventory/GuardInventoryEquipmentForm';
import { GuardInventoryUniformCard } from './inventory/GuardInventoryUniformCard';
import { GuardInventoryUniformForm } from './inventory/GuardInventoryUniformForm';

interface GuardInventoryPanelProps {
  guard: SecurityGuard;
  editing?: boolean;
  equipment?: GuardInventoryEquipmentItem[];
  uniforms?: GuardInventoryUniform[];
  onEquipmentChange?: (next: GuardInventoryEquipmentItem[]) => void | Promise<void>;
  onUniformsChange?: (next: GuardInventoryUniform[]) => void | Promise<void>;
}

/** Independent guard inventory — equipment and uniforms separate from credentials. */
export function GuardInventoryPanel({
  guard,
  editing = false,
  equipment,
  uniforms,
  onEquipmentChange,
  onUniformsChange,
}: GuardInventoryPanelProps) {
  const [equipmentFormOpen, setEquipmentFormOpen] = useState(false);
  const [uniformFormOpen, setUniformFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<GuardInventoryEquipmentItem | null>(null);
  const [editingUniform, setEditingUniform] = useState<GuardInventoryUniform | null>(null);

  const sourceEquipment = equipment ?? guard.inventoryEquipment ?? [];
  const sourceUniforms = uniforms ?? guard.inventoryUniforms ?? [];

  const visibleEquipment = useMemo(() => {
    const items = editing ? normalizeInventoryEquipment(sourceEquipment) : getClientVisibleInventoryEquipment({
      ...guard,
      inventoryEquipment: sourceEquipment,
    });
    return items;
  }, [editing, guard, sourceEquipment]);

  const visibleUniforms = useMemo(() => {
    return editing ? normalizeInventoryUniforms(sourceUniforms) : getClientVisibleInventoryUniforms({
      ...guard,
      inventoryUniforms: sourceUniforms,
    });
  }, [editing, guard, sourceUniforms]);

  const armedStatus = computeGuardArmedStatus(guard);

  const persistEquipment = async (next: GuardInventoryEquipmentItem[]) => {
    await onEquipmentChange?.(normalizeInventoryEquipment(next));
  };

  const persistUniforms = async (next: GuardInventoryUniform[]) => {
    await onUniformsChange?.(normalizeInventoryUniforms(next));
  };

  const handleSaveEquipment = async (item: GuardInventoryEquipmentItem) => {
    const nextId = item.id || createInventoryItemId('inv-eq');
    const nextItem = {
      ...item,
      id: nextId,
      createdAt: item.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const current = normalizeInventoryEquipment(sourceEquipment);
    const exists = current.some((entry) => entry.id === nextItem.id);
    const next = exists
      ? current.map((entry) => (entry.id === nextItem.id ? nextItem : entry))
      : [...current, nextItem];
    await persistEquipment(next);
  };

  const handleSaveUniform = async (uniform: GuardInventoryUniform) => {
    const nextId = uniform.id || createInventoryItemId('inv-uni');
    const nextUniform = {
      ...uniform,
      id: nextId,
      createdAt: uniform.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const current = normalizeInventoryUniforms(sourceUniforms);
    const exists = current.some((entry) => entry.id === nextUniform.id);
    const next = exists
      ? current.map((entry) => (entry.id === nextUniform.id ? nextUniform : entry))
      : [...current, nextUniform];
    await persistUniforms(next);
  };

  return (
    <section className="guard-inventory-panel space-y-6">
      <div className="app-form-section space-y-2 pb-4 border-b border-brand-border">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-text flex items-center gap-2">
          <Package className="w-4 h-4 text-brand-primary shrink-0" />
          Inventory
        </p>
        <p className="text-xs text-brand-text-muted leading-relaxed">
          Showcase the equipment and uniforms you own and can use on assignments. Credentials stay on the
          Credentials tab — certified gear only appears here after Guardr verifies the required permits.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <GuardArmedStatusPill guard={guard} status={armedStatus} />
          <span className="text-xs text-brand-text-muted">
            {armedStatus === 'armed'
              ? 'Firearm listed in inventory'
              : armedStatus === 'light-armed'
                ? 'Less-lethal weapons in inventory'
                : 'No certified weapons in inventory'}
          </span>
        </div>
      </div>

      <section className="app-form-section space-y-3 pb-5 border-b border-brand-border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">Equipment inventory</p>
            <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
              Body cam, flashlight, handcuffs, duty gear, and certified weapons — each with type, make, model,
              condition, quantity, and photos.
            </p>
          </div>
          {editing && (
            <AppButton
              type="button"
              variant="primary"
              size="sm"
              startEnhancer={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingEquipment(null);
                setEquipmentFormOpen(true);
              }}
            >
              Add equipment
            </AppButton>
          )}
        </div>

        {visibleEquipment.length === 0 ? (
          <p className="text-sm text-brand-text-muted py-3">
            {editing
              ? 'No equipment listed yet. Add your duty gear so clients can see what you carry.'
              : 'No equipment listed yet.'}
          </p>
        ) : (
          <div className="space-y-3">
            {visibleEquipment.map((item) => (
              <GuardInventoryEquipmentCard
                key={item.id}
                item={item}
                editing={editing}
                onEdit={() => {
                  setEditingEquipment(item);
                  setEquipmentFormOpen(true);
                }}
                onDelete={() => void persistEquipment(sourceEquipment.filter((entry) => entry.id !== item.id))}
              />
            ))}
          </div>
        )}
      </section>

      <section className="app-form-section space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-text flex items-center gap-2">
              <Shirt className="w-4 h-4 text-brand-primary shrink-0" />
              Uniform inventory
            </p>
            <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
              List outfits you can wear on assignment — corporate, tactical, polo, business casual, or custom
              looks with a full preview photo.
            </p>
          </div>
          {editing && (
            <AppButton
              type="button"
              variant="primary"
              size="sm"
              startEnhancer={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingUniform(null);
                setUniformFormOpen(true);
              }}
            >
              Add uniform
            </AppButton>
          )}
        </div>

        {visibleUniforms.length === 0 ? (
          <p className="text-sm text-brand-text-muted py-3">
            {editing
              ? 'No uniforms listed yet. Add outfit profiles so clients can request the right appearance.'
              : 'No uniforms listed yet.'}
          </p>
        ) : (
          <div className="space-y-3">
            {visibleUniforms.map((uniform) => (
              <GuardInventoryUniformCard
                key={uniform.id}
                uniform={uniform}
                editing={editing}
                onEdit={() => {
                  setEditingUniform(uniform);
                  setUniformFormOpen(true);
                }}
                onDelete={() => void persistUniforms(sourceUniforms.filter((entry) => entry.id !== uniform.id))}
              />
            ))}
          </div>
        )}
      </section>

      {editing && (
        <>
          <GuardInventoryEquipmentForm
            open={equipmentFormOpen}
            onClose={() => {
              setEquipmentFormOpen(false);
              setEditingEquipment(null);
            }}
            guard={guard}
            initial={editingEquipment}
            onSave={(item) => void handleSaveEquipment(item)}
          />
          <GuardInventoryUniformForm
            open={uniformFormOpen}
            onClose={() => {
              setUniformFormOpen(false);
              setEditingUniform(null);
            }}
            initial={editingUniform}
            onSave={(uniform) => void handleSaveUniform(uniform)}
          />
        </>
      )}
    </section>
  );
}
