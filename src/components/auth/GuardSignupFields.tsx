/** isSignUp && role === 'guard' && ( fields extracted from AuthPage. */
import type React from 'react';
import type { ReactNode } from 'react';
import { GUARD_CARD_STATUS_OPTIONS, type GuardArmedPreference, type GuardCardStatus } from '../../lib/guardApplicationIntake';
import { GUARD_SPECIALTY_OPTIONS } from '../../types';
import { ChevronDown, MapPin, Phone } from 'lucide-react';
import { StaffSignupNotice } from './StaffSignupNotice';

export interface RenderGuardSignupFieldsBindings {
  DEFAULT_GUARD_HOURLY_RATE: 35;
  MAX_GUARD_HOURLY_RATE: 300;
  MIN_GUARD_HOURLY_RATE: 15;
  allowCrossAppSignup: boolean;
  bio: string;
  guardArmedPreference: "" | import("../../types").GuardArmedPreference;
  guardAvailabilityNotes: string;
  guardCardStatus: "" | import("../../types").GuardCardStatus;
  guardCityAccessMsg: string;
  guardExtraCities: string;
  guardPrimaryCity: string;
  guardReliableTransport: "" | "yes" | "no";
  guardSignupCities: string[];
  guardSpecialties: string[];
  guardSummary: string;
  guardYearsExperience: string;
  handleGuardCityChange: (city: string) => void;
  hourlyRate: string;
  phone: string;
  setBio: (value: React.SetStateAction<string>) => void;
  setGuardArmedPreference: (value: React.SetStateAction<"" | import("../../types").GuardArmedPreference>) => void;
  setGuardAvailabilityNotes: (value: React.SetStateAction<string>) => void;
  setGuardCardStatus: (value: React.SetStateAction<"" | import("../../types").GuardCardStatus>) => void;
  setGuardExtraCities: (value: React.SetStateAction<string>) => void;
  setGuardReliableTransport: (value: React.SetStateAction<"" | "yes" | "no">) => void;
  setGuardSpecialties: (value: React.SetStateAction<string[]>) => void;
  setGuardSummary: (value: React.SetStateAction<string>) => void;
  setGuardYearsExperience: (value: React.SetStateAction<string>) => void;
  setHourlyRate: (value: React.SetStateAction<string>) => void;
  setPhone: (value: React.SetStateAction<string>) => void;
  switchToStaffSignup: () => void;
}

export function renderGuardSignupFields(mount: RenderGuardSignupFieldsBindings): ReactNode {
  const {
    DEFAULT_GUARD_HOURLY_RATE,
    MAX_GUARD_HOURLY_RATE,
    MIN_GUARD_HOURLY_RATE,
    allowCrossAppSignup,
    bio,
    guardArmedPreference,
    guardAvailabilityNotes,
    guardCardStatus,
    guardCityAccessMsg,
    guardExtraCities,
    guardPrimaryCity,
    guardReliableTransport,
    guardSignupCities,
    guardSpecialties,
    guardSummary,
    guardYearsExperience,
    handleGuardCityChange,
    hourlyRate,
    phone,
    setBio,
    setGuardArmedPreference,
    setGuardAvailabilityNotes,
    setGuardCardStatus,
    setGuardExtraCities,
    setGuardReliableTransport,
    setGuardSpecialties,
    setGuardSummary,
    setGuardYearsExperience,
    setHourlyRate,
    setPhone,
    switchToStaffSignup,
  } = mount;
  return (
    <div className="space-y-5 pt-4 border-t border-brand-border">
                  {allowCrossAppSignup ? (
                    <StaffSignupNotice onApplyAsStaff={switchToStaffSignup} />
                  ) : null}
                  <p className="uber-label">Guard marketplace application</p>
                  <p className="text-xs text-brand-text-muted leading-relaxed -mt-2">
                    For licensed independent contractors — not Guardr employment. After approval,
                    upload five credentials (ID, COI, guard card, PTA/UOF, and 32-hour BSIS CE) on the
                    activation screen. After staff activates you, you need the Guard app to take shifts.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
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
                    <div>
                      <label className="uber-label block mb-2">Hourly rate ($)</label>
                      <input
                        type="number"
                        min={MIN_GUARD_HOURLY_RATE}
                        max={MAX_GUARD_HOURLY_RATE}
                        placeholder={String(DEFAULT_GUARD_HOURLY_RATE)}
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        className="uber-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="uber-label block mb-2">Years in security</label>
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
                      <label className="uber-label block mb-2">Armed work</label>
                      <div className="relative">
                        <select
                          required
                          value={guardArmedPreference}
                          onChange={(e) => setGuardArmedPreference(e.target.value as GuardArmedPreference | '')}
                          className="uber-input appearance-none pr-8"
                        >
                          <option value="">Select…</option>
                          <option value="unarmed">Unarmed only</option>
                          <option value="armed">Armed only</option>
                          <option value="both">Open to armed & unarmed</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="uber-label block mb-2">Types of work you&apos;ve done</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {GUARD_SPECIALTY_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setGuardSpecialties((prev) =>
                              prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            guardSpecialties.includes(opt)
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'border-brand-border text-brand-text-muted hover:border-brand-primary/50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="uber-label block mb-2">Primary service area</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                        <select
                          required
                          value={guardPrimaryCity}
                          onChange={(e) => handleGuardCityChange(e.target.value)}
                          className="uber-input pl-10 appearance-none pr-8"
                        >
                          {guardSignupCities.length === 0 ? (
                            <option value="">No open markets right now</option>
                          ) : (
                            guardSignupCities.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))
                          )}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                      </div>
                      {guardSignupCities.length === 0 ? (
                        <p className="text-xs text-amber-400 mt-1.5">
                          Guardr is not accepting new guard applications in any city right now. Check back when a market opens.
                        </p>
                      ) : null}
                      {guardCityAccessMsg ? (
                        <p className="text-xs text-amber-400 mt-1.5">{guardCityAccessMsg}</p>
                      ) : null}
                    </div>
                    <div>
                      <label className="uber-label block mb-2">
                        Other cities <span className="font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="San Diego, Oakland"
                        value={guardExtraCities}
                        onChange={(e) => setGuardExtraCities(e.target.value)}
                        className="uber-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="uber-label block mb-2">Guard card status</label>
                      <div className="relative">
                        <select
                          required
                          value={guardCardStatus}
                          onChange={(e) => setGuardCardStatus(e.target.value as GuardCardStatus | '')}
                          className="uber-input appearance-none pr-8"
                        >
                          <option value="">Select…</option>
                          {GUARD_CARD_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="uber-label block mb-2">Reliable transportation?</label>
                      <div className="relative">
                        <select
                          required
                          value={guardReliableTransport}
                          onChange={(e) => setGuardReliableTransport(e.target.value as '' | 'yes' | 'no')}
                          className="uber-input appearance-none pr-8"
                        >
                          <option value="">Select…</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="uber-label block mb-2">Recent roles & employers</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Last 1–2 employers, job titles, and the types of sites you covered…"
                      value={guardSummary}
                      onChange={(e) => setGuardSummary(e.target.value)}
                      className="uber-input resize-none"
                    />
                  </div>

                  <div>
                    <label className="uber-label block mb-2">Professional background</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Training, licenses in progress, strengths, and what you are looking for on Guardr…"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="uber-input resize-none"
                    />
                  </div>

                  <div>
                    <label className="uber-label block mb-2">Availability</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Days/times you usually work, overnight availability, etc."
                      value={guardAvailabilityNotes}
                      onChange={(e) => setGuardAvailabilityNotes(e.target.value)}
                      className="uber-input resize-none"
                    />
                  </div>
                </div>
  );
}
