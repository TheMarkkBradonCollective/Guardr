import React from 'react';
import { Users } from 'lucide-react';
import { TeamCodeJoinPanel } from './TeamCodeJoinPanel';

interface GuardCrewJoinSectionProps {
  onJoin: (code: string) => void | Promise<void>;
}

export function GuardCrewJoinSection({ onJoin }: GuardCrewJoinSectionProps) {
  return (
    <section className="crew-join-section">
      <div className="crew-join-card">
        <div className="crew-join-header">
          <div className="crew-join-icon-wrap" aria-hidden>
            <Users className="crew-join-icon" />
          </div>
          <div className="min-w-0">
            <h3 className="crew-join-title">Join a crew</h3>
            <p className="crew-join-desc">
              Enter a crew code from a coordinator to join their standing crew on a job. You can only
              be on one standing crew at a time — leave your current crew before joining another.
            </p>
          </div>
        </div>
        <TeamCodeJoinPanel onJoin={onJoin} variant="crew" />
      </div>
    </section>
  );
}
