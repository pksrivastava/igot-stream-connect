-- Fix infinite recursion in RLS policies by creating a security definer function
CREATE OR REPLACE FUNCTION public.is_event_participant(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_participants
    WHERE event_id = _event_id
      AND user_id = _user_id
  )
$$;

-- Drop and recreate event_participants policies without recursion
DROP POLICY IF EXISTS "Users can view participants of their events" ON event_participants;
CREATE POLICY "Users can view participants of their events"
ON event_participants
FOR SELECT
USING (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM events WHERE events.id = event_participants.event_id AND events.organizer_id = auth.uid()
  )
);

-- Update other table policies to use the security definer function
DROP POLICY IF EXISTS "Participants can view polls" ON event_polls;
CREATE POLICY "Participants can view polls"
ON event_polls
FOR SELECT
USING (
  public.is_event_participant(event_id, auth.uid())
  OR EXISTS (SELECT 1 FROM events WHERE events.id = event_polls.event_id AND events.organizer_id = auth.uid())
);

DROP POLICY IF EXISTS "Participants can view surveys" ON event_surveys;
CREATE POLICY "Participants can view surveys"
ON event_surveys
FOR SELECT
USING (
  public.is_event_participant(event_id, auth.uid())
  OR EXISTS (SELECT 1 FROM events WHERE events.id = event_surveys.event_id AND events.organizer_id = auth.uid())
);

DROP POLICY IF EXISTS "Participants can view breakout rooms" ON breakout_rooms;
CREATE POLICY "Participants can view breakout rooms"
ON breakout_rooms
FOR SELECT
USING (
  public.is_event_participant(event_id, auth.uid())
  OR EXISTS (SELECT 1 FROM events WHERE events.id = breakout_rooms.event_id AND events.organizer_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view breakout room participants" ON breakout_room_participants;
CREATE POLICY "Users can view breakout room participants"
ON breakout_room_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM breakout_rooms br
    WHERE br.id = breakout_room_participants.room_id 
    AND (public.is_event_participant(br.event_id, auth.uid()) OR EXISTS (SELECT 1 FROM events WHERE events.id = br.event_id AND events.organizer_id = auth.uid()))
  )
);

DROP POLICY IF EXISTS "Participants can view recordings" ON event_recordings;
CREATE POLICY "Participants can view recordings"
ON event_recordings
FOR SELECT
USING (
  public.is_event_participant(event_id, auth.uid())
  OR EXISTS (SELECT 1 FROM events WHERE events.id = event_recordings.event_id AND events.organizer_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view poll responses" ON poll_responses;
CREATE POLICY "Users can view poll responses"
ON poll_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_polls ep
    WHERE ep.id = poll_responses.poll_id 
    AND (public.is_event_participant(ep.event_id, auth.uid()) OR EXISTS (SELECT 1 FROM events WHERE events.id = ep.event_id AND events.organizer_id = auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can view survey responses" ON survey_responses;
CREATE POLICY "Users can view survey responses"
ON survey_responses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_surveys es
    WHERE es.id = survey_responses.survey_id 
    AND (public.is_event_participant(es.event_id, auth.uid()) OR EXISTS (SELECT 1 FROM events WHERE events.id = es.event_id AND events.organizer_id = auth.uid()))
  )
);

-- Add scheduled display times to polls and surveys
ALTER TABLE event_polls ADD COLUMN IF NOT EXISTS scheduled_display_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE event_surveys ADD COLUMN IF NOT EXISTS scheduled_display_at TIMESTAMP WITH TIME ZONE;

-- Add column to track if poll/survey was created in advance or on-the-go
ALTER TABLE event_polls ADD COLUMN IF NOT EXISTS created_in_advance BOOLEAN DEFAULT false;
ALTER TABLE event_surveys ADD COLUMN IF NOT EXISTS created_in_advance BOOLEAN DEFAULT false;