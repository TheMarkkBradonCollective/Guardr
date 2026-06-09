import React from 'react';
import { Calendar, Video } from 'lucide-react';
import { MOCK_APPOINTMENTS } from './mockData';

export function AppointmentScreen() {
  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 py-4 pb-8">
      <h1 className="text-2xl font-bold tracking-tight mb-4">My Appointments</h1>
      <div className="space-y-3">
        {MOCK_APPOINTMENTS.map((appt) => (
          <div key={appt.id} className="appointment-card !min-w-0 w-full">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-base">{appt.doctorName}</p>
                <p className="text-sm text-brand-text-muted">{appt.specialty}</p>
              </div>
              {appt.videoEnabled && (
                <span className="inline-flex items-center gap-1 text-xs text-brand-text-muted bg-brand-bg-sec px-2 py-1 rounded-full">
                  <Video className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Video
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm text-brand-text-muted">
              <Calendar className="w-4 h-4" strokeWidth={1.5} />
              <span>{appt.date}</span>
              <span>·</span>
              <span>{appt.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
