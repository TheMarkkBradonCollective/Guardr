import React from 'react';
import { TeamCodeJoinPanel } from './TeamCodeJoinPanel';

interface GuardCrewJoinSectionProps {
  onJoin: (code: string) => void | Promise<void>;
}

export function GuardCrewJoinSection({ onJoin }: GuardCrewJoinSectionProps) {
  return (
    <section className="guard-factors-section crew-hub-section">
      <div className="guard-factors-header">
        <h3 className="guard-factors-heading">Join a crew</h3>
        <p className="guard-factors-subheading">
          Enter a crew code from a coordinator to join their standing crew on a job.
        </p>
      </div>
      <div className="rounded-lg border border-brand-border bg-brand-surface/40 px-3 py-3 space-y-3">
        <p className="text-xs text-brand-text-muted leading-relaxed">
          You can only be on one standing crew at a time — leave your current crew before joining
          another.
        </p>
        <TeamCodeJoinPanel onJoin={onJoin} compact />
      </div>
    </section>
  );
}
