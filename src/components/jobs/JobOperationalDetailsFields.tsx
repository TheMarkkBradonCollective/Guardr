import React from 'react';
import { JobOperationalDetails, JobOperationalLocation } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

interface JobOperationalDetailsFieldsProps {
  value: JobOperationalDetails;
  onChange: (next: JobOperationalDetails) => void;
}

function setField<K extends keyof JobOperationalDetails>(
  value: JobOperationalDetails,
  onChange: (next: JobOperationalDetails) => void,
  key: K,
  val: JobOperationalDetails[K]
) {
  onChange({ ...value, [key]: val });
}

function LocationListEditor({
  title,
  description,
  items,
  onChange,
  addLabel,
  placeholder,
}: {
  title: string;
  description: string;
  items: JobOperationalLocation[];
  onChange: (items: JobOperationalLocation[]) => void;
  addLabel: string;
  placeholder: string;
}) {
  const updateItem = (index: number, patch: Partial<JobOperationalLocation>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-brand-text">{title}</p>
        <p className="text-xs text-brand-text-muted mt-0.5">{description}</p>
      </div>
      {items.map((item, index) => (
        <div key={index} className="rounded-xl border border-brand-border p-3 space-y-2 bg-brand-bg-sec/40">
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              value={item.label ?? ''}
              onChange={(e) => updateItem(index, { label: e.target.value })}
              placeholder="Label (optional) — e.g. North bar, Gate B"
              className="uber-input w-full rounded-lg !h-9 !text-xs"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="shrink-0 p-2 text-brand-text-muted hover:text-red-400"
              aria-label={`Remove ${title} entry`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={item.details}
            onChange={(e) => updateItem(index, { details: e.target.value })}
            rows={2}
            placeholder={placeholder}
            className="uber-input w-full resize-none rounded-lg !text-sm"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { details: '' }])}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
      >
        <Plus className="w-3.5 h-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

function TextField({
  label,
  hint,
  value,
  onChange,
  rows = 2,
  placeholder,
}: {
  label: string;
  hint?: string;
  value?: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="uber-label block mb-1.5">{label}</label>
      {hint && <p className="text-xs text-brand-text-muted mb-2">{hint}</p>}
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="uber-input w-full resize-none rounded-xl"
      />
    </div>
  );
}

function TimeField({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="uber-label block mb-1.5">{label}</label>
      {hint && <p className="text-xs text-brand-text-muted mb-2">{hint}</p>}
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'e.g. 9:00 PM'}
        className="uber-input w-full rounded-xl"
      />
    </div>
  );
}

function Section({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="rounded-xl border border-brand-border bg-brand-surface/60 group" open={defaultOpen}>
      <summary className="cursor-pointer list-none px-4 py-3">
        <p className="text-sm font-semibold text-brand-text">{title}</p>
        <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">{description}</p>
      </summary>
      <div className="px-4 pb-4 space-y-4 border-t border-brand-border pt-4">{children}</div>
    </details>
  );
}

export function JobOperationalDetailsFields({ value, onChange }: JobOperationalDetailsFieldsProps) {
  const set = <K extends keyof JobOperationalDetails>(key: K, val: JobOperationalDetails[K]) =>
    setField(value, onChange, key, val);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold">Site briefing (optional)</p>
        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
          Set up security your way — every field is optional. Guards only see this briefing after they are approved
          for the shift (access codes, keys, emergency plans, and equipment locations stay hidden until then).
        </p>
      </div>

      <Section
        title="Venue & crowd"
        description="Expected attendance, post assignment, doors, curfew, and smoking areas."
        defaultOpen
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Expected patron / guest count"
            value={value.patronHeadCount}
            onChange={(v) => set('patronHeadCount', v)}
            placeholder="e.g. 500 guests, 21+ only"
            rows={1}
          />
          <TextField
            label="Post / assignment"
            value={value.postAssignment}
            onChange={(v) => set('postAssignment', v)}
            placeholder="e.g. Main entrance, VIP lane, perimeter"
            rows={1}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TimeField label="Doors open" value={value.doorsOpenTime} onChange={(v) => set('doorsOpenTime', v)} />
          <TimeField label="Doors close" value={value.doorsCloseTime} onChange={(v) => set('doorsCloseTime', v)} />
          <TimeField label="Curfew" value={value.curfewTime} onChange={(v) => set('curfewTime', v)} />
        </div>
        <TextField
          label="Smoking area location"
          value={value.smokingAreaLocation}
          onChange={(v) => set('smokingAreaLocation', v)}
          placeholder="e.g. North patio, rear lot behind kitchen"
          rows={2}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TimeField
            label="Smoking area opens"
            value={value.smokingAreaOpenTime}
            onChange={(v) => set('smokingAreaOpenTime', v)}
          />
          <TimeField
            label="Smoking area closes"
            value={value.smokingAreaCloseTime}
            onChange={(v) => set('smokingAreaCloseTime', v)}
          />
        </div>
        <TextField
          label="Smoking rules for guests"
          value={value.smokingAreaRules}
          onChange={(v) => set('smokingAreaRules', v)}
          placeholder="Escort required, wristband, re-entry line, distance from doors..."
          rows={2}
        />
        <TextField
          label="Guard coverage / post notes"
          value={value.smokingAreaGuardNotes}
          onChange={(v) => set('smokingAreaGuardNotes', v)}
          placeholder="Assigned post, patrol interval, conflict de-escalation..."
          rows={2}
        />
      </Section>

      <Section title="Bar & hospitality" description="Bar operations, last call, and close procedures.">
        <TextField
          label="Bar details"
          value={value.barDetails}
          onChange={(v) => set('barDetails', v)}
          placeholder="Which bars are active, cash vs tab, security at each bar..."
          rows={3}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TimeField label="Bar last call" value={value.barLastCallTime} onChange={(v) => set('barLastCallTime', v)} />
          <TimeField label="Bar close" value={value.barCloseTime} onChange={(v) => set('barCloseTime', v)} />
        </div>
      </Section>

      <Section
        title="Access, codes & keys"
        description="Gate codes, lockboxes, and key control — hidden from guards until approved."
      >
        <TextField
          label="Access codes"
          value={value.accessCodes}
          onChange={(v) => set('accessCodes', v)}
          placeholder="Gate, door, alarm, and radio codes..."
          rows={3}
        />
        <TextField
          label="Key location"
          value={value.keyLocation}
          onChange={(v) => set('keyLocation', v)}
          placeholder="Lockbox location, who holds master keys, return procedure..."
        />
        <TextField
          label="Additional access notes"
          value={value.accessNotes}
          onChange={(v) => set('accessNotes', v)}
          placeholder="Escort requirements, after-hours entry, contractor access..."
        />
      </Section>

      <Section title="Emergency & radio" description="Protocols, channels, and cooldown / de-escalation areas.">
        <TextField
          label="Emergency protocol"
          value={value.emergencyProtocol}
          onChange={(v) => set('emergencyProtocol', v)}
          placeholder="Medical, fire, active threat, evacuation order of operations..."
          rows={4}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            label="Radio channel"
            value={value.radioChannel}
            onChange={(v) => set('radioChannel', v)}
            placeholder="e.g. Channel 2 — Security"
            rows={1}
          />
          <TextField
            label="Radio codes"
            value={value.radioCodes}
            onChange={(v) => set('radioCodes', v)}
            placeholder="10-codes, plain-language signals..."
            rows={1}
          />
        </div>
        <TextField
          label="Cooldown / de-escalation area"
          value={value.cooldownAreaDetails}
          onChange={(v) => set('cooldownAreaDetails', v)}
          placeholder="Where to move guests during conflicts, staff escort rules..."
        />
        <TextField
          label="Medical emergency contacts"
          value={value.medicalEmergencyContacts}
          onChange={(v) => set('medicalEmergencyContacts', v)}
          placeholder="On-site medic, EMT, venue nurse, 911 notes..."
        />
        <TextField
          label="Nearest hospital"
          value={value.nearestHospital}
          onChange={(v) => set('nearestHospital', v)}
          placeholder="Name, address, ambulance staging..."
        />
        <TextField
          label="Evacuation rally point"
          value={value.evacuationRallyPoint}
          onChange={(v) => set('evacuationRallyPoint', v)}
          placeholder="Primary and secondary muster locations..."
        />
      </Section>

      <Section title="Safety equipment on site" description="Add as many locations as you need.">
        <LocationListEditor
          title="Fire extinguishers"
          description="Building maps, zones, or landmarks for each extinguisher."
          items={value.fireExtinguisherLocations ?? []}
          onChange={(items) => set('fireExtinguisherLocations', items)}
          addLabel="Add extinguisher location"
          placeholder="e.g. East wall by main bar, ABC dry chemical"
        />
        <LocationListEditor
          title="Med kits"
          description="First-aid kits and trauma bags."
          items={value.medkitLocations ?? []}
          onChange={(items) => set('medkitLocations', items)}
          addLabel="Add med kit location"
          placeholder="e.g. Security desk drawer, manager office"
        />
        <LocationListEditor
          title="Narcan / Naloxone"
          description="Opioid emergency kits if available on site."
          items={value.narcanLocations ?? []}
          onChange={(items) => set('narcanLocations', items)}
          addLabel="Add Narcan location"
          placeholder="e.g. Bar 2 supervisor station"
        />
      </Section>

      <Section title="VIP, credentialing & operations" description="Artist zones, wristbands, load-in, and guard station.">
        <TextField
          label="VIP / restricted areas"
          value={value.vipAreaDetails}
          onChange={(v) => set('vipAreaDetails', v)}
          placeholder="Green room, artist lanes, backstage rules..."
        />
        <TextField
          label="Credentialing & wristbands"
          value={value.credentialingDetails}
          onChange={(v) => set('credentialingDetails', v)}
          placeholder="Band colors, laminate levels, scan procedures..."
        />
        <TextField
          label="Vendor load-in / load-out"
          value={value.vendorLoadInDetails}
          onChange={(v) => set('vendorLoadInDetails', v)}
          placeholder="Dock schedule, escorts, vehicle search policy..."
        />
        <TextField
          label="Guard station / command post"
          value={value.guardStationLocation}
          onChange={(v) => set('guardStationLocation', v)}
          placeholder="Where guards report, charge radios, store logs..."
        />
        <TextField
          label="Restroom / break policy"
          value={value.restroomBreakPolicy}
          onChange={(v) => set('restroomBreakPolicy', v)}
          placeholder="Relief procedure, max time off post..."
        />
        <TextField
          label="Lost child / guest procedure"
          value={value.lostChildProcedure}
          onChange={(v) => set('lostChildProcedure', v)}
          placeholder="Code word, PA announcement, reunification area..."
        />
        <TextField
          label="Intoxication / 86 policy"
          value={value.intoxicationPolicy}
          onChange={(v) => set('intoxicationPolicy', v)}
          placeholder="When to involve bar staff, cut-off, ejection routes..."
        />
        <TextField
          label="Filming / photo policy"
          value={value.filmingPhotoPolicy}
          onChange={(v) => set('filmingPhotoPolicy', v)}
          placeholder="Guest phones, media, artist restrictions..."
        />
      </Section>

      <Section title="Anything else" description="Special requests or notes for your security team.">
        <TextField
          label="Client special requests"
          value={value.clientSpecialRequests}
          onChange={(v) => set('clientSpecialRequests', v)}
          placeholder="Prior incidents, problem guests, neighborhood concerns..."
          rows={3}
        />
        <TextField
          label="Additional notes"
          value={value.additionalNotes}
          onChange={(v) => set('additionalNotes', v)}
          placeholder="Anything we missed — your guards will see this after approval."
          rows={4}
        />
      </Section>
    </div>
  );
}
