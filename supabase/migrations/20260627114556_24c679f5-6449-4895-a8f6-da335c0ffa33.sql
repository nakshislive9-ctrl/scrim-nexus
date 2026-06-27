ALTER TABLE public.scrim_lobbies ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

-- Gate lobby chat: only allow sending/reading within 10 min before scheduled start
DROP POLICY IF EXISTS "Lobby participants can read messages" ON public.lobby_messages;
DROP POLICY IF EXISTS "Lobby participants can send messages" ON public.lobby_messages;

CREATE POLICY "Lobby participants can read messages"
ON public.lobby_messages FOR SELECT
TO authenticated
USING (
  public.is_lobby_participant(lobby_id, auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.scrim_lobbies l
    WHERE l.id = lobby_id
      AND (l.scheduled_at IS NULL OR now() >= l.scheduled_at - interval '10 minutes')
  )
);

CREATE POLICY "Lobby participants can send messages"
ON public.lobby_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_lobby_participant(lobby_id, auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.scrim_lobbies l
    WHERE l.id = lobby_id
      AND (l.scheduled_at IS NULL OR now() >= l.scheduled_at - interval '10 minutes')
  )
);