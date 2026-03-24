
CREATE TABLE public.player_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  listing_type text NOT NULL CHECK (listing_type IN ('player_looking_for_team', 'team_looking_for_player')),
  game text NOT NULL,
  rank text NOT NULL,
  role text,
  region text,
  level text,
  ign text NOT NULL,
  description text,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.player_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view listings"
  ON public.player_listings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can manage own listings"
  ON public.player_listings FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_player_listings_updated_at
  BEFORE UPDATE ON public.player_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
