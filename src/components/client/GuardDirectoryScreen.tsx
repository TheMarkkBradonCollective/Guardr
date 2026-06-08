import React, { useMemo, useState } from 'react';
import { SecurityGuard } from '../../types';
import { filterGuardsByQuery, getBrowsableGuards } from '../../lib/guardDirectory';
import { Search, Shield, Star, ChevronRight } from 'lucide-react';

interface GuardDirectoryScreenProps {
  guards: SecurityGuard[];
  onSelectGuard: (guard: SecurityGuard) => void;
  onBack?: () => void;
}

export function GuardDirectoryScreen({ guards, onSelectGuard, onBack }: GuardDirectoryScreenProps) {
  const [query, setQuery] = useState('');

  const browseable = useMemo(() => getBrowsableGuards(guards), [guards]);
  const filtered = useMemo(() => filterGuardsByQuery(browseable, query), [browseable, query]);

  return (
    <div className="h-full flex flex-col overflow-hidden client-content-shell">
      <div className="shrink-0 px-4 pt-4 pb-3 space-y-3">
        {onBack && (
          <button type="button" onClick={onBack} className="text-sm font-medium text-brand-primary">
            ← Back
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Find a guard</h1>
          <p className="text-sm text-brand-text-muted mt-1">
            Browse verified professionals, view experience, and request someone directly.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, skills, or experience…"
            className="uber-input pl-10 w-full"
          />
        </div>
        <p className="text-xs text-brand-text-muted">{filtered.length} guard{filtered.length !== 1 ? 's' : ''} available</p>
      </div>

      <div className="guard-scroll-panel flex-1 px-4 pb-8">
        {filtered.length === 0 ? (
          <div className="app-card text-center py-12 text-sm text-brand-text-muted">
            No guards match your search. Try a general security request instead.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((guard) => (
              <button
                key={guard.id}
                type="button"
                onClick={() => onSelectGuard(guard)}
                className="w-full app-card text-left hover:border-brand-primary/35 transition-colors flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-primary/15 flex items-center justify-center shrink-0 overflow-hidden">
                  {guard.avatar ? (
                    <img src={guard.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-6 h-6 text-brand-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{guard.name}</p>
                    {guard.isStaff && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded">
                        Staff
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-brand-text-muted mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-brand-primary text-brand-primary" />
                    <span>{guard.rating.toFixed(1)}</span>
                    <span>·</span>
                    <span>{guard.jobsCompleted} shifts</span>
                    {guard.isArmed && (
                      <>
                        <span>·</span>
                        <span>Armed</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-brand-text-muted mt-1 line-clamp-2">{guard.bio || 'Licensed security professional.'}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-brand-text-muted shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
