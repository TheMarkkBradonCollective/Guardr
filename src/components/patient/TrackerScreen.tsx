import React from 'react';
import { Plus } from 'lucide-react';
import { WfMetricTile } from '../ui/wireframe';
import { MOCK_TRACKER_METRICS } from './mockData';

export function TrackerScreen() {
  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 py-4 pb-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Tracker</h1>
        <button
          type="button"
          className="w-9 h-9 rounded-full bg-brand-bg-sec flex items-center justify-center text-brand-text"
          aria-label="Add metric"
        >
          <Plus className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {MOCK_TRACKER_METRICS.map((metric) => (
          <WfMetricTile
            key={metric.id}
            label={metric.label}
            value={metric.unit ? `${metric.value} ${metric.unit}` : metric.value}
            accent={metric.id === 'bp'}
          />
        ))}
      </div>

      <section>
        <h2 className="app-section-title mb-3">Recent readings</h2>
        <div className="space-y-2">
          {[
            { date: 'Today, 8:30 AM', metric: 'Blood Pressure', value: '120/80 mmHg' },
            { date: 'Yesterday, 9:15 AM', metric: 'Temperature', value: '98 F' },
            { date: 'Yesterday, 9:15 AM', metric: 'Pulse', value: '74 bpm' },
          ].map((reading, i) => (
            <div key={i} className="wf-list-card !py-3">
              <div className="flex-1">
                <p className="font-semibold text-sm">{reading.metric}</p>
                <p className="text-xs text-brand-text-muted mt-0.5">{reading.date}</p>
              </div>
              <p className="font-semibold text-sm">{reading.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
