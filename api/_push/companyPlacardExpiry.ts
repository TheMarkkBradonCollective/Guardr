import type { SupabaseClient } from '@supabase/supabase-js';
import {
  claimNotificationDedup,
  companyPlacardExpiryDedupKey,
  companyPlacardMissingDedupKey,
  pruneStaleNotificationDedup,
} from './dedup';
import { dispatchPushNotification } from './delivery';
import { isPushConfigured } from './config';
import type { PushNotificationType } from './types';

const NOTIFICATION_TYPE: PushNotificationType = 'company_placard_expiry';
const SETTINGS_URL = '/staff/settings';
const EXECUTIVE_ROLES = ['Founder', 'Owner', 'Director'];

const PLACARD_CATALOG: { id: string; title: string; required: boolean }[] = [
  { id: 'business_entity_registration', title: 'Business Entity Registration', required: true },
  { id: 'general_liability_insurance', title: 'General Liability Insurance (COI)', required: true },
  { id: 'professional_liability_insurance', title: 'Professional / E&O Liability Insurance', required: false },
  { id: 'workers_comp_insurance', title: "Workers' Compensation Insurance", required: false },
  { id: 'business_license', title: 'City / County Business License', required: false },
];

type AlertTier = 'missing' | 'expired' | '45' | '30' | '14' | '7' | '1';

interface CompanyDocRow {
  document_type: string;
  title: string;
  document_number: string | null;
  issuer: string | null;
  expiry_date: string | null;
  image_url: string | null;
}

function docHasContent(row: CompanyDocRow | undefined): boolean {
  if (!row) return false;
  return Boolean(
    row.document_number?.trim() ||
      row.issuer?.trim() ||
      row.image_url?.trim() ||
      row.expiry_date?.trim()
  );
}

