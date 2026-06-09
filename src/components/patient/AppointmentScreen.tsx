import React from 'react';
import { Calendar, Video } from 'lucide-react';
import { AppList, AppListRow, AppScreen, AppScreenTitle } from './AppPrimitives';
import { MOCK_APPOINTMENTS } from './mockData';

export function AppointmentScreen() {
  return (
    <AppScreen className="pb-8">
      <AppScreenTitle>My Appointments</AppScreenTitle>
      <AppList>
        {MOCK_APPOINTMENTS.map((appt) => (
          <AppListRow key={appt.id} className="app-list-row-align-top !items-start !py-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-base">{appt.doctorName}</p>
                  <p className="text-sm text-brand-text-muted mt-0.5">{appt.specialty}</p>
                </div>
                {appt.videoEnabled && (
                  <Video className="w-4 h-4 text-brand-text-muted shrink-0 mt-1" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex items-center gap-2 mt-3 text-sm text-brand-text-muted">
                <Calendar className="w-4 h-4" strokeWidth={1.5} />
                <span>{appt.date}</span>
                <span>·</span>
                <span>{appt.time}</span>
              </div>
            </div>
          </AppListRow>
        ))}
      </AppList>
    </AppScreen>
  );
}
