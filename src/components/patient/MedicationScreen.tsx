import React from 'react';
import { Plus, Pill } from 'lucide-react';
import { HealthTopBar } from './HealthTopBar';
import { MOCK_MEDICATIONS } from './mockData';

interface MedicationScreenProps {
  avatarUrl?: string;
  onProfileClick?: () => void;
}

export function MedicationScreen({ avatarUrl, onProfileClick }: MedicationScreenProps) {
  return (
    <div className="h-full overflow-y-auto overscroll-contain pb-8">
      <HealthTopBar avatarUrl={avatarUrl} onAvatarClick={onProfileClick} showCamera={false} />

      <div className="px-4">
        <h1 className="text-2xl font-bold tracking-tight mb-5">Medication</h1>

        <div className="space-y-4">
          {MOCK_MEDICATIONS.map((med) => {
            const progress = (med.taken / med.total) * 100;
            return (
              <div key={med.id} className="medication-card relative">
                <button
                  type="button"
                  className="absolute top-4 right-4 p-1 text-brand-text-muted hover:text-brand-text"
                  aria-label="Add dose"
                >
                  <Plus className="w-5 h-5" strokeWidth={1.5} />
                </button>
                <p className="font-semibold text-base pr-8">{med.name}</p>
                <p className="text-sm text-brand-text-muted mt-1">{med.instructions}</p>
                <div className="flex items-center gap-3 mt-4">
                  <div className="medication-progress flex-1">
                    <div
                      className="medication-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-brand-text-muted shrink-0 flex items-center gap-1">
                    {med.taken}/{med.total}
                    <Pill className="w-4 h-4" strokeWidth={1.5} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
