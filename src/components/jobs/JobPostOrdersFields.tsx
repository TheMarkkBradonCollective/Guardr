import React from 'react';
import { ClientServiceId } from '../../lib/clientRequestFlow';
import { JobListingFields, serviceListingPlaceholders } from '../../lib/jobListing';

interface JobPostOrdersFieldsProps {
  value: JobListingFields;
  onChange: (next: JobListingFields) => void;
  showContact?: boolean;
  serviceId?: ClientServiceId;
}

export function JobPostOrdersFields({
  value,
  onChange,
  showContact = true,
  serviceId = 'standing-guard',
}: JobPostOrdersFieldsProps) {
  const placeholders = serviceListingPlaceholders(serviceId);

  const set = <K extends keyof JobListingFields>(key: K, val: JobListingFields[K]) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="uber-label block mb-1.5">Listing overview <span className="text-brand-text-muted font-normal">(optional)</span></label>
        <p className="text-xs text-brand-text-muted mb-2">
          How you present this opportunity to guards — scope, tone, and expectations.
        </p>
        <textarea
          value={value.description}
          onChange={(e) => set('description', e.target.value)}
          rows={4}
          placeholder={placeholders.description}
          className="uber-input w-full resize-none rounded-xl"
        />
      </div>

      <div>
        <label className="uber-label block mb-1.5">Dress code & uniform <span className="text-brand-text-muted font-normal">(optional)</span></label>
        <textarea
          value={value.uniformRequirements}
          onChange={(e) => set('uniformRequirements', e.target.value)}
          rows={3}
          placeholder={placeholders.uniformRequirements}
          className="uber-input w-full resize-none rounded-xl"
        />
      </div>

      <div>
        <label className="uber-label block mb-1.5">Equipment required <span className="text-brand-text-muted font-normal">(optional)</span></label>
        <textarea
          value={value.equipmentRequirements}
          onChange={(e) => set('equipmentRequirements', e.target.value)}
          rows={3}
          placeholder={placeholders.equipmentRequirements}
          className="uber-input w-full resize-none rounded-xl"
        />
      </div>

      <div>
        <label className="uber-label block mb-1.5">Post orders & site instructions <span className="text-brand-text-muted font-normal">(optional)</span></label>
        <textarea
          value={value.siteInstructions}
          onChange={(e) => set('siteInstructions', e.target.value)}
          rows={4}
          placeholder={placeholders.siteInstructions}
          className="uber-input w-full resize-none rounded-xl"
        />
      </div>

      {showContact && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="uber-label block mb-1.5">On-site contact name</label>
            <input
              type="text"
              value={value.contactName}
              onChange={(e) => set('contactName', e.target.value)}
              placeholder="Site manager or POC"
              className="uber-input w-full rounded-xl"
            />
          </div>
          <div>
            <label className="uber-label block mb-1.5">Contact phone</label>
            <input
              type="tel"
              value={value.contactPhone}
              onChange={(e) => set('contactPhone', e.target.value)}
              placeholder="(555) 555-0100"
              className="uber-input w-full rounded-xl"
            />
          </div>
        </div>
      )}

      <div>
        <label className="uber-label block mb-1.5">Parking & arrival</label>
        <textarea
          value={value.parkingInstructions}
          onChange={(e) => set('parkingInstructions', e.target.value)}
          rows={2}
          placeholder={placeholders.parkingInstructions}
          className="uber-input w-full resize-none rounded-xl"
        />
      </div>

      <div>
        <label className="uber-label block mb-1.5">Access & check-in</label>
        <textarea
          value={value.accessInstructions}
          onChange={(e) => set('accessInstructions', e.target.value)}
          rows={2}
          placeholder={placeholders.accessInstructions}
          className="uber-input w-full resize-none rounded-xl"
        />
      </div>
    </div>
  );
}
