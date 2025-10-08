-- Create chat messages table with file attachment support
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  message text,
  file_path text,
  file_name text,
  file_size bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat messages
CREATE POLICY "Users can send chat messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND (public.is_event_participant(event_id, auth.uid()) OR EXISTS (SELECT 1 FROM events WHERE events.id = event_id AND events.organizer_id = auth.uid()))
);

CREATE POLICY "Users can view chat messages"
ON public.chat_messages
FOR SELECT
USING (
  public.is_event_participant(event_id, auth.uid())
  OR EXISTS (SELECT 1 FROM events WHERE events.id = event_id AND events.organizer_id = auth.uid())
);

-- Create post-event discussions table
CREATE TABLE public.post_event_discussions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  message text NOT NULL,
  file_path text,
  file_name text,
  file_size bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_event_discussions ENABLE ROW LEVEL SECURITY;

-- Policies for post-event discussions
CREATE POLICY "Users can create discussion messages"
ON public.post_event_discussions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND (public.is_event_participant(event_id, auth.uid()) OR EXISTS (SELECT 1 FROM events WHERE events.id = event_id AND events.organizer_id = auth.uid()))
);

CREATE POLICY "Users can view discussion messages"
ON public.post_event_discussions
FOR SELECT
USING (
  public.is_event_participant(event_id, auth.uid())
  OR EXISTS (SELECT 1 FROM events WHERE events.id = event_id AND events.organizer_id = auth.uid())
);

-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat files
CREATE POLICY "Users can upload chat files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view chat files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-files');

-- Enable realtime for chat messages and discussions
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_event_discussions;