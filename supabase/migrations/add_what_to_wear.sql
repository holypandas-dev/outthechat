-- Add what_to_wear column to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS what_to_wear jsonb;
