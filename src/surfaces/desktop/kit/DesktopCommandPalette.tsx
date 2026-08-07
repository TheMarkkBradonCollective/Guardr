import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';
import type { SurfaceCommand } from '../../surfaceNavigation';
import { filterCommands, groupCommandMatches, type CommandMatch } from './commandMatch';
import { formatCombo, useIsMacPlatform } from './useKeyboardShortcuts';

export interface DesktopCommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: SurfaceCommand[];
  onRun: (command: SurfaceCommand) => void;
}

/**
 * Command palette — the desktop surface's fastest path to anything.
 *
 * Fuzzy-matches destinations and actions, keeps a keyboard cursor with
 * arrow/enter, and shows each command's shortcut so the palette teaches the
 * shortcuts rather than replacing them.
 *
 * Desktop only. The mobile and tablet surfaces reach the same destinations
 * through their own navigation because neither has a keyboard to drive a palette.
 */
export function DesktopCommandPalette({ open, onClose, commands, onRun }: DesktopCommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isMac = useIsMacPlatform();

  const matches = useMemo(() => filterCommands(commands, query), [commands, query]);
  const groups = useMemo(() => groupCommandMatches(matches), [matches]);
  const flat = useMemo(() => groups.flatMap((group) => group.matches), [groups]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setCursor(0);
    // Focusing on the next frame avoids fighting the element that opened the palette.
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const active = listRef.current?.querySelector('[data-cursor="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [cursor, open]);

  if (!open) return null;

  const run = (command: SurfaceCommand) => {
    onRun(command);
    onClose();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCursor((value) => (flat.length === 0 ? 0 : (value + 1) % flat.length));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCursor((value) => (flat.length === 0 ? 0 : (value - 1 + flat.length) % flat.length));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const match = flat[cursor];
      if (match) run(match.command);
    }
  };

  let flatIndex = -1;

  return (
    <div className="sfd-palette-root" role="presentation">
      <div className="sfd-palette-scrim" onClick={onClose} role="presentation" />
      <div className="sfd-palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="sfd-palette-input-row">
          <Search size={16} strokeWidth={2.25} aria-hidden className="sfd-palette-search-icon" />
          <input
            ref={inputRef}
            className="sfd-palette-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search destinations and actions…"
            aria-label="Search commands"
            role="combobox"
            aria-expanded
            aria-controls="sfd-palette-list"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="sfd-kbd">Esc</kbd>
        </div>

        <div className="sfd-palette-list" id="sfd-palette-list" ref={listRef} role="listbox">
          {flat.length === 0 ? (
            <p className="sfd-palette-empty">No matches for “{query}”</p>
          ) : (
            groups.map((group) => (
              <div className="sfd-palette-group" key={group.group}>
                <p className="sfd-palette-group-title">{group.group}</p>
                {group.matches.map((match) => {
                  flatIndex += 1;
                  const index = flatIndex;
                  return (
                    <CommandRow
                      key={`${match.command.kind}-${match.command.id}`}
                      match={match}
                      active={index === cursor}
                      isMac={isMac}
                      onHover={() => setCursor(index)}
                      onSelect={() => run(match.command)}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>

        <footer className="sfd-palette-foot">
          <span>
            <kbd className="sfd-kbd">↑</kbd>
            <kbd className="sfd-kbd">↓</kbd> navigate
          </span>
          <span>
            <kbd className="sfd-kbd">
              <CornerDownLeft size={11} strokeWidth={2.5} aria-hidden />
            </kbd>{' '}
            open
          </span>
          <span>
            <kbd className="sfd-kbd">{formatCombo('mod+k', isMac)}</kbd> toggle
          </span>
        </footer>
      </div>
    </div>
  );
}

function CommandRow({
  match,
  active,
  isMac,
  onHover,
  onSelect,
}: {
  match: CommandMatch;
  active: boolean;
  isMac: boolean;
  onHover: () => void;
  onSelect: () => void;
}) {
  const Icon = match.command.icon;
  const highlights = new Set(match.highlights);

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      data-cursor={active ? 'true' : undefined}
      className="sfd-palette-row"
      onMouseMove={onHover}
      onClick={onSelect}
    >
      {Icon ? <Icon size={15} strokeWidth={2} aria-hidden className="sfd-palette-row-icon" /> : <span className="sfd-palette-row-icon" />}
      <span className="sfd-palette-row-label">
        {[...match.command.label].map((char, index) => (
          <span key={index} data-match={highlights.has(index) ? 'true' : undefined}>
            {char}
          </span>
        ))}
      </span>
      {match.command.shortcut ? (
        <kbd className="sfd-kbd">{formatCombo(match.command.shortcut.replace(' ', '+'), isMac)}</kbd>
      ) : null}
    </button>
  );
}
