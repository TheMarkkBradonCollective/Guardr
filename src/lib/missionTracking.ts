import type { SecurityRequest, ShiftReport } from '../types';
import { inferClientShiftPhase, type ClientShiftPhase } from './clientShift';

export type MissionTimelineStep =
  | 'assigned'
  | 'en-route'
  | 'arrived'
  | 'on-duty'
  | 'incident'
  | 'emergency'
  | 'complete';

export interface MissionTimelineItem {
  step: MissionTimelineStep;
  label: string;
  timestamp?: string;
  active: boolean;
  complete: boolean;
}

const STEP_LABELS: Record<MissionTimelineStep, string> = {
  assigned: 'Guard assigned',
  'en-route': 'Guard en route',
  arrived: 'Arrived on site',
  'on-duty': 'On job',
  incident: 'Incident report filed',
  emergency: 'Emergency',
  complete: 'Job complete',
};

const PHASE_TO_STEP: Record<ClientShiftPhase, MissionTimelineStep> = {
  scheduled: 'assigned',
  'en-route': 'en-route',
  'on-site': 'arrived',
  'on-duty': 'on-duty',
  complete: 'complete',
};

const STEP_ORDER: MissionTimelineStep[] = [
  'assigned',
  'en-route',
  'arrived',
  'on-duty',
  'incident',
  'emergency',
  'complete',
];

export function inferMissionPhase(req: SecurityRequest): ClientShiftPhase {
  if (req.status === 'accepted' && !req.checkInAudit?.checkedAt) {
    if (req.arrivedAt) return 'on-site';
    if (req.enRouteAt) return 'en-route';
  }
  return inferClientShiftPhase(req);
}

export function buildMissionTimeline(
  req: SecurityRequest,
  reports: ShiftReport[] = []
): MissionTimelineItem[] {
  const phase = inferMissionPhase(req);
  const currentStep = PHASE_TO_STEP[phase];
  const currentIdx = STEP_ORDER.indexOf(currentStep);

  const incidentReport = reports.find(
    (r) => r.requestId === req.id && r.type === 'incident'
  );
  const hasEmergency = reports.some(
    (r) => r.requestId === req.id && r.type === 'incident' && /emergency|urgent/i.test(r.notes)
  );

  const timestamps: Partial<Record<MissionTimelineStep, string | undefined>> = {
    assigned: req.assignedGuardId ? req.startDate : undefined,
    'en-route': req.enRouteAt,
    arrived: req.arrivedAt,
    'on-duty': req.checkInAudit?.checkedAt,
    incident: incidentReport?.submittedAt,
    emergency: hasEmergency ? incidentReport?.submittedAt : undefined,
    complete: req.checkOutAudit?.checkedAt,
  };

  const steps: MissionTimelineStep[] = ['assigned', 'en-route', 'arrived', 'on-duty'];
  if (incidentReport) steps.push('incident');
  if (hasEmergency) steps.push('emergency');
  if (phase === 'complete') steps.push('complete');

  return steps.map((step) => {
    const stepIdx = STEP_ORDER.indexOf(step);
    return {
      step,
      label: STEP_LABELS[step],
      timestamp: timestamps[step],
      active: step === currentStep,
      complete: stepIdx < currentIdx || phase === 'complete',
    };
  });
}
