import React from 'react';
import { DollarSign, TrendingUp, Settings, BarChart3 } from 'lucide-react';
import { SecurityRequest } from '../../types';
import { computeGuardEarnings, PLATFORM_FEE_PER_HOUR } from '../../lib/payments';

interface AdminFinancePanelProps {
  requests: SecurityRequest[];
  isDirector: boolean;
}

export function AdminFinancePanel({ requests, isDirector }: AdminFinancePanelProps) {
  const completed = requests.filter((r) => r.status === 'completed');
  const platformFees = completed.reduce(
    (sum, r) => sum + (r.platformFeePerHour ?? PLATFORM_FEE_PER_HOUR) * r.durationHours,
    0
  );
  const guardPayouts = completed.reduce(
    (sum, r) => sum + computeGuardEarnings(r.durationHours, r.hourlyRate),
    0
  );
  const grossVolume = completed.reduce((sum, r) => sum + r.estimatedPayout, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-mono uppercase text-slate-500 tracking-widest mb-1">Financial Controls</p>
        <h3 className="text-xl font-black text-slate-900">Platform Revenue</h3>
        <p className="text-xs text-slate-500 mt-1">
          {isDirector ? 'Full financial visibility — Director access' : 'Administrator payout and fee management'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Gross Client Volume', value: grossVolume, icon: DollarSign },
          { label: 'Guard Payouts', value: guardPayouts, icon: TrendingUp },
          { label: 'Platform Fees', value: Math.round(platformFees * 100) / 100, icon: BarChart3 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-indigo-600" />
              <p className="text-[10px] font-mono uppercase text-slate-500">{label}</p>
            </div>
            <p className="text-2xl font-black font-mono text-slate-900">${value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-600" />
          Fee Configuration
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Platform Fee (per hour)</label>
            <input
              type="number"
              defaultValue={PLATFORM_FEE_PER_HOUR}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
              readOnly={!isDirector}
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Payout Schedule</label>
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" defaultValue="instant">
              <option value="instant">Instant (Stripe Connect)</option>
              <option value="weekly">Weekly batch</option>
            </select>
          </div>
        </div>
        {isDirector && (
          <p className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Director override enabled — fee changes apply platform-wide immediately.
          </p>
        )}
      </div>

      {isDirector && (
        <div className="bg-slate-950 text-white rounded-xl p-5 border border-slate-800">
          <h4 className="font-bold text-sm text-emerald-400 mb-3">Audit Log (recent)</h4>
          <div className="space-y-2 text-[11px] font-mono text-slate-400">
            <p><span className="text-slate-600">[{new Date().toLocaleDateString()}]</span> Platform fee model active at ${PLATFORM_FEE_PER_HOUR}/hr</p>
            <p><span className="text-slate-600">[{new Date().toLocaleDateString()}]</span> {completed.length} completed shifts processed</p>
            <p><span className="text-slate-600">[{new Date().toLocaleDateString()}]</span> Stripe Connect sandbox mode</p>
          </div>
        </div>
      )}
    </div>
  );
}
