-- Migration: 20260715120000_client_signup_enrichment.sql
-- Description: Add intake fields to the clients table so staff have enough
--              context to make informed approval decisions on pending sign-ups.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS business_type          TEXT,
  ADD COLUMN IF NOT EXISTS industry               TEXT,
  ADD COLUMN IF NOT EXISTS business_license       TEXT,
  ADD COLUMN IF NOT EXISTS website                TEXT,
  ADD COLUMN IF NOT EXISTS service_description    TEXT,
  ADD COLUMN IF NOT EXISTS service_types          TEXT[],
  ADD COLUMN IF NOT EXISTS estimated_guards_needed INTEGER,
  ADD COLUMN IF NOT EXISTS armed_preference       TEXT,
  ADD COLUMN IF NOT EXISTS service_frequency      TEXT,
  ADD COLUMN IF NOT EXISTS estimated_start_date   TEXT,
  ADD COLUMN IF NOT EXISTS budget_range           TEXT,
  ADD COLUMN IF NOT EXISTS service_city           TEXT,
  ADD COLUMN IF NOT EXISTS service_state          TEXT,
  ADD COLUMN IF NOT EXISTS property_type          TEXT,
  ADD COLUMN IF NOT EXISTS referred_by            TEXT,
  ADD COLUMN IF NOT EXISTS referred_by_id         TEXT,
  ADD COLUMN IF NOT EXISTS how_heard_about_us     TEXT,
  ADD COLUMN IF NOT EXISTS has_prior_security_service BOOLEAN,
  ADD COLUMN IF NOT EXISTS prior_security_provider TEXT,
  ADD COLUMN IF NOT EXISTS special_requirements   TEXT;
