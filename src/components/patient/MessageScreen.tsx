import React from 'react';
import { MOCK_MESSAGES } from './mockData';

export function MessageScreen() {
  return (
    <div className="h-full overflow-y-auto overscroll-contain px-4 py-4 pb-8">
      <h1 className="text-2xl font-bold tracking-tight mb-4">Messages</h1>
      <div className="space-y-2">
        {MOCK_MESSAGES.map((msg) => (
          <button
            key={msg.id}
            type="button"
            className="wf-list-card wf-list-card-interactive w-full !items-start"
          >
            <div className="w-11 h-11 rounded-full bg-brand-bg-sec shrink-0 flex items-center justify-center text-sm font-semibold text-brand-text-muted">
              {msg.sender.charAt(0)}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between gap-2">
                <p className={`font-semibold text-sm truncate ${msg.unread ? 'text-brand-text' : ''}`}>
                  {msg.sender}
                </p>
                <span className="text-xs text-brand-text-muted shrink-0">{msg.time}</span>
              </div>
              <p className={`text-sm mt-0.5 truncate ${msg.unread ? 'text-brand-text' : 'text-brand-text-muted'}`}>
                {msg.preview}
              </p>
            </div>
            {msg.unread && (
              <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0 mt-2" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
