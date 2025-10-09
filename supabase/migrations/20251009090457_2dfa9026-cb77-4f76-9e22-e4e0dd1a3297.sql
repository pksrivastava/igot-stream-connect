-- Fix infinite recursion in RLS policies by simplifying them

-- Drop existing policies that cause circular dependencies
DROP POLICY IF EXISTS "Participants can view recordings" ON public.event_recordings;
DROP POLICY IF EXISTS "Participants can view breakout rooms" ON public.breakout_rooms;
DROP POLICY IF EXISTS "Users can view breakout room participants" ON public.breakout_room_participants;
DROP POLICY IF EXISTS "Users can view chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Participants can view polls" ON public.event_polls;
DROP POLICY IF EXISTS "Participants can view surveys" ON public.event_surveys;
DROP POLICY IF EXISTS "Users can view participants of their events" ON public.event_participants;
DROP POLICY IF EXISTS "Users can view poll responses" ON public.poll_responses;
DROP POLICY IF EXISTS "Users can view survey responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Users can view discussion messages" ON public.post_event_discussions;
DROP POLICY IF EXISTS "Organizers can view all activities" ON public.participant_activities;

-- Recreate simplified policies without circular dependencies

-- event_participants: Simple check without referencing events
CREATE POLICY "Users can view participants of their events"
ON public.event_participants
FOR SELECT
USING (user_id = auth.uid() OR event_id IN (
  SELECT id FROM events WHERE organizer_id = auth.uid()
));

-- event_recordings: Direct participant check
CREATE POLICY "Participants can view recordings"
ON public.event_recordings
FOR SELECT
USING (
  event_id IN (
    SELECT event_id FROM event_participants WHERE user_id = auth.uid()
  ) OR event_id IN (
    SELECT id FROM events WHERE organizer_id = auth.uid()
  )
);

-- breakout_rooms: Direct participant check
CREATE POLICY "Participants can view breakout rooms"
ON public.breakout_rooms
FOR SELECT
USING (
  event_id IN (
    SELECT event_id FROM event_participants WHERE user_id = auth.uid()
  ) OR event_id IN (
    SELECT id FROM events WHERE organizer_id = auth.uid()
  )
);

-- breakout_room_participants
CREATE POLICY "Users can view breakout room participants"
ON public.breakout_room_participants
FOR SELECT
USING (
  room_id IN (
    SELECT br.id FROM breakout_rooms br
    WHERE br.event_id IN (
      SELECT event_id FROM event_participants WHERE user_id = auth.uid()
    ) OR br.event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
  )
);

-- chat_messages: Direct participant check
CREATE POLICY "Users can view chat messages"
ON public.chat_messages
FOR SELECT
USING (
  event_id IN (
    SELECT event_id FROM event_participants WHERE user_id = auth.uid()
  ) OR event_id IN (
    SELECT id FROM events WHERE organizer_id = auth.uid()
  )
);

-- event_polls: Direct participant check
CREATE POLICY "Participants can view polls"
ON public.event_polls
FOR SELECT
USING (
  event_id IN (
    SELECT event_id FROM event_participants WHERE user_id = auth.uid()
  ) OR event_id IN (
    SELECT id FROM events WHERE organizer_id = auth.uid()
  )
);

-- event_surveys: Direct participant check
CREATE POLICY "Participants can view surveys"
ON public.event_surveys
FOR SELECT
USING (
  event_id IN (
    SELECT event_id FROM event_participants WHERE user_id = auth.uid()
  ) OR event_id IN (
    SELECT id FROM events WHERE organizer_id = auth.uid()
  )
);

-- poll_responses
CREATE POLICY "Users can view poll responses"
ON public.poll_responses
FOR SELECT
USING (
  poll_id IN (
    SELECT ep.id FROM event_polls ep
    WHERE ep.event_id IN (
      SELECT event_id FROM event_participants WHERE user_id = auth.uid()
    ) OR ep.event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
  )
);

-- survey_responses
CREATE POLICY "Users can view survey responses"
ON public.survey_responses
FOR SELECT
USING (
  survey_id IN (
    SELECT es.id FROM event_surveys es
    WHERE es.event_id IN (
      SELECT event_id FROM event_participants WHERE user_id = auth.uid()
    ) OR es.event_id IN (
      SELECT id FROM events WHERE organizer_id = auth.uid()
    )
  )
);

-- post_event_discussions: Direct participant check
CREATE POLICY "Users can view discussion messages"
ON public.post_event_discussions
FOR SELECT
USING (
  event_id IN (
    SELECT event_id FROM event_participants WHERE user_id = auth.uid()
  ) OR event_id IN (
    SELECT id FROM events WHERE organizer_id = auth.uid()
  )
);

-- participant_activities: Direct organizer check
CREATE POLICY "Organizers can view all activities"
ON public.participant_activities
FOR SELECT
USING (
  event_id IN (
    SELECT id FROM events WHERE organizer_id = auth.uid()
  )
);