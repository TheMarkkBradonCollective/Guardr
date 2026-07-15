import { ArrowRight, Building2, Shield } from 'lucide-react';
import { AppItemCard, AppItemCardStack } from '../ui/app/AppPrimitives';

interface AppRolePickerProps {
  onNavigateToAuth: (role: 'guard' | 'client', mode: 'sign-up') => void;
}

export function AppRolePicker({ onNavigateToAuth }: AppRolePickerProps) {
  return (
    <AppItemCardStack className="app-role-picker">
      <AppItemCard onClick={() => onNavigateToAuth('client', 'sign-up')} className="app-role-picker-card">
        <div className="app-role-picker-icon app-role-picker-icon--client" aria-hidden="true">
          <Building2 className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">Client</p>
          <p className="font-semibold mt-0.5">Post jobs and manage coverage</p>
          <p className="text-sm text-brand-text-muted mt-1 leading-relaxed">
            Create a client account to request guards and track shifts.
          </p>
        </div>
        <ArrowRight className="w-4 h-4 shrink-0 text-brand-text-muted" aria-hidden="true" />
      </AppItemCard>

      <AppItemCard onClick={() => onNavigateToAuth('guard', 'sign-up')} className="app-role-picker-card">
        <div className="app-role-picker-icon" aria-hidden="true">
          <Shield className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">Guard</p>
          <p className="font-semibold mt-0.5">Find work and manage shifts</p>
          <p className="text-sm text-brand-text-muted mt-1 leading-relaxed">
            Create a guard account to browse jobs and manage your schedule.
          </p>
        </div>
        <ArrowRight className="w-4 h-4 shrink-0 text-brand-text-muted" aria-hidden="true" />
      </AppItemCard>
    </AppItemCardStack>
  );
}
