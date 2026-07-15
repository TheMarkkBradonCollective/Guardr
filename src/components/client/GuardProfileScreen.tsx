import React, { useMemo } from 'react';
import { JobChatThread, SecurityGuard, SecurityRequest, SessionUser } from '../../types';
import { getGuardHistoryWithClient, getGuardPlatformHistory } from '../../lib/guardDirectory';
import {
  canOpenJobChatForRequest,
  findMessageableRequestForGuard,
  isJobChatEligible,
  isJobChatReadOnly,
  jobChatActionLabel,
  threadForRequest,
} from '../../lib/jobChat';
import {
  formatServiceAreas,
  formatSkillList,
  getGuardDisplayHeadline,
  getGuardDisplaySummary,
} from '../../lib/guardResume';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { CertBadgeRow } from '../guard/CertBadgeRow';
import { GuardCredentialsView } from '../credentials/GuardCredentialsView';
import { GuardWeaponGearClientSection } from '../profile/GuardWeaponGearPanel';
import { formatShiftRange } from '../../lib/dates';
import { WfBadge, WfMetricTile, WfSectionHeader } from '../ui/wireframe';
import {
  GUARD_APPROVED_BADGE_LABEL,
  GUARD_TRUSTED_BADGE_LABEL,
  isGuardProfileApproved,
  isGuardTrusted,
} from '../../lib/guardTrust';
import { GuardArmedStatusPill } from '../guard/GuardArmedStatusPill';
import { GuardRatingSection } from '../guard/GuardRatingSection';
import {
  computeGuardPerformance,
  computeGuardSkillRatings,
} from '../../lib/guardPerformance';
import { AppScreen, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import {
  BookOpen,
  Briefcase,
  Check,
  Clock,
  GraduationCap,
  Heart,
  MapPin,
  MessageCircle,
} from 'lucide-react';

interface GuardProfileScreenProps {
  guard: SecurityGuard;
  clientId: string;
  requests: SecurityRequest[];
  platformRequests?: SecurityRequest[];
  onBack: () => void;
  onRequestGuard: (guard: SecurityGuard) => void;
  jobChatThreads?: JobChatThread[];
  currentUser?: SessionUser;
  onSendJobChatMessage?: (requestId: string, body: string) => void | Promise<void>;
  onOpenJobChat?: (requestId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void | Promise<void>;
}

const STATUS_LABEL: Record<SecurityRequest['status'], string> = {
  draft: 'Draft',
  'pending-review': 'Pending',
  open: 'Open',
  accepted: 'Picked up',
  'in-progress': 'In progress',
  completed: 'Completed',
  cancelled: 'Canceled',
  closed: 'Closed',
};

export function GuardProfileScreen({
  guard,
  clientId,
  requests,
  platformRequests = [],
  onBack,
  onRequestGuard,
  jobChatThreads = [],
  currentUser,
  onSendJobChatMessage,
  onOpenJobChat,
  isFavorite = false,
  onToggleFavorite,
}: GuardProfileScreenProps) {
  const history = useMemo(
    () => getGuardHistoryWithClient(guard.id, clientId, requests),
    [guard.id, clientId, requests]
  );

  const platformHistory = useMemo(
    () => getGuardPlatformHistory(guard.id, platformRequests, clientId),
    [guard.id, platformRequests, clientId]
  );

  const guardFirstName = guard.name.split(' ')[0];

  const messageableRequest = useMemo(
    () => findMessageableRequestForGuard(clientId, guard.id, requests, jobChatThreads),
    [clientId, guard.id, requests, jobChatThreads]
  );

  const canMessageFromProfile =
    !!messageableRequest &&
    !!onOpenJobChat &&
    (isJobChatEligible(messageableRequest)
      ? !!(currentUser && onSendJobChatMessage)
      : canOpenJobChatForRequest(messageableRequest, jobChatThreads));

  const openJobChat = (requestId: string) => onOpenJobChat?.(requestId);

  const canOpenHistoryChat = (requestId: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req || !onOpenJobChat) return false;
    if (isJobChatEligible(req)) return !!(currentUser && onSendJobChatMessage);
    return isJobChatReadOnly(req) && !!threadForRequest(jobChatThreads, req.id);
  };

  const aboutText = guard.about?.trim() || guard.bio?.trim();
  const ratingRequests = platformRequests.length ? platformRequests : requests;
  const performance = useMemo(
    () => computeGuardPerformance(guard.id, ratingRequests),
    [guard.id, ratingRequests]
  );
  const skillRatings = useMemo(
    () => computeGuardSkillRatings(guard, ratingRequests),
    [guard, ratingRequests]
  );

  return (
    <AppScreen className="app-full-page-detail">
      <AppSubScreenHeader title={guard.name} onBack={onBack} backLabel="Guards" />
      <div className="px-4 py-4 space-y-6 pb-28 max-w-3xl mx-auto">
          <div className="wf-list-card flex-col items-stretch !flex !flex-col gap-4 overflow-hidden p-0">
            <div className="p-6 bg-gradient-to-br from-brand-primary/20 via-brand-primary/8 to-transparent">
              <div className="flex items-start gap-4">
                <ProfileAvatar src={guard.avatar} name={guard.name} size="2xl" rounded="xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h1 className="text-2xl font-bold">{guard.name}</h1>
                    {onToggleFavorite && (
                      <button
                        type="button"
                        aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
                        onClick={() => void onToggleFavorite()}
                        className="shrink-0 p-1.5 rounded-full text-brand-text-muted hover:text-rose-500 transition-colors"
                      >
                        <Heart className={`w-6 h-6 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    )}
                  </div>
                  <p className="text-base text-brand-primary font-medium mt-1">{getGuardDisplayHeadline(guard)}</p>
                  <p className="text-sm text-brand-text-muted mt-2 leading-relaxed">{getGuardDisplaySummary(guard)}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <GuardArmedStatusPill guard={guard} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 mt-4">
                    <WfMetricTile label="Completed" value={guard.jobsCompleted} accent />
                    {guard.yearsExperience != null && guard.yearsExperience > 0 && (
                      <WfMetricTile label="Experience" value={`${guard.yearsExperience}+ yrs`} />
                    )}
                  </div>
                  {isGuardProfileApproved(guard) && (
                    <p className="inline-flex items-center gap-1 text-sm text-brand-primary mt-3">
                      <Check className="w-4 h-4" />
                      {GUARD_APPROVED_BADGE_LABEL}
                    </p>
                  )}
                  {isGuardTrusted(guard) && (
                    <p className="inline-flex items-center gap-1 text-sm text-brand-primary mt-3">
                      <Check className="w-4 h-4" />
                      {GUARD_TRUSTED_BADGE_LABEL}
                    </p>
                  )}
                  {guard.backgroundChecked && (
                    <p className="inline-flex items-center gap-1 text-sm text-brand-primary mt-3">
                      <Check className="w-4 h-4" />
                      Background checked
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <CertBadgeRow guard={guard} clientMode />

          <GuardRatingSection
            guard={guard}
            requests={ratingRequests}
            performance={performance}
            skillRatings={skillRatings}
            variant="full"
          />

          <GuardWeaponGearClientSection guard={guard} />

          {aboutText && (
            <section>
              <WfSectionHeader title="Full profile" className="mb-2" />
              <div className="wf-list-card flex-col items-stretch !flex !flex-col">
                <BookOpen className="w-4 h-4 text-brand-primary mb-2" />
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{aboutText}</p>
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {guard.skills && guard.skills.length > 0 && (
              <FactCard label="Skills" value={formatSkillList(guard.skills)} />
            )}
            {guard.languages && guard.languages.length > 0 && (
              <FactCard label="Languages" value={guard.languages.join(', ')} />
            )}
            {guard.serviceAreas && guard.serviceAreas.length > 0 && (
              <FactCard label="Service areas" value={formatServiceAreas(guard.serviceAreas)} icon={MapPin} />
            )}
            {guard.availabilityNotes && (
              <FactCard label="Availability" value={guard.availabilityNotes} icon={Clock} />
            )}
          </section>

          {guard.specialties && guard.specialties.length > 0 && (
            <section>
              <WfSectionHeader title="Specialties" className="mb-2" />
              <div className="flex flex-wrap gap-2">
                {guard.specialties.map((s) => (
                  <span key={s} className="chip chip-active text-xs">{s}</span>
                ))}
              </div>
            </section>
          )}

          <section>
            <GuardCredentialsView guard={guard} guardName={guard.name} hideEmpty excludeRejected verifiedOnly />
          </section>

          {guard.experience.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-brand-text-muted" />
                <h2 className="app-section-title mb-0">Work experience</h2>
              </div>
              <div className="space-y-3">
                {guard.experience.map((exp) => (
                  <div key={exp.id} className="wf-list-card flex-col items-stretch !flex !flex-col gap-1">
                    <p className="font-semibold">{exp.title}</p>
                    <p className="text-sm text-brand-primary">{exp.company}</p>
                    <p className="text-xs text-brand-text-muted">{exp.period}</p>
                    <p className="text-sm text-brand-text-muted leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {guard.education && guard.education.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-brand-text-muted" />
                <h2 className="app-section-title mb-0">Education</h2>
              </div>
              <div className="space-y-3">
                {guard.education.map((edu) => (
                  <div key={edu.id} className="wf-list-card flex-col items-stretch !flex !flex-col gap-1">
                    <p className="font-semibold">{edu.school}</p>
                    <p className="text-sm text-brand-primary">
                      {[edu.degree, edu.field].filter(Boolean).join(' · ') || 'Program'}
                    </p>
                    <p className="text-xs text-brand-text-muted">{edu.period}</p>
                    {edu.description && (
                      <p className="text-sm text-brand-text-muted">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <WfSectionHeader title={`Your history with ${guardFirstName}`} className="mb-2" />
            {history.length === 0 ? (
              <div className="wf-list-card text-sm text-brand-text-muted justify-center">
                You have not worked with this guard on Guardr yet.
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => {
                  const historyChatOpen = canOpenHistoryChat(item.requestId);
                  const historyReq = requests.find((r) => r.id === item.requestId);
                  const CardTag = historyChatOpen ? 'button' : 'div';
                  return (
                    <CardTag
                      key={item.requestId}
                      type={historyChatOpen ? 'button' : undefined}
                      onClick={historyChatOpen ? () => openJobChat(item.requestId) : undefined}
                      className={`wf-list-card flex-col items-stretch !flex !flex-col gap-1 text-left w-full${
                        historyChatOpen ? ' hover:border-brand-primary/40 transition-colors' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 w-full">
                        <p className="font-semibold text-sm">{item.title}</p>
                        <WfBadge className="shrink-0">{STATUS_LABEL[item.status]}</WfBadge>
                      </div>
                      <p className="text-xs text-brand-text-muted">{item.location}</p>
                      <p className="text-sm text-brand-primary">{formatShiftRange(item.startDate, item.endDate)}</p>
                      {item.ratingGiven != null && (
                        <p className="text-xs text-brand-text-muted">
                          Your rating: {item.ratingGiven}/5{item.reviewText ? ` — "${item.reviewText}"` : ''}
                        </p>
                      )}
                      {historyChatOpen && historyReq && (
                        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-primary mt-1">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {jobChatActionLabel(historyReq)}
                        </p>
                      )}
                    </CardTag>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <WfSectionHeader title={`${guardFirstName}'s work with other clients`} className="mb-2" />
            {platformHistory.length === 0 ? (
              <div className="wf-list-card text-sm text-brand-text-muted justify-center">
                No other completed assignments to show yet.
              </div>
            ) : (
              <div className="space-y-2">
                {platformHistory.map((item) => (
                  <div
                    key={item.requestId}
                    className="wf-list-card flex-col items-stretch !flex !flex-col gap-1"
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <p className="font-semibold text-sm">{item.jobTypeLabel}</p>
                      <WfBadge className="shrink-0">Completed</WfBadge>
                    </div>
                    <p className="text-xs text-brand-text-muted">Private client · {item.locationLabel}</p>
                    <p className="text-sm text-brand-primary">{formatShiftRange(item.startDate, item.endDate)}</p>
                    {item.armedRequired && (
                      <p className="text-xs text-brand-text-muted">Armed assignment</p>
                    )}
                    {item.clientRating != null && (
                      <p className="text-xs text-brand-text-muted">
                        Client rating: {item.clientRating}/5
                        {item.clientReview ? ` — "${item.clientReview}"` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

      <div className="shrink-0 p-4 border-t border-brand-border bg-brand-bg/95 backdrop-blur-xl max-w-3xl mx-auto w-full space-y-2">
        {canMessageFromProfile && messageableRequest && (
          <button
            type="button"
            onClick={() => openJobChat(messageableRequest.id)}
            className="app-button-outline w-full gap-1.5"
          >
            <MessageCircle className="w-4 h-4" />
            {jobChatActionLabel(messageableRequest)}
          </button>
        )}
        <button
          type="button"
          onClick={() => onRequestGuard(guard)}
          className="app-button-primary"
        >
          Send assignment request to {guardFirstName}
        </button>
        <p className="text-center text-xs text-brand-text-muted mt-2">
          Separate from posting a general job to all guards
        </p>
      </div>
    </AppScreen>
  );
}

function FactCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof MapPin;
}) {
  return (
    <div className="wf-metric-tile">
      <p className="wf-metric-label flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </p>
      <p className="wf-metric-value text-base leading-relaxed">{value}</p>
    </div>
  );
}
