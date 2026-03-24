
-- Scrim requests: a challenge from one team to another
CREATE TABLE public.scrim_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  challenged_team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  challenger_captain_id uuid NOT NULL,
  challenged_captain_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  proposed_time timestamptz,
  proposed_by uuid,
  time_status text NOT NULL DEFAULT 'no_proposal' CHECK (time_status IN ('no_proposal', 'proposed', 'confirmed')),
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scrim_requests ENABLE ROW LEVEL SECURITY;

-- Both teams' captains can view their requests
CREATE POLICY "Captains can view their scrim requests"
ON public.scrim_requests FOR SELECT TO authenticated
USING (challenger_captain_id = auth.uid() OR challenged_captain_id = auth.uid());

-- Authenticated users can create challenges
CREATE POLICY "Authenticated users can create challenges"
ON public.scrim_requests FOR INSERT TO authenticated
WITH CHECK (challenger_captain_id = auth.uid());

-- Captains involved can update requests
CREATE POLICY "Captains can update their scrim requests"
ON public.scrim_requests FOR UPDATE TO authenticated
USING (challenger_captain_id = auth.uid() OR challenged_captain_id = auth.uid());

-- Scheduled scrims table
CREATE TABLE public.scrims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.scrim_requests(id) ON DELETE CASCADE,
  home_team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  away_team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  scheduled_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'forfeited', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scrims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view scrims"
ON public.scrims FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Captains can manage their scrims"
ON public.scrims FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.teams WHERE id = scrims.home_team_id AND captain_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.teams WHERE id = scrims.away_team_id AND captain_id = auth.uid())
);

-- Enable realtime for scrim_requests so captains get live notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.scrim_requests;
