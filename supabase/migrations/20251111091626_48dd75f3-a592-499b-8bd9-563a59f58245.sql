-- Create security definer function to check if user is event organizer
CREATE OR REPLACE FUNCTION public.is_event_organizer(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.events
    WHERE id = _event_id
      AND organizer_id = _user_id
  )
$$;

-- Drop the problematic policy on event_participants
DROP POLICY IF EXISTS "Users can view participants of their events" ON public.event_participants;

-- Recreate it using the security definer function
CREATE POLICY "Users can view participants of their events" 
ON public.event_participants 
FOR SELECT 
USING (
  user_id = auth.uid() OR public.is_event_organizer(event_id, auth.uid())
);