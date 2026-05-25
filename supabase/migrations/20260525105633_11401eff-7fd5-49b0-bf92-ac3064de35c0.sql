-- Lobby results: one row per captain per lobby
CREATE TABLE public.lobby_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id uuid NOT NULL,
  team_id uuid NOT NULL,
  submitted_by uuid NOT NULL,
  team_side text NOT NULL CHECK (team_side IN ('A','B')),
  map text,
  team_a_score integer NOT NULL DEFAULT 0,
  team_b_score integer NOT NULL DEFAULT 0,
  screenshot_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lobby_id, submitted_by)
);

ALTER TABLE public.lobby_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view lobby results"
  ON public.lobby_results FOR SELECT TO authenticated USING (true);

CREATE POLICY "Captains can submit their result"
  ON public.lobby_results FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.scrim_lobbies l
      WHERE l.id = lobby_id
        AND (l.team_a_captain_id = auth.uid() OR l.team_b_captain_id = auth.uid())
    )
  );

CREATE POLICY "Captains can update their own result"
  ON public.lobby_results FOR UPDATE TO authenticated
  USING (submitted_by = auth.uid());

CREATE TRIGGER update_lobby_results_updated_at
BEFORE UPDATE ON public.lobby_results
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.lobby_results;

-- Final confirmed proof on the lobby itself
ALTER TABLE public.scrim_lobbies
  ADD COLUMN IF NOT EXISTS final_screenshot_url text,
  ADD COLUMN IF NOT EXISTS final_team_a_score integer,
  ADD COLUMN IF NOT EXISTS final_team_b_score integer;

-- Screenshot storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('match-screenshots', 'match-screenshots', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view match screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'match-screenshots');

CREATE POLICY "Authenticated can upload match screenshots"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'match-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners can update their match screenshots"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'match-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);