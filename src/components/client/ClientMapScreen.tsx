import React, { useMemo, useState } from 'react';
import { SecurityRequest } from '../../types';
import { ShiftMap } from '../guard/ShiftMap';

interface ClientMapScreenProps {
  requests: SecurityRequest[];
}

export function ClientMapScreen({ requests }: ClientMapScreenProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const mapJobs = useMemo(
    () =>
      requests.filter((r) =>
        ['pending-review', 'open', 'accepted', 'in-progress'].includes(r.status)
      ),
    [requests]
  );

  return (
    <div className="h-full min-h-0 relative overflow-hidden guard-map-layout">
      <ShiftMap
        jobs={mapJobs}
        selectedJobId={selectedJobId}
        onSelectJob={setSelectedJobId}
      />
    </div>
  );
}
