import React, { useState } from 'react';
import { Logo } from './Logo';
import { 
  Shield, 
  Lock, 
  User, 
  Mail, 
  Briefcase, 
  Phone, 
  FileText, 
  DollarSign, 
  CheckCircle,
  HelpCircle,
  Unlock,
  Key,
  ArrowLeft
} from 'lucide-react';
import { SessionUser, SecurityGuard } from '../types';

interface AuthPageProps {
  onSignIn: (user: SessionUser) => void;
  onSignUp: (newGuard: SecurityGuard, role: 'guard' | 'client' | 'auditor' | 'staff') => void;
  guardsList: SecurityGuard[];
  onBackToHome: () => void;
  initialRole?: 'guard' | 'client' | 'auditor' | 'staff';
}

export function AuthPage({ 
  onSignIn, 
  onSignUp, 
  guardsList, 
  onBackToHome,
  initialRole = 'guard' 
}: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [role, setRole] = useState<'guard' | 'client' | 'auditor' | 'staff'>(initialRole);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Shared Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Guard specific inputs
  const [badgeNumber, setBadgeNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('35');
  const [isArmed, setIsArmed] = useState(false);
  
  // Client specific inputs
  const [clientCompanyName, setClientCompanyName] = useState('');
  
  // Auditor specific inputs
  const [auditorOrg, setAuditorOrg] = useState('');

  // Staff specific inputs
  const [staffCode, setStaffCode] = useState(''); // e.g. "STAFF777" to register as staff!

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Email address is required.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    if (isSignUp) {
      if (!fullName) {
        setErrorMsg('Please specify your Full Name.');
        return;
      }

      // Check Staff signup passcode
      if (role === 'staff' && staffCode.trim().toUpperCase() !== 'STAFF777') {
        setErrorMsg('Invalid staff authorization passcode. Use "STAFF777" for operation demo privileges.');
        return;
      }

      const randomId = `${role}-${Date.now()}`;
      
      // Setup default avatar based on role
      const avatarMap = {
        guard: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        client: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        auditor: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        staff: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
      };

      // Create new guard representation even if client/auditor (so they enter directory seamlessly)
      const newGuardProfile: SecurityGuard = {
        id: randomId,
        name: fullName,
        email: email,
        badgeNumber: badgeNumber || `S-${Math.floor(10000 + Math.random() * 90000)}`,
        avatar: avatarMap[role],
        phone: phone || '+1 (555) 000-0000',
        bio: bio || `${role === 'client' ? 'Registered business contracting client.' : role === 'auditor' ? 'Regulatory compliance review officer.' : 'Administrative system operator.'}`,
        isArmed: isArmed,
        backgroundChecked: role === 'auditor' || role === 'staff' ? true : false,
        verified: role === 'auditor' || role === 'staff' ? true : false,
        rating: 5.0,
        jobsCompleted: 0,
        certifications: [],
        experience: [],
        hourlyRateRequirement: parseInt(hourlyRate) || 35,
        isStaff: role === 'staff',
        userStatus: 'active'
      };

      // Call SignUp Prop
      onSignUp(newGuardProfile, role);

      // Instantly Sign In as the newly registered user
      onSignIn({
        id: randomId,
        name: fullName,
        email: email,
        role: role,
        badgeNumber: newGuardProfile.badgeNumber,
        clientName: role === 'client' ? clientCompanyName || fullName : undefined,
        organization: role === 'auditor' ? auditorOrg || 'State Compliance' : undefined,
        avatar: newGuardProfile.avatar,
        hourlyRate: newGuardProfile.hourlyRateRequirement
      });

    } else {
      // Signing In - search existing guard accounts first, or allow demo entry
      const emailLower = email.toLowerCase();
      
      // General guard checks
      const matchedGuard = guardsList.find(g => g.email.toLowerCase() === emailLower);

      if (matchedGuard) {
        if (matchedGuard.userStatus === 'blocked') {
          setErrorMsg('Account blocked. Your operational access card has been revoked by administration.');
          return;
        }

        // Detect appropriate role based on isStaff or id prefix
        let resolvedRole: 'guard' | 'client' | 'auditor' | 'staff' = matchedGuard.isStaff ? 'staff' : 'guard';
        if (matchedGuard.id.startsWith('client')) {
          resolvedRole = 'client';
        } else if (matchedGuard.id.startsWith('auditor')) {
          resolvedRole = 'auditor';
        } else if (matchedGuard.id.startsWith('staff')) {
          resolvedRole = 'staff';
        }

        onSignIn({
          id: matchedGuard.id,
          name: matchedGuard.name,
          email: matchedGuard.email,
          role: resolvedRole,
          badgeNumber: matchedGuard.badgeNumber,
          avatar: matchedGuard.avatar,
          hourlyRate: matchedGuard.hourlyRateRequirement
        });
      } else {
        setErrorMsg('Security account is not registered in our database. Please specify a valid email or create a new profile.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4 relative py-12" id="sigsec-auth-root">
      
      {/* Background aesthetics */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#141414_1px,transparent_1px),linear-gradient(to_bottom,#141414_1px,transparent_1px)] bg-[size:5rem_5rem] pointer-events-none" />

      {/* Back button */}
      <button 
        onClick={onBackToHome}
        className="absolute top-6 left-6 flex items-center space-x-2 font-mono text-xs text-neutral-400 hover:text-white transition-all bg-neutral-950 border border-neutral-900 py-2.5 px-4 rounded-none cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Home</span>
      </button>

      <div className="w-full max-w-md bg-neutral-950 border border-neutral-900 p-8 shadow-none rounded-none relative overflow-hidden z-10">
        
        {/* Banner header logo */}
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 text-uber-green flex items-center justify-center">
            <Logo size={24} className="text-uber-green" />
          </div>
          <h2 className="text-xl font-black font-sans tracking-tight">
            {isSignUp ? 'Create Platform Profile' : 'Credentials Sign In'}
          </h2>
          <p className="text-xs text-slate-400">
            {isSignUp ? 'Onboard a secure profile into our credentials database' : 'Secure gateway into the Signature Security platform'}
          </p>
        </div>

        {/* System Messages */}
        {errorMsg && (
          <div className="mb-5 bg-red-950/50 text-red-300 border border-red-500/20 text-xs py-2.5 px-3 rounded-lg flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Roles tab selector (SignUp only) */}
        {isSignUp && (
          <div className="grid grid-cols-4 bg-black border border-neutral-900 p-1 mb-5 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => { setRole('guard'); setErrorMsg(''); }}
              className={`py-2 font-bold uppercase transition-all tracking-wider ${role === 'guard' ? 'bg-white text-black font-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}
            >
              Guard
            </button>
            <button
              type="button"
              onClick={() => { setRole('client'); setErrorMsg(''); }}
              className={`py-2 font-bold uppercase transition-all tracking-wider ${role === 'client' ? 'bg-white text-black font-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}
            >
              Client
            </button>
            <button
              type="button"
              onClick={() => { setRole('auditor'); setErrorMsg(''); }}
              className={`py-2 font-bold uppercase transition-all tracking-wider ${role === 'auditor' ? 'bg-white text-black font-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}
            >
              Compliance Auditor
            </button>
            <button
              type="button"
              onClick={() => { setRole('staff'); setErrorMsg(''); }}
              className={`py-2 font-bold uppercase transition-all tracking-wider ${role === 'staff' ? 'bg-white text-black font-black' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}
            >
              Staff
            </button>
          </div>
        )}

        {/* Main form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          
          {/* Sign Up Fields */}
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Full Name / Profile Name</label>
              <div className="relative flex items-center bg-slate-950 border border-slate-800 hover:border-slate-700 p-2.5 rounded-lg">
                <User className="absolute left-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Officer Alex / Corp Representative"
                  className="bg-transparent text-xs outline-none text-white w-full pl-7"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Contact Email</label>
            <div className="relative flex items-center bg-slate-950 border border-slate-800 hover:border-slate-700 p-2.5 rounded-lg block">
              <Mail className="absolute left-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="officer@sigsec.com"
                className="bg-transparent text-xs outline-none text-white w-full pl-7"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Access Password</label>
            <div className="relative flex items-center bg-slate-950 border border-slate-800 hover:border-slate-700 p-2.5 rounded-lg">
              <Lock className="absolute left-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                className="bg-transparent text-xs outline-none text-white w-full pl-7"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Guard signup specific fields */}
          {isSignUp && role === 'guard' && (
            <div className="space-y-3.5 border-t border-slate-800/80 pt-3.5">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">State License Badge No</label>
                <div className="relative flex items-center bg-slate-950 border border-slate-800 hover:border-slate-700 p-2.5 rounded-lg">
                  <Key className="absolute left-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="S-22109 or G-77291"
                    className="bg-transparent text-xs outline-none text-white w-full pl-7"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 tracking-wider block">Phone Number</label>
                  <div className="relative flex items-center bg-slate-950 border border-slate-800 p-2 rounded-lg">
                    <Phone className="absolute left-2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="+1 (555)"
                      className="bg-transparent text-xs outline-none text-white w-full pl-6"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 tracking-wider block">Hourly rate ($)</label>
                  <div className="relative flex items-center bg-slate-950 border border-slate-800 p-2 rounded-lg">
                    <DollarSign className="absolute left-2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="number"
                      placeholder="35"
                      className="bg-transparent text-xs outline-none text-white w-full pl-6"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Professional Biography</label>
                <textarea
                  placeholder="List tactical training or private security escrow hours..."
                  className="bg-slate-950 text-xs border border-slate-800 p-2.5 rounded-lg outline-none text-white w-full h-16 resize-none"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  id="armed-check"
                  checked={isArmed}
                  onChange={(e) => setIsArmed(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-850 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="armed-check" className="text-xs text-slate-400 font-mono tracking-wide cursor-pointer select-none">
                  Armed Security Permit Holder (State Licensed)
                </label>
              </div>

            </div>
          )}

          {/* Client signup specific fields */}
          {isSignUp && role === 'client' && (
            <div className="space-y-3 border-t border-slate-800/80 pt-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Business / Company Name</label>
                <div className="relative flex items-center bg-slate-950 border border-slate-800 p-2.5 rounded-lg">
                  <Briefcase className="absolute left-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Sartorial Security Corp"
                    className="bg-transparent text-xs outline-none text-white w-full pl-7"
                    value={clientCompanyName}
                    onChange={(e) => setClientCompanyName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Auditor signup specific fields */}
          {isSignUp && role === 'auditor' && (
            <div className="space-y-3 border-t border-slate-800/80 pt-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Regulatory Organization</label>
                <div className="relative flex items-center bg-slate-950 border border-slate-800 p-2.5 rounded-lg">
                  <Briefcase className="absolute left-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="State License Board"
                    className="bg-transparent text-xs outline-none text-white w-full pl-7"
                    value={auditorOrg}
                    onChange={(e) => setAuditorOrg(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Staff signup activation code */}
          {isSignUp && role === 'staff' && (
            <div className="space-y-3 border-t border-slate-800/80 pt-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Staff Operations Code</label>
                <div className="relative flex items-center bg-slate-950 border border-slate-800 p-2.5 rounded-lg">
                  <Lock className="absolute left-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Enter STAFF777"
                    className="bg-transparent text-xs outline-none text-white w-full pl-7 font-mono font-bold text-amber-400 uppercase"
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value)}
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-mono">Use passcode <strong className="text-slate-350">STAFF777</strong> to unlock administrative privileges in the database.</p>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full h-12 bg-white hover:bg-neutral-100 text-black text-xs font-bold font-mono uppercase tracking-widest transition-all rounded-none border border-white cursor-pointer"
          >
            {isSignUp ? 'REGISTER PROFILE' : 'SIGN INTO PROFILE'}
          </button>
        </form>

        {/* Change auth mode */}
        <div className="mt-6 text-center text-xs">
          <span className="text-slate-500">
            {isSignUp ? 'Already have an existing profile?' : 'Register fresh security credentials?'}
          </span>{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
            }}
            className="text-sage-400 hover:text-sage-300 font-bold underline transition-colors cursor-pointer"
          >
            {isSignUp ? 'Sign In Here' : 'Create Profile Here'}
          </button>
        </div>



      </div>
    </div>
  );
}
