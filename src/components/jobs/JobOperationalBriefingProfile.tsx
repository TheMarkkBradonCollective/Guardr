import React from 'react';
import { AlertTriangle, MapPin, Shield } from 'lucide-react';
import {
  JobOperationalCheckpoint,
  JobOperationalContact,
  JobOperationalCustomField,
  JobOperationalDetails,
  JobOperationalLocation,
  SecurityRequest,
} from '../../types';
import {
  hasJobOperationalDetails,
  operationalBriefingLockedMessage,
} from '../../lib/jobOperationalDetails';
import { OPERATIONAL_FIELD_SECTIONS } from '../../lib/jobOperationalFieldRegistry';

function DetailField({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  if (!children || (typeof children === 'string' && !children.trim())) return null;
  return (
    <div className="detail-field">
      <p className="detail-field-label">{title}</p>
      <div className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">{children}</div>
    </div>
  );
}

function LocationList({ title, items }: { title: string; items?: JobOperationalLocation[] }) {
  if (!items?.length) return null;
  return (
    <DetailField title={title}>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>
            {item.label && <p className="font-medium text-brand-text">{item.label}</p>}
            <p className={item.label ? 'text-brand-text-muted mt-0.5' : undefined}>{item.details}</p>
          </li>
        ))}
      </ul>
    </DetailField>
  );
}

function ContactList({ title, items }: { title: string; items?: JobOperationalContact[] }) {
  if (!items?.length) return null;
  return (
    <DetailField title={title}>
      <ul className="space-y-3">
        {items.map((contact, index) => (
          <li key={`${title}-${index}`} className="space-y-0.5">
            {contact.role && <p className="font-medium text-brand-text">{contact.role}</p>}
            {contact.name && <p>{contact.name}</p>}
            {contact.phone && <p className="text-brand-text-muted">{contact.phone}</p>}
            {contact.email && <p className="text-brand-text-muted">{contact.email}</p>}
            {contact.notes && <p className="text-brand-text-muted mt-1">{contact.notes}</p>}
          </li>
        ))}
      </ul>
    </DetailField>
  );
}

function CheckpointList({ title, items }: { title: string; items?: JobOperationalCheckpoint[] }) {
  if (!items?.length) return null;
  return (
    <DetailField title={title}>
      <ul className="space-y-3">
        {items.map((post, index) => (
          <li key={`${title}-${index}`} className="space-y-0.5">
            {post.label && <p className="font-medium text-brand-text">{post.label}</p>}
            {post.location && <p>Location: {post.location}</p>}
            {post.schedule && <p className="text-brand-text-muted">Schedule: {post.schedule}</p>}
            {post.instructions && <p className="mt-1">{post.instructions}</p>}
          </li>
        ))}
      </ul>
    </DetailField>
  );
}

function CustomFieldList({ items }: { items?: JobOperationalCustomField[] }) {
  if (!items?.length) return null;
  return (
    <>
      {items.map((field, index) => (
        <DetailField
          key={`custom-${index}`}
          title={field.section ? `${field.section}: ${field.label}` : field.label}
        >
          {field.value}
        </DetailField>
      ))}
    </>
  );
}

interface JobOperationalBriefingProfileProps {
  details?: JobOperationalDetails;
  locked?: boolean;
  jobStatus?: SecurityRequest['status'];
}

export function JobOperationalBriefingProfile({
  details,
  locked = false,
  jobStatus = 'open',
}: JobOperationalBriefingProfileProps) {
  if (locked) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200 leading-relaxed flex gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{operationalBriefingLockedMessage({ status: jobStatus })}</span>
      </div>
    );
  }

  if (!hasJobOperationalDetails(details)) return null;

  const d = details!;

  return (
    <div className="space-y-0 border-t border-brand-border pt-3">
      <p className="detail-field-label mb-2">
        <Shield className="w-3.5 h-3.5 text-brand-primary" />
        Site briefing
      </p>

      {OPERATIONAL_FIELD_SECTIONS.map((section) => {
        const scalarFields = section.fields
          .map((field) => {
            const val = d[field.key];
            if (typeof val !== 'string' || !val.trim()) return null;
            return <DetailField key={field.key} title={field.label}>{val}</DetailField>;
          })
          .filter(Boolean);

        const listFields = section.lists?.map((list) => {
          if (list.type === 'locationList') {
            return (
              <LocationList
                key={list.key}
                title={list.label}
                items={d[list.key] as JobOperationalLocation[] | undefined}
              />
            );
          }
          if (list.type === 'contactList') {
            return (
              <ContactList
                key={list.key}
                title={list.label}
                items={d[list.key] as JobOperationalContact[] | undefined}
              />
            );
          }
          if (list.type === 'checkpointList') {
            return (
              <CheckpointList
                key={list.key}
                title={list.label}
                items={d[list.key] as JobOperationalCheckpoint[] | undefined}
              />
            );
          }
          return <CustomFieldList key={list.key} items={d[list.key] as JobOperationalCustomField[] | undefined} />;
        });

        const hasContent =
          scalarFields.length > 0 ||
          listFields?.some((node) => node != null);

        if (!hasContent) return null;

        return (
          <div key={section.id} className="mb-4 last:mb-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-brand-text-muted mb-2 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              {section.title}
            </p>
            <div className="space-y-0">
              {scalarFields}
              {listFields}
            </div>
          </div>
        );
      })}
    </div>
  );
}
