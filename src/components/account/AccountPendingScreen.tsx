import React from 'react';
import { Clock, User } from 'lucide-react';

interface AccountPendingScreenProps {
  role: 'guard' | 'client';
  onOpenProfile: () => void;
}

export function AccountPendingScreen({ role, onOpenProfile }: AccountPendingScreenProps) {
  const isGuard = role === 'guard';

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="uber-card max-w-md w-full text-center space-y-5 rounded-2xl">
        <Clock className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="font-black text-lg uppercase">Application pending</h2>
        <p className="text-brand-text-muted text-sm leading-relaxed">
          {isGuard
            ? 'Your guard profile is waiting for Guardr staff approval. You can complete your profile and upload credentials now, but you cannot browse or accept jobs until approved.'
            : 'Your client account is waiting for Guardr staff approval. You can update your profile now, but you cannot post jobs or hire guards until approved.'}
        </p>
        <button type="button" onClick={onOpenProfile} className="app-button-primary !w-full !h-11 gap-2">
          <User className="w-4 h-4" />
          {isGuard ? 'Complete your application' : 'View profile'}
        </button>
      </div>
    </div>
  );
}
