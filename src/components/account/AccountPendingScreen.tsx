import React from 'react';
import { SecurityGuard } from '../../types';
import { Clock, User } from 'lucide-react';
import { GuardActivationChecklistView } from '../guard/GuardActivationChecklistView';

interface AccountPendingScreenProps {
  role: 'guard' | 'client';
  guard?: SecurityGuard | null;
  onOpenProfile: () => void;
}

export function AccountPendingScreen({ role, guard, onOpenProfile }: AccountPendingScreenProps) {
  const isGuard = role === 'guard';

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="uber-card max-w-md w-full text-center space-y-5 rounded-2xl">
        <Clock className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="font-black text-lg uppercase">Application pending</h2>
        <p className="text-brand-text-muted text-sm leading-relaxed">
          {isGuard
            ? 'Before your account can be activated, submit your government ID (front, back, and identity selfie) and upload your BSIS Guard Card. Guardr staff will verify both. After activation you can add more credentials and accept jobs.'
            : 'Your client account is waiting for Guardr staff approval. You can update your profile now, but you cannot post jobs or hire guards until approved.'}
        </p>
        {isGuard && guard && (
          <div className="text-left">
            <GuardActivationChecklistView guard={guard} />
          </div>
        )}
        <button type="button" onClick={onOpenProfile} className="app-button-primary !w-full !h-11 gap-2">
          <User className="w-4 h-4" />
          {isGuard ? 'Complete your application' : 'View profile'}
        </button>
      </div>
    </div>
  );
}
