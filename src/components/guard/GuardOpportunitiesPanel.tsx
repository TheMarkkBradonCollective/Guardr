import React, { useMemo, useState } from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import {
  filterJobsByCategory,
  JobCategoryId,
  JobSortKey,
  sortJobs,
} from '../../lib/guardJobs';
import { GuardJobCard } from './GuardJobCard';
import { ShiftMap } from './ShiftMap';
import { Filter, List, Map as MapIcon } from 'lucide-react';

interface GuardOpportunitiesPanelProps {
  jobs: GuardJobView[];
  guard: SecurityGuard;
  selectedJobId: string | null;
  onSelectJob: (id: string | null) => void;
  onAcceptJob: (id: string) => void;
}

export function GuardOpportunitiesPanel({
  jobs,
  guard,
  selectedJobId,
  onSelectJob,
  onAcceptJob,
}: GuardOpportunitiesPanelProps) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState<JobSortKey>('distance');
  const [category, setCategory] = useState<JobCategoryId | null>(null);

  const filtered = useMemo(
    () => sortJobs(filterJobsByCategory(jobs, category), sortBy),
    [jobs, category, sortBy]
  );

  const selectedJob = filtered.find((j) => j.id === selectedJobId) ?? null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-1 py-3 border-b border-brand-border space-y-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Find shifts</h2>
          <div className="segmented-control w-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`segmented-control-btn flex items-center gap-1 ${viewMode === 'list' ? 'segmented-control-btn-active' : ''}`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`segmented-control-btn flex items-center gap-1 ${viewMode === 'map' ? 'segmented-control-btn-active' : ''}`}
            >
              <MapIcon className="w-3.5 h-3.5" /> Map
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-brand-text-muted shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as JobSortKey)}
            className="uber-select text-xs flex-1 rounded-lg"
          >
            <option value="distance">Sort: Distance</option>
            <option value="pay">Sort: Pay</option>
            <option value="startTime">Sort: Start Time</option>
            <option value="clientRating">Sort: Client Rating</option>
          </select>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="flex-1 relative min-h-0">
          <ShiftMap
            jobs={filtered}
            selectedJobId={selectedJobId}
            onSelectJob={onSelectJob}
            className="relative h-full"
          />
          {selectedJob && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent max-h-[55vh] overflow-y-auto">
              <GuardJobCard
                job={selectedJob}
                guard={guard}
                onClose={() => onSelectJob(null)}
                onAccept={() => onAcceptJob(selectedJob.id)}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center text-brand-text-muted font-mono text-sm py-16">No opportunities match your filters.</p>
          ) : (
            filtered.map((job) => (
              <div key={job.id} className="uber-card rounded-2xl p-4">
                <GuardJobCard
                  job={job}
                  guard={guard}
                  onAccept={() => onAcceptJob(job.id)}
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
