-- Add group chat columns to comments table
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS activity_id uuid REFERENCES activities(id) ON DELETE SET NULL;

-- Index for chat queries
CREATE INDEX IF NOT EXISTS comments_trip_id_created_at_idx ON comments(trip_id, created_at);

-- Enable realtime on comments table
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
