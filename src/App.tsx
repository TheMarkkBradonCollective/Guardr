/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SecurityGuard, SecurityRequest, Certification, Client, SessionUser, Payment, PaymentStatus, Experience, GuardEducation } from './types';
import { isStaffRole } from './lib/permissions';
import { ClientDashboard, ClientView } from './components/ClientDashboard';
import { GuardDashboard } from './components/GuardDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { HomePage } from './components/HomePage';
import { AuthPage } from './components/AuthPage';
import { Logo } from './components/Logo';
import { ClientAppLayout } from './components/layouts/ClientAppLayout';
import { InstallPrompt } from './components/InstallPrompt';
import { supabase, isSupabaseConnected } from './lib/supabase';
import { computeDurationHours } from './lib/dates';
import { normalizeJobStatus } from './lib/jobStatus';
import { computeGuardPay, PLATFORM_FEE_PER_HOUR } from './lib/payments';
import { checkJobRequirements } from './lib/guardJobs';
import { findGuardProfileForUser, loadStaffGuardMode, saveStaffGuardMode } from './lib/guardDirectory';
import { holdJobPayment, releasePayout, refundPayment } from './lib/stripeApi';
import { ThemeMode, applyThemeToDocument, isThemeMode, loadTheme, saveTheme } from './lib/platform/theme';
import { ProfileSavePayload, UserProfileScreen } from './components/profile/UserProfileScreen';

