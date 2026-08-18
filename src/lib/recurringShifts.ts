import type { SecurityRequest } from '../types';
import { computeDurationHours } from './dates';
import { computeJobBilling, rebillJobFromSnapshot } from './payments';
import type { PlatformFeeConfig } from '../../lib/platformFees';

export type RecurrenceRule = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface RecurringShiftTemplate {
  id: string;
  clientId: string;
  title: string;
  siteName?: string;
  address?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  recurrenceRule: RecurrenceRule;
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  guardsNeeded: number;
  /** Frozen at contract time — later platform fee table changes must not rewrite this. */
  platformFeePerHour?: number;
  uniformRequirements?: string;
  equipmentRequirements?: string;
  siteInstructions?: string;
  active: boolean;
  lastGeneratedAt?: string;
  createdAt: string;
}

function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number);
  return { hours: h || 0, minutes: m || 0 };
}

function nextOccurrence(template: RecurringShiftTemplate, after: Date): Date | null {
  if (!template.active) return null;
  const base = new Date(after);
  base.setHours(0, 0, 0, 0);

  for (let i = 0; i < 60; i++) {
    const candidate = new Date(base);
    candidate.setDate(candidate.getDate() + i);

    if (template.recurrenceRule === 'weekly' || template.recurrenceRule === 'biweekly') {
      if (template.dayOfWeek != null && candidate.getDay() !== template.dayOfWeek) continue;
      if (template.recurrenceRule === 'biweekly' && template.lastGeneratedAt) {
        const weeks = Math.floor(
          (candidate.getTime() - new Date(template.lastGeneratedAt).getTime()) / (7 * 86_400_000)
        );
        if (weeks % 2 !== 0) continue;
      }
    }

    const { hours, minutes } = parseTime(template.startTime);
    candidate.setHours(hours, minutes, 0, 0);
    if (candidate <= after) continue;
    return candidate;
  }
  return null;
}

export function generateJobFromTemplate(
  template: RecurringShiftTemplate,
  feeConfig: PlatformFeeConfig,
  after = new Date()
): Partial<SecurityRequest> | null {
  const start = nextOccurrence(template, after);
  if (!start) return null;

  const { hours: endH, minutes: endM } = parseTime(template.endTime);
  const end = new Date(start);
  end.setHours(endH, endM, 0, 0);
  if (end <= start) end.setDate(end.getDate() + 1);

  const durationHours = computeDurationHours(start.toISOString(), end.toISOString());
  const billing =
    template.platformFeePerHour != null
      ? rebillJobFromSnapshot(
          {
            hourlyRate: template.hourlyRate,
            platformFeePerHour: template.platformFeePerHour,
          },
          { durationHours, guardsNeeded: template.guardsNeeded }
        )
      : computeJobBilling(template.hourlyRate, durationHours, template.guardsNeeded, feeConfig);

  return {
    id: `req-recur-${template.id}-${start.getTime()}`,
    title: template.title,
    clientId: template.clientId,
    siteName: template.siteName,
    address: template.address,
    state: template.state,
    latitude: template.latitude,
    longitude: template.longitude,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    durationHours,
    hourlyRate: template.hourlyRate,
    guardsNeeded: template.guardsNeeded,
    uniformRequirements: template.uniformRequirements,
    equipmentRequirements: template.equipmentRequirements,
    siteInstructions: template.siteInstructions,
    guardPay: billing.guardPay,
    platformFeePerHour: billing.platformFeePerHour,
    estimatedPayout: billing.estimatedPayout,
    status: 'pending-review',
    type: 'patrol',
  };
}
