-- Add suggestion columns and voting enhancements to activities table
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS is_suggestion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suggested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS parent_activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vote_count integer NOT NULL DEFAULT 0;

-- Index for querying suggestions by parent activity
CREATE INDEX IF NOT EXISTS activities_parent_activity_id_idx ON activities(parent_activity_id);

-- Index for querying suggestions per trip
CREATE INDEX IF NOT EXISTS activities_trip_suggestion_idx ON activities(trip_id, is_suggestion);
