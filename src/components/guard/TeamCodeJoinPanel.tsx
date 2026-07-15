import React, { useState } from 'react';
import { normalizeTeamCode } from '../../lib/teamCode';
import { KeyRound } from 'lucide-react';

interface TeamCodeJoinPanelProps {
  onJoin: (code: string) => void | Promise<void>;
  compact?: boolean;
  variant?: 'default' | 'preferences';
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

  const isPreferences = variant === 'preferences';

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className={
        isPreferences
          ? 'guard-pref-crew-form'
          : `space-y-2 ${compact ? '' : 'rounded-lg border border-brand-border bg-brand-surface/60 px-3 py-3'}`
      }
    >
      {!isPreferences && (
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-brand-primary shrink-0" />
          <p className="text-sm font-semibold text-brand-text">Join a crew with code</p>
        </div>
      )}
      {!compact && !isPreferences && (
        <p className="text-xs text-brand-text-muted leading-relaxed">{hint}</p>
      )}
      <div className={isPreferences ? 'guard-pref-crew-input-row' : 'flex gap-2'}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CREW-XXXXXX"
          className={`app-input flex-1 text-sm font-mono tracking-wide uppercase ${
            isPreferences ? 'guard-pref-crew-input' : ''
          }`}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={!normalizeTeamCode(code) || joining}
          className={`app-button-primary shrink-0 ${isPreferences ? 'guard-pref-crew-submit' : 'app-btn-sm'}`}
        >
          {joining ? 'Joining…' : 'Join crew'}
        </button>
      </div>
    </form>
  );
}
