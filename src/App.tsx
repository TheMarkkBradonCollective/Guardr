/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { INITIAL_GUARDS, INITIAL_REQUESTS } from './initialData';
import { SecurityGuard, SecurityRequest, Certification, SessionUser } from './types';
import { SimulatorHeader } from './components/SimulatorHeader';
import { ClientDashboard } from './components/ClientDashboard';
import { GuardDashboard } from './components/GuardDashboard';
import { AuditorDashboard } from './components/AuditorDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { HomePage } from './components/HomePage';
import { AuthPage } from './components/AuthPage';
import { Shield, Sparkles, RefreshCw, Layers, LogOut, User, Lock, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConnected } from './lib/supabase';

export default function App() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(() => {
    const saved = localStorage.getItem('sigsec_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthView, setIsAuthView] = useState<boolean>(false);
  const [initialAuthRole, setInitialAuthRole] = useState<'guard' | 'client' | 'auditor' | 'staff'>('guard');

  const [persona, setPersona] = useState<'client' | 'guard' | 'auditor' | 'staff'>(() => {
    return currentUser ? currentUser.role : 'guard';
  });
  const [activeGuardId, setActiveGuardId] = useState<string>(() => {
    return currentUser && currentUser.role === 'guard' ? currentUser.id : 'guard-3';
  });

  // Sync persona and activeGuardId whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      setPersona(currentUser.role);
      if (currentUser.role === 'guard') {
        setActiveGuardId(currentUser.id);
      }
    }
  }, [currentUser]);

  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);


  // Load and state management for guards & requests
  const [guards, setGuards] = useState<SecurityGuard[]>(() => {
    const saved = localStorage.getItem('sigsec_guards');
    return saved ? JSON.parse(saved) : INITIAL_GUARDS;
  });

  const [requests, setRequests] = useState<SecurityRequest[]>(() => {
    const saved = localStorage.getItem('sigsec_requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  // Load backend Supabase database state on mount
  useEffect(() => {
    const initDbSync = async () => {
      const active = await isSupabaseConnected();
      if (active) {
        setIsDbConnected(true);
        await loadSupabaseData();
      } else {
        setIsDbConnected(false);
      }
    };
    initDbSync();
  }, []);

  // Function to pull all data from Supabase and integrate it on top of initial data
  const loadSupabaseData = async () => {
    try {
      setSyncing(true);
      
      // Fetch guards
      const { data: dbGuards, error: guardsError } = await supabase
        .from('guards')
        .select('*');

      if (guardsError) throw guardsError;

      // Fetch certifications
      const { data: dbCerts, error: certsError } = await supabase
        .from('certifications')
        .select('*');

      if (certsError) throw certsError;

      // Fetch experiences
      const { data: dbExps, error: expsError } = await supabase
        .from('experience')
        .select('*');

      if (expsError) throw expsError;

      // Fetch security requests
      const { data: dbRequests, error: reqsError } = await supabase
        .from('security_requests')
        .select('*');

      if (reqsError) throw reqsError;

      // Map to frontend models to maintain strict typing
      const mappedGuards: SecurityGuard[] = dbGuards.map((g: any) => {
        const guardCerts = (dbCerts || [])
          .filter((c: any) => c.guard_id === g.id)
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            issuer: c.issuer,
            number: c.number,
            status: c.status as 'verified' | 'pending' | 'rejected',
            issueDate: c.issue_date,
            expiryDate: c.expiry_date
          }));

        const guardExps = (dbExps || [])
          .filter((e: any) => e.guard_id === g.id)
          .map((e: any) => ({
            id: e.id,
            title: e.title,
            company: e.company,
            period: e.period,
            description: e.description
          }));

        return {
          id: g.id,
          name: g.name,
          email: g.email,
          badgeNumber: g.badge_number,
          avatar: g.avatar,
          phone: g.phone,
          bio: g.bio,
          isArmed: g.is_armed,
          backgroundChecked: g.background_checked,
          verified: g.verified,
          rating: Number(g.rating),
          jobsCompleted: g.jobs_completed,
          certifications: guardCerts,
          experience: guardExps,
          hourlyRateRequirement: g.hourly_rate_requirement,
          isStaff: g.is_staff !== undefined ? g.is_staff : (g.id === 'guard-1'),
          userStatus: g.user_status || 'active'
        };
      });

      const mappedRequests: SecurityRequest[] = dbRequests.map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        clientId: r.client_id,
        clientName: r.client_name,
        clientLogo: r.client_logo,
        location: r.location,
        type: r.type as any,
        armedRequired: r.armed_required,
        startDate: r.start_date,
        endDate: r.end_date,
        durationHours: r.duration_hours,
        hourlyRate: r.hourly_rate,
        estimatedPayout: r.estimated_payout,
        status: r.status as any,
        assignedGuardId: r.assigned_guard_id,
        requiredCertifications: r.required_certifications || [],
        applicants: r.applicants || [],
        ratingGiven: r.rating_given ?? undefined,
        reviewText: r.review_text ?? undefined
      }));

      // Set state securely
      setGuards(mappedGuards);
      setRequests(mappedRequests);
      setIsDbConnected(true);
    } catch (err) {
      console.error("Supabase load failed, continuing with offline LocalStore sync.", err);
      setIsDbConnected(false);
    } finally {
      setSyncing(false);
    }
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('sigsec_guards', JSON.stringify(guards));
  }, [guards]);

  useEffect(() => {
    localStorage.setItem('sigsec_requests', JSON.stringify(requests));
  }, [requests]);

  const activeGuard = guards.find(g => g.id === activeGuardId) || guards[0];

  // RESET STATE handler (for effortless sandbox exploration)
  const handleResetSimulation = () => {
    if (window.confirm("Restore demo simulation states to defaults? All new postings and credentials uploads will be re-set.")) {
      setGuards(INITIAL_GUARDS);
      setRequests(INITIAL_REQUESTS);
      setActiveGuardId('guard-3');
      setPersona('guard');
      localStorage.removeItem('sigsec_guards');
      localStorage.removeItem('sigsec_requests');
    }
  };

  // 1. Swaps background check status
  const handleUpdateBackgroundChecked = async (guardId: string, status: boolean) => {
    setGuards(prev => prev.map(g => {
      if (g.id === guardId) {
        return { ...g, backgroundChecked: status };
      }
      return g;
    }));
    if (isDbConnected) {
      await supabase.from('guards').update({ background_checked: status }).eq('id', guardId);
    }
  };

  // 2. Swaps global guard profile approval
  const handleApproveGuard = async (guardId: string) => {
    setGuards(prev => prev.map(g => {
      if (g.id === guardId) {
        return { ...g, verified: true };
      }
      return g;
    }));
    if (isDbConnected) {
      await supabase.from('guards').update({ verified: true }).eq('id', guardId);
    }
  };

  const handleRejectGuard = async (guardId: string) => {
    setGuards(prev => prev.map(g => {
      if (g.id === guardId) {
        return { ...g, verified: false };
      }
      return g;
    }));
    if (isDbConnected) {
      await supabase.from('guards').update({ verified: false }).eq('id', guardId);
    }
  };

  // Auth Operations handlers
  const handleSignIn = (user: SessionUser) => {
    localStorage.setItem('sigsec_current_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthView(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem('sigsec_current_user');
    setCurrentUser(null);
    setIsAuthView(false);
  };

  const handleSignUp = async (newGuard: SecurityGuard, role: 'guard' | 'client' | 'auditor' | 'staff') => {
    // Save to memory
    setGuards(prev => [...prev, newGuard]);

    if (isDbConnected) {
      try {
        const { error } = await supabase.from('guards').insert({
          id: newGuard.id,
          name: newGuard.name,
          email: newGuard.email,
          badge_number: newGuard.badgeNumber,
          avatar: newGuard.avatar,
          phone: newGuard.phone,
          bio: newGuard.bio,
          is_armed: newGuard.isArmed,
          background_checked: newGuard.backgroundChecked,
          verified: newGuard.verified,
          rating: newGuard.rating,
          jobs_completed: newGuard.jobsCompleted,
          hourly_rate_requirement: newGuard.hourlyRateRequirement,
          is_staff: newGuard.isStaff,
          user_status: newGuard.userStatus || 'active'
        });
        if (error) console.error("Database table insertion error: ", error);
      } catch (err) {
        console.error("Database schema does not support full inline inserts yet, continuing locally.", err);
      }
    }
  };


  // 3. Certification verify approvals
  const handleApproveCert = async (guardId: string, certId: string) => {
    setGuards(prev => prev.map(g => {
      if (g.id === guardId) {
        return {
          ...g,
          certifications: g.certifications.map(c => c.id === certId ? { ...c, status: 'verified' } : c)
        };
      }
      return g;
    }));
    if (isDbConnected) {
      await supabase.from('certifications').update({ status: 'verified' }).eq('id', certId);
    }
  };

  const handleRejectCert = async (guardId: string, certId: string) => {
    setGuards(prev => prev.map(g => {
      if (g.id === guardId) {
        return {
          ...g,
          certifications: g.certifications.map(c => c.id === certId ? { ...c, status: 'rejected' } : c)
        };
      }
      return g;
    }));
    if (isDbConnected) {
      await supabase.from('certifications').update({ status: 'rejected' }).eq('id', certId);
    }
  };

  // Staff Controls handlers
  const handleUpdateGuardStaffStatus = async (guardId: string, isStaff: boolean) => {
    setGuards(prev => prev.map(g => {
      if (g.id === guardId) {
        return { ...g, isStaff };
      }
      return g;
    }));
    if (isDbConnected) {
      try {
        const { error } = await supabase.from('guards').update({ is_staff: isStaff }).eq('id', guardId);
        if (error) console.error("Database update error: is_staff status change", error);
      } catch (err) {
        console.error("Database table update failed - column is_staff might be missing on the table.", err);
      }
    }
  };

  const handleUpdateGuardUserStatus = async (guardId: string, status: 'active' | 'suspended' | 'blocked') => {
    setGuards(prev => prev.map(g => {
      if (g.id === guardId) {
        return { ...g, userStatus: status };
      }
      return g;
    }));
    if (isDbConnected) {
      try {
        const { error } = await supabase.from('guards').update({ user_status: status }).eq('id', guardId);
        if (error) console.error("Database update error: user_status change", error);
      } catch (err) {
        console.error("Database table update failed - column user_status might be missing on the table.", err);
      }
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return { ...r, status: 'open' };
      }
      return r;
    }));
    if (isDbConnected) {
      await supabase.from('security_requests').update({ status: 'open' }).eq('id', requestId);
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return { ...r, status: 'cancelled' };
      }
      return r;
    }));
    if (isDbConnected) {
      await supabase.from('security_requests').update({ status: 'cancelled' }).eq('id', requestId);
    }
  };

  // 4. Guards upload new credentials
  const handleAddCertification = async (newCert: Partial<Certification>) => {
    const certWithId: Certification = {
      id: `cert-${Date.now()}`,
      name: newCert.name || 'Custom Security License',
      issuer: newCert.issuer || 'BSIS Authority',
      number: newCert.number || 'LIC-000000',
      status: 'pending',
      issueDate: newCert.issueDate || new Date().toISOString().split('T')[0],
      expiryDate: newCert.expiryDate || new Date().toISOString().split('T')[0],
    };

    setGuards(prev => prev.map(g => {
      if (g.id === activeGuardId) {
        return {
          ...g,
          certifications: [...g.certifications, certWithId]
        };
      }
      return g;
    }));

    if (isDbConnected) {
      await supabase.from('certifications').insert({
        id: certWithId.id,
        guard_id: activeGuardId,
        name: certWithId.name,
        issuer: certWithId.issuer,
        number: certWithId.number,
        status: certWithId.status,
        issue_date: certWithId.issueDate,
        expiry_date: certWithId.expiryDate
      });
    }
  };

  // 5. Client publishes demand requests
  const handlePostRequest = async (newRequest: Partial<SecurityRequest>) => {
    const clientNameStr = currentUser?.clientName || currentUser?.name || 'Sartorial Vanguard Group';
    const logoInitials = clientNameStr.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
    const freshJob: SecurityRequest = {
      id: `req-${Date.now()}`,
      title: newRequest.title || 'Security Guard Deployment',
      description: newRequest.description || 'General unarmed patrolling patrol.',
      clientId: currentUser?.id || 'client-custom',
      clientName: clientNameStr,
      clientLogo: logoInitials || 'SVG',
      location: newRequest.location || 'Metropolitan Area',
      type: newRequest.type || 'event',
      armedRequired: newRequest.armedRequired || false,
      startDate: newRequest.startDate || new Date().toISOString(),
      endDate: newRequest.endDate || new Date().toISOString(),
      durationHours: newRequest.durationHours || 8,
      hourlyRate: newRequest.hourlyRate || 35,
      estimatedPayout: newRequest.estimatedPayout || 280,
      status: 'open',
      assignedGuardId: null,
      requiredCertifications: newRequest.requiredCertifications || [],
      applicants: []
    };

    setRequests(prev => [freshJob, ...prev]);

    if (isDbConnected) {
      await supabase.from('security_requests').insert({
        id: freshJob.id,
        title: freshJob.title,
        description: freshJob.description,
        client_id: freshJob.clientId,
        client_name: freshJob.clientName,
        client_logo: freshJob.clientLogo,
        location: freshJob.location,
        type: freshJob.type,
        armed_required: freshJob.armedRequired,
        start_date: freshJob.startDate,
        end_date: freshJob.endDate,
        duration_hours: freshJob.durationHours,
        hourly_rate: freshJob.hourlyRate,
        estimated_payout: freshJob.estimatedPayout,
        status: freshJob.status,
        assigned_guard_id: freshJob.assignedGuardId,
        required_certifications: freshJob.requiredCertifications,
        applicants: freshJob.applicants
      });
    }
  };

  // 6. Client hires guard personnel
  const handleHireGuard = async (requestId: string, guardId: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'assigned',
          assignedGuardId: guardId,
          applicants: [...r.applicants, guardId]
        };
      }
      return r;
    }));

    if (isDbConnected) {
      await supabase.from('security_requests').update({
        status: 'assigned',
        assigned_guard_id: guardId,
        applicants: [guardId]
      }).eq('id', requestId);
    }
  };

  // 7. Swap job status (open -> assigned -> in-progress -> completed)
  const handleUpdateStatus = async (requestId: string, status: SecurityRequest['status']) => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        const updated = { ...r, status };
        
        // If transitioning to completed, increment guard jobs completed list!
        if (status === 'completed' && r.assignedGuardId) {
          setGuards(prevG => prevG.map(g => {
            if (g.id === r.assignedGuardId) {
              return { ...g, jobsCompleted: g.jobsCompleted + 1 };
            }
            return g;
          }));
        }
        return updated;
      }
      return r;
    }));

    if (isDbConnected) {
      await supabase.from('security_requests').update({ status }).eq('id', requestId);
      
      const targetRequest = requests.find(r => r.id === requestId);
      if (status === 'completed' && targetRequest?.assignedGuardId) {
        const targetGuard = guards.find(g => g.id === targetRequest.assignedGuardId);
        if (targetGuard) {
          await supabase.from('guards').update({ 
            jobs_completed: targetGuard.jobsCompleted + 1 
          }).eq('id', targetRequest.assignedGuardId);
        }
      }
    }
  };

  // 8. Client releases review & rating
  const handleAddReview = async (requestId: string, rating: number, reviewText: string) => {
    // 1. Update the request
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return { ...r, ratingGiven: rating, reviewText };
      }
      return r;
    }));

    // Find the target guardId
    const targetRequest = requests.find(r => r.id === requestId);
    if (!targetRequest || !targetRequest.assignedGuardId) return;

    // 2. Re-calculate guard rating averages
    const guardId = targetRequest.assignedGuardId;
    const completedWithRating = requests.filter(r => r.assignedGuardId === guardId && r.ratingGiven !== undefined);
    
    // Add the new rating to calc
    const allRatings = completedWithRating.map(r => r.ratingGiven!).concat(rating);
    const avgRating = Number((allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1));

    setGuards(prevG => prevG.map(g => {
      if (g.id === guardId) {
        return { ...g, rating: avgRating };
      }
      return g;
    }));
    alert("Review finalized! Security guard's system performance rating has been updated.");

    if (isDbConnected) {
      await supabase.from('security_requests').update({
        rating_given: rating,
        review_text: reviewText
      }).eq('id', requestId);

      await supabase.from('guards').update({
        rating: avgRating
      }).eq('id', guardId);
    }
  };

  // 9. Guard instant accept shift order
  const handleAcceptJob = async (requestId: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'assigned',
          assignedGuardId: activeGuardId,
          applicants: [...r.applicants, activeGuardId]
        };
      }
      return r;
    }));
    alert(`Dispatch Success! You have accepted the assignment. Check. Your Active Schedule is updated below.`);

    if (isDbConnected) {
      await supabase.from('security_requests').update({
        status: 'assigned',
        assigned_guard_id: activeGuardId,
        applicants: [activeGuardId]
      }).eq('id', requestId);
    }
  };

  // 10. Core Self-Audit status transitions and logging
  const handleUpdateJobAudit = async (
    requestId: string,
    auditPayload: {
      checkInAudit?: any;
      midShiftAudit?: any;
      checkOutAudit?: any;
      status?: SecurityRequest['status'];
    }
  ) => {
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        const updated = { ...r };
        if (auditPayload.checkInAudit) {
          updated.checkInAudit = auditPayload.checkInAudit;
        }
        if (auditPayload.midShiftAudit) {
          const currentAudits = updated.midShiftAudits || [];
          updated.midShiftAudits = [...currentAudits, auditPayload.midShiftAudit];
        }
        if (auditPayload.checkOutAudit) {
          updated.checkOutAudit = auditPayload.checkOutAudit;
        }
        if (auditPayload.status) {
          updated.status = auditPayload.status;
          
          if (auditPayload.status === 'completed' && r.assignedGuardId) {
            setGuards(prevG => prevG.map(g => {
              if (g.id === r.assignedGuardId) {
                return { ...g, jobsCompleted: g.jobsCompleted + 1 };
              }
              return g;
            }));
          }
        }
        return updated;
      }
      return r;
    }));

    if (isDbConnected) {
      try {
        const updateObj: any = {};
        if (auditPayload.status) {
          updateObj.status = auditPayload.status;
        }
        await supabase.from('security_requests').update(updateObj).eq('id', requestId);
      } catch (err) {
        console.error("Failed to sync audit state with live DB.", err);
      }
    }
  };

  // 11. Record compliance violations automatically
  const handleRecordAuditViolation = async (guardId: string, reason?: string) => {
    let autoSuspensionTriggered = false;

    setGuards(prev => prev.map(g => {
      if (g.id === guardId) {
        const prevFails = g.failedAudits || 0;
        const newFails = prevFails + 1;
        const nextStatus = newFails >= 3 ? 'suspended' : g.userStatus || 'active';

        if (newFails >= 3) {
          autoSuspensionTriggered = true;
        }

        return {
          ...g,
          failedAudits: newFails,
          userStatus: nextStatus as any
        };
      }
      return g;
    }));

    if (autoSuspensionTriggered) {
      alert(`🚨 AUTOMATED SYSTEM ACTION: Security officer has committed 3 uniform/gear code of conduct compliance violations. Their account has been automatically SUSPENDED immediately pending review.`);
    } else {
      alert(`⚠️ BSIS Warning Recorded: Compliance violation registered to account files.\nReason: ${reason || 'Failed dress/equipment audit'}`);
    }

    if (isDbConnected) {
      try {
        const targetG = guards.find(g => g.id === guardId);
        if (targetG) {
          const newFails = (targetG.failedAudits || 0) + 1;
          const nextStatus = newFails >= 3 ? 'suspended' : targetG.userStatus || 'active';
          await supabase.from('guards').update({
            user_status: nextStatus
          }).eq('id', guardId);
        }
      } catch (err) {
        console.error("Database status update failed.", err);
      }
    }
  };

  const handleResetAuditFailures = async (guardId: string) => {
    setGuards(prev => prev.map(g => {
      if (g.id === guardId) {
        return {
          ...g,
          failedAudits: 0,
          userStatus: 'active'
        };
      }
      return g;
    }));
    
    alert("✓ Officer dress code penalty records have been reset. Account has been reinstated to Active status.");

    if (isDbConnected) {
      try {
        await supabase.from('guards').update({
          user_status: 'active'
        }).eq('id', guardId);
      } catch (err) {
        console.error("Database status reset failed.", err);
      }
    }
  };

  if (!currentUser) {
    if (isAuthView) {
      return (
        <AuthPage
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          guardsList={guards}
          onBackToHome={() => setIsAuthView(false)}
          initialRole={initialAuthRole}
        />
      );
    }

    return (
      <HomePage
        onNavigateToAuth={(role) => {
          if (role) {
            setInitialAuthRole(role);
          }
          setIsAuthView(true);
        }}
        guardsCount={guards.length}
        requestsCount={requests.length}
        availableRequests={requests}
        sampleGuards={guards.slice(0, 3)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Real Authenticated Navigation Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white py-4 px-4 sm:px-6 lg:px-8 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl">
                <Shield className="w-5 h-5 animate-pulse" />
              </div>
              <button 
                onClick={handleSignOut}
                className="text-left cursor-pointer hover:opacity-90 block"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-white uppercase">SIGSEC SYSTEMS</span>
                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-extrabold tracking-wider">SECURE</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">BSIS California Escrow System</p>
              </button>
            </div>
          </div>

          {/* User profile action indicators and logout */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-slate-950 p-1.5 px-3 rounded-xl border border-slate-800">
              {currentUser.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-7 h-7 rounded-full border border-slate-850 object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="text-left font-sans mr-1">
                <h4 className="text-[11px] font-extrabold text-slate-100">{currentUser.name}</h4>
                <p className="text-[9px] font-mono text-indigo-400 tracking-wider uppercase font-bold">
                  {currentUser.role === 'staff' 
                    ? 'Staff Controller' 
                    : currentUser.role === 'auditor' 
                      ? 'Compliance Officer' 
                      : currentUser.role === 'client' 
                        ? 'Corporate Client' 
                        : 'BSIS Officer'}
                </p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-fade-in">
        
        {/* Reset Sandbox & Database Sync Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-blue-600 font-mono tracking-widest">Platform Escrow Ledger</span>
              {isDbConnected ? (
                <span className="bg-blue-100 text-blue-800 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                  SUPABASE SYSTEM ACTIVE
                </span>
              ) : (
                <span className="bg-slate-100 text-slate-500 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                  SANDBOX LOCAL STORAGE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isDbConnected 
                ? "All registrations and security dispatches are synchronized live to your Supabase PostgreSQL cluster." 
                : "Shift rosters, security logs, and approvals are preserved in your secure browser cache."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isDbConnected && (
              <button
                onClick={loadSupabaseData}
                disabled={syncing}
                className="flex items-center space-x-1 font-mono text-[11px] text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 p-1.5 px-3 rounded-lg border border-blue-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'SYNC ARCHIVE' : 'PULL SUPABASE RECORDFILE'}</span>
              </button>
            )}
            <button
              onClick={handleResetSimulation}
              className="flex items-center space-x-1 font-mono text-[11px] text-slate-400 hover:text-slate-900 border border-slate-200 hover:border-slate-400 p-1.5 px-3 rounded-lg transition-colors animate-pulse"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>RESET SANDBOX DATA</span>
            </button>
          </div>
        </div>

        {/* Dashboards Routing strictly secured based on active logged-in role */}
        {currentUser.role === 'client' && (
          <ClientDashboard
            requests={requests}
            guards={guards}
            onPostRequest={handlePostRequest}
            onHireGuard={handleHireGuard}
            onUpdateStatus={handleUpdateStatus}
            onAddReview={handleAddReview}
          />
        )}

        {currentUser.role === 'guard' && (
          <GuardDashboard
            guard={activeGuard}
            requests={requests}
            onAddCertification={handleAddCertification}
            onAcceptJob={handleAcceptJob}
            onUpdateJobAudit={handleUpdateJobAudit}
            onRecordAuditViolation={handleRecordAuditViolation}
          />
        )}

        {currentUser.role === 'auditor' && (
          <AuditorDashboard
            guards={guards}
            onApproveGuard={handleApproveGuard}
            onRejectGuard={handleRejectGuard}
            onApproveCert={handleApproveCert}
            onRejectCert={handleRejectCert}
            onUpdateBackgroundChecked={handleUpdateBackgroundChecked}
          />
        )}

        {currentUser.role === 'staff' && (
          <StaffDashboard
            guards={guards}
            requests={requests}
            onUpdateGuardStaffStatus={handleUpdateGuardStaffStatus}
            onUpdateGuardUserStatus={handleUpdateGuardUserStatus}
            onApproveRequest={handleApproveRequest}
            onDenyRequest={handleDenyRequest}
            onApproveCert={handleApproveCert}
            onRejectCert={handleRejectCert}
            onRecordAuditViolation={handleRecordAuditViolation}
            onResetAuditFailures={handleResetAuditFailures}
            isDbConnected={isDbConnected}
          />
        )}

      </main>

      {/* Footer Vetting disclaimers */}
      <footer className="bg-white border-t border-slate-100 mt-12 py-6 text-center text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amber-600 animate-pulse" />
            <span className="font-mono text-[11px] tracking-wide text-slate-500">Signature Security Systems — ISO-27001 Accredited Vetting Protocol</span>
          </div>
          <div className="text-[10px] text-slate-450 font-mono">
            State-mandated BSIS Private Security Compliance Verified • {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
