
CREATE TABLE public.user_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game text NOT NULL,
  rank text,
  role text,
  region text,
  ign text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, game)
);

ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own games" ON public.user_games
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own games" ON public.user_games
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own games" ON public.user_games
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own games" ON public.user_games
  FOR DELETE TO authenticated USING (user_id = auth.uid());
