
-- helper: is a user a member of a team (captain or roster)
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams WHERE id = _team_id AND captain_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.team_members WHERE team_id = _team_id AND user_id = _user_id
  );
$$;

CREATE TABLE public.team_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view team messages"
ON public.team_messages FOR SELECT TO authenticated
USING (public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team members can post team messages"
ON public.team_messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND public.is_team_member(team_id, auth.uid()));

CREATE INDEX team_messages_team_id_created_at_idx ON public.team_messages (team_id, created_at);

ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
ALTER TABLE public.team_messages REPLICA IDENTITY FULL;

-- Trigger: notify other team members on new message
CREATE OR REPLACE FUNCTION public.notify_team_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
  team_name text;
BEGIN
  SELECT COALESCE(p.display_name, 'A teammate') INTO sender_name
  FROM public.profiles p WHERE p.user_id = NEW.sender_id LIMIT 1;

  SELECT t.name INTO team_name FROM public.teams t WHERE t.id = NEW.team_id;

  -- captain (if not sender)
  INSERT INTO public.notifications (user_id, type, title, message, link, reference_id)
  SELECT t.captain_id, 'team_chat',
         COALESCE(sender_name, 'Teammate') || ' in ' || COALESCE(team_name, 'your team'),
         LEFT(NEW.content, 140), '/team-profile', NEW.id
  FROM public.teams t
  WHERE t.id = NEW.team_id AND t.captain_id <> NEW.sender_id;

  -- roster members (with user_id, not sender, not captain duplicates)
  INSERT INTO public.notifications (user_id, type, title, message, link, reference_id)
  SELECT tm.user_id, 'team_chat',
         COALESCE(sender_name, 'Teammate') || ' in ' || COALESCE(team_name, 'your team'),
         LEFT(NEW.content, 140), '/team-profile', NEW.id
  FROM public.team_members tm
  JOIN public.teams t ON t.id = tm.team_id
  WHERE tm.team_id = NEW.team_id
    AND tm.user_id IS NOT NULL
    AND tm.user_id <> NEW.sender_id
    AND tm.user_id <> t.captain_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER team_message_notify
AFTER INSERT ON public.team_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_team_message();
