import React from 'react';
import { AppList, AppListRow, AppScreen, AppScreenTitle, AvatarPlaceholder } from './AppPrimitives';
import { MOCK_MESSAGES } from './mockData';

export function MessageScreen() {
  return (
    <AppScreen className="pb-8">
      <AppScreenTitle>Messages</AppScreenTitle>
      <AppList>
        {MOCK_MESSAGES.map((msg) => (
          <AppListRow key={msg.id} onClick={() => {}} className="app-list-row-align-top">
            <AvatarPlaceholder name={msg.sender} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={`font-semibold text-sm truncate ${msg.unread ? '' : 'text-brand-text-muted'}`}>
                  {msg.sender}
                </p>
                <span className="text-xs text-brand-text-muted shrink-0">{msg.time}</span>
              </div>
              <p className={`text-sm mt-0.5 truncate ${msg.unread ? 'text-brand-text' : 'text-brand-text-muted'}`}>
                {msg.preview}
              </p>
            </div>
            {msg.unread && <span className="w-2 h-2 rounded-full bg-brand-text shrink-0 mt-2" />}
          </AppListRow>
        ))}
      </AppList>
    </AppScreen>
  );
}
