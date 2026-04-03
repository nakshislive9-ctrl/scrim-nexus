
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scrim_request_id UUID NOT NULL REFERENCES public.scrim_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Captains can view messages for their scrim requests"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.scrim_requests sr
    WHERE sr.id = messages.scrim_request_id
    AND (sr.challenger_captain_id = auth.uid() OR sr.challenged_captain_id = auth.uid())
  )
);

CREATE POLICY "Captains can send messages for their scrim requests"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.scrim_requests sr
    WHERE sr.id = messages.scrim_request_id
    AND (sr.challenger_captain_id = auth.uid() OR sr.challenged_captain_id = auth.uid())
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
