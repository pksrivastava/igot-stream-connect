-- Create polls and surveys tables
CREATE TABLE public.event_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of {id: string, text: string, votes: number}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.poll_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.event_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

CREATE TABLE public.event_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL, -- Array of {id: string, question: string, type: 'text' | 'rating' | 'multiple'}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.event_surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  responses JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(survey_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Policies for polls
CREATE POLICY "Participants can view polls"
ON public.event_polls FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_participants
    WHERE event_id = event_polls.event_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Organizers can manage polls"
ON public.event_polls FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = event_polls.event_id AND organizer_id = auth.uid()
  )
);

-- Policies for poll responses
CREATE POLICY "Users can view poll responses"
ON public.poll_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_polls ep
    JOIN public.event_participants part ON part.event_id = ep.event_id
    WHERE ep.id = poll_responses.poll_id AND part.user_id = auth.uid()
  )
);

CREATE POLICY "Users can submit poll responses"
ON public.poll_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policies for surveys
CREATE POLICY "Participants can view surveys"
ON public.event_surveys FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_participants
    WHERE event_id = event_surveys.event_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Organizers can manage surveys"
ON public.event_surveys FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = event_surveys.event_id AND organizer_id = auth.uid()
  )
);

-- Policies for survey responses
CREATE POLICY "Users can view survey responses"
ON public.survey_responses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_surveys es
    JOIN public.event_participants part ON part.event_id = es.event_id
    WHERE es.id = survey_responses.survey_id AND part.user_id = auth.uid()
  )
);

CREATE POLICY "Users can submit survey responses"
ON public.survey_responses FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for polls
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_responses;