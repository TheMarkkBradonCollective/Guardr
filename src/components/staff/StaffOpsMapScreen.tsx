import React, { useMemo, useState } from 'react';
import { SecurityRequest } from '../../types';
import { ShiftMap } from '../guard/ShiftMap';

interface StaffOpsMapScreenProps {
  requests: SecurityRequest[];
}

/** Read-only platform map for staff — not a shift workspace */
export function StaffOpsMapScreen({ requests }: StaffOpsMapScreenProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const mapJobs = useMemo(
    () =>
      requests.filter((r) =>
        ['pending-review', 'open', 'accepted', 'in-progress'].includes(r.status)
      ),
    [requests]
  );

  return (
    <div className="h-full min-h-0 staff-map-layout">
      <ShiftMap
        jobs={mapJobs}
        selectedJobId={selectedJobId}
        onSelectJob={setSelectedJobId}
        pinMode="staff"
      />
    </div>
  );
}
