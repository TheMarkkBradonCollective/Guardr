import React, { useState } from 'react';
import { SecurityGuard, SecurityRequest, Certification } from '../types';
import { 
  Users, 
  Shield, 
  Briefcase, 
  UserX, 
  UserCheck, 
  Ban, 
  Check, 
  X, 
  Search, 
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  Lock,
  Unlock,
  ShieldAlert,
  Loader2,
  Filter,
  CheckCircle,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StaffDashboardProps {
  guards: SecurityGuard[];
  requests: SecurityRequest[];
  onUpdateGuardStaffStatus: (guardId: string, isStaff: boolean) => Promise<void>;
  onUpdateGuardUserStatus: (guardId: string, status: 'active' | 'suspended' | 'blocked') => Promise<void>;
  onApproveRequest: (requestId: string) => Promise<void>;
  onDenyRequest: (requestId: string) => Promise<void>;
  onApproveCert: (guardId: string, certId: string) => void;
  onRejectCert: (guardId: string, certId: string) => void;
  onRecordAuditViolation: (guardId: string, reason?: string) => void;
  onResetAuditFailures?: (guardId: string) => void;
  isDbConnected: boolean;
}

export function StaffDashboard({
  guards,
  requests,
  onUpdateGuardStaffStatus,
  onUpdateGuardUserStatus,
  onApproveRequest,
  onDenyRequest,
  onApproveCert,
  onRejectCert,
  onRecordAuditViolation,
  onResetAuditFailures,
  isDbConnected
}: StaffDashboardProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'claims' | 'audits'>('users');
  const [userSearchText, setUserSearchText] = useState('');
  const [requestSearchText, setRequestSearchText] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<'all' | 'staff' | 'active' | 'suspended' | 'blocked'>('all');
  const [selectedRequestFilter, setSelectedRequestFilter] = useState<'all' | 'open' | 'assigned' | 'completed' | 'cancelled'>('all');
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Filter Guards / Users
  const filteredGuards = guards.filter(guard => {
    const matchesSearch = 
      guard.name.toLowerCase().includes(userSearchText.toLowerCase()) ||
      guard.email.toLowerCase().includes(userSearchText.toLowerCase()) ||
      guard.badgeNumber.toLowerCase().includes(userSearchText.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedUserFilter === 'staff') return guard.isStaff;
    if (selectedUserFilter === 'active') return guard.userStatus === 'active' || !guard.userStatus;
    if (selectedUserFilter === 'suspended') return guard.userStatus === 'suspended';
    if (selectedUserFilter === 'blocked') return guard.userStatus === 'blocked';
    
    return true;
  });

  // Filter Requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.title.toLowerCase().includes(requestSearchText.toLowerCase()) ||
      req.clientName.toLowerCase().includes(requestSearchText.toLowerCase()) ||
      req.location.toLowerCase().includes(requestSearchText.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedRequestFilter === 'all') return true;
    return req.status === selectedRequestFilter;
  });

  // Get all pending certifications
  const pendingCertificationsList: { guard: SecurityGuard; cert: Certification }[] = [];
  guards.forEach(g => {
    g.certifications.forEach(c => {
      if (c.status === 'pending') {
        pendingCertificationsList.push({ guard: g, cert: c });
      }
    });
  });

  const handleToggleStaff = async (guardId: string, currentStatus?: boolean) => {
    setActioningId(`staff-${guardId}`);
    try {
      await onUpdateGuardStaffStatus(guardId, !currentStatus);
    } catch (e) {
      console.error(e);
    } finally {
      setActioningId(null);
    }
  };

  const handleChangeUserStatus = async (guardId: string, status: 'active' | 'suspended' | 'blocked') => {
    setActioningId(`status-${guardId}`);
    try {
      await onUpdateGuardUserStatus(guardId, status);
    } catch (e) {
      console.error(e);
    } finally {
      setActioningId(null);
    }
  };

  const handleApproveReq = async (id: string) => {
    setActioningId(`approve-req-${id}`);
    try {
      await onApproveRequest(id);
    } catch (e) {
      console.error(e);
    } finally {
      setActioningId(null);
    }
  };

  const handleDenyReq = async (id: string) => {
    setActioningId(`deny-req-${id}`);
    try {
      await onDenyRequest(id);
    } catch (e) {
      console.error(e);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="staff-controls-root">
      
      {/* Dashboard Executive Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        {/* Background Decorative Accent */}
        <div className="absolute top-0 right-0 w-80 h-full bg-linear-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] bg-indigo-500/25 border border-indigo-500/50 text-indigo-300 font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                STAFF CONTROL CENTER
              </span>
              {isDbConnected && (
                <span className="text-[10px] bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  DB persistence ready
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black font-sans tracking-tight">System Operations Console</h2>
            <p className="text-sm text-slate-405 mt-1 max-w-2xl">
              Platform administration dashboard. Grant staff privileges, approve job post queries, override user access status (active, suspended, blocked), and confirm licensing files.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <div className="bg-slate-950 p-1 rounded-xl flex border border-slate-800">
              <button
                id="staff-tab-users"
                onClick={() => setActiveTab('users')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'users'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Users ({guards.length})</span>
              </button>

              <button
                id="staff-tab-requests"
                onClick={() => setActiveTab('requests')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'requests'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Job Requests ({requests.length})</span>
              </button>

              <button
                id="staff-tab-claims"
                onClick={() => setActiveTab('claims')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide tracking-wider transition-all relative ${
                  activeTab === 'claims'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Claims/Certs</span>
                {pendingCertificationsList.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-550 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-bounce">
                    {pendingCertificationsList.length}
                  </span>
                )}
              </button>

              <button
                id="staff-tab-audits"
                onClick={() => setActiveTab('audits')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all relative ${
                  activeTab === 'audits'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-yellow-500" />
                <span>Shift Compliance ({requests.filter(r => r.checkInAudit || r.checkOutAudit).length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'users' && (
          <motion.div
            key="users-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex-1 flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Query user details (name, email, badge)..."
                  className="bg-transparent text-xs outline-none text-slate-900 w-full"
                  value={userSearchText}
                  onChange={(e) => setUserSearchText(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1 shrink-0">
                  <Filter className="w-3.5 h-3.5" /> Filter status:
                </span>
                <select
                  value={selectedUserFilter}
                  onChange={(e) => setSelectedUserFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg py-1 px-2.5 text-xs text-slate-700 outline-none font-medium"
                >
                  <option value="all">All Personnel</option>
                  <option value="staff">Staff Members Only</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                  <option value="blocked">Blocked Only</option>
                </select>
              </div>
            </div>

            {/* User Directory Rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGuards.map((guard) => {
                const isCurrentlyStaff = !!guard.isStaff;
                const status = guard.userStatus || 'active';

                return (
                  <div 
                    key={guard.id} 
                    className={`bg-white rounded-xl border p-5 shadow-2xs flex flex-col justify-between transition-all relative ${
                      status === 'suspended' ? 'border-amber-300 bg-amber-50/10' :
                      status === 'blocked' ? 'border-red-300 bg-red-50/10' : 'border-slate-200'
                    }`}
                  >
                    {/* Upper badge items */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={guard.avatar} 
                          alt={guard.name} 
                          className="w-12 h-12 rounded-full border border-slate-200 object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-sans font-bold text-slate-900 text-sm">{guard.name}</span>
                            {isCurrentlyStaff && (
                              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                                <Shield className="w-2.5 h-2.5 fill-indigo-800" /> Staff
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[9px] text-slate-400 block tracking-wide uppercase mt-0.5">ID: {guard.id}</span>
                          <span className="text-xs text-slate-500 block">{guard.email}</span>
                        </div>
                      </div>

                      {/* Pill indicator */}
                      <div>
                        {status === 'active' && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Active
                          </span>
                        )}
                        {status === 'suspended' && (
                          <span className="bg-amber-150 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Suspended
                          </span>
                        )}
                        {status === 'blocked' && (
                          <span className="bg-red-100 text-red-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Blocked
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Badge Registry No:</span>
                        <span className="font-mono font-bold text-slate-800">{guard.badgeNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">License Cleared:</span>
                        <span className={`font-semibold ${guard.verified ? 'text-blue-600' : 'text-amber-600'}`}>
                          {guard.verified ? '✓ Verified Certified' : '⚠ Pending Audit'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-sans">Contact Phone:</span>
                        <span className="text-slate-700 font-mono">{guard.phone}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 p-1.5 px-2.5 rounded-lg border border-slate-100 mt-1">
                        <span className="text-slate-500 font-medium text-[11px]">Uniform Violations:</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-[11px] font-bold ${guard.failedAudits && guard.failedAudits >= 3 ? 'text-red-650 font-black' : guard.failedAudits ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {guard.failedAudits || 0} / 3 Fails
                          </span>
                          {guard.failedAudits && guard.failedAudits > 0 && onResetAuditFailures ? (
                            <button
                              onClick={() => onResetAuditFailures(guard.id)}
                              className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 py-0.5 px-1.5 rounded-md font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
                            >
                              CLEAR
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Operational controls */}
                    <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-col gap-3">
                      
                      {/* Privileges Toggle Option */}
                      <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-slate-500" />
                          <div>
                            <span className="font-bold text-slate-700 block">Operator Staff Status</span>
                            <span className="text-[10px] text-slate-400">Allows management actions</span>
                          </div>
                        </div>

                        <button
                          disabled={actioningId === `staff-${guard.id}`}
                          onClick={() => handleToggleStaff(guard.id, isCurrentlyStaff)}
                          className={`font-mono font-bold text-[10px] p-1.5 px-3 rounded-md transition-all ${
                            isCurrentlyStaff
                              ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {actioningId === `staff-${guard.id}` ? (
                            <Loader2 className="w-3 h-3 animate-spin mx-auto text-slate-400" />
                          ) : isCurrentlyStaff ? (
                            'REVOKE STAFF STATUS'
                          ) : (
                            'GRANT STAFF ROLE'
                          )}
                        </button>
                      </div>

                      {/* Status Management Bar */}
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium text-slate-500 font-mono">SET SECURITY RESTRAINTS:</span>
                        <div className="flex gap-1">
                          
                          {/* Active Button */}
                          <button
                            title="Set Active Status"
                            disabled={status === 'active' || actioningId === `status-${guard.id}`}
                            onClick={() => handleChangeUserStatus(guard.id, 'active')}
                            className={`p-1.5 px-2.5 rounded text-[10px] font-bold font-mono transition-colors ${
                              status === 'active' 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            ACTIVE
                          </button>

                          {/* Suspend Button */}
                          <button
                            title="Suspend Account"
                            disabled={status === 'suspended' || actioningId === `status-${guard.id}`}
                            onClick={() => handleChangeUserStatus(guard.id, 'suspended')}
                            className={`p-1.5 px-2.5 rounded text-[10px] font-bold font-mono transition-colors ${
                              status === 'suspended' 
                                ? 'bg-amber-500 text-white' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            SUSPEND
                          </button>

                          {/* Block Button */}
                          <button
                            title="Block / Ban Account"
                            disabled={status === 'blocked' || actioningId === `status-${guard.id}`}
                            onClick={() => handleChangeUserStatus(guard.id, 'blocked')}
                            className={`p-1.5 px-2.5 rounded text-[10px] font-bold font-mono transition-colors ${
                              status === 'blocked' 
                                ? 'bg-red-650 text-white' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            BLOCK
                          </button>

                        </div>
                      </div>

                      {status !== 'active' && (
                        <div className="bg-red-50 text-red-800 text-[10px] py-1.5 px-2.5 rounded border border-red-200 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                          <span>This user account is currently restricted. Shift postings and credential check-ins are locked.</span>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}

              {filteredGuards.length === 0 && (
                <div className="col-span-full bg-slate-50 text-center py-12 rounded-xl border border-slate-200 text-slate-400 text-xs">
                  No registered users matched the query guidelines or search parameters.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'requests' && (
          <motion.div
            key="requests-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Search and filter */}
            <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex-1 flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Query job details (title, client name, location)..."
                  className="bg-transparent text-xs outline-none text-slate-900 w-full"
                  value={requestSearchText}
                  onChange={(e) => setRequestSearchText(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1 shrink-0">
                  <Filter className="w-3.5 h-3.5" /> Shift status:
                </span>
                <select
                  value={selectedRequestFilter}
                  onChange={(e) => setSelectedRequestFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg py-1 px-2.5 text-xs text-slate-700 outline-none font-medium"
                >
                  <option value="all">All Postings</option>
                  <option value="open">Open / Untested</option>
                  <option value="assigned">Assigned Dispatch</option>
                  <option value="completed">Completed Shifts</option>
                  <option value="cancelled">Cancelled Shifts</option>
                </select>
              </div>
            </div>

            {/* List of security requests */}
            <div className="space-y-3">
              {filteredRequests.map((req) => (
                <div key={req.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="font-mono text-[10px] text-slate-400 uppercase">REQ ID: {req.id}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-indigo-600 font-mono font-bold uppercase text-[9px]">{req.type}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-650 font-medium">{req.location}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-950 font-sans tracking-tight">{req.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 max-w-3xl leading-relaxed">{req.description}</p>
                    
                    <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-2 flex-wrap">
                      <span>Rate: <strong className="text-slate-800">${req.hourlyRate}/hr</strong></span>
                      <span>•</span>
                      <span>Total hours: <strong className="text-slate-800">{req.durationHours} hrs</strong></span>
                      <span>•</span>
                      <span>Estimated Payout: <strong className="text-blue-600 font-black">${req.estimatedPayout}</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 md:border-l md:border-slate-100 md:pl-5">
                    <div className="text-center md:text-right font-mono mb-2 md:mb-0 mr-3">
                      <p className="text-[9px] text-slate-400 uppercase">STATUS INDICATOR</p>
                      <span className={`text-[11px] font-black uppercase ${
                        req.status === 'open' ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200' :
                        req.status === 'assigned' ? 'text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200' :
                        req.status === 'completed' ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100' :
                        'text-slate-500 bg-slate-55 px-2 py-0.5 rounded border border-slate-200'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="flex flex-row md:flex-col gap-1.5">
                      {req.status !== 'completed' && req.status !== 'cancelled' && (
                        <>
                          <button
                            disabled={actioningId === `deny-req-${req.id}`}
                            onClick={() => handleDenyReq(req.id)}
                            className="flex-1 bg-red-50 text-red-700 hover:bg-red-105 border border-red-200 font-mono font-bold text-[10px] p-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>CANCEL SHIFT</span>
                          </button>

                          {req.status === 'open' && (
                            <button
                              disabled={actioningId === `approve-req-${req.id}`}
                              onClick={() => handleApproveReq(req.id)}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-[10px] p-2 px-3.5 rounded-lg transition-all flex items-center justify-center gap-1 shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>APPROVE & PUBLICIZE</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredRequests.length === 0 && (
                <div className="bg-slate-50 text-center py-12 rounded-xl border border-slate-200 text-slate-400 text-xs">
                  No security postings matched the filter conditions or active query.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'claims' && (
          <motion.div
            key="claims-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-indigo-600" /> Pending License & Claims Verification Queue
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Security personnel uploaded physical claims. Match state records below to sign-off and authenticate.
              </p>
            </div>

            {pendingCertificationsList.length > 0 ? (
              <div className="space-y-4">
                {pendingCertificationsList.map(({ guard, cert }) => (
                  <div key={cert.id} className="bg-white border border-slate-205 rounded-xl overflow-hidden p-5 shadow-2xs flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2.5">
                        <img 
                          src={guard.avatar} 
                          alt={guard.name} 
                          className="w-8 h-8 rounded-full object-cover shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 leading-none">{guard.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Badge No: {guard.badgeNumber} • Email: {guard.email}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-2.5 mt-2">
                        <span className="text-[9px] bg-indigo-50 text-indigo-850 font-mono font-bold py-0.5 px-2 rounded-full uppercase">
                          LICENSE NO: {cert.number}
                        </span>
                        <h5 className="font-black text-slate-900 text-sm mt-1">{cert.name}</h5>
                        <p className="text-xs text-slate-500">Issuer: {cert.issuer} • Valid to: {cert.expiryDate}</p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col justify-end gap-2 shrink-0 sm:border-l sm:border-slate-100 sm:pl-5 self-center">
                      <button
                        onClick={() => onRejectCert(guard.id, cert.id)}
                        className="bg-red-50 text-red-755 hover:bg-red-100 font-mono font-bold text-[10px] p-2 px-3 rounded-lg border border-red-200"
                      >
                        REJECT CLAIM
                      </button>
                      <button
                        onClick={() => onApproveCert(guard.id, cert.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-[10px] p-2 px-3.5 rounded-lg shadow-xs flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>APPROVE LICENSE</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 text-center py-16 rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                <Users className="w-8 h-8 text-slate-350" />
                <span>Zero pending credentials or claim verifications in the queue to evaluate.</span>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'audits' && (
          <motion.div
            key="audits-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 font-sans">
                  🛡️ Live Shift Compliance Reports Audit
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Compliance and private security audit logs. Inspect guard pre-shift outfitting photos, midpoint verification snaps, and final Daily Activity Reports (DAR) and Incident Report (IR) narratives.
                </p>
              </div>

              {requests.filter(r => r.checkInAudit || r.checkOutAudit).length === 0 ? (
                <div className="bg-slate-50 border border-dashed text-center py-12 rounded-xl text-slate-400 text-xs font-medium">
                  No active or historical shift audit reports recorded yet. Let a guard check-in or out to generate.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {requests.filter(r => r.checkInAudit || r.checkOutAudit).map(req => {
                    const guardItem = guards.find(g => g.id === req.assignedGuardId);
                    return (
                      <div key={req.id} className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 space-y-4 shadow-md">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                          <div className="flex items-center space-x-3">
                            <img src={guardItem?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0" referrerPolicy="no-referrer" />
                            <div>
                              <h4 className="font-bold text-sm text-slate-100">{guardItem?.name || 'Officer'}</h4>
                              <span className="font-mono text-[9px] text-slate-450 uppercase">{guardItem?.badgeNumber || 'S-Registry'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-mono text-indigo-400 block font-bold uppercase">{req.title}</span>
                            <span className="text-[9px] font-mono text-slate-400 block mt-0.5">{req.location} | Rate: ${req.hourlyRate}/hr</span>
                          </div>
                        </div>

                        {/* Audit Details layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-slate-300">
                          
                          {/* Left Column: Pre-Shift Audit info */}
                          {req.checkInAudit && (
                            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3 relative">
                              <span className="text-[9px] font-mono text-amber-500 font-extrabold uppercase tracking-wider block border-b border-slate-850 pb-1">
                                📋 Checked-In compliance (Time: {req.checkInAudit.checkedAt})
                              </span>

                              <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                                <div className="space-y-1 bg-slate-900/60 p-2 rounded">
                                  <span className="text-slate-500 block uppercase text-[8px] font-bold">Uniform Outfits</span>
                                  <div>Shirt: <span className={req.checkInAudit.uniform.shirt ? 'text-emerald-400 font-bold' : 'text-red-400'}>{req.checkInAudit.uniform.shirt ? '✓ OK' : '× Fail'}</span></div>
                                  <div>Pants: <span className={req.checkInAudit.uniform.pants ? 'text-emerald-400 font-bold' : 'text-red-400'}>{req.checkInAudit.uniform.pants ? '✓ OK' : '× Fail'}</span></div>
                                  <div>Badge: <span className={req.checkInAudit.uniform.badge ? 'text-emerald-400 font-bold' : 'text-red-400'}>{req.checkInAudit.uniform.badge ? '✓ OK' : '× Fail'}</span></div>
                                </div>
                                <div className="space-y-1 bg-slate-900/60 p-2 rounded">
                                  <span className="text-slate-500 block uppercase text-[8px] font-bold">Device & Comm</span>
                                  <div>Radio: <span className={req.checkInAudit.equipment.radio ? 'text-emerald-400 font-bold' : 'text-red-400'}>{req.checkInAudit.equipment.radio ? '✓' : '×'}</span></div>
                                  <div>Flash: <span className={req.checkInAudit.equipment.flashlight ? 'text-emerald-400 font-bold' : 'text-red-400'}>{req.checkInAudit.equipment.flashlight ? '✓' : '×'}</span></div>
                                  <div>GPS: <span className="text-emerald-400 font-bold">Verified ✓</span></div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-center">
                                <div>
                                  <span className="text-[8px] text-slate-400 block font-mono uppercase mb-1">Selfie Snap</span>
                                  <img src={req.checkInAudit.frontSelfie} className="w-full h-20 object-cover rounded border border-slate-800" referrerPolicy="no-referrer" />
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 block font-mono uppercase mb-1">Rig Snap</span>
                                  <img src={req.checkInAudit.fullBodyPhoto} className="w-full h-20 object-cover rounded border border-slate-800" referrerPolicy="no-referrer" />
                                </div>
                              </div>

                              {req.checkInAudit.signature && (
                                <div className="p-2 bg-slate-900 border border-slate-850 rounded flex items-center justify-between gap-1">
                                  <div className="text-[9px] font-mono">
                                    <span className="text-slate-450 block uppercase text-[7px]">Electronic Ink Signature</span>
                                    <span className="text-slate-200 font-bold">Certified Seal Latch</span>
                                  </div>
                                  <img src={req.checkInAudit.signature} className="h-6 bg-white rounded px-1" />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Right Column: Checkout or ongoing mid-shift drills info */}
                          {req.checkOutAudit ? (
                            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3">
                              <span className="text-[9px] font-mono text-emerald-400 font-extrabold uppercase tracking-wider block border-b border-slate-850 pb-1">
                                🗃️ Checkout site report (Time: {req.checkOutAudit.checkedAt})
                              </span>

                              <div className="space-y-1 bg-slate-900/60 p-2.5 rounded font-mono text-[9.5px]">
                                <div className="text-slate-400 uppercase text-[8px] font-bold">End-of-Shift Sign-Off:</div>
                                <div>- Shift completed fully: <span className="text-emerald-400 font-bold font-bold">YES ✓</span></div>
                                <div>- Dress violations reported: <span className={req.checkOutAudit.noViolations ? 'text-emerald-400 font-bold' : 'text-red-400'}>{req.checkOutAudit.noViolations ? 'No violations ✓' : 'Dress code breach'}</span></div>
                              </div>

                              {/* Daily Activity Log */}
                              <div className="bg-slate-900 p-2 rounded text-[11px]">
                                <span className="text-indigo-400 font-mono text-[8.5px] uppercase font-bold block mb-1">📝 Daily Activity Report (DAR):</span>
                                <p className="italic text-slate-200 leading-relaxed font-sans">"{req.checkOutAudit.dailyActivityReport}"</p>
                              </div>

                              {/* Incident Report module inside checkout status */}
                              {req.checkOutAudit.incidentReport?.hasIncident ? (
                                <div className="bg-red-950/40 border border-red-900/30 p-2.5 rounded text-[11px] text-red-100">
                                  <span className="text-red-400 uppercase font-bold text-[8.5px] font-mono block mb-1">🚨 ACTIVE INCIDENT REPORT FILED:</span>
                                  <div>Type: <span className="font-bold underline">{req.checkOutAudit.incidentReport.incidentType}</span> | Priority: <span className="text-white bg-red-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase inline-block ml-1">{req.checkOutAudit.incidentReport.priority}</span></div>
                                  <p className="mt-1.5 italic text-red-100">"{req.checkOutAudit.incidentReport.description}"</p>
                                </div>
                              ) : (
                                <div className="p-1.5 px-2.5 bg-slate-900 rounded text-[9.5px] font-mono text-slate-400 text-center">
                                  No incident dispatches or compliance breaches reported on-scene.
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-slate-950/40 p-4 border border-slate-850/60 border-dashed rounded-xl flex flex-col items-center justify-center text-center text-slate-400">
                              <Clock className="w-5 h-5 mb-1.5 text-slate-600 animate-pulse" />
                              <span className="text-[10px] font-mono">Shift is currently active and patrolling on-scene. Logs will compile on Clock-Out.</span>
                            </div>
                          )}

                        </div>

                        {/* Staff Compliance Audit Decisions */}
                        {guardItem && (
                          <div className="border-t border-slate-800 pt-3 flex items-center justify-between flex-wrap gap-3">
                            <div className="text-[10px] text-slate-400 font-mono">
                              Officer Warning registry: <span className="font-extrabold text-slate-200">{guardItem.failedAudits || 0} / 3</span> Compliance Violations.
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const confirmFlagCheck = window.confirm(
                                  `Flag Uniform and Dress Code Violation for ${guardItem.name}?\n\nThis adds +1 Penalty count. Once they hit 3, the account is immediately SUSPENDED.`
                                );
                                if (confirmFlagCheck) {
                                  onRecordAuditViolation(guardItem.id, `Shift compliance breach on contract ${req.id}`);
                                }
                              }}
                              className="py-1.5 px-3.5 bg-red-950/80 hover:bg-red-900 text-red-400 border border-red-950 rounded-xl text-[10px] font-bold font-mono uppercase tracking-tight transition-all cursor-pointer"
                            >
                              ⚠️ Flag Outfitting/Gear violation on scene
                            </button>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
