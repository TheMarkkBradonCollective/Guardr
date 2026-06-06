/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { INITIAL_GUARDS, INITIAL_REQUESTS } from './initialData';
import { SecurityGuard, SecurityRequest, Certification } from './types';
import { SimulatorHeader } from './components/SimulatorHeader';
import { ClientDashboard } from './components/ClientDashboard';
import { GuardDashboard } from './components/GuardDashboard';
import { AuditorDashboard } from './components/AuditorDashboard';
import { Shield, Sparkles, RefreshCw, Layers } from 'lucide-react';

export default function App() {
  const [persona, setPersona] = useState<'client' | 'guard' | 'auditor'>('guard');
  const [activeGuardId, setActiveGuardId] = useState<string>('guard-3'); // Liam Vance starts as the default to showcase "pending verification" flow

  // Load and state management for guards & requests
  const [guards, setGuards] = useState<SecurityGuard[]>(() => {
    const saved = localStorage.getItem('sigsec_guards');
    return saved ? JSON.parse(saved) : INITIAL_GUARDS;
  });

  const [requests, setRequests] = useState<SecurityRequest[]>(() => {
    const saved = localStorage.getItem('sigsec_requests');
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

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
  const handleUpdateBackgroundChecked = (guardId: string, status: boolean) => {
    setGuards(prev => prev.map(g => {
      if (g.id === guardId) {
        return { ...g, backgroundChecked: status };
      }
      return g;
    }));
  };

  // 2. Swaps global guard profile approval
  const handleApproveGuard = (guardId: string) => {
    setGuards(prev => prev.map(g => {
      if (g.id === guardId) {
        return { ...g, verified: true };
      }
      return g;
    }));
  };

  const handleRejectGuard = (guardId: string) => {
    setGuards(prev => prev.map(g => {
      if (g.id === guardId) {
        return { ...g, verified: false };
      }
      return g;
    }));
  };

  // 3. Certification verify approvals
  const handleApproveCert = (guardId: string, certId: string) => {
    setGuards(prev => prev.map(g => {
      if (g.id === guardId) {
        return {
          ...g,
          certifications: g.certifications.map(c => c.id === certId ? { ...c, status: 'verified' } : c)
        };
      }
      return g;
    }));
  };

  const handleRejectCert = (guardId: string, certId: string) => {
    setGuards(prev => prev.map(g => {
      if (g.id === guardId) {
        return {
          ...g,
          certifications: g.certifications.map(c => c.id === certId ? { ...c, status: 'rejected' } : c)
        };
      }
      return g;
    }));
  };

  // 4. Guards upload new credentials
  const handleAddCertification = (newCert: Partial<Certification>) => {
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
  };

  // 5. Client publishes demand requests
  const handlePostRequest = (newRequest: Partial<SecurityRequest>) => {
    const freshJob: SecurityRequest = {
      id: `req-${Date.now()}`,
      title: newRequest.title || 'Security Guard Deployment',
      description: newRequest.description || 'General unarmed patrolling patrol.',
      clientId: 'client-custom',
      clientName: 'Sartorial Vanguard Group',
      clientLogo: 'SV',
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
  };

  // 6. Client hires guard personnel
  const handleHireGuard = (requestId: string, guardId: string) => {
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
  };

  // 7. Swap job status (open -> assigned -> in-progress -> completed)
  const handleUpdateStatus = (requestId: string, status: SecurityRequest['status']) => {
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
  };

  // 8. Client releases review & rating
  const handleAddReview = (requestId: string, rating: number, reviewText: string) => {
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
  };

  // 9. Guard instant accept shift order
  const handleAcceptJob = (requestId: string) => {
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
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Simulation control bar */}
      <SimulatorHeader
        currentPersona={persona}
        setPersona={setPersona}
        activeGuard={activeGuard}
        guardsList={guards}
        setActiveGuardId={setActiveGuardId}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        
        {/* Reset Sandbox Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-2xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-500 font-mono tracking-widest block">Double-Sided Verification sandbox</span>
            <p className="text-xs text-slate-500">You can simulate the entire Security specialist workflow by toggling personas at the top.</p>
          </div>
          <button
            onClick={handleResetSimulation}
            className="flex items-center space-x-1 font-mono text-[11px] text-slate-400 hover:text-slate-900 border border-slate-200 hover:border-slate-400 p-1.5 px-3 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RESET SANDBOX DATA</span>
          </button>
        </div>

        {/* Dashboards Routing based on active toggle */}
        {persona === 'client' && (
          <ClientDashboard
            requests={requests}
            guards={guards}
            onPostRequest={handlePostRequest}
            onHireGuard={handleHireGuard}
            onUpdateStatus={handleUpdateStatus}
            onAddReview={handleAddReview}
          />
        )}

        {persona === 'guard' && (
          <GuardDashboard
            guard={activeGuard}
            requests={requests}
            onAddCertification={handleAddCertification}
            onAcceptJob={handleAcceptJob}
          />
        )}

        {persona === 'auditor' && (
          <AuditorDashboard
            guards={guards}
            onApproveGuard={handleApproveGuard}
            onRejectGuard={handleRejectGuard}
            onApproveCert={handleApproveCert}
            onRejectCert={handleRejectCert}
            onUpdateBackgroundChecked={handleUpdateBackgroundChecked}
          />
        )}

      </main>

      {/* Footer Vetting disclaimers */}
      <footer className="bg-white border-t border-slate-100 mt-12 py-6 text-center text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <span className="font-mono text-[11px] tracking-wide text-slate-500">Signature Security Systems — Double-Sided Vetting</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            State-mandated BSIS Private Security Compliance Verified • {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
