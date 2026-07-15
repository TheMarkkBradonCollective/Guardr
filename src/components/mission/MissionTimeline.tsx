import React from 'react';
import type { MissionTimelineItem } from '../../lib/missionTracking';

interface MissionTimelineProps {
  items: MissionTimelineItem[];
  compact?: boolean;
}

function formatTime(iso?: string): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function MissionTimeline({ items, compact = false }: MissionTimelineProps) {
  return (
    <ol className={`mission-timeline ${compact ? 'mission-timeline--compact' : ''}`}>
      {items.map((item) => (
        <li
          key={item.step}
          className={[
            'mission-timeline-step',
            item.complete ? 'mission-timeline-step--complete' : '',
            item.active ? 'mission-timeline-step--active' : '',
            item.step === 'emergency' ? 'mission-timeline-step--emergency' : '',
            item.step === 'incident' ? 'mission-timeline-step--incident' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className="mission-timeline-dot" aria-hidden />
          <div className="mission-timeline-content">
            <p className="mission-timeline-label">{item.label}</p>
            {item.timestamp && (
              <p className="mission-timeline-time">{formatTime(item.timestamp)}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