function daysUntilExpiry(expiryDate: string, now: Date): number | null {
  const expiry = new Date(`${expiryDate}T23:59:59`);
  if (Number.isNaN(expiry.getTime())) return null;
  return (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
}

function expiryAlertTier(
  expiryDate: string | undefined,
  hasContent: boolean,
  required: boolean,
  now: Date
): AlertTier | null {
  if (!hasContent && required) return 'missing';
  if (!expiryDate?.trim()) return null;
  const daysUntil = daysUntilExpiry(expiryDate, now);
  if (daysUntil == null) return null;
  if (daysUntil < 0) return 'expired';
  if (daysUntil <= 1) return '1';
  if (daysUntil <= 7) return '7';
  if (daysUntil <= 14) return '14';
  if (daysUntil <= 30) return '30';
  if (daysUntil <= 45) return '45';
  return null;
}

function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function alertCopy(
  documentTitle: string,
  tier: AlertTier,
  expiryDate?: string | null
): { title: string; body: string; priority: 'normal' | 'high' } {
  const formattedExpiry = expiryDate ? formatDate(expiryDate) : undefined;
  switch (tier) {
    case 'missing':
      return {
        title: 'Company placard item needed',
        body: `${documentTitle} is required for the public company placard but has not been uploaded yet.`,
        priority: 'high',
      };
    case 'expired':
      return {
        title: 'Company credential expired',
        body: formattedExpiry
          ? `${documentTitle} expired on ${formattedExpiry}. Update it in Staff Settings.`
          : `${documentTitle} has expired. Update it in Staff Settings.`,
        priority: 'high',
      };
    case '1':
      return {
        title: 'Company credential expires tomorrow',
        body: formattedExpiry
          ? `${documentTitle} expires on ${formattedExpiry}.`
          : `${documentTitle} expires within 1 day.`,
        priority: 'high',
      };
    case '7':
      return {
        title: 'Company credential expiring soon',
        body: formattedExpiry
          ? `${documentTitle} expires on ${formattedExpiry} (within 7 days).`
          : `${documentTitle} expires within 7 days.`,
        priority: 'high',
      };
    default:
      return {
        title: 'Company credential renewal reminder',
        body: formattedExpiry
          ? `${documentTitle} expires on ${formattedExpiry}.`
          : `${documentTitle} is approaching its expiry date.`,
        priority: 'normal',
      };
  }
}

async function loadExecutiveUserIds(db: SupabaseClient): Promise<string[]> {
  const ids = new Set<string>();

  const { data: staffRows, error: staffErr } = await db
    .from('staff')
    .select('id, staff_role, user_status')
    .in('staff_role', EXECUTIVE_ROLES);
  if (staffErr) throw new Error(staffErr.message);

  for (const row of staffRows ?? []) {
    if (row.user_status === 'suspended' || row.user_status === 'blocked') continue;
    ids.add(String(row.id));
  }

  const { data: guardRows, error: guardErr } = await db
    .from('guards')
    .select('id, staff_role, user_status, is_staff')
    .eq('is_staff', true)
    .in('staff_role', EXECUTIVE_ROLES);
  if (guardErr) throw new Error(guardErr.message);

  for (const row of guardRows ?? []) {
    if (row.user_status === 'suspended' || row.user_status === 'blocked') continue;
    ids.add(String(row.id));
  }

  return [...ids];
}

async function persistInboxNotification(
  db: SupabaseClient,
  userId: string,
  notificationId: string,
  title: string,
  body: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await db.from('user_notifications').upsert(
    {
      id: notificationId,
      user_id: userId,
      type: NOTIFICATION_TYPE,
      title,
      body,
      url: SETTINGS_URL,
      metadata: { source: 'company_placard_expiry_cron' },
      created_at: now,
    },
    { onConflict: 'id' }
  );
  if (error) throw new Error(error.message);
}

export interface CompanyPlacardExpiryScanResult {
  scanned: number;
  executives: number;
  notified: number;
  skipped: number;
  sent: number;
  failed: number;
}

export async function scanAndNotifyCompanyPlacardExpiry(
  db: SupabaseClient
): Promise<CompanyPlacardExpiryScanResult> {
  if (!isPushConfigured()) {
    return { scanned: 0, executives: 0, notified: 0, skipped: 0, sent: 0, failed: 0 };
  }

  await pruneStaleNotificationDedup(db);

  const executives = await loadExecutiveUserIds(db);
  if (!executives.length) {
    return { scanned: 0, executives: 0, notified: 0, skipped: 0, sent: 0, failed: 0 };
  }

  const { data: rows, error } = await db.from('company_public_documents').select('*');
  if (error) {
    if (error.code === '42P01') {
      return { scanned: 0, executives: executives.length, notified: 0, skipped: 0, sent: 0, failed: 0 };
    }
    throw new Error(error.message);
  }

  const byType = new Map<string, CompanyDocRow>();
  for (const row of (rows ?? []) as CompanyDocRow[]) {
    byType.set(row.document_type, row);
  }

  const now = new Date();
  const weekBucket = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
  let notified = 0;
  let skipped = 0;
  let sent = 0;
  let failed = 0;
  let scanned = 0;

  for (const catalogItem of PLACARD_CATALOG) {
    const row = byType.get(catalogItem.id);
    const hasContent = docHasContent(row);
    const tier = expiryAlertTier(row?.expiry_date ?? undefined, hasContent, catalogItem.required, now);
    if (!tier) continue;

    scanned += 1;
    const documentTitle = row?.title?.trim() || catalogItem.title;
    const copy = alertCopy(documentTitle, tier, row?.expiry_date);

    for (const userId of executives) {
      const dedupKey =
        tier === 'missing'
          ? companyPlacardMissingDedupKey(catalogItem.id, weekBucket, userId)
          : companyPlacardExpiryDedupKey(catalogItem.id, tier, row?.expiry_date ?? 'none', userId);

      const alreadySent = await claimNotificationDedup(db, dedupKey, NOTIFICATION_TYPE);
      if (alreadySent) {
        skipped += 1;
        continue;
      }

      const notificationId = dedupKey.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
      await persistInboxNotification(db, userId, notificationId, copy.title, copy.body);

      const result = await dispatchPushNotification(db, {
        userId,
        type: NOTIFICATION_TYPE,
        title: copy.title,
        body: copy.body,
        url: SETTINGS_URL,
        priority: copy.priority,
      });

      sent += result.sent;
      failed += result.failed;
      notified += 1;
    }
  }

  return {
    scanned,
    executives: executives.length,
    notified,
    skipped,
    sent,
    failed,
  };
}
