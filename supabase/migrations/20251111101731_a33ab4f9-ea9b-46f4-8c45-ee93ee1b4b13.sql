-- Add storage policies for event-recordings bucket
CREATE POLICY "Organizers can upload recordings"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'event-recordings' AND
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = (storage.foldername(name))[1]::uuid
    AND organizer_id = auth.uid()
  )
);

CREATE POLICY "Participants can view recordings"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'event-recordings' AND
  (
    EXISTS (
      SELECT 1 FROM public.event_participants
      WHERE event_id = (storage.foldername(name))[1]::uuid
      AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE id = (storage.foldername(name))[1]::uuid
      AND organizer_id = auth.uid()
    )
  )
);

CREATE POLICY "Organizers can download recordings"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'event-recordings' AND
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = (storage.foldername(name))[1]::uuid
    AND organizer_id = auth.uid()
  )
);