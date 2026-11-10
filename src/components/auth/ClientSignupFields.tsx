/** isSignUp && role === 'client' && ( fields extracted from AuthPage. */
import type React from 'react';
import type { ReactNode } from 'react';
import { BUSINESS_TYPE_OPTIONS, ENGAGEMENT_TYPE_OPTIONS, HOW_HEARD_OPTIONS, INDUSTRY_OPTIONS, PROPERTY_TYPE_OPTIONS, SERVICE_TYPE_OPTIONS } from '../../lib/clientSignupOptions';
import { isOrganizationClientType, isSecurityCompanyClientType } from '../../lib/clientType';
import { ChevronDown, Globe, MapPin, Phone, Users } from 'lucide-react';
import { StaffSignupNotice } from './StaffSignupNotice';
import type { ReferralPerson } from './clientSignup/types';

export interface RenderClientSignupFieldsBindings {
  allowCrossAppSignup: boolean;
  armedPreference: string;
  budgetRange: string;
  businessLicense: string;
  businessType: string;
  clientCityAccessMsg: string;
  clientCompanyName: string;
  clientKind: "personal" | "business" | "security-company";
  clientSignupCities: string[];
  estimatedGuardsNeeded: string;
  estimatedStartDate: string;
  guardsList: import("../../types").SecurityGuard[];
  handleClientCityChange: (city: string) => void;
  hasPriorSecurityService: "" | "yes" | "no";
  howHeardAboutUs: string;
  industries: string[];
  phone: string;
  priorSecurityProvider: string;
  propertyTypes: string[];
  referralRef: React.RefObject<HTMLDivElement>;
  referralSuggestionsOpen: boolean;
  referredByText: string;
  serviceCity: string;
  serviceDescription: string;
  serviceFrequencies: string[];
  serviceTypes: string[];
  setArmedPreference: (value: React.SetStateAction<string>) => void;
  setBudgetRange: (value: React.SetStateAction<string>) => void;
  setBusinessLicense: (value: React.SetStateAction<string>) => void;
  setBusinessType: (value: React.SetStateAction<string>) => void;
  setClientCompanyName: (value: React.SetStateAction<string>) => void;
  setEstimatedGuardsNeeded: (value: React.SetStateAction<string>) => void;
  setEstimatedStartDate: (value: React.SetStateAction<string>) => void;
  setHasPriorSecurityService: (value: React.SetStateAction<"" | "yes" | "no">) => void;
  setHowHeardAboutUs: (value: React.SetStateAction<string>) => void;
  setIndustries: (value: React.SetStateAction<string[]>) => void;
  setPhone: (value: React.SetStateAction<string>) => void;
  setPriorSecurityProvider: (value: React.SetStateAction<string>) => void;
  setPropertyTypes: (value: React.SetStateAction<string[]>) => void;
  setReferralSuggestionsOpen: (value: React.SetStateAction<boolean>) => void;
  setReferredById: (value: React.SetStateAction<string>) => void;
  setReferredByText: (value: React.SetStateAction<string>) => void;
  setServiceDescription: (value: React.SetStateAction<string>) => void;
  setServiceFrequencies: (value: React.SetStateAction<string[]>) => void;
  setServiceTypes: (value: React.SetStateAction<string[]>) => void;
  setSpecialRequirements: (value: React.SetStateAction<string>) => void;
  setWebsite: (value: React.SetStateAction<string>) => void;
  specialRequirements: string;
  switchToStaffSignup: () => void;
  website: string;
}

