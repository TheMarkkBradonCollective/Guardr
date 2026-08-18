import React, { useState } from 'react';
import type { Client, ClientAuthorizedContact } from '../../types';
import {
  contactRoleLabel,
  contactRolesForClientType,
  newAuthorizedContactDraft,
} from '../../lib/clientAuthorizedContacts';
import { normalizeClientType } from '../../lib/clientType';
import { AppButton } from '../ui/AppButton';
import { Plus, Trash2 } from 'lucide-react';

interface ClientAuthorizedContactsSectionProps {
  client: Client;
  contacts: ClientAuthorizedContact[];
  editing: boolean;
  onChange: (contacts: ClientAuthorizedContact[]) => void;
}

export function ClientAuthorizedContactsSection({
  client,
  contacts,
  editing,
  onChange,
}: ClientAuthorizedContactsSectionProps) {
  const clientType = normalizeClientType(client.clientType);
  const roles = contactRolesForClientType(clientType);
  const [draftName, setDraftName] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftRole, setDraftRole] = useState(roles[0]?.id ?? 'contact');

  const isPersonal = clientType === 'personal';
  const title = isPersonal ? 'Authorized contacts' : 'Team & authorized users';
  const description = isPersonal
    ? 'People Guardr or your assigned guards can contact for this account — family, emergency, or anyone you authorize.'
    : 'Managers, employees, and site contacts Guardr can coordinate with for this business. Inviting them to log in as their own users comes next.';

  const addContact = () => {
    if (!draftName.trim()) return;
    onChange([
      ...contacts,
      newAuthorizedContactDraft({
        name: draftName,
        phone: draftPhone,
        email: draftEmail,
        role: draftRole,
      }),
    ]);
    setDraftName('');
    setDraftPhone('');
    setDraftEmail('');
    setDraftRole(roles[0]?.id ?? 'contact');
  };

  const removeContact = (id: string) => {
    onChange(contacts.filter((contact) => contact.id !== id));
  };

  return (
    <div className="space-y-3 pt-4 border-t border-brand-border">
      <div>
        <p className="uber-label">{title}</p>
        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">{description}</p>
      </div>
      {contacts.length === 0 ? (
        <p className="text-sm text-brand-text-muted">No contacts added yet.</p>
      ) : (
        <ul className="space-y-2">
          {contacts.map((contact) => (
            <li key={contact.id} className="wf-list-card items-start">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{contact.name}</p>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  {contactRoleLabel(contact.role, clientType)}
                  {contact.phone ? ` · ${contact.phone}` : ''}
                  {contact.email ? ` · ${contact.email}` : ''}
                </p>
              </div>
              {editing ? (
                <button
                  type="button"
                  className="text-brand-text-muted hover:text-rose-500 p-1"
                  onClick={() => removeContact(contact.id)}
                  aria-label={`Remove ${contact.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {editing ? (
        <div className="space-y-2 rounded-xl border border-brand-border p-3">
          <input
            className="uber-input rounded-xl"
            placeholder="Name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              className="uber-input rounded-xl"
              placeholder="Phone"
              type="tel"
              value={draftPhone}
              onChange={(e) => setDraftPhone(e.target.value)}
            />
            <input
              className="uber-input rounded-xl"
              placeholder="Email (optional)"
              type="email"
              value={draftEmail}
              onChange={(e) => setDraftEmail(e.target.value)}
            />
          </div>
          <select
            className="uber-select w-full rounded-xl"
            value={draftRole}
            onChange={(e) => setDraftRole(e.target.value as typeof draftRole)}
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.label}
              </option>
            ))}
          </select>
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            startEnhancer={<Plus className="w-3.5 h-3.5" />}
            onClick={addContact}
            disabled={!draftName.trim()}
          >
            Add contact
          </AppButton>
        </div>
      ) : null}
    </div>
  );
}