export default function App() {
  // ── Session ────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(() => {
    try { const s = localStorage.getItem('guardr_current_user'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [isAuthView, setIsAuthView]       = useState(false);
  const [initialAuthRole, setInitialAuthRole] = useState<'guard' | 'client'>('client');
  const [initialAuthMode, setInitialAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');

  // ── Theme ──────────────────────────────────────────────────
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => loadTheme());
  const changeThemeMode = async (mode: ThemeMode) => {
    setThemeMode(mode);
    saveTheme(mode, currentUser?.id);
    applyThemeToDocument(mode);
    if (isDbConnected && currentUser) {
      const table = currentUser.role === 'client' ? 'clients' : 'guards';
      try {
        await supabase.from(table).update({ theme_preference: mode }).eq('id', currentUser.id);
      } catch {
        /* theme_preference column may not exist yet */
      }
    }
  };

  useEffect(() => {
    applyThemeToDocument(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (!currentUser) return;
    const local = loadTheme(currentUser.id);
    setThemeMode(local);
    applyThemeToDocument(local);
  }, [currentUser?.id]);

  // ── DB state ───────────────────────────────────────────────
  const [guards,   setGuards]   = useState<SecurityGuard[]>([]);
  const [clients,  setClients]  = useState<Client[]>([]);
  const [requests, setRequests] = useState<SecurityRequest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [clientView, setClientView] = useState<ClientView>('home');
  const [staffGuardMode, setStaffGuardMode] = useState(loadStaffGuardMode);

  const setStaffGuardModePersisted = (enabled: boolean) => {
    setStaffGuardMode(enabled);
    saveStaffGuardMode(enabled);
  };

  // ── Active guard identity ──────────────────────────────────
  const [activeGuardId, setActiveGuardId] = useState<string>(() =>
    currentUser?.role === 'guard' ? currentUser.id : ''
  );
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'guard') {
      setActiveGuardId(currentUser.id);
      return;
    }
    if (isStaffRole(currentUser.role) && staffGuardMode) {
      const profile = findGuardProfileForUser(currentUser, guards);
      setActiveGuardId(profile?.id ?? currentUser.id);
    }
  }, [currentUser, staffGuardMode, guards]);

  useEffect(() => {
    if (!currentUser) return;
    const profile =
      currentUser.role === 'client'
        ? clients.find((c) => c.id === currentUser.id)
        : guards.find((g) => g.id === currentUser.id);
    if (profile?.themePreference) {
      setThemeMode(profile.themePreference);
      saveTheme(profile.themePreference, currentUser.id);
      applyThemeToDocument(profile.themePreference);
    }
  }, [currentUser, guards, clients]);

  // ── Load from Supabase on mount ────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadFromSupabase();
      } catch (e) {
        console.error('Supabase init error:', e);
        setGuards([]);
        setClients([]);
        setRequests([]);
        setIsDbConnected(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const parseJsonStringArray = (val: unknown): string[] => {
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const loadFromSupabase = async () => {
    try {
      const { data: dbGuards, error: guardsErr } = await supabase.from('guards').select('*');
      const { data: dbClients, error: clientsErr } = await supabase.from('clients').select('*');
      const { data: dbCerts, error: certsErr } = await supabase.from('certifications').select('*');
      const { data: dbExps, error: expsErr } = await supabase.from('experience').select('*');
      const { data: dbEducation, error: eduErr } = await supabase.from('education').select('*');
      const { data: dbRequests, error: requestsErr } = await supabase.from('security_requests').select('*');
      const { data: dbPayments, error: paymentsErr } = await supabase.from('payments').select('*');

      if (eduErr) console.warn('Education table load (run migration if missing):', eduErr);
      if (guardsErr || clientsErr || certsErr || expsErr || requestsErr || paymentsErr) {
        console.error('Supabase load errors:', { guardsErr, clientsErr, certsErr, expsErr, requestsErr, paymentsErr });
        setGuards([]);
        setClients([]);
        setRequests([]);
        setIsDbConnected(false);
        return;
      }

      setGuards((dbGuards ?? []).map((g: any) => ({
        id: g.id, name: g.name, email: g.email, badgeNumber: g.badge_number,
        avatar: g.avatar, phone: g.phone, bio: g.bio,
        headline: g.headline || undefined,
        summary: g.summary || undefined,
        about: g.about || undefined,
        skills: parseJsonStringArray(g.skills),
        languages: parseJsonStringArray(g.languages),
        serviceAreas: parseJsonStringArray(g.service_areas),
        specialties: parseJsonStringArray(g.specialties),
        yearsExperience: g.years_experience ?? undefined,
        availabilityNotes: g.availability_notes || undefined,
        isArmed: g.is_armed, backgroundChecked: g.background_checked, verified: g.verified,
        rating: Number(g.rating), jobsCompleted: g.jobs_completed,
        hourlyRateRequirement: g.hourly_rate_requirement,
        isStaff: g.is_staff,
        staffRole: g.staff_role,
        userStatus: g.user_status || 'active',
        stripeConnectAccountId: g.stripe_connect_account_id || undefined,
        themePreference: isThemeMode(g.theme_preference) ? g.theme_preference : undefined,
        certifications: (dbCerts ?? []).filter((c: any) => c.guard_id === g.id).map((c: any) => ({
          id: c.id, name: c.name, issuer: c.issuer, number: c.number,
          status: c.status, issueDate: c.issue_date, expiryDate: c.expiry_date,
          state: c.state ?? undefined,
          catalogId: c.catalog_id ?? undefined,
          category: c.category ?? undefined,
        })),
        experience: (dbExps ?? []).filter((e: any) => e.guard_id === g.id).map((e: any) => ({
          id: e.id, title: e.title, company: e.company, period: e.period, description: e.description,
        })),
        education: (dbEducation ?? []).filter((e: any) => e.guard_id === g.id).map((e: any) => ({
          id: e.id, school: e.school, degree: e.degree, field: e.field,
          period: e.period, description: e.description ?? '',
        })),
      })));

      setClients((dbClients ?? []).map((c: any) => ({
        id: c.id, name: c.name, email: c.email,
        companyName: c.company_name, phone: c.phone, avatar: c.avatar,
        totalRequests: c.total_requests || 0,
        approved: c.approved ?? false,
        rating: c.rating != null ? Number(c.rating) : undefined,
        themePreference: isThemeMode(c.theme_preference) ? c.theme_preference : undefined,
      })));

      setRequests((dbRequests ?? []).map((r: any) => ({
        id: r.id, title: r.title, description: r.description,
        clientId: r.client_id, clientName: r.client_name, clientLogo: r.client_logo,
        clientRating: r.client_rating != null ? Number(r.client_rating) : undefined,
        siteName: r.site_name || undefined,
        address: r.address || undefined,
        state: r.state || undefined,
        location: r.location, type: r.type,
        armedRequired: r.armed_required,
        guardsNeeded: r.guards_needed ?? 1,
        uniformRequirements: r.uniform_requirements || undefined,
        equipmentRequirements: r.equipment_requirements || undefined,
        siteInstructions: r.site_instructions || undefined,
        startDate: r.start_date, endDate: r.end_date,
        durationHours: r.duration_hours, hourlyRate: r.hourly_rate,
        guardPay: r.guard_pay ?? computeGuardPay(r.hourly_rate),
        platformFeePerHour: r.platform_fee_per_hour ?? PLATFORM_FEE_PER_HOUR,
        estimatedPayout: r.estimated_payout,
        status: normalizeJobStatus(r.status),
        assignedGuardId: r.assigned_guard_id,
        requestType: r.request_type === 'direct' ? 'direct' : 'marketplace',
        targetGuardId: r.target_guard_id ?? r.preferred_guard_id ?? undefined,
        requiredCertifications: r.required_certifications || [],
        applicants: r.applicants || [],
        ratingGiven: r.rating_given ?? undefined,
        reviewText: r.review_text ?? undefined,
        stripePaymentIntentId: r.stripe_payment_intent_id || undefined,
        paymentStatus: r.payment_status || 'unpaid',
      })));

      setPayments((dbPayments ?? []).map((p: any) => ({
        id: p.id,
        jobId: p.job_id,
        amount: Number(p.amount),
        stripeSessionId: p.stripe_session_id || undefined,
        stripePaymentIntentId: p.stripe_payment_intent_id || undefined,
        stripeTransferId: p.stripe_transfer_id || undefined,
        status: p.status,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })));

      setIsDbConnected(true);
    } catch (err) {
      console.error('Supabase load error:', err);
      setGuards([]);
      setClients([]);
      setRequests([]);
      setIsDbConnected(false);
    }
  };

  // Drop stale session if user no longer exists in DB
  useEffect(() => {
    if (!currentUser || loading) return;
    const emailLower = currentUser.email.toLowerCase();
    const exists =
      currentUser.role === 'client'
        ? clients.some((c) => c.email.toLowerCase() === emailLower)
        : guards.some((g) => g.email.toLowerCase() === emailLower);
    if (!exists) {
      localStorage.removeItem('guardr_current_user');
      setCurrentUser(null);
    }
  }, [currentUser, guards, clients, loading]);

  // Refresh from DB when tab regains focus
  useEffect(() => {
    const onFocus = () => { void loadFromSupabase(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // ── Derived ────────────────────────────────────────────────
  // Only real guards (not clients/auditors/staff-only accounts)
  const verifiedGuards = guards.filter(g => !g.id.startsWith('client-') && !g.id.startsWith('auditor-'));
  const activeGuard = verifiedGuards.find(g => g.id === activeGuardId) || verifiedGuards[0] || ({} as SecurityGuard);

  // ── Auth ───────────────────────────────────────────────────
  const handleSignIn = (user: SessionUser) => {
    localStorage.setItem('guardr_current_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthView(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem('guardr_current_user');
    setCurrentUser(null);
    setIsAuthView(false);
  };

  /**
   * Sign up handler — routes to the correct table based on role:
   *   guard   → guards table
   *   client  → clients table
   *   auditor → guards table (auditor is a special reviewer role, same table)
   *   staff   → guards table
   */
  const handleSignUp = async (profile: SecurityGuard | Client, role: 'guard' | 'client') => {
    if (!isDbConnected) {
      alert('Database is not connected. Cannot create accounts until Supabase is linked.');
      return;
    }
    if (role === 'client') {
      const client = profile as Client;
      if (isDbConnected) {
        try {
          await supabase.from('clients').insert({
            id: client.id, name: client.name, email: client.email,
            company_name: client.companyName, phone: client.phone,
            avatar: client.avatar, total_requests: 0, approved: false,
          });
          await loadFromSupabase();
        } catch (e) { console.error('Client DB insert error:', e); }
      }
    } else {
      const guard = profile as SecurityGuard;
      if (isDbConnected) {
        try {
          await supabase.from('guards').insert({
            id: guard.id, name: guard.name, email: guard.email,
            badge_number: guard.badgeNumber, avatar: guard.avatar,
            phone: guard.phone, bio: guard.bio,
            is_armed: guard.isArmed, background_checked: guard.backgroundChecked,
            verified: guard.verified, rating: guard.rating,
            jobs_completed: guard.jobsCompleted,
            hourly_rate_requirement: guard.hourlyRateRequirement,
            is_staff: guard.isStaff, staff_role: guard.staffRole,
            user_status: guard.userStatus || 'active',
          });
          if (guard.certifications.length > 0) {
            await supabase.from('certifications').insert(
              guard.certifications.map((cert) => ({
                id: cert.id,
                guard_id: guard.id,
                name: cert.name,
                issuer: cert.issuer,
                number: cert.number,
                status: cert.status,
                issue_date: cert.issueDate,
                expiry_date: cert.expiryDate,
                state: cert.state ?? null,
              }))
            );
          }
          await loadFromSupabase();
        } catch (e) { console.error('Guard DB insert error:', e); }
      }
    }
  };

  const handleAddExperience = async (guardId: string, exp: Omit<Experience, 'id'>) => {
    const row: Experience = { id: `exp-${Date.now()}`, ...exp };
    setGuards((prev) =>
      prev.map((g) => (g.id === guardId ? { ...g, experience: [...g.experience, row] } : g))
    );
    if (isDbConnected) {
      try {
        await supabase.from('experience').insert({
          id: row.id,
          guard_id: guardId,
          title: row.title,
          company: row.company,
          period: row.period,
          description: row.description,
        });
      } catch (e) {
        console.error('Experience insert error:', e);
      }
    }
  };

  const handleAddEducation = async (guardId: string, edu: Omit<GuardEducation, 'id'>) => {
    const row: GuardEducation = { id: `edu-${Date.now()}`, ...edu };
    setGuards((prev) =>
      prev.map((g) => (g.id === guardId ? { ...g, education: [...(g.education ?? []), row] } : g))
    );
    if (isDbConnected) {
      try {
        await supabase.from('education').insert({
          id: row.id,
          guard_id: guardId,
          school: row.school,
          degree: row.degree,
          field: row.field,
          period: row.period,
          description: row.description ?? '',
        });
      } catch (e) {
        console.error('Education insert error:', e);
      }
    }
  };

  // ── Certification CRUD ─────────────────────────────────────
  const handleAddCertification = async (guardId: string, newCert: Partial<Certification>) => {
    const certWithId: Certification = {
      id: `cert-${Date.now()}`,
      name: newCert.name || 'BSIS Guard Card',
      issuer: newCert.issuer || 'BSIS',
      number: newCert.number || 'LIC-000000',
      status: 'pending',
      issueDate: newCert.issueDate || new Date().toISOString().split('T')[0],
      expiryDate: newCert.expiryDate || new Date().toISOString().split('T')[0],
      state: newCert.state?.toUpperCase(),
      catalogId: newCert.catalogId,
      category: newCert.category,
    };
    setGuards(prev => prev.map(g => g.id === guardId ? { ...g, certifications: [...g.certifications, certWithId] } : g));
    if (isDbConnected) {
      try {
        await supabase.from('certifications').insert({
          id: certWithId.id, guard_id: guardId, name: certWithId.name,
          issuer: certWithId.issuer, number: certWithId.number, status: certWithId.status,
          issue_date: certWithId.issueDate, expiry_date: certWithId.expiryDate,
          state: certWithId.state ?? null,
          catalog_id: certWithId.catalogId ?? null,
          category: certWithId.category ?? null,
        });
      } catch (e) { console.error('Cert insert error:', e); }
    }
  };

  const handleApproveCert = async (guardId: string, certId: string) => {
    setGuards(prev => prev.map(g => g.id === guardId ? { ...g, certifications: g.certifications.map(c => c.id === certId ? { ...c, status: 'verified' as const } : c) } : g));
    if (isDbConnected) await supabase.from('certifications').update({ status: 'verified' }).eq('id', certId);
  };

  const handleRejectCert = async (guardId: string, certId: string) => {
    setGuards(prev => prev.map(g => g.id === guardId ? { ...g, certifications: g.certifications.map(c => c.id === certId ? { ...c, status: 'rejected' as const } : c) } : g));
    if (isDbConnected) await supabase.from('certifications').update({ status: 'rejected' }).eq('id', certId);
  };

  // ── Guard approval ─────────────────────────────────────────
  const handleApproveGuard = async (guardId: string) => {
    setGuards(prev => prev.map(g => g.id === guardId ? { ...g, verified: true } : g));
    if (isDbConnected) await supabase.from('guards').update({ verified: true }).eq('id', guardId);
  };

  const handleRejectGuard = async (guardId: string) => {
    setGuards(prev => prev.map(g => g.id === guardId ? { ...g, verified: false } : g));
    if (isDbConnected) await supabase.from('guards').update({ verified: false }).eq('id', guardId);
  };

  const handleUpdateBackgroundChecked = async (guardId: string, status: boolean) => {
    setGuards(prev => prev.map(g => g.id === guardId ? { ...g, backgroundChecked: status } : g));
    if (isDbConnected) await supabase.from('guards').update({ background_checked: status }).eq('id', guardId);
  };

  const syncSessionUser = (patch: Partial<SessionUser>) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem('guardr_current_user', JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateGuardProfile = async (guardId: string, payload: ProfileSavePayload) => {
    setGuards((prev) =>
      prev.map((g) =>
        g.id === guardId
          ? {
              ...g,
              name: payload.name,
              phone: payload.phone,
              bio: payload.bio ?? payload.summary ?? g.bio,
              headline: payload.headline ?? g.headline,
              summary: payload.summary ?? g.summary,
              about: payload.about ?? g.about,
              skills: payload.skills ?? g.skills,
              languages: payload.languages ?? g.languages,
              serviceAreas: payload.serviceAreas ?? g.serviceAreas,
              specialties: payload.specialties ?? g.specialties,
              yearsExperience: payload.yearsExperience ?? g.yearsExperience,
              availabilityNotes: payload.availabilityNotes ?? g.availabilityNotes,
              hourlyRateRequirement: payload.hourlyRateRequirement ?? g.hourlyRateRequirement,
            }
          : g
      )
    );
    if (isDbConnected) {
      await supabase
        .from('guards')
        .update({
          name: payload.name,
          phone: payload.phone,
          bio: payload.bio ?? payload.summary ?? '',
          headline: payload.headline ?? '',
          summary: payload.summary ?? '',
          about: payload.about ?? '',
          skills: payload.skills ?? [],
          languages: payload.languages ?? [],
          service_areas: payload.serviceAreas ?? [],
          specialties: payload.specialties ?? [],
          years_experience: payload.yearsExperience ?? null,
          availability_notes: payload.availabilityNotes ?? '',
          hourly_rate_requirement: payload.hourlyRateRequirement ?? null,
        })
        .eq('id', guardId);
    }
    if (currentUser?.id === guardId) {
      syncSessionUser({
        name: payload.name,
        hourlyRate: payload.hourlyRateRequirement ?? currentUser.hourlyRate,
      });
    }
  };

  const handleUpdateClientProfile = async (clientId: string, payload: ProfileSavePayload) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              name: payload.name,
              phone: payload.phone,
              companyName: payload.companyName ?? c.companyName,
            }
          : c
      )
    );
    if (isDbConnected) {
      await supabase
        .from('clients')
        .update({
          name: payload.name,
          phone: payload.phone,
          company_name: payload.companyName ?? '',
        })
        .eq('id', clientId);
    }
    if (currentUser?.id === clientId) {
      syncSessionUser({
        name: payload.name,
        clientName: payload.companyName ?? currentUser.clientName,
      });
    }
  };

  // ── Staff controls ─────────────────────────────────────────
  const handleUpdateGuardStaffStatus = async (guardId: string, isStaff: boolean) => {
    setGuards(prev => prev.map(g => g.id === guardId ? { ...g, isStaff } : g));
    if (isDbConnected) await supabase.from('guards').update({ is_staff: isStaff }).eq('id', guardId);
  };

  const handleUpdateGuardUserStatus = async (guardId: string, status: 'active' | 'suspended' | 'blocked') => {
    setGuards(prev => prev.map(g => g.id === guardId ? { ...g, userStatus: status } : g));
    if (isDbConnected) await supabase.from('guards').update({ user_status: status }).eq('id', guardId);
  };

  const handleAddStaffProfile = async (name: string, email: string, badgeNumber: string, staffRole: 'Director' | 'Administrator' | 'Moderator') => {
    const newStaff: SecurityGuard = {
      id: `staff-${Date.now()}`, name, email, badgeNumber,
      avatar: '',
      phone: '', bio: `${staffRole} — Platform operations.`,
      isArmed: false, backgroundChecked: true, verified: true,
      rating: 5.0, jobsCompleted: 0, certifications: [], experience: [],
      hourlyRateRequirement: 0, isStaff: true, staffRole, userStatus: 'active',
    };
    setGuards(prev => [...prev, newStaff]);
    if (isDbConnected) {
      try {
        await supabase.from('guards').insert({
          id: newStaff.id, name: newStaff.name, email: newStaff.email,
          badge_number: newStaff.badgeNumber, avatar: newStaff.avatar,
          phone: newStaff.phone, bio: newStaff.bio, is_armed: false,
          background_checked: true, verified: true, rating: 5.0,
          jobs_completed: 0, is_staff: true, staff_role: staffRole, user_status: 'active',
        });
      } catch (e) { console.error('Staff insert error:', e); }
    }
  };

  const handleApproveClient = async (clientId: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, approved: true } : c));
    if (isDbConnected) await supabase.from('clients').update({ approved: true }).eq('id', clientId);
  };

  const handleRejectClient = async (clientId: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, approved: false } : c));
    if (isDbConnected) await supabase.from('clients').update({ approved: false }).eq('id', clientId);
  };

  // ── Request CRUD ───────────────────────────────────────────
  const handlePostRequest = async (newRequest: Partial<SecurityRequest>) => {
    const clientRecord = clients.find(c => c.id === currentUser?.id);
    if (clientRecord && clientRecord.approved === false) {
      alert('Your company account is pending staff approval. You cannot post jobs yet.');
      return;
    }
    const clientName = clientRecord?.companyName || currentUser?.clientName || currentUser?.name || 'Client';
    const clientLogo = clientName.split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase();
    const siteName = newRequest.siteName || '';
    const address = newRequest.address || newRequest.location || 'To Be Confirmed';
    const startDate = newRequest.startDate || new Date().toISOString();
    const endDate = newRequest.endDate || new Date(Date.now() + 8 * 3600000).toISOString();
    const durationHours = newRequest.durationHours ?? computeDurationHours(startDate, endDate);
    const hourlyRate = newRequest.hourlyRate || 35;
    const guardPay = newRequest.guardPay ?? computeGuardPay(hourlyRate);
    const estimatedPayout = newRequest.estimatedPayout ?? Math.round(durationHours * hourlyRate * 100) / 100;
    const location = siteName ? `${siteName} — ${address}` : address;

    const freshJob: SecurityRequest = {
      id: `req-${Date.now()}`,
      title: newRequest.title || 'Security Guard Deployment',
      description: newRequest.description || newRequest.siteInstructions || 'General security patrol.',
      clientId: currentUser?.id || 'client-unknown',
      clientName,
      clientLogo,
      clientRating: clientRecord?.rating,
      siteName,
      address,
      state: newRequest.state?.toUpperCase() || '',
      location,
      type: newRequest.type || 'event',
      armedRequired: newRequest.armedRequired || false,
      guardsNeeded: newRequest.guardsNeeded || 1,
      uniformRequirements: newRequest.uniformRequirements || '',
      equipmentRequirements: newRequest.equipmentRequirements || '',
      siteInstructions: newRequest.siteInstructions || newRequest.description || '',
      startDate, endDate, durationHours, hourlyRate, guardPay,
      platformFeePerHour: PLATFORM_FEE_PER_HOUR,
      estimatedPayout,
      status: 'pending-review',
      paymentStatus: 'unpaid',
      assignedGuardId: null,
      requestType: newRequest.requestType ?? 'marketplace',
      targetGuardId: newRequest.requestType === 'direct' ? (newRequest.targetGuardId ?? null) : null,
      requiredCertifications: newRequest.requiredCertifications || [],
      applicants: [],
    };

    setRequests(prev => [freshJob, ...prev]);

    // Increment client's total_requests
    if (currentUser?.id) {
      setClients(prev => prev.map(c => c.id === currentUser.id ? { ...c, totalRequests: c.totalRequests + 1 } : c));
      if (isDbConnected) {
        const cl = clients.find(c => c.id === currentUser.id);
        if (cl) await supabase.from('clients').update({ total_requests: cl.totalRequests + 1 }).eq('id', currentUser.id);
      }
    }

    if (isDbConnected) {
      try {
        await supabase.from('security_requests').insert({
          id: freshJob.id, title: freshJob.title, description: freshJob.description,
          client_id: freshJob.clientId, client_name: freshJob.clientName, client_logo: freshJob.clientLogo,
          site_name: freshJob.siteName, address: freshJob.address, state: freshJob.state ?? '',
          location: freshJob.location, type: freshJob.type, armed_required: freshJob.armedRequired,
          guards_needed: freshJob.guardsNeeded,
          uniform_requirements: freshJob.uniformRequirements,
          equipment_requirements: freshJob.equipmentRequirements,
          site_instructions: freshJob.siteInstructions,
          start_date: freshJob.startDate, end_date: freshJob.endDate,
          duration_hours: freshJob.durationHours, hourly_rate: freshJob.hourlyRate,
          guard_pay: freshJob.guardPay, platform_fee_per_hour: freshJob.platformFeePerHour,
          estimated_payout: freshJob.estimatedPayout, status: freshJob.status,
          payment_status: 'unpaid',
          assigned_guard_id: freshJob.assignedGuardId,
          request_type: freshJob.requestType ?? 'marketplace',
          target_guard_id: freshJob.targetGuardId ?? null,
          required_certifications: freshJob.requiredCertifications,
          applicants: freshJob.applicants,
        });
      } catch (e) { console.error('Request insert error:', e); }
    }
  };

  const handleHireGuard = async (requestId: string, guardId: string) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'accepted', assignedGuardId: guardId, applicants: [...r.applicants, guardId] } : r));
    if (isDbConnected) await supabase.from('security_requests').update({ status: 'accepted', assigned_guard_id: guardId, applicants: [guardId] }).eq('id', requestId);
  };

  const handleJobPaymentStatus = async (requestId: string, paymentStatus: PaymentStatus) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, paymentStatus } : r));
    if (isDbConnected) {
      await supabase.from('security_requests').update({ payment_status: paymentStatus }).eq('id', requestId);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: SecurityRequest['status']) => {
    const req = requests.find(r => r.id === requestId);
    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      if (status === 'completed' && r.assignedGuardId) {
        setGuards(pg => pg.map(g => g.id === r.assignedGuardId ? { ...g, jobsCompleted: g.jobsCompleted + 1 } : g));
      }
      const paymentStatus =
        status === 'completed' && r.paymentStatus === 'paid' ? 'held' as const : r.paymentStatus;
      return { ...r, status, paymentStatus };
    }));
    if (isDbConnected) {
      const updates: Record<string, unknown> = { status };
      if (status === 'completed' && req?.paymentStatus === 'paid') {
        updates.payment_status = 'held';
      }
      await supabase.from('security_requests').update(updates).eq('id', requestId);
    }
    if (status === 'completed' && req?.paymentStatus === 'paid') {
      try {
        await holdJobPayment(requestId);
        setPayments(prev => prev.map(p =>
          p.jobId === requestId && p.status === 'paid' ? { ...p, status: 'held' } : p
        ));
      } catch (e) {
        console.error('Hold payment error:', e);
      }
    }
  };

  const handleAddReview = async (requestId: string, rating: number, reviewText: string) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ratingGiven: rating, reviewText } : r));
    const req = requests.find(r => r.id === requestId);
    if (req?.assignedGuardId) {
      const allRatings = requests
        .filter(r => r.assignedGuardId === req.assignedGuardId && r.ratingGiven !== undefined)
        .map(r => r.ratingGiven!).concat(rating);
      const avg = Number((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1));
      setGuards(prev => prev.map(g => g.id === req.assignedGuardId ? { ...g, rating: avg } : g));
      if (isDbConnected) {
        await supabase.from('security_requests').update({ rating_given: rating, review_text: reviewText }).eq('id', requestId);
        await supabase.from('guards').update({ rating: avg }).eq('id', req.assignedGuardId);
      }
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'open' } : r));
    if (isDbConnected) await supabase.from('security_requests').update({ status: 'open' }).eq('id', requestId);
  };

  const handleDenyRequest = async (requestId: string) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'closed' } : r));
    if (isDbConnected) await supabase.from('security_requests').update({ status: 'closed' }).eq('id', requestId);
  };

  const handleCancelRequest = async (requestId: string) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'closed' } : r));
    if (isDbConnected) await supabase.from('security_requests').update({ status: 'closed' }).eq('id', requestId);
  };

  const handleEditRequest = async (requestId: string, updates: Partial<SecurityRequest>) => {
    const existing = requests.find(r => r.id === requestId);
    if (!existing || (existing.status !== 'pending-review' && existing.status !== 'open')) {
      alert('Only open or pending requests can be edited.');
      return;
    }
    const startDate = updates.startDate || existing.startDate;
    const endDate = updates.endDate || existing.endDate;
    const durationHours = updates.durationHours ?? computeDurationHours(startDate, endDate);
    const hourlyRate = updates.hourlyRate ?? existing.hourlyRate;
    const siteName = updates.siteName ?? existing.siteName ?? '';
    const address = updates.address ?? existing.address ?? existing.location;
    const merged: Partial<SecurityRequest> = {
      ...updates,
      startDate,
      endDate,
      durationHours,
      hourlyRate,
      guardPay: updates.guardPay ?? computeGuardPay(hourlyRate),
      estimatedPayout: updates.estimatedPayout ?? Math.round(durationHours * hourlyRate * 100) / 100,
      location: siteName ? `${siteName} — ${address}` : address,
      state: updates.state?.toUpperCase() ?? existing.state,
      description: updates.description || updates.siteInstructions || existing.description,
      status: existing.status === 'open' ? 'open' : 'pending-review',
    };
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, ...merged } : r));
    if (isDbConnected) {
      await supabase.from('security_requests').update({
        title: merged.title,
        description: merged.description,
        site_name: merged.siteName,
        address: merged.address,
        state: merged.state,
        location: merged.location,
        type: merged.type,
        armed_required: merged.armedRequired,
        guards_needed: merged.guardsNeeded,
        uniform_requirements: merged.uniformRequirements,
        equipment_requirements: merged.equipmentRequirements,
        site_instructions: merged.siteInstructions,
        start_date: merged.startDate,
        end_date: merged.endDate,
        duration_hours: merged.durationHours,
        hourly_rate: merged.hourlyRate,
        guard_pay: merged.guardPay,
        estimated_payout: merged.estimatedPayout,
        required_certifications: merged.requiredCertifications,
      }).eq('id', requestId);
    }
  };

  // ── Guard accept shift ─────────────────────────────────────
  const handleAcceptJob = async (requestId: string) => {
    if (!activeGuard.verified) { alert('Your profile must be verified before accepting shifts.'); return; }
    const job = requests.find((r) => r.id === requestId);
    if (job) {
      if (job.requestType === 'direct' && job.targetGuardId && job.targetGuardId !== activeGuardId) {
        alert('This assignment was sent to another guard from their profile.');
        return;
      }
      const { canAccept } = checkJobRequirements(activeGuard, job);
      if (!canAccept) {
        alert('You do not meet the requirements for this shift. Add a verified guard card for the job state in your profile.');
        return;
      }
    }
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'accepted', assignedGuardId: activeGuardId, applicants: [...r.applicants, activeGuardId] } : r));
    if (isDbConnected) {
      await supabase.from('security_requests').update({ status: 'accepted', assigned_guard_id: activeGuardId, applicants: [activeGuardId] }).eq('id', requestId);
    }
  };

  // ── Audit lifecycle ────────────────────────────────────────
  const handleUpdateJobAudit = async (requestId: string, payload: { checkInAudit?: any; midShiftAudit?: any; checkOutAudit?: any; status?: SecurityRequest['status']; }) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      const updated = { ...r };
      if (payload.checkInAudit) updated.checkInAudit = payload.checkInAudit;
      if (payload.midShiftAudit) updated.midShiftAudits = [...(updated.midShiftAudits || []), payload.midShiftAudit];
      if (payload.checkOutAudit) updated.checkOutAudit = payload.checkOutAudit;
      if (payload.status) {
        updated.status = payload.status;
        if (payload.status === 'completed' && r.assignedGuardId) {
          setGuards(pg => pg.map(g => g.id === r.assignedGuardId ? { ...g, jobsCompleted: g.jobsCompleted + 1 } : g));
        }
        if (payload.status === 'completed' && r.paymentStatus === 'paid') {
          updated.paymentStatus = 'held';
        }
      }
      return updated;
    }));
    if (isDbConnected && payload.status) {
      const updates: Record<string, unknown> = { status: payload.status };
      const req = requests.find(r => r.id === requestId);
      if (payload.status === 'completed' && req?.paymentStatus === 'paid') {
        updates.payment_status = 'held';
      }
      await supabase.from('security_requests').update(updates).eq('id', requestId);
    }
    if (payload.status === 'completed') {
      const req = requests.find(r => r.id === requestId);
      if (req?.paymentStatus === 'paid') {
        try {
          await holdJobPayment(requestId);
        } catch (e) {
          console.error('Hold payment error:', e);
        }
      }
    }
  };

  const handleReleasePayout = async (requestId: string, force = false) => {
    const req = requests.find(r => r.id === requestId);
    if (!req?.assignedGuardId) {
      alert('No guard assigned to this job.');
      return;
    }
    const guard = guards.find(g => g.id === req.assignedGuardId);
    if (!guard?.stripeConnectAccountId) {
      alert('Guard has not connected a Stripe account.');
      return;
    }
    try {
      const result = await releasePayout({
        jobId: requestId,
        guardConnectAccountId: guard.stripeConnectAccountId,
        hourlyRate: req.hourlyRate,
        durationHours: req.durationHours,
        force,
      });
      await handleJobPaymentStatus(requestId, 'released');
      setPayments(prev => prev.map(p =>
        p.jobId === requestId ? { ...p, status: 'released', stripeTransferId: result.transferId } : p
      ));
      alert(`Payout released: $${(result.amountCents / 100).toFixed(2)} sent to guard.`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Payout failed');
    }
  };

  const handleRefundPayment = async (requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req?.stripePaymentIntentId) {
      alert('No payment to refund for this job.');
      return;
    }
    try {
      await refundPayment({ paymentIntentId: req.stripePaymentIntentId, jobId: requestId });
      await handleJobPaymentStatus(requestId, 'unpaid');
      setPayments(prev => prev.map(p =>
        p.jobId === requestId ? { ...p, status: 'refunded' } : p
      ));
      alert('Payment refunded successfully.');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Refund failed');
    }
  };

  const handleUpdateGuardStripeAccount = async (guardId: string, accountId: string) => {
    setGuards(prev => prev.map(g =>
      g.id === guardId ? { ...g, stripeConnectAccountId: accountId } : g
    ));
    if (isDbConnected) {
      await supabase.from('guards').update({ stripe_connect_account_id: accountId }).eq('id', guardId);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentResult = params.get('payment');
    const jobId = params.get('job_id');
    if (paymentResult === 'success' && jobId) {
      handleJobPaymentStatus(jobId, 'paid');
      setPayments(prev => {
        const exists = prev.some(p => p.jobId === jobId);
        if (exists) {
          return prev.map(p => p.jobId === jobId ? { ...p, status: 'paid' } : p);
        }
        const req = requests.find(r => r.id === jobId);
        return [...prev, {
          id: `pay-${Date.now()}`,
          jobId,
          amount: req?.estimatedPayout ?? 0,
          status: 'paid' as const,
        }];
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (paymentResult === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [requests]);

  // ── Compliance violations ──────────────────────────────────
  const handleRecordAuditViolation = async (guardId: string, reason?: string) => {
    let autoSuspend = false;
    setGuards(prev => prev.map(g => {
      if (g.id !== guardId) return g;
      const fails = (g.failedAudits || 0) + 1;
      if (fails >= 3) autoSuspend = true;
      return { ...g, failedAudits: fails, userStatus: fails >= 3 ? 'suspended' : g.userStatus || 'active' };
    }));
    if (autoSuspend) {
      alert('🚨 AUTOMATED ACTION: 3 compliance violations logged. Account automatically suspended.');
    } else {
      alert(`⚠ Compliance warning recorded: ${reason || 'Failed audit'}`);
    }
    if (isDbConnected) {
      const g = guards.find(x => x.id === guardId);
      if (g) {
        const fails = (g.failedAudits || 0) + 1;
        await supabase.from('guards').update({ user_status: fails >= 3 ? 'suspended' : g.userStatus }).eq('id', guardId);
      }
    }
  };

  const handleResetAuditFailures = async (guardId: string) => {
    setGuards(prev => prev.map(g => g.id === guardId ? { ...g, failedAudits: 0, userStatus: 'active' } : g));
    if (isDbConnected) await supabase.from('guards').update({ user_status: 'active' }).eq('id', guardId);
    alert('✓ Compliance record cleared. Account reinstated.');
  };

  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-shell min-h-screen flex flex-col justify-center items-center gap-4">
        <Logo className="text-brand-primary animate-pulse" size={48} />
        <p className="text-sm text-brand-text-muted">Loading Guardr…</p>
      </div>
    );
  }

  if (!currentUser) {
    if (isAuthView) {
      return (
        <>
          <AuthPage
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
            guardsList={guards}
            clientsList={clients}
            onBackToHome={() => setIsAuthView(false)}
            initialRole={initialAuthRole}
            initialMode={initialAuthMode}
            themeMode={themeMode}
          />
          <InstallPrompt />
        </>
      );
    }
    return (
      <>
        <HomePage
          onNavigateToAuth={(role, mode) => {
            if (role) setInitialAuthRole(role);
            setInitialAuthMode(mode ?? 'sign-in');
            setIsAuthView(true);
          }}
          guardsCount={verifiedGuards.filter(g => g.verified).length}
          requestsCount={requests.length}
          availableRequests={requests.filter(r => r.status === 'open')}
          sampleGuards={verifiedGuards.filter(g => g.verified).slice(0, 3)}
          themeMode={themeMode}
          onChangeTheme={changeThemeMode}
        />
        <InstallPrompt />
      </>
    );
  }

  // ── Guard view ─────────────────────────────────────────────
  if (currentUser.role === 'guard') {
    if (!activeGuard?.id) {
      return (
        <div className="page-shell min-h-screen flex flex-col items-center justify-center p-8 text-center">
          <p className="text-brand-text-muted text-sm mb-4">Loading your guard profile…</p>
          <button type="button" onClick={handleSignOut} className="text-sm font-medium text-brand-primary">Sign out</button>
        </div>
      );
    }
    return (
      <>
        <GuardDashboard
          guard={activeGuard}
          requests={requests}
          payments={payments}
          onAddCertification={(cert) => handleAddCertification(activeGuard.id, cert)}
          onAddExperience={(exp) => handleAddExperience(activeGuard.id, exp)}
          onAddEducation={(edu) => handleAddEducation(activeGuard.id, edu)}
          onAcceptJob={handleAcceptJob}
          onUpdateJobAudit={handleUpdateJobAudit}
          onRecordAuditViolation={handleRecordAuditViolation}
          onUpdateStripeAccount={handleUpdateGuardStripeAccount}
          onSignOut={handleSignOut}
          themeMode={themeMode}
          onChangeTheme={changeThemeMode}
          onUpdateProfile={(payload) => handleUpdateGuardProfile(activeGuard.id, payload)}
          currentUser={currentUser}
        />
        <InstallPrompt />
      </>
    );
  }

  // ── Client view ────────────────────────────────────────────
  if (currentUser.role === 'client') {
    const clientRecord = clients.find(c => c.id === currentUser.id);
    const isClientApproved = clientRecord?.approved !== false;
    // Show only THIS client's requests
    const myRequests = requests.filter(r =>
      r.clientId === currentUser.id ||
      r.clientName === currentUser.clientName ||
      r.clientName === currentUser.name
    );
    // Verified guards available to browse/hire (includes staff who work shifts)
    const hireableGuards = verifiedGuards.filter((g) => g.verified);

    return (
      <>
        <ClientAppLayout
          currentUser={currentUser}
          themeMode={themeMode}
          onSignOut={handleSignOut}
          onChangeTheme={changeThemeMode}
          activeView={clientView}
          onNavigate={setClientView}
        >
          {clientView === 'profile' ? (
            <UserProfileScreen
              currentUser={currentUser}
              themeMode={themeMode}
              onChangeTheme={changeThemeMode}
              onSignOut={handleSignOut}
              client={clientRecord ?? null}
              onSave={(payload) => handleUpdateClientProfile(currentUser.id, payload)}
            />
          ) : (
            <ClientDashboard
              companyName={clientRecord?.companyName || currentUser.clientName || currentUser.name || 'Your Company'}
              clientId={currentUser.id}
              requests={myRequests}
              guards={hireableGuards}
              clientEmail={currentUser.email}
              isClientApproved={isClientApproved}
              activeView={clientView}
              onViewChange={setClientView}
              onPostRequest={handlePostRequest}
              onEditRequest={handleEditRequest}
              onHireGuard={handleHireGuard}
              onUpdateStatus={handleUpdateStatus}
              onCancelRequest={handleCancelRequest}
              onAddReview={handleAddReview}
            />
          )}
        </ClientAppLayout>
        <InstallPrompt />
      </>
    );
  }

  // ── Staff Operations Command Center ─────────────────────────
  if (isStaffRole(currentUser.role)) {
    const staffGuardProfile = findGuardProfileForUser(currentUser, guards);

    if (staffGuardMode && !staffGuardProfile) {
      return (
        <div className="page-shell min-h-screen flex flex-col items-center justify-center p-8 text-center gap-4">
          <Logo className="text-brand-primary" size={48} />
          <h2 className="font-bold text-lg">Guard profile not linked</h2>
          <p className="text-sm text-brand-text-muted max-w-sm">
            Your staff account needs a guard profile to browse the map and accept shifts. Open Staff Ops to complete your profile, or sign in with the email on your guard record.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setStaffGuardModePersisted(false)}
              className="uber-button-sage h-11 px-6 text-sm"
            >
              Open Staff Ops
            </button>
            <button type="button" onClick={handleSignOut} className="uber-button-outline h-11 px-6 text-sm">
              Sign out
            </button>
          </div>
        </div>
      );
    }

    if (staffGuardMode && staffGuardProfile) {
      return (
        <>
          <GuardDashboard
            guard={staffGuardProfile}
            requests={requests}
            payments={payments}
            onAddCertification={(cert) => handleAddCertification(staffGuardProfile.id, cert)}
            onAddExperience={(exp) => handleAddExperience(staffGuardProfile.id, exp)}
            onAddEducation={(edu) => handleAddEducation(staffGuardProfile.id, edu)}
            onAcceptJob={handleAcceptJob}
            onUpdateJobAudit={handleUpdateJobAudit}
            onRecordAuditViolation={handleRecordAuditViolation}
            onUpdateStripeAccount={handleUpdateGuardStripeAccount}
            onSignOut={handleSignOut}
            themeMode={themeMode}
            onChangeTheme={changeThemeMode}
            onUpdateProfile={(payload) => handleUpdateGuardProfile(staffGuardProfile.id, payload)}
            currentUser={currentUser}
            onExitGuardMode={() => setStaffGuardModePersisted(false)}
          />
          <InstallPrompt />
        </>
      );
    }

    return (
      <>
        <StaffDashboard
          guards={verifiedGuards}
          clients={clients}
          requests={requests}
          payments={payments}
          onUpdateGuardStaffStatus={handleUpdateGuardStaffStatus}
          onUpdateGuardUserStatus={handleUpdateGuardUserStatus}
          onApproveRequest={handleApproveRequest}
          onDenyRequest={handleDenyRequest}
          onApproveClient={handleApproveClient}
          onRejectClient={handleRejectClient}
          onApproveCert={handleApproveCert}
          onRejectCert={handleRejectCert}
          onApproveGuard={handleApproveGuard}
          onRejectGuard={handleRejectGuard}
          onRecordAuditViolation={handleRecordAuditViolation}
          onResetAuditFailures={handleResetAuditFailures}
          onReleasePayout={handleReleasePayout}
          onRefundPayment={handleRefundPayment}
          isDbConnected={isDbConnected}
          currentUser={currentUser}
          onAddStaffProfile={handleAddStaffProfile}
          themeMode={themeMode}
          onChangeTheme={changeThemeMode}
          onSignOut={handleSignOut}
          onUpdateGuardProfile={handleUpdateGuardProfile}
          onAddCertification={handleAddCertification}
          onAddExperience={handleAddExperience}
          onAddEducation={handleAddEducation}
          onEnterGuardMode={() => setStaffGuardModePersisted(true)}
        />
        <InstallPrompt />
      </>
    );
  }

  return null;
}
