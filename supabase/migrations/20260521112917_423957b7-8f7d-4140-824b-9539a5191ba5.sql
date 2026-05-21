
-- 1) Back-fill captain team_members.user_id from teams.captain_id
UPDATE public.team_members tm
SET user_id = t.captain_id
FROM public.teams t
WHERE tm.team_id = t.id
  AND tm.is_captain = true
  AND tm.user_id IS NULL;

-- 2) Delete any remaining roster rows without a real user account
DELETE FROM public.team_members WHERE user_id IS NULL;

-- 3) Enforce real users only, forever
ALTER TABLE public.team_members ALTER COLUMN user_id SET NOT NULL;

-- 4) Prevent duplicate roster entries for the same user on the same team
CREATE UNIQUE INDEX IF NOT EXISTS team_members_team_user_unique
  ON public.team_members (team_id, user_id);
