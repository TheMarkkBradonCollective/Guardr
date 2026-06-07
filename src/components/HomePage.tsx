import React from 'react';
import { Logo } from './Logo';
import { 
  ShieldCheck, 
  ArrowRight, 
  MapPin, 
  User, 
  Compass, 
  FileCheck, 
  Smartphone,
  ChevronRight,
  Shield,
  Clock,
  Briefcase,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';
import { SecurityRequest, SecurityGuard } from '../types';

interface HomePageProps {
  onNavigateToAuth: (initialRole?: 'guard' | 'client' | 'auditor' | 'staff') => void;
  guardsCount: number;
  requestsCount: number;
  availableRequests: SecurityRequest[];
  sampleGuards: SecurityGuard[];
}

export function HomePage({ 
  onNavigateToAuth, 
  guardsCount, 
  requestsCount,
  availableRequests,
  sampleGuards
}: HomePageProps) {
  return (
    <div className="bg-black text-white min-h-screen font-sans relative selection:bg-brand-primary selection:text-black overflow-hidden" id="guardr-landing-root">
      
      {/* Subtle crisp geometric background grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d110e_1px,transparent_1px),linear-gradient(to_bottom,#0d110e_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none opacity-80" />

      {/* Modern Top Header / Portal Selector Bar */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-neutral-900 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={32} className="text-brand-primary shrink-0" />
            <span className="font-sans font-black text-xl tracking-tighter text-white uppercase">Guardr</span>
          </div>

          <div className="hidden md:flex items-center gap-5">
            <button 
              onClick={() => onNavigateToAuth('client')} 
              className="text-neutral-400 hover:text-white transition-colors font-mono text-[11px] uppercase tracking-wider"
            >
              Client Login
            </button>
            <button 
              onClick={() => onNavigateToAuth('guard')} 
              className="text-neutral-400 hover:text-white transition-colors font-mono text-[11px] uppercase tracking-wider"
            >
              Guard Portal
            </button>
            <button 
              onClick={() => onNavigateToAuth('auditor')} 
              className="text-neutral-400 hover:text-white transition-colors font-mono text-[11px] uppercase tracking-wider"
            >
              Compliance Audit
            </button>
            <button 
              onClick={() => onNavigateToAuth('staff')} 
              className="text-neutral-400 hover:text-white transition-colors font-mono text-[11px] uppercase tracking-wider border-l border-neutral-800 pl-4"
            >
              Operations Console
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => onNavigateToAuth('client')}
              className="text-xs bg-neutral-900 border border-neutral-800 px-3 py-1.5 font-mono uppercase tracking-wider"
            >
              Enter Console
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center z-10">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-[#0b120c] border border-[#1b2f1d]/40 text-brand-primary text-[10px] font-mono uppercase tracking-wider mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></span>
          <span>Verified Contractor Marketplace</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl sm:text-7xl font-sans font-black tracking-tight leading-none uppercase text-white flex flex-col items-center justify-center gap-1"
        >
          <span>Guardr</span>
          <a 
            href="https://www.signaturesecurityspecialist.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-xs sm:text-sm font-mono tracking-[0.25em] text-neutral-400 hover:text-brand-primary uppercase font-bold mt-1 transition-all hover:underline"
          >
            BY SIGNATURE SECURITY SPECIALIST
          </a>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg sm:text-2xl font-mono text-brand-primary font-bold mt-3 tracking-wide uppercase"
        >
          Independent Security Staffing. On Demand.
        </motion.p>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-base sm:text-lg text-neutral-300 max-w-2xl mx-auto mt-6 leading-relaxed"
        >
          Guardr connects clients with verified independent security professionals ready for assignment.
        </motion.p>

        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-sm font-mono text-neutral-450 uppercase tracking-widest font-extrabold mt-8 bg-neutral-950 p-2.5 max-w-md mx-auto border border-neutral-900"
        >
          📍 Anytime. Anywhere. Security, when you need it.
        </motion.h3>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="text-xs sm:text-sm text-neutral-450 max-w-xl mx-auto mt-6 leading-relaxed font-sans"
        >
          We are an <span className="text-white font-medium">independent contractor marketplace</span> that connects licensed security professionals directly with clients who need coverage—fast, flexible, and transparent.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto"
        >
          <button
            onClick={() => onNavigateToAuth('client')}
            className="flex-1 px-6 py-4 bg-white text-black font-sans font-extrabold text-xs tracking-wider uppercase transition-all hover:bg-neutral-200 cursor-pointer text-center"
          >
            Get Started
          </button>
          <button
            onClick={() => onNavigateToAuth('guard')}
            className="flex-1 px-6 py-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-sans font-extrabold text-xs tracking-wider uppercase transition-all cursor-pointer text-center"
          >
            Sign Up as a Guard
          </button>
        </motion.div>
      </section>

      {/* SECTION 1: GET SECURITY COVERAGE */}
      <section className="py-16 border-t border-neutral-900 bg-neutral-950/40 relative z-10 px-4">
        <div className="max-w-4xl mx-auto bg-black border border-neutral-900 p-8 sm:p-12 space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] text-brand-primary font-mono tracking-widest uppercase font-bold">DIRECT ASSIGNMENT</span>
            <h2 className="text-2xl sm:text-3xl font-sans font-black uppercase text-white tracking-tight">
              Get Security Coverage When You Need It
            </h2>
          </div>

          <p className="text-base sm:text-lg text-neutral-200 font-mono italic">
            Post a request. Get qualified guards. Confirm coverage.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="border border-neutral-900 bg-neutral-95 w-full p-4 font-mono text-[11px] text-brand-primary uppercase">
              ⚡ No long hiring cycles.
            </div>
            <div className="border border-neutral-900 bg-neutral-95 w-full p-4 font-mono text-[11px] text-brand-primary uppercase">
              🛡 No staffing middlemen.
            </div>
          </div>

          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed pt-2">
            Guardr lets you request security personnel by time, location, and job type—then independent contractors choose the shifts that fit them.
          </p>
        </div>
      </section>

      {/* SECTION 2: HOW IT WORKS */}
      <section className="py-20 border-t border-neutral-900 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-12 space-y-2">
          <span className="text-[10px] text-brand-primary font-mono tracking-widest uppercase font-bold">TRANSPARENT SYSTEM</span>
          <h2 className="text-3xl font-sans font-black uppercase text-white tracking-tight">How It Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* For Clients */}
          <div className="bg-neutral-950 border border-neutral-900 p-6 sm:p-8 space-y-6">
            <div className="border-b border-neutral-900 pb-4">
              <span className="text-[10px] text-neutral-500 font-mono block mb-1">STAGING PORTAL</span>
              <h3 className="text-lg font-sans font-bold uppercase text-white">For Clients</h3>
            </div>

            <ol className="space-y-4 text-xs font-mono">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-white text-black flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <div>
                  <h4 className="text-white font-bold uppercase">Create a request</h4>
                  <p className="text-neutral-400 text-[11px] mt-0.5 font-sans">Open your client staging dashboard instantly.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-white text-black flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <div>
                  <h4 className="text-white font-bold uppercase">Submit job details</h4>
                  <p className="text-neutral-400 text-[11px] mt-0.5 font-sans">Specify date, time, location, and desired hourly rate.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-white text-black flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <div>
                  <h4 className="text-white font-bold uppercase">Staff reviews and approves</h4>
                  <p className="text-neutral-400 text-[11px] mt-0.5 font-sans">Our dispatch controller verifies and approves the post.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-white text-black flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</span>
                <div>
                  <h4 className="text-white font-bold uppercase">Qualified guards accept</h4>
                  <p className="text-neutral-400 text-[11px] mt-0.5 font-sans">Licensed contract security personnel take the shift.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-brand-primary text-black flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">5</span>
                <div>
                  <h4 className="text-brand-primary font-bold uppercase">Coverage begins</h4>
                  <p className="text-neutral-400 text-[11px] mt-0.5 font-sans">Continuous field check-ins ensure total visibility.</p>
                </div>
              </li>
            </ol>
          </div>

          {/* For Guards */}
          <div className="bg-neutral-950 border border-neutral-900 p-6 sm:p-8 space-y-6">
            <div className="border-b border-neutral-900 pb-4">
              <span className="text-[10px] text-neutral-500 font-mono block mb-1">INDEPENDENT CONTRACTOR</span>
              <h3 className="text-lg font-sans font-bold uppercase text-white">For Guards</h3>
            </div>

            <ol className="space-y-4 text-xs font-mono">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 border border-neutral-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <div>
                  <h4 className="text-white font-bold uppercase">Sign up as an independent contractor</h4>
                  <p className="text-neutral-400 text-[11px] mt-0.5 font-sans">Register your local license details on our dispatch ledger.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 border border-neutral-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <div>
                  <h4 className="text-white font-bold uppercase">Upload certifications and credentials</h4>
                  <p className="text-neutral-400 text-[11px] mt-0.5 font-sans">Present Guard Cards, weapons permits, and training files.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 border border-neutral-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <div>
                  <h4 className="text-white font-bold uppercase">Get access to available shifts</h4>
                  <p className="text-neutral-400 text-[11px] mt-0.5 font-sans">View matching immediate coverage demands in real time.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 border border-neutral-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</span>
                <div>
                  <h4 className="text-white font-bold uppercase">Accept jobs that match your schedule</h4>
                  <p className="text-neutral-400 text-[11px] mt-0.5 font-sans font-mono text-brand-primary">No quotas. Work whenever you decide is appropriate.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 bg-brand-primary text-black flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">5</span>
                <div>
                  <h4 className="text-brand-primary font-bold uppercase">Work and get paid directly</h4>
                  <p className="text-neutral-400 text-[11px] mt-0.5 font-sans">Get rapid contract digital remittance upon completion.</p>
                </div>
              </li>
            </ol>
          </div>

        </div>
      </section>

      {/* SECTION 3: BUILT FOR FLEXIBILITY */}
      <section className="py-16 border-t border-neutral-900 bg-neutral-950/20 relative z-10 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[10px] text-brand-primary font-mono tracking-widest uppercase font-bold">OPERATIONAL DIVERSITY</span>
            <h2 className="text-2xl sm:text-3xl font-sans font-black uppercase text-white tracking-tight">Built for Flexibility</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-neutral-950 border border-neutral-900 p-4 font-mono text-center">
              <span className="text-brand-primary text-xs uppercase block font-bold">Event Security</span>
            </div>
            <div className="bg-neutral-950 border border-neutral-900 p-4 font-mono text-center">
              <span className="text-brand-primary text-xs uppercase block font-bold">Construction Sites</span>
            </div>
            <div className="bg-neutral-950 border border-neutral-900 p-4 font-mono text-center">
              <span className="text-brand-primary text-xs uppercase block font-bold">Retail Protection</span>
            </div>
            <div className="bg-neutral-950 border border-neutral-900 p-4 font-mono text-center">
              <span className="text-brand-primary text-xs uppercase block font-bold">Nightlife & Events</span>
            </div>
            <div className="bg-neutral-950 border border-neutral-900 col-span-2 md:col-span-1 p-4 font-mono text-center">
              <span className="text-brand-primary text-xs uppercase block font-bold">Short & Recurring</span>
            </div>
          </div>

          <div className="text-center max-w-xl mx-auto text-xs sm:text-sm text-neutral-350 bg-neutral-950 border border-neutral-900 p-4 font-mono uppercase tracking-wide">
            ⚠ Guardr is designed for real-world coverage needs that change by the hour, not by the month.
          </div>
        </div>
      </section>

      {/* SECTION 4: INDEPENDENT TRANSPARENT FAST */}
      <section className="py-16 border-t border-neutral-900 px-4">
        <div className="max-w-3xl mx-auto space-y-6 bg-black border border-neutral-900 p-6 sm:p-10 text-center">
          <span className="text-[10px] text-brand-primary font-mono tracking-widest uppercase font-bold">PLATFORM MANDATES</span>
          <h2 className="text-xl sm:text-2xl font-sans font-black uppercase text-white tracking-tight">
            Independent. Transparent. Fast.
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans max-w-xl mx-auto">
            Every assignment is a direct agreement between clients and independent contractors.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px] font-mono pt-4 text-neutral-450">
            <div className="border border-neutral-900 p-3 bg-neutral-950">
              ✖ Guardr does not employ guards.
            </div>
            <div className="border border-neutral-900 p-3 bg-neutral-950">
              ✖ Guardr does not guarantee placement.
            </div>
            <div className="border border-neutral-900 p-3 bg-neutral-950">
              ✔ Guardr provides the system that makes connection possible.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: SIGNUP BOTTOM PANEL */}
      <section className="py-20 border-t border-neutral-900 bg-neutral-950/50 text-center relative z-10 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-sans font-black uppercase tracking-tight text-white">
            Start Using Guardr
          </h2>

          <p className="text-base sm:text-xl font-mono text-brand-primary font-bold uppercase">
            Need coverage? Or ready to take shifts?
          </p>

          <p className="text-sm text-neutral-400">
            Join Guardr today and stay ready.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4 max-w-sm mx-auto">
            <button
              onClick={() => onNavigateToAuth('client')}
              className="flex-1 px-8 py-4 bg-white hover:bg-neutral-200 text-black font-sans font-black text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
            >
              Get Started
            </button>
            <button
              onClick={() => onNavigateToAuth('guard')}
              className="flex-1 px-8 py-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-sans font-black text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
            >
              Sign Up as a Guard
            </button>
          </div>
        </div>
      </section>

      {/* Elegant minimalist footer */}
      <footer className="py-12 border-t border-neutral-950 text-center text-neutral-600 font-mono text-[9px] uppercase tracking-widest relative z-10 bg-black space-y-2">
        <p>© {new Date().getFullYear()} G-U-A-R-D-R — ALL DATA STAGED ACCORDING TO STATE LICENSE LAWS</p>
        <p>
          POWERED BY{" "}
          <a 
            href="https://www.signaturesecurityspecialist.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-neutral-500 hover:text-brand-primary transition-colors underline"
          >
            SIGNATURE SECURITY SPECIALIST
          </a>
        </p>
      </footer>

    </div>
  );
}
