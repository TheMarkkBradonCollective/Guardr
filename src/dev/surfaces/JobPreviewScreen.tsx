import React, { useEffect, useState } from 'react';
import { StaffJobDetailPanel } from '../../components/staff/StaffJobDetailPanel';
import { useSurfaceKind } from '../../surfaces';
import { PREVIEW_JOB } from '../previewStaffFixtures';
import { PREVIEW_SHIFTS, SHIFT_STATUS_LABEL } from '../surfacePreviewData';
import { previewScreenState } from '../previewScreenState';

/** Staff job review against fixtures, composed differently on each surface. */
export function JobPreviewScreen() {
  const surface = useSurfaceKind();
  const state = previewScreenState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (surface === 'mobile' || state !== 'ready') return;
    setSelectedId((current) => current ?? PREVIEW_SHIFTS[0]?.id ?? null);
  }, [surface, state]);
  const selected = PREVIEW_SHIFTS.find((shift) => shift.id === selectedId) ?? null;
  const detail = selected ? (
    <StaffJobDetailPanel
      req={{
        ...PREVIEW_JOB,
        id: selected.id,
        title: selected.site,
        location: selected.city,
        latitude: 38.5816,
        longitude: -121.4944,
      }}
      guards={[]}
      canEditJobListing
      staffRole="director"
      onApproveRequest={() => undefined}
      onDenyRequest={() => undefined}
      onEditJobListing={() => undefined}
      onBack={surface === 'mobile' ? () => setSelectedId(null) : undefined}
    />
  ) : (
    <div className="job-surface-empty">
      <p>Select a job</p>
      <p>Review details stay beside the list on tablet and in the inspector on desktop.</p>
    </div>
  );

  if (state === 'error') {
    return (
      <div className={`job-surface job-surface--${surface} job-surface--state`} role="alert">
        <p className="job-surface-error-title">Couldn&apos;t load jobs</p>
        <p className="job-surface-error-body">The job list did not come back. Try again in a moment.</p>
      </div>
    );
  }

  if (state === 'empty') {
    return (
      <div className={`job-surface job-surface--${surface} job-surface--state job-surface--empty`}>
        <p className="job-surface-empty-title">No jobs yet</p>
        <p>Jobs will appear here once clients post coverage requests.</p>
      </div>
    );
  }

  if (surface === 'desktop') {
    return (
      <div className="job-surface job-surface--desktop">
        <div className="job-surface-table-wrap">
        <table className="job-surface-table">
          <caption className="sr-only">Jobs</caption>
          <thead>
            <tr>
              <th>Site</th>
              <th>Guard</th>
              <th>Window</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {PREVIEW_SHIFTS.map((shift) => (
              <tr
                key={shift.id}
                data-selected={shift.id === selectedId ? 'true' : undefined}
                onClick={() => setSelectedId(shift.id)}
              >
                <td>{shift.site}</td>
                <td>{shift.guard}</td>
                <td>{shift.window}</td>
                <td>{SHIFT_STATUS_LABEL[shift.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="job-surface-detail">{detail}</div>
      </div>
    );
  }

  if (surface === 'tablet') {
    return (
      <div className="job-surface job-surface--tablet">
        <div className="job-surface-list" role="list">
          {PREVIEW_SHIFTS.map((shift) => (
            <button
              key={shift.id}
              type="button"
              data-selected={shift.id === selectedId ? 'true' : undefined}
              onClick={() => setSelectedId(shift.id)}
            >
              <span>{shift.site}</span>
              <span>{shift.city}</span>
              <span>{SHIFT_STATUS_LABEL[shift.status]}</span>
            </button>
          ))}
        </div>
        <div className="job-surface-detail">{detail}</div>
      </div>
    );
  }

  if (selected) {
    return <div className="job-surface job-surface--mobile">{detail}</div>;
  }

  return (
    <div className="job-surface job-surface--mobile" role="list">
      {PREVIEW_SHIFTS.map((shift) => (
        <button key={shift.id} type="button" onClick={() => setSelectedId(shift.id)}>
          <span>{shift.site}</span>
          <span>
            {shift.city} · {shift.window}
          </span>
          <span>{SHIFT_STATUS_LABEL[shift.status]}</span>
        </button>
      ))}
    </div>
  );
}
