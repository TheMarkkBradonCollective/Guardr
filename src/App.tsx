/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SecurityGuard, SecurityRequest, Certification, Client, SessionUser } from './types';
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
type ThemeMode = 'dark' | 'light' | 'grey';

export default function App() {
  // ── Session ────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(() => {
    try { const s = localStorage.getItem('guardr_current_user'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [isAuthView, setIsAuthView]       = useState(false);
  const [initialAuthRole, setInitialAuthRole] = useState<'guard' | 'client'>('client');

  // ── Theme ──────────────────────────────────────────────────
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('guardr_theme_mode') as ThemeMode) || 'dark';
  });
  const changeThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem('guardr_theme_mode', mode);
  };

  // ── Active guard identity ──────────────────────────────────
  const [activeGuardId, setActiveGuardId] = useState<string>(() =>
    currentUser?.role === 'guard' ? currentUser.id : ''
  );
  useEffect(() => {
    if (currentUser?.role === 'guard') setActiveGuardId(currentUser.id);
  }, [currentUser]);

  // ── DB state ───────────────────────────────────────────────
  const [guards,   setGuards]   = useState<SecurityGuard[]>([]);
  const [clients,  setClients]  = useState<Client[]>([]);
  const [requests, setRequests] = useState<SecurityRequest[]>([]);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [clientView, setClientView] = useState<ClientView>('home');

  // ── Load from Supabase on mount ────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (await isSupabaseConnected()) {
          setIsDbConnected(true);
          await loadFromSupabase();
        }
      } catch (e) {
        console.error('Supabase init error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadFromSupabase = async () => {
    try {
      // Guards
      const { data: dbGuards } = await supabase.from('guards').select('*');
      // Clients
      const { data: dbClients } = await supabase.from('clients').select('*');
      // Certifications
      const { data: dbCerts } = await supabase.from('certifications').select('*');
      // Experience
      const { data: dbExps } = await supabase.from('experience').select('*');
      // Requests
      const { data: dbRequests } = await supabase.from('security_requests').select('*');

      setGuards((dbGuards ?? []).map((g: any) => ({
        id: g.id, name: g.name, email: g.email, badgeNumber: g.badge_number,
        avatar: g.avatar, phone: g.phone, bio: g.bio,
        isArmed: g.is_armed, backgroundChecked: g.background_checked, verified: g.verified,
        rating: Number(g.rating), jobsCompleted: g.jobs_completed,
        hourlyRateRequirement: g.hourly_rate_requirement,
        isStaff: g.is_staff,
        staffRole: g.staff_role,
        userStatus: g.user_status || 'active',
        certifications: (dbCerts ?? []).filter((c: any) => c.guard_id === g.id).map((c: any) => ({
          id: c.id, name: c.name, issuer: c.issuer, number: c.number,
          status: c.status, issueDate: c.issue_date, expiryDate: c.expiry_date,
        })),
        experience: (dbExps ?? []).filter((e: any) => e.guard_id === g.id).map((e: any) => ({
          id: e.id, title: e.title, company: e.company, period: e.period, description: e.description,
        })),
      })));

      setClients((dbClients ?? []).map((c: any) => ({
        id: c.id, name: c.name, email: c.email,
        companyName: c.company_name, phone: c.phone, avatar: c.avatar,
        totalRequests: c.total_requests || 0,
        approved: c.approved ?? false,
        rating: c.rating != null ? Number(c.rating) : undefined,
      })));

      setRequests((dbRequests ?? []).map((r: any) => ({
        id: r.id, title: r.title, description: r.description,
        clientId: r.client_id, clientName: r.client_name, clientLogo: r.client_logo,
        clientRating: r.client_rating != null ? Number(r.client_rating) : undefined,
        siteName: r.site_name || undefined,
        address: r.address || undefined,
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
        requiredCertifications: r.required_certifications || [],
        applicants: r.applicants || [],
        ratingGiven: r.rating_given ?? undefined,
        reviewText: r.review_text ?? undefined,
      })));

      setIsDbConnected(true);
    } catch (err) {
      console.error('Supabase load error:', err);
      setIsDbConnected(false);
    }
  };

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
    if (role === 'client') {
      const client = profile as Client;
      setClients(prev => {
        if (prev.some(c => c.id === client.id)) return prev;
        return [...prev, client];
      });
      if (isDbConnected) {
        try {
          await supabase.from('clients').insert({
            id: client.id, name: client.name, email: client.email,
            company_name: client.companyName, phone: client.phone,
            avatar: client.avatar, total_requests: 0, approved: false,
          });
        } catch (e) { console.error('Client DB insert error:', e); }
      }
    } else {
      const guard = profile as SecurityGuard;
      setGuards(prev => {
        if (prev.some(g => g.id === guard.id)) return prev;
        return [...prev, guard];
      });
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
        } catch (e) { console.error('Guard DB insert error:', e); }
      }
    }
  };

  // ── Certification CRUD ─────────────────────────────────────
  const handleAddCertification = async (newCert: Partial<Certification>) => {
    const certWithId: Certification = {
      id: `cert-${Date.now()}`,
      name: newCert.name || 'Security License',
      issuer: newCert.issuer || 'State Licensing Bureau',
      number: newCert.number || 'LIC-000000',
      status: 'pending',
      issueDate: newCert.issueDate || new Date().toISOString().split('T')[0],
      expiryDate: newCert.expiryDate || new Date().toISOString().split('T')[0],
    };
    setGuards(prev => prev.map(g => g.id === activeGuardId ? { ...g, certifications: [...g.certifications, certWithId] } : g));
    if (isDbConnected) {
      try {
        await supabase.from('certifications').insert({
          id: certWithId.id, guard_id: activeGuardId, name: certWithId.name,
          issuer: certWithId.issuer, number: certWithId.number, status: certWithId.status,
          issue_date: certWithId.issueDate, expiry_date: certWithId.expiryDate,
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
      assignedGuardId: null,
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
          site_name: freshJob.siteName, address: freshJob.address,
          location: freshJob.location, type: freshJob.type, armed_required: freshJob.armedRequired,
          guards_needed: freshJob.guardsNeeded,
          uniform_requirements: freshJob.uniformRequirements,
          equipment_requirements: freshJob.equipmentRequirements,
          site_instructions: freshJob.siteInstructions,
          start_date: freshJob.startDate, end_date: freshJob.endDate,
          duration_hours: freshJob.durationHours, hourly_rate: freshJob.hourlyRate,
          guard_pay: freshJob.guardPay, platform_fee_per_hour: freshJob.platformFeePerHour,
          estimated_payout: freshJob.estimatedPayout, status: freshJob.status,
          assigned_guard_id: freshJob.assignedGuardId,
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

  const handleUpdateStatus = async (requestId: string, status: SecurityRequest['status']) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== requestId) return r;
      if (status === 'completed' && r.assignedGuardId) {
        setGuards(pg => pg.map(g => g.id === r.assignedGuardId ? { ...g, jobsCompleted: g.jobsCompleted + 1 } : g));
      }
      return { ...r, status };
    }));
    if (isDbConnected) await supabase.from('security_requests').update({ status }).eq('id', requestId);
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
      }
      return updated;
    }));
    if (isDbConnected && payload.status) {
      await supabase.from('security_requests').update({ status: payload.status }).eq('id', requestId);
    }
  };

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
      <div className={`theme-${themeMode} min-h-screen bg-brand-bg text-brand-text flex flex-col justify-center items-center gap-4`}>
        <Logo className="text-brand-primary animate-pulse" size={48} />
        <p className="text-xs font-mono uppercase tracking-widest text-brand-text-muted">Loading Guardr...</p>
      </div>
    );
  }

  if (!currentUser) {
    if (isAuthView) {
      return (
        <div className={`theme-${themeMode}`}>
          <AuthPage
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
            guardsList={guards}
            clientsList={clients}
            onBackToHome={() => setIsAuthView(false)}
            initialRole={initialAuthRole}
            themeMode={themeMode}
          />
          <InstallPrompt />
        </div>
      );
    }
    return (
      <div className={`theme-${themeMode}`}>
        <HomePage
          onNavigateToAuth={(role) => {
            if (role) setInitialAuthRole(role as 'guard' | 'client');
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
      </div>
    );
  }

  // ── Guard view ─────────────────────────────────────────────
  if (currentUser.role === 'guard') {
    if (!activeGuard?.id) {
      return (
        <div className={`theme-${themeMode} min-h-screen flex flex-col items-center justify-center p-8 text-center`}>
          <p className="text-brand-text-muted font-mono text-sm mb-4">Loading your guard profile…</p>
          <button type="button" onClick={handleSignOut} className="text-xs font-mono text-brand-primary uppercase">Sign out</button>
        </div>
      );
    }
    return (
      <div className={`theme-${themeMode}`}>
        <GuardDashboard
          guard={activeGuard}
          requests={requests}
          onAddCertification={handleAddCertification}
          onAcceptJob={handleAcceptJob}
          onUpdateJobAudit={handleUpdateJobAudit}
          onRecordAuditViolation={handleRecordAuditViolation}
          onSignOut={handleSignOut}
          themeMode={themeMode}
          onChangeTheme={changeThemeMode}
        />
        <InstallPrompt />
      </div>
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
    // Guards available to hire (only real verified guards, no clients/auditors)
    const hireableGuards = verifiedGuards.filter(g => !g.isStaff);

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
          <ClientDashboard
            companyName={clientRecord?.companyName || currentUser.clientName || currentUser.name || 'Your Company'}
            requests={myRequests}
            guards={hireableGuards}
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
        </ClientAppLayout>
        <InstallPrompt />
      </>
    );
  }

  // ── Staff Operations Command Center ─────────────────────────
  if (isStaffRole(currentUser.role)) {
    return (
      <>
        <StaffDashboard
          guards={verifiedGuards}
          clients={clients}
          requests={requests}
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
          isDbConnected={isDbConnected}
          currentUser={currentUser}
          onAddStaffProfile={handleAddStaffProfile}
          themeMode={themeMode}
          onChangeTheme={changeThemeMode}
          onSignOut={handleSignOut}
        />
        <InstallPrompt />
      </>
    );
  }

  return null;
}
