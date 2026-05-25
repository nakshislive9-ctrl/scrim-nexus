
CREATE TABLE public.lobby_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lobby_messages_lobby_created ON public.lobby_messages(lobby_id, created_at);

ALTER TABLE public.lobby_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_lobby_participant(_lobby_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.scrim_lobbies l
    WHERE l.id = _lobby_id
      AND (
        public.is_team_member(l.team_a_id, _user_id)
        OR (l.team_b_id IS NOT NULL AND public.is_team_member(l.team_b_id, _user_id))
      )
  );
$$;

CREATE POLICY "Lobby participants can view messages"
ON public.lobby_messages FOR SELECT TO authenticated
USING (public.is_lobby_participant(lobby_id, auth.uid()));

CREATE POLICY "Lobby participants can post messages"
ON public.lobby_messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND public.is_lobby_participant(lobby_id, auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.lobby_messages;
ALTER TABLE public.lobby_messages REPLICA IDENTITY FULL;
