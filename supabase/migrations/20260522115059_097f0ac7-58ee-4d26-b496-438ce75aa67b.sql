
-- 6-char alphanumeric code generator (no ambiguous chars like 0/O/1/I)
CREATE OR REPLACE FUNCTION public.generate_short_code()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Migrate existing teams to 6-char codes
UPDATE public.teams SET join_code = public.generate_short_code();

-- Change default for new teams
ALTER TABLE public.teams ALTER COLUMN join_code SET DEFAULT public.generate_short_code();

-- Add discord webhook column for Phase 3
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS discord_webhook_url text;

-- New scrim_lobbies table
CREATE TABLE public.scrim_lobbies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_a_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  team_a_captain_id uuid NOT NULL,
  team_b_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  team_b_captain_id uuid,
  game text NOT NULL,
  status text NOT NULL DEFAULT 'waiting',
  veto_state jsonb NOT NULL DEFAULT '{"steps":[],"remaining":[],"picked":[]}'::jsonb,
  current_turn_captain_id uuid,
  turn_deadline timestamptz,
  discord_pinged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scrim_lobbies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view lobbies"
  ON public.scrim_lobbies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Captains can create lobbies for their own team"
  ON public.scrim_lobbies FOR INSERT TO authenticated
  WITH CHECK (
    team_a_captain_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_a_id AND t.captain_id = auth.uid())
  );

CREATE POLICY "Either captain can update their lobby"
  ON public.scrim_lobbies FOR UPDATE TO authenticated
  USING (
    team_a_captain_id = auth.uid()
    OR team_b_captain_id = auth.uid()
    OR (team_b_id IS NULL AND EXISTS (SELECT 1 FROM public.teams t WHERE t.captain_id = auth.uid()))
  );

CREATE POLICY "Creator can delete their lobby"
  ON public.scrim_lobbies FOR DELETE TO authenticated
  USING (team_a_captain_id = auth.uid());

CREATE TRIGGER update_scrim_lobbies_updated_at
  BEFORE UPDATE ON public.scrim_lobbies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER TABLE public.scrim_lobbies REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scrim_lobbies;