export function renderClientSignupFields(mount: RenderClientSignupFieldsBindings): ReactNode {
  const {
    allowCrossAppSignup,
    armedPreference,
    budgetRange,
    businessLicense,
    businessType,
    clientCityAccessMsg,
    clientCompanyName,
    clientKind,
    clientSignupCities,
    estimatedGuardsNeeded,
    estimatedStartDate,
    guardsList,
    handleClientCityChange,
    hasPriorSecurityService,
    howHeardAboutUs,
    industries,
    phone,
    priorSecurityProvider,
    propertyTypes,
    referralRef,
    referralSuggestionsOpen,
    referredByText,
    serviceCity,
    serviceDescription,
    serviceFrequencies,
    serviceTypes,
    setArmedPreference,
    setBudgetRange,
    setBusinessLicense,
    setBusinessType,
    setClientCompanyName,
    setEstimatedGuardsNeeded,
    setEstimatedStartDate,
    setHasPriorSecurityService,
    setHowHeardAboutUs,
    setIndustries,
    setPhone,
    setPriorSecurityProvider,
    setPropertyTypes,
    setReferralSuggestionsOpen,
    setReferredById,
    setReferredByText,
    setServiceDescription,
    setServiceFrequencies,
    setServiceTypes,
    setSpecialRequirements,
    setWebsite,
    specialRequirements,
    switchToStaffSignup,
    website,
  } = mount;
  return (
    <div className="space-y-5 pt-4 border-t border-brand-border">
                  {allowCrossAppSignup ? (
                    <StaffSignupNotice onApplyAsStaff={switchToStaffSignup} compact />
                  ) : null}

                  <p className="uber-label">
                    {clientKind === 'personal'
                      ? 'Personal account'
                      : clientKind === 'security-company'
                        ? 'Security company account'
                        : 'Business account'}
                  </p>
                  <p className="text-xs text-brand-text-muted leading-relaxed -mt-2">
                    {clientKind === 'personal'
                      ? 'You hire and pay as an individual. Request security as often as you need — one-time or recurring. Coverage can still be at a home, venue, or other site.'
                      : clientKind === 'security-company'
                        ? 'Your licensed security company hires independent contractor guards through Guardr. Upload your PPO license after sign-up — staff verify before your first job posts.'
                        : 'The company or organization is the contracting party and pays. Extra tools for sites, staffing, and team access.'}
                  </p>
                  {isOrganizationClientType(clientKind) ? (
                  <div>
                    <label className="uber-label block mb-2">
                      {isSecurityCompanyClientType(clientKind) ? 'Security company name' : 'Business name'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isSecurityCompanyClientType(clientKind) ? 'Acme Patrol Services' : 'ABC Nightclub'}
                      value={clientCompanyName}
                      onChange={(e) => setClientCompanyName(e.target.value)}
                      className="uber-input"
                    />
                  </div>
                  ) : null}
                  <div>
                    <label className="uber-label block mb-2">
                      {clientKind === 'personal' ? 'Phone' : 'Contact phone'}{' '}
                      <span className="font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="uber-input pl-10"
                      />
                    </div>
                  </div>
                  {clientKind === 'business' || clientKind === 'security-company' ? (
                  <>
                  {clientKind === 'security-company' ? (
                    <div>
                      <label className="uber-label block mb-2">BSIS PPO license number</label>
                      <input
                        type="text"
                        required
                        placeholder="PPO license number"
                        value={businessLicense}
                        onChange={(e) => setBusinessLicense(e.target.value)}
                        className="uber-input"
                      />
                    </div>
                  ) : null}
                  {clientKind === 'business' ? (
                  <>
                  <div>
                    <label className="uber-label block mb-2">Business type <span className="font-normal">(optional)</span></label>
                    <div className="relative">
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="uber-input appearance-none pr-8"
                      >
                        <option value="">Select…</option>
                        {BUSINESS_TYPE_OPTIONS.filter((o) => o !== 'Individual').map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="uber-label block mb-2">Industry <span className="font-normal">(optional — select all that apply)</span></label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setIndustries((prev) =>
                              prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            industries.includes(opt)
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'border-brand-border text-brand-text-muted hover:border-brand-primary/50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="uber-label block mb-2">Business license / EIN <span className="font-normal">(optional)</span></label>
                      <input
                        type="text"
                        placeholder="12-3456789"
                        value={businessLicense}
                        onChange={(e) => setBusinessLicense(e.target.value)}
                        className="uber-input"
                      />
                    </div>
                    <div>
                      <label className="uber-label block mb-2">Website <span className="font-normal">(optional)</span></label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                        <input
                          type="url"
                          placeholder="https://yoursite.com"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="uber-input pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  </>
                  ) : (
                  <div>
                    <label className="uber-label block mb-2">Website <span className="font-normal">(optional)</span></label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                      <input
                        type="url"
                        placeholder="https://yoursecuritycompany.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="uber-input pl-10"
                      />
                    </div>
                  </div>
                  )}
                  </>
                  ) : null}

                  {/* ── Service needs ── */}
                  <p className="uber-label pt-2 border-t border-brand-border">Security needs</p>
                  <div>
                    <label className="uber-label block mb-2">Tell us what you're looking for <span className="font-normal">(optional)</span></label>
                    <textarea
                      rows={3}
                      placeholder="Briefly describe the security coverage you need…"
                      value={serviceDescription}
                      onChange={(e) => setServiceDescription(e.target.value)}
                      className="uber-input resize-none"
                    />
                  </div>
                  <div>
                    <label className="uber-label block mb-2">Type of service needed <span className="font-normal">(optional — select all that apply)</span></label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {SERVICE_TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setServiceTypes((prev) =>
                              prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            serviceTypes.includes(opt)
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'border-brand-border text-brand-text-muted hover:border-brand-primary/50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="uber-label block mb-2">Guards needed <span className="font-normal">(optional)</span></label>
                      <div className="relative">
                        <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                        <input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={estimatedGuardsNeeded}
                          onChange={(e) => setEstimatedGuardsNeeded(e.target.value)}
                          className="uber-input pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="uber-label block mb-2">Armed preference <span className="font-normal">(optional)</span></label>
                      <div className="relative">
                        <select
                          value={armedPreference}
                          onChange={(e) => setArmedPreference(e.target.value)}
                          className="uber-input appearance-none pr-8"
                        >
                          <option value="">No preference</option>
                          <option value="armed">Armed</option>
                          <option value="unarmed">Unarmed</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="uber-label block mb-2">Engagement type <span className="font-normal">(optional — select all that apply)</span></label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {ENGAGEMENT_TYPE_OPTIONS.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setServiceFrequencies((prev) =>
                              prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            serviceFrequencies.includes(value)
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'border-brand-border text-brand-text-muted hover:border-brand-primary/50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="uber-label block mb-2">Estimated start <span className="font-normal">(optional)</span></label>
                    <input
                      type="text"
                      placeholder="e.g. July 2026, ASAP…"
                      value={estimatedStartDate}
                      onChange={(e) => setEstimatedStartDate(e.target.value)}
                      className="uber-input"
                    />
                  </div>
                  <div>
                    <label className="uber-label block mb-2">
                      {clientKind === 'personal' ? 'Payment estimate' : 'Billing estimate'}{' '}
                      <span className="font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={budgetRange}
                        onChange={(e) => setBudgetRange(e.target.value)}
                        className="uber-input appearance-none pr-8"
                      >
                        <option value="">Prefer not to say</option>
                        <option value="under-500">Under $500</option>
                        <option value="500-2000">$500 – $2,000</option>
                        <option value="2000-5000">$2,000 – $5,000</option>
                        <option value="5000-15000">$5,000 – $15,000</option>
                        <option value="15000+">$15,000+</option>
                        <option value="ongoing">Ongoing / monthly contract</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                    </div>
                    <p className="text-xs text-brand-text-muted mt-1.5">
                      {clientKind === 'personal'
                        ? 'Invoices are billed to you as an individual.'
                        : 'Invoices are billed to the business or organization.'}
                    </p>
                  </div>

                  {/* ── Address ── */}
                  <p className="uber-label pt-2 border-t border-brand-border">
                    {clientKind === 'personal' ? 'Address' : 'Business address'}
                  </p>
                  <div>
                    <label className="uber-label block mb-2">City</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                      <select
                        value={serviceCity}
                        onChange={(e) => handleClientCityChange(e.target.value)}
                        className="uber-select pl-10"
                      >
                        {clientSignupCities.length === 0 ? (
                          <option value="">No open markets right now</option>
                        ) : (
                          clientSignupCities.map((city) => (
                            <option key={city} value={city}>{city}, CA</option>
                          ))
                        )}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                    </div>
                    {clientSignupCities.length === 0 ? (
                      <p className="text-xs text-amber-400 mt-1.5">
                        Guardr is not accepting new customer applications in any city right now. Check back when a market opens.
                      </p>
                    ) : null}
                    {clientCityAccessMsg && (
                      <p className="text-xs text-amber-400 mt-1.5">{clientCityAccessMsg}</p>
                    )}
                    <p className="text-xs text-brand-text-muted mt-1.5">Guardr operates in California only. All licensing follows CA BSIS rules.</p>
                  </div>
                  <div>
                    <label className="uber-label block mb-2">
                      {clientKind === 'business' ? 'Site(s)' : 'Job site type'}{' '}
                      <span className="font-normal">(optional — does not change who is billed)</span>
                    </label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {PROPERTY_TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setPropertyTypes((prev) =>
                              prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            propertyTypes.includes(opt)
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'border-brand-border text-brand-text-muted hover:border-brand-primary/50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Prior experience ── */}
                  <p className="uber-label pt-2 border-t border-brand-border">Prior security experience</p>
                  <div>
                    <label className="uber-label block mb-2">Have you used a security company before? <span className="font-normal">(optional)</span></label>
                    <div className="flex gap-3">
                      {(['yes', 'no'] as const).map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setHasPriorSecurityService(hasPriorSecurityService === val ? '' : val)}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                            hasPriorSecurityService === val
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'border-brand-border text-brand-text-muted hover:border-brand-primary/50'
                          }`}
                        >
                          {val === 'yes' ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {hasPriorSecurityService === 'yes' && (
                    <div>
                      <label className="uber-label block mb-2">Previous provider <span className="font-normal">(optional)</span></label>
                      <input
                        type="text"
                        placeholder="Company name"
                        value={priorSecurityProvider}
                        onChange={(e) => setPriorSecurityProvider(e.target.value)}
                        className="uber-input"
                      />
                    </div>
                  )}
                  <div>
                    <label className="uber-label block mb-2">Special requirements or compliance needs <span className="font-normal">(optional)</span></label>
                    <textarea
                      rows={2}
                      placeholder="Any licensing, regulatory, or site-specific requirements…"
                      value={specialRequirements}
                      onChange={(e) => setSpecialRequirements(e.target.value)}
                      className="uber-input resize-none"
                    />
                  </div>

                  {/* ── Referral ── */}
                  <p className="uber-label pt-2 border-t border-brand-border">How did you find us?</p>
                  <div ref={referralRef} className="relative">
                    <label className="uber-label block mb-2">Referred by a guard or staff member? <span className="font-normal">(optional)</span></label>
                    <input
                      type="text"
                      placeholder="Search by name or type freehand…"
                      value={referredByText}
                      onChange={(e) => {
                        setReferredByText(e.target.value);
                        setReferredById('');
                        setReferralSuggestionsOpen(e.target.value.trim().length > 0);
                      }}
                      onFocus={() => {
                        if (referredByText.trim().length > 0) setReferralSuggestionsOpen(true);
                      }}
                      onBlur={() => setTimeout(() => setReferralSuggestionsOpen(false), 150)}
                      className="uber-input"
                    />
                    {referralSuggestionsOpen && (() => {
                      const query = referredByText.trim().toLowerCase();
                      const suggestions: ReferralPerson[] = guardsList
                        .filter((g) => g.name.toLowerCase().includes(query))
                        .slice(0, 6)
                        .map((g) => ({
                          id: g.id,
                          name: g.name,
                          role: g.isStaff ? 'staff' : 'guard',
                        }));
                      return suggestions.length > 0 ? (
                        <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-xl border border-brand-border bg-brand-card shadow-lg overflow-hidden">
                          {suggestions.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onMouseDown={() => {
                                setReferredByText(s.name);
                                setReferredById(s.id);
                                setReferralSuggestionsOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-primary/10 flex items-center justify-between gap-2"
                            >
                              <span>{s.name}</span>
                              <span className="text-xs text-brand-text-muted capitalize">{s.role}</span>
                            </button>
                          ))}
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <div>
                    <label className="uber-label block mb-2">How did you hear about us? <span className="font-normal">(optional)</span></label>
                    <div className="relative">
                      <select
                        value={howHeardAboutUs}
                        onChange={(e) => setHowHeardAboutUs(e.target.value)}
                        className="uber-input appearance-none pr-8"
                      >
                        <option value="">Select…</option>
                        {HOW_HEARD_OPTIONS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                    </div>
                  </div>
                </div>
  );
}
