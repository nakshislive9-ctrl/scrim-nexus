
-- Teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  captain_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  game text NOT NULL,
  rank text NOT NULL,
  region text,
  join_code text UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  map_pool jsonb DEFAULT '{}',
  reliability_score integer DEFAULT 100 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Captains can manage own team" ON public.teams
  FOR ALL TO authenticated
  USING (captain_id = auth.uid())
  WITH CHECK (captain_id = auth.uid());

CREATE POLICY "Anyone authenticated can view teams" ON public.teams
  FOR SELECT TO authenticated
  USING (true);

-- Team members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ign text NOT NULL,
  role text,
  member_rank text,
  level text,
  is_captain boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team captains can manage members" ON public.team_members
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND captain_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND captain_id = auth.uid())
  );

CREATE POLICY "Authenticated users can view team members" ON public.team_members
  FOR SELECT TO authenticated
  USING (true);

-- Trigger for updated_at on teams
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on team_members
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
