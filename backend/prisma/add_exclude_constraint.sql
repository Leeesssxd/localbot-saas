-- migrations/add_appointment_exclude_constraint.sql
--
-- PostgreSQL EXCLUDE constraint: prevents two CONFIRMED/PENDING appointments
-- from overlapping for the same tenant.
--
-- Run this ONCE after `prisma migrate deploy` creates the appointments table.
-- Supabase: paste in the SQL editor. Railway: connect with psql and run.
--
-- Requires the btree_gist extension (available on all PostgreSQL >= 9.3).

-- 1. Enable btree_gist extension
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Add the EXCLUDE constraint
ALTER TABLE appointments
ADD CONSTRAINT appointments_no_overlap
EXCLUDE USING gist (
  tenant_id WITH =,
  tstzrange(scheduled_at, ends_at, '[)') WITH &&
)
WHERE (status IN ('CONFIRMED', 'PENDING'));

-- The WHERE clause means:
--   - CANCELLED and NO_SHOW appointments do NOT participate in the constraint.
--   - Only CONFIRMED and PENDING appointments are checked for overlap.
-- This allows rebooking a slot after a cancellation.
