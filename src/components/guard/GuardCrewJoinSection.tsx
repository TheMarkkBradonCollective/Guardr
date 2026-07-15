import React from 'react';
import { Users } from 'lucide-react';
import { TeamCodeJoinPanel } from './TeamCodeJoinPanel';

interface GuardCrewJoinSectionProps {
  onJoin: (code: string) => void | Promise<void>;
}

export function GuardCrewJoinSection({ onJoin }: GuardCrewJoinSectionProps) {
  return (
    <section className="guard-pref-crew-section guard-settings-crew-card">
      <div className="guard-pref-crew-header">
        <div className="guard-pref-crew-icon-wrap" aria-hidden>
          <Users className="guard-pref-crew-icon" />
        </div>
        <div>
          <h3 className="guard-pref-crew-title">Join a crew</h3>
          <p className="guard-pref-crew-desc">
            Enter a crew code from a coordinator to join their standing crew on a job. You can only
            be on one standing crew at a time — leave your current crew before joining another.
          </p>
        </div>
      </div>
      <TeamCodeJoinPanel onJoin={onJoin} variant="preferences" />
    </section>
  );
}
