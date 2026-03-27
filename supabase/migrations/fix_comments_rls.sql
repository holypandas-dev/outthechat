-- Enable RLS on comments table
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start clean
DROP POLICY IF EXISTS "trip_members_can_view_comments" ON comments;
DROP POLICY IF EXISTS "trip_members_can_insert_comments" ON comments;
DROP POLICY IF EXISTS "users_can_view_trip_comments" ON comments;
DROP POLICY IF EXISTS "users_can_insert_trip_comments" ON comments;
DROP POLICY IF EXISTS "users_can_send_messages" ON comments;
DROP POLICY IF EXISTS "users_can_read_messages" ON comments;

-- Any trip member (including solo organizer) can read all comments in their trips
CREATE POLICY "trip_members_can_view_comments"
  ON comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = comments.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

-- Any trip member can insert their own comments (user_id must match the authenticated user)
CREATE POLICY "trip_members_can_insert_comments"
  ON comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = comments.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );
