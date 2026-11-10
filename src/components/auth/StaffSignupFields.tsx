/** isSignUp && role === 'staff' && ( fields extracted from AuthPage. */
import type React from 'react';
import type { ReactNode } from 'react';
import { STAFF_ROLES_ORDERED } from '../../lib/permissions';
import type { StaffRole } from '../../types';
import { EqualOpportunityNotice } from '../legal/EqualOpportunityNotice';
import { Phone } from 'lucide-react';

export interface RenderStaffSignupFieldsBindings {
  guardAvailabilityNotes: string;
  guardPrimaryCity: string;
  guardSummary: string;
  guardYearsExperience: string;
  onOpenLegal: (page: import("../../lib/legalContent").LegalPageId) => void;
  phone: string;
  setGuardAvailabilityNotes: (value: React.SetStateAction<string>) => void;
  setGuardPrimaryCity: (value: React.SetStateAction<string>) => void;
  setGuardSummary: (value: React.SetStateAction<string>) => void;
  setGuardYearsExperience: (value: React.SetStateAction<string>) => void;
  setPhone: (value: React.SetStateAction<string>) => void;
  setStaffRequestedRole: (value: React.SetStateAction<import("../../types").StaffRole>) => void;
  staffRequestedRole: "Founder" | "Director" | "Manager" | "Administrator" | "Moderator" | "Support";
  staffSignupCities: string[];
}

export function renderStaffSignupFields(mount: RenderStaffSignupFieldsBindings): ReactNode {
  const {
    guardAvailabilityNotes,
    guardPrimaryCity,
    guardSummary,
    guardYearsExperience,
    onOpenLegal,
    phone,
    setGuardAvailabilityNotes,
    setGuardPrimaryCity,
    setGuardSummary,
    setGuardYearsExperience,
    setPhone,
    setStaffRequestedRole,
    staffRequestedRole,
    staffSignupCities,
  } = mount;
  return (
    <div className="space-y-5 pt-4 border-t border-brand-border">
                  <p className="uber-label">Apply to work at Guardr</p>
                  <p className="text-xs text-brand-text-muted leading-relaxed -mt-2">
                    Choose the role you are applying for. New seats start as Support until a Director assigns
                    your ladder role. Sign in after submitting to upload government ID and connect Stripe
                    payouts while your application is reviewed.
                  </p>
                  <div>
                    <label className="uber-label block mb-2">Role you are applying for</label>
                    <select
                      required
                      value={staffRequestedRole}
                      onChange={(e) => setStaffRequestedRole(e.target.value as StaffRole)}
                      className="uber-input"
                    >
                      {STAFF_ROLES_ORDERED.filter((r) => r !== 'Founder').map((staffRole) => (
                        <option key={staffRole} value={staffRole}>
                          {staffRole}
                        </option>
                      ))}
                    </select>
                  </div>
                  <EqualOpportunityNotice onOpenLegal={onOpenLegal} />
                  <div>
                    <label className="uber-label block mb-2">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                      <input
                        type="tel"
                        required
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="uber-input pl-10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="uber-label block mb-2">Years of experience</label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        required
                        placeholder="e.g. 3"
                        value={guardYearsExperience}
                        onChange={(e) => setGuardYearsExperience(e.target.value)}
                        className="uber-input"
                      />
                    </div>
                    <div>
                      <label className="uber-label block mb-2">Primary city</label>
                      <select
                        required
                        value={guardPrimaryCity}
                        onChange={(e) => setGuardPrimaryCity(e.target.value)}
                        className="uber-input"
                      >
                        <option value="">Select city</option>
                        {staffSignupCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="uber-label block mb-2">Work history</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Recent roles, employers, and operations experience…"
                      value={guardSummary}
                      onChange={(e) => setGuardSummary(e.target.value)}
                      className="uber-input min-h-[96px]"
                    />
                  </div>
                  <div>
                    <label className="uber-label block mb-2">Availability</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Days, hours, or schedule you can work…"
                      value={guardAvailabilityNotes}
                      onChange={(e) => setGuardAvailabilityNotes(e.target.value)}
                      className="uber-input min-h-[72px]"
                    />
                  </div>
                </div>
  );
}
