import React from 'react';
import { SecurityRequest, SecurityGuard } from '../../types';
import {
  checkJobRequirements,
  formatJobDate,
  formatJobTimeRange,
  getEstimatedGuardEarnings,
  getGuardHourlyPay,
  getJobDistance,
} from '../../lib/guardJobs';
import { formatDuration } from '../../lib/dates';
import { MapPin, Star, Clock, Users, Check, X } from 'lucide-react';

interface GuardJobCardProps {
  job: SecurityRequest;
  guard: SecurityGuard;
  onAccept?: () => void;
  onSelect?: () => void;
  onClose?: () => void;
  compact?: boolean;
}

export function GuardJobCard({ job, guard, onAccept, onSelect, onClose, compact = false }: GuardJobCardProps) {
  const distance = getJobDistance(job);
  const hourlyPay = getGuardHourlyPay(job);
  const estimated = getEstimatedGuardEarnings(job);
  const { checks, canAccept } = checkJobRequirements(guard, job);

  if (compact) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left rounded-xl border border-white/10 bg-white/5 p-3 hover:border-brand-primary/50 transition-colors"
      >
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{job.title}</p>
            <p className="text-[11px] text-white/50 font-mono mt-0.5">{distance} mi · ${hourlyPay}/hr</p>
          </div>
          <p className="text-sm font-black font-mono text-brand-primary shrink-0">${estimated}</p>
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-black tracking-tight leading-tight">{job.title}</h3>
          <p className="flex items-center gap-1.5 text-sm text-white/60 font-mono mt-2">
            <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" />
            {distance} Miles Away
          </p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white p-1" aria-label="Close">
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <p className="text-[10px] font-mono uppercase text-white/40 mb-1">Hourly Rate</p>
          <p className="text-2xl font-black font-mono text-brand-primary">${hourlyPay}<span className="text-sm text-white/50">/hr</span></p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <p className="text-[10px] font-mono uppercase text-white/40 mb-1">Client Rating</p>
          <p className="text-2xl font-black font-mono flex items-center gap-1">
            <Star className="w-5 h-5 fill-brand-primary text-brand-primary" />
            {job.clientRating?.toFixed(1) ?? '—'}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2">
        <div className="flex items-center justify-between text-sm font-mono">
          <span className="text-white/50">{formatJobDate(job)}</span>
          <span className="font-bold">{formatJobTimeRange(job)}</span>
        </div>
        <div className="flex items-center justify-between text-sm font-mono border-t border-white/10 pt-2">
          <span className="flex items-center gap-1.5 text-white/50">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(job.durationHours)}
          </span>
          <span className="flex items-center gap-1.5 text-white/50">
            <Users className="w-3.5 h-3.5" />
            {job.guardsNeeded ?? 1} guard{(job.guardsNeeded ?? 1) > 1 ? 's' : ''} needed
          </span>
        </div>
      </div>

      <div className="rounded-xl bg-brand-primary/10 border border-brand-primary/30 p-4">
        <p className="text-[10px] font-mono uppercase text-brand-primary/80 mb-1">Estimated Earnings</p>
        <p className="text-3xl font-black font-mono text-brand-primary">${estimated}</p>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-mono uppercase text-white/40 tracking-wider">Requirements</p>
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-xs font-mono">
            {c.met ? (
              <Check className="w-3.5 h-3.5 text-brand-primary shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-red-400 shrink-0" />
            )}
            <span className={c.met ? 'text-white/70' : 'text-red-300'}>{c.label}</span>
          </div>
        ))}
      </div>

      {onAccept && job.status === 'open' && (
        <button
          type="button"
          onClick={onAccept}
          disabled={!canAccept}
          className="w-full py-4 rounded-xl bg-brand-primary text-black font-black text-sm uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          Accept Assignment
        </button>
      )}
    </div>
  );
}
