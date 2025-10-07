-- Create breakout rooms table
CREATE TABLE public.breakout_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  max_participants INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create breakout room participants table
CREATE TABLE public.breakout_room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.breakout_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(room_id, user_id)
);

-- Create activity log table
CREATE TABLE public.participant_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'joined', 'left', 'chat', 'poll_vote', 'survey_response', 'breakout_join', 'breakout_leave'
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.breakout_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakout_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_activities ENABLE ROW LEVEL SECURITY;

-- Policies for breakout rooms
CREATE POLICY "Participants can view breakout rooms"
ON public.breakout_rooms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_participants
    WHERE event_id = breakout_rooms.event_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Organizers can manage breakout rooms"
ON public.breakout_rooms FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = breakout_rooms.event_id AND organizer_id = auth.uid()
  )
);

-- Policies for breakout room participants
CREATE POLICY "Users can view breakout room participants"
ON public.breakout_room_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.breakout_rooms br
    JOIN public.event_participants ep ON ep.event_id = br.event_id
    WHERE br.id = breakout_room_participants.room_id AND ep.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join breakout rooms"
ON public.breakout_room_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave breakout rooms"
ON public.breakout_room_participants FOR UPDATE
USING (auth.uid() = user_id);

-- Policies for activity logs
CREATE POLICY "Organizers can view all activities"
ON public.participant_activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = participant_activities.event_id AND organizer_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own activities"
ON public.participant_activities FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for breakout rooms
ALTER PUBLICATION supabase_realtime ADD TABLE public.breakout_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.breakout_room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participant_activities;