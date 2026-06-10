import React from 'react';
import { JobListingLike } from '../../lib/jobListing';
import { JobListingProfile } from './JobListingProfile';

/** Compact review card used at end of posting flows */
export function JobListingPreview({ job }: { job: JobListingLike }) {
  return (
    <div className="wf-list-card flex-col items-stretch !flex !flex-col gap-0 !p-0 overflow-hidden">
      <div className="p-4">
        <JobListingProfile job={job} showBadges={false} />
      </div>
    </div>
  );
}
