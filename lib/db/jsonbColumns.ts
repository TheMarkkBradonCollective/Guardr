/**
 * jsonb columns per table (from production information_schema, Nov 9 2026).
 * JS arrays bound to these must be sent as JSON text; the driver would otherwise
 * encode them as Postgres arrays ('{}' for []), which jsonb rejects or misreads.
 */
export const JSONB_COLUMNS: Record<string, ReadonlySet<string>> = {
  audit_log: new Set(["details"]),
  billing_adjustments: new Set(["after_snapshot", "before_snapshot"]),
  billing_admin_audit_log: new Set(["new_values", "old_values"]),
  billing_repeat_booking_reviews: new Set(["evidence"]),
  billing_snapshots: new Set(["snapshot"]),
  certifications: new Set(["pending_update", "revision_history"]),
  client_invoices: new Set(["line_items"]),
  clients: new Set(["authorized_contacts", "credentials", "favorite_guard_ids", "security_company_roster"]),
  financial_ledger_entries: new Set(["metadata"]),
  guard_insurance_policies: new Set(["revision_history"]),
  guard_payout_invoices: new Set(["job_ids", "lines"]),
  guards: new Set(["application_submission_snapshot", "credential_grace_missing", "id_revision_history", "inventory_equipment", "inventory_uniforms", "job_type_onboarding", "job_type_preferences", "languages", "listed_equipment_gear", "listed_weapon_gear", "service_areas", "skills", "specialties"]),
  one_role_cases: new Set(["accounts"]),
  platform_cities: new Set(["credential_resource_links"]),
  platform_fee_acceptances: new Set(["disclosed_fee_snapshot"]),
  platform_fee_configs: new Set(["fee_config"]),
  platform_settings: new Set(["client_credential_rules", "fee_config", "staff_compensation_config", "staff_role_permissions"]),
  security_requests: new Set(["activity_log", "agreement_fee_config", "billing_snapshot", "briefing_acknowledgments", "cash_deposit_stripe_event_ids", "check_in_audit", "check_out_audit", "client_violation_reports", "guard_live_location", "guard_suggestions", "mid_shift_audits", "opening_price_offer", "operational_details", "origin_metadata", "post_orders_acknowledgments", "price_negotiations", "replacement_request", "reports", "self_audit", "service_agreement", "shift_audit_violations", "shift_breaks", "spot_checks", "tier_pay_rates"]),
  staff: new Set(["assigned_manager_ids", "id_revision_history", "managed_cities", "specialties"]),
  stripe_webhook_events: new Set(["payload"]),
  user_notifications: new Set(["metadata"]),
};

export function encodeColumnValue(table: string, column: string, value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (!JSONB_COLUMNS[table]?.has(column)) return value;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}
