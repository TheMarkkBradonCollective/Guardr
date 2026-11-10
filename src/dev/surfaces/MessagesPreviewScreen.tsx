import React, { useState } from 'react';
import { MessagesConversationFacts, MessagesHubLayout } from '../../components/messaging/MessagesHubLayout';
import { previewScreenState } from '../previewScreenState';

const THREADS = [
  {
    id: 'portage',
    title: 'Portage Distribution — Dock A3',
    meta: 'Job thread',
    preview: 'Gate is clear for the inbound trucks.',
  },
  {
    id: 'staff',
    title: 'Staff channel',
    meta: 'Team',
    preview: 'Coverage for Harbor is confirmed.',
  },
];

/** Inbox compositions for phone, tablet, and desktop without a database session. */
export function MessagesPreviewScreen() {
  const state = previewScreenState();
  const threads = state === 'ready' ? THREADS : [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = threads.find((thread) => thread.id === selectedId) ?? null;

  const list =
    state === 'error' ? (
      <p className="messages-preview-error" role="alert">
        Couldn&apos;t load conversations.
      </p>
    ) : threads.length === 0 ? (
      <p className="messages-preview-empty">No conversations yet.</p>
    ) : (
      <div className="messages-preview-list" role="list">
        {threads.map((thread) => (
          <button
            key={thread.id}
            type="button"
            data-selected={thread.id === selectedId ? 'true' : undefined}
            onClick={() => setSelectedId(thread.id)}
          >
            <span>{thread.title}</span>
            <span>{thread.preview}</span>
          </button>
        ))}
      </div>
    );

  return (
    <div className="h-full min-h-0">
      <MessagesHubLayout
        list={list}
        detail={
          selected ? (
            <div className="messages-preview-thread">
              <p>{selected.title}</p>
              <p>{selected.preview}</p>
            </div>
          ) : (
            <div />
          )
        }
        hasSelection={!!selected}
        emptyDetailTitle={state === 'error' ? 'Messages unavailable' : 'Select a conversation'}
        emptyDetailHint={
          state === 'error'
            ? 'The inbox did not load.'
            : state === 'empty'
              ? 'New job and team threads will show up here.'
              : 'Choose a chat from your inbox'
        }
        context={
          selected ? (
            <MessagesConversationFacts title={selected.title} meta={selected.meta} detail={selected.preview} />
          ) : undefined
        }
      />
    </div>
  );
}
