import React from 'react';
import {
  AlertTriangle,
  Clock,
  FileText,
  Flame,
  HeartPulse,
  KeyRound,
  MapPin,
  Radio,
  Shield,
  Users,
  Wine,
} from 'lucide-react';
import { JobOperationalDetails, JobOperationalLocation, SecurityRequest } from '../../types';
import {
  hasJobOperationalDetails,
  operationalBriefingLockedMessage,
} from '../../lib/jobOperationalDetails';

function DetailField({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  if (!children || (typeof children === 'string' && !children.trim())) return null;
  return (
    <div className="detail-field">
      <p className="detail-field-label">
        {icon}
        {title}
      </p>
      <div className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">{children}</div>
    </div>
  );
}

function LocationList({ title, items }: { title: string; items?: JobOperationalLocation[] }) {
  if (!items?.length) return null;
  return (
    <DetailField icon={<MapPin className="w-3.5 h-3.5" />} title={title}>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>
            {item.label && <p className="font-medium text-brand-text">{item.label}</p>}
            <p className={item.label ? 'text-brand-text-muted mt-0.5' : undefined}>{item.details}</p>
          </li>
        ))}
      </ul>
    </DetailField>
  );
}

interface JobOperationalBriefingProfileProps {
  details?: JobOperationalDetails;
  locked?: boolean;
  jobStatus?: SecurityRequest['status'];
}

export function JobOperationalBriefingProfile({
  details,
  locked = false,
  jobStatus = 'open',
}: JobOperationalBriefingProfileProps) {
  if (locked) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200 leading-relaxed flex gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{operationalBriefingLockedMessage({ status: jobStatus })}</span>
      </div>
    );
  }

  if (!hasJobOperationalDetails(details)) return null;

  const d = details!;

  return (
    <div className="space-y-0 border-t border-brand-border pt-3">
      <p className="detail-field-label mb-2">
        <Shield className="w-3.5 h-3.5 text-brand-primary" />
        Site briefing
      </p>

      <DetailField icon={<Users className="w-3.5 h-3.5" />} title="Patron / guest count">
        {d.patronHeadCount}
      </DetailField>
      <DetailField icon={<MapPin className="w-3.5 h-3.5" />} title="Post / assignment">
        {d.postAssignment}
      </DetailField>
      {(d.doorsOpenTime || d.doorsCloseTime || d.curfewTime) && (
        <DetailField icon={<Clock className="w-3.5 h-3.5" />} title="Doors & curfew">
          <>
            {d.doorsOpenTime && <p>Doors open: {d.doorsOpenTime}</p>}
            {d.doorsCloseTime && <p>Doors close: {d.doorsCloseTime}</p>}
            {d.curfewTime && <p>Curfew: {d.curfewTime}</p>}
          </>
        </DetailField>
      )}
      {(d.smokingAreaLocation ||
        d.smokingAreaOpenTime ||
        d.smokingAreaCloseTime ||
        d.smokingAreaRules ||
        d.smokingAreaGuardNotes) && (
        <DetailField icon={<MapPin className="w-3.5 h-3.5" />} title="Smoking area">
          <>
            {d.smokingAreaLocation && <p>Location: {d.smokingAreaLocation}</p>}
            {(d.smokingAreaOpenTime || d.smokingAreaCloseTime) && (
              <p>
                Hours:{' '}
                {[d.smokingAreaOpenTime, d.smokingAreaCloseTime].filter(Boolean).join(' – ')}
              </p>
            )}
            {d.smokingAreaRules && <p>Guest rules: {d.smokingAreaRules}</p>}
            {d.smokingAreaGuardNotes && <p>Guard notes: {d.smokingAreaGuardNotes}</p>}
          </>
        </DetailField>
      )}

      <DetailField icon={<Wine className="w-3.5 h-3.5" />} title="Bar details">
        {d.barDetails}
      </DetailField>
      {(d.barLastCallTime || d.barCloseTime) && (
        <DetailField icon={<Clock className="w-3.5 h-3.5" />} title="Bar last call & close">
          <>
            {d.barLastCallTime && <p>Last call: {d.barLastCallTime}</p>}
            {d.barCloseTime && <p>Bar close: {d.barCloseTime}</p>}
          </>
        </DetailField>
      )}

      <DetailField icon={<KeyRound className="w-3.5 h-3.5" />} title="Access codes">
        {d.accessCodes}
      </DetailField>
      <DetailField icon={<KeyRound className="w-3.5 h-3.5" />} title="Key location">
        {d.keyLocation}
      </DetailField>
      <DetailField icon={<KeyRound className="w-3.5 h-3.5" />} title="Access notes">
        {d.accessNotes}
      </DetailField>

      <DetailField icon={<Shield className="w-3.5 h-3.5" />} title="Emergency protocol">
        {d.emergencyProtocol}
      </DetailField>
      <DetailField icon={<Radio className="w-3.5 h-3.5" />} title="Radio channel">
        {d.radioChannel}
      </DetailField>
      <DetailField icon={<Radio className="w-3.5 h-3.5" />} title="Radio codes">
        {d.radioCodes}
      </DetailField>
      <DetailField icon={<MapPin className="w-3.5 h-3.5" />} title="Cooldown / de-escalation area">
        {d.cooldownAreaDetails}
      </DetailField>
      <DetailField icon={<HeartPulse className="w-3.5 h-3.5" />} title="Medical emergency contacts">
        {d.medicalEmergencyContacts}
      </DetailField>
      <DetailField icon={<HeartPulse className="w-3.5 h-3.5" />} title="Nearest hospital">
        {d.nearestHospital}
      </DetailField>
      <DetailField icon={<MapPin className="w-3.5 h-3.5" />} title="Evacuation rally point">
        {d.evacuationRallyPoint}
      </DetailField>

      <LocationList title="Fire extinguisher locations" items={d.fireExtinguisherLocations} />
      <LocationList title="Med kit locations" items={d.medkitLocations} />
      <LocationList title="Narcan locations" items={d.narcanLocations} />

      <DetailField icon={<Users className="w-3.5 h-3.5" />} title="VIP / restricted areas">
        {d.vipAreaDetails}
      </DetailField>
      <DetailField icon={<Shield className="w-3.5 h-3.5" />} title="Credentialing & wristbands">
        {d.credentialingDetails}
      </DetailField>
      <DetailField icon={<MapPin className="w-3.5 h-3.5" />} title="Vendor load-in / load-out">
        {d.vendorLoadInDetails}
      </DetailField>
      <DetailField icon={<MapPin className="w-3.5 h-3.5" />} title="Guard station / command post">
        {d.guardStationLocation}
      </DetailField>
      <DetailField icon={<Clock className="w-3.5 h-3.5" />} title="Restroom / break policy">
        {d.restroomBreakPolicy}
      </DetailField>
      <DetailField icon={<Users className="w-3.5 h-3.5" />} title="Lost child / guest procedure">
        {d.lostChildProcedure}
      </DetailField>
      <DetailField icon={<Wine className="w-3.5 h-3.5" />} title="Intoxication / 86 policy">
        {d.intoxicationPolicy}
      </DetailField>
      <DetailField icon={<Shield className="w-3.5 h-3.5" />} title="Filming / photo policy">
        {d.filmingPhotoPolicy}
      </DetailField>
      <DetailField icon={<Flame className="w-3.5 h-3.5" />} title="Client special requests">
        {d.clientSpecialRequests}
      </DetailField>
      <DetailField icon={<FileText className="w-3.5 h-3.5" />} title="Additional notes">
        {d.additionalNotes}
      </DetailField>
    </div>
  );
}
