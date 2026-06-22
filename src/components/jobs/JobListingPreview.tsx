import React from 'react';
import { JobListingLike } from '../../lib/jobListing';
import { JobListingProfile } from './JobListingProfile';

/** Compact flat review used at end of posting flows */
export function JobListingPreview({ job }: { job: JobListingLike }) {
  return (
    <JobListingProfile
      job={job}
      showBadges={false}
      operationalDetails={job.operationalDetails}
    />
  );
}
