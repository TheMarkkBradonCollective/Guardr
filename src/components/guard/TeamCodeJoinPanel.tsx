import React, { useState } from 'react';
import { normalizeTeamCode } from '../../lib/teamCode';
import { KeyRound } from 'lucide-react';

interface TeamCodeJoinPanelProps {
  onJoin: (code: string) => void | Promise<void>;
  compact?: boolean;
  variant?: 'default' | 'crew';
  hint?: string;
}

export function TeamCodeJoinPanel({
  onJoin,
  compact = false,
  variant = 'default',
  hint = 'Enter a crew code from your coordinator to join their coordinated crew.',
}: TeamCodeJoinPanelProps) {
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeTeamCode(code);
    if (!normalized) return;
    setJoining(true);
    try {
      await onJoin(normalized);
      setCode('');
    } finally {
      setJoining(false);
    }
  };

  const isCrew = variant === 'crew';

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className={
        isCrew
          ? 'crew-join-form'
          : `space-y-2 ${compact ? '' : 'rounded-lg border border-brand-border bg-brand-surface/60 px-3 py-3'}`
      }
    >
      {!isCrew && (
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-brand-primary shrink-0" />
          <p className="text-sm font-semibold text-brand-text">Join a crew with code</p>
        </div>
      )}
      {!compact && !isCrew && (
        <p className="text-xs text-brand-text-muted leading-relaxed">{hint}</p>
      )}
      <div className={isCrew ? 'crew-join-form-fields' : 'flex gap-2'}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CREW-XXXXXX"
          className={`app-input text-sm font-mono tracking-wide uppercase ${
            isCrew ? 'crew-join-input w-full' : 'flex-1'
          }`}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={!normalizeTeamCode(code) || joining}
          className={`app-button-primary ${
            isCrew ? 'crew-join-submit w-full app-btn-md' : 'shrink-0 app-btn-sm'
          }`}
        >
          {joining ? 'Joining…' : 'Join crew'}
        </button>
      </div>
    </form>
  );
}
