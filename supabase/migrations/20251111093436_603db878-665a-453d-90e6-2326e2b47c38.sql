-- Add participant role management for better access control
CREATE TYPE public.participant_role AS ENUM ('organizer', 'moderator', 'presenter', 'viewer');

-- Update event_participants table to use the new role enum
ALTER TABLE public.event_participants 
  DROP COLUMN IF EXISTS role;

ALTER TABLE public.event_participants 
  ADD COLUMN role public.participant_role DEFAULT 'viewer';

-- Allow public viewing of live events (viewers don't need accounts)
CREATE POLICY "Anyone can view live events" 
ON public.events 
FOR SELECT 
USING (status = 'live');

-- Add scheduled timestamp fields for polls
ALTER TABLE public.event_polls 
  ADD COLUMN IF NOT EXISTS display_timestamp INTEGER;

-- Add scheduled timestamp fields for surveys  
ALTER TABLE public.event_surveys
  ADD COLUMN IF NOT EXISTS display_timestamp INTEGER;

-- Add network quality tracking
CREATE TABLE IF NOT EXISTS public.stream_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) NOT NULL,
  user_id UUID,
  bandwidth_mbps DECIMAL,
  packet_loss_percent DECIMAL,
  latency_ms INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stream_quality_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view quality metrics"
ON public.stream_quality_metrics
FOR SELECT
USING (is_event_organizer(event_id, auth.uid()));

CREATE POLICY "Users can insert their own metrics"
ON public.stream_quality_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);