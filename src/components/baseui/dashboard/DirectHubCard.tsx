import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

/** Guardr Direct home hub card — title with arrow, description, circular accent icon. */
export function DirectHubCard({
  title,
  description,
  icon: Icon,
  iconTone = 'green',
  onClick,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  iconTone?: 'green' | 'yellow' | 'orange';
  onClick: () => void;
}) {
  return (
    <button type="button" className="uber-direct-hub-card" onClick={onClick}>
      <div className="uber-direct-hub-card-copy">
        <span className="uber-direct-hub-card-title">
          {title}
          <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
        </span>
        <span className="uber-direct-hub-card-description">{description}</span>
      </div>
      <span className={`uber-direct-hub-card-icon uber-direct-hub-card-icon--${iconTone}`} aria-hidden>
        <Icon size={22} strokeWidth={1.75} />
      </span>
    </button>
  );
}
