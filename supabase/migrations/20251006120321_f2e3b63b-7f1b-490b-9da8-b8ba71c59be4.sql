-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL,
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  stream_url TEXT,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create event participants table for access control
CREATE TABLE public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('organizer', 'moderator', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Create recordings table
CREATE TABLE public.event_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  duration INTEGER,
  format TEXT DEFAULT 'mp4',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Users can view events they're invited to"
  ON public.events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_participants
      WHERE event_participants.event_id = events.id
      AND event_participants.user_id = auth.uid()
    ) OR organizer_id = auth.uid()
  );

CREATE POLICY "Organizers can create events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their events"
  ON public.events FOR UPDATE
  USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their events"
  ON public.events FOR DELETE
  USING (auth.uid() = organizer_id);

-- RLS Policies for participants
CREATE POLICY "Users can view participants of their events"
  ON public.event_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_participants ep
      WHERE ep.event_id = event_participants.event_id
      AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can add participants"
  ON public.event_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_participants.event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can remove participants"
  ON public.event_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_participants.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- RLS Policies for recordings
CREATE POLICY "Participants can view recordings"
  ON public.event_recordings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_participants
      WHERE event_participants.event_id = event_recordings.event_id
      AND event_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can create recordings"
  ON public.event_recordings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_recordings.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Create storage bucket for recordings
INSERT INTO storage.buckets (id, name, public) VALUES ('event-recordings', 'event-recordings', false);

-- Storage policies
CREATE POLICY "Authenticated users can upload recordings"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-recordings' AND auth.uid() IS NOT NULL);

CREATE POLICY "Participants can download recordings"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'event-recordings' AND
    EXISTS (
      SELECT 1 FROM public.event_recordings er
      JOIN public.event_participants ep ON er.event_id = ep.event_id
      WHERE storage.filename(name) = er.file_path
      AND ep.user_id = auth.uid()
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();