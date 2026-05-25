-- =========================================================
-- 1) Tighten match_results policies (must be scrim participant)
-- =========================================================
DROP POLICY IF EXISTS "Captains can insert match results" ON public.match_results;
CREATE POLICY "Captains can insert match results"
ON public.match_results FOR INSERT TO authenticated
WITH CHECK (
  reported_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.scrims s
    JOIN public.teams t ON t.id IN (s.home_team_id, s.away_team_id)
    WHERE s.id = match_results.scrim_id
      AND t.captain_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Captains can update match results" ON public.match_results;
CREATE POLICY "Captains can update match results"
ON public.match_results FOR UPDATE TO authenticated
USING (
  reported_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.scrims s
    JOIN public.teams t ON t.id IN (s.home_team_id, s.away_team_id)
    WHERE s.id = match_results.scrim_id
      AND t.captain_id = auth.uid()
  )
);

-- =========================================================
-- 2) Lock down scrim_lobbies UPDATE to the two lobby captains
-- =========================================================
DROP POLICY IF EXISTS "Either captain can update their lobby" ON public.scrim_lobbies;
CREATE POLICY "Lobby captains can update their lobby"
ON public.scrim_lobbies FOR UPDATE TO authenticated
USING (team_a_captain_id = auth.uid() OR team_b_captain_id = auth.uid())
WITH CHECK (team_a_captain_id = auth.uid() OR team_b_captain_id = auth.uid());

-- =========================================================
-- 3) RPC: join_scrim_lobby - safe opponent join
-- =========================================================
CREATE OR REPLACE FUNCTION public.join_scrim_lobby(_lobby_id uuid)
RETURNS public.scrim_lobbies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _team_id uuid;
  _team_game text;
  _lobby public.scrim_lobbies;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT id, game INTO _team_id, _team_game
  FROM public.teams WHERE captain_id = auth.uid() LIMIT 1;
  IF _team_id IS NULL THEN
    RAISE EXCEPTION 'Only team captains can join a lobby';
  END IF;

  UPDATE public.scrim_lobbies
  SET team_b_id = _team_id,
      team_b_captain_id = auth.uid(),
      updated_at = now()
  WHERE id = _lobby_id
    AND team_b_id IS NULL
    AND team_a_id <> _team_id
    AND game = _team_game
  RETURNING * INTO _lobby;

  IF _lobby.id IS NULL THEN
    RAISE EXCEPTION 'Lobby unavailable, already joined, or game mismatch';
  END IF;

  RETURN _lobby;
END;
$$;

REVOKE ALL ON FUNCTION public.join_scrim_lobby(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.join_scrim_lobby(uuid) TO authenticated;

-- =========================================================
-- 4) RPC: start_veto and submit_veto_action
-- =========================================================
CREATE OR REPLACE FUNCTION public.start_veto(_lobby_id uuid, _pool jsonb)
RETURNS public.scrim_lobbies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lobby public.scrim_lobbies;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _lobby FROM public.scrim_lobbies WHERE id = _lobby_id FOR UPDATE;
  IF _lobby.id IS NULL THEN RAISE EXCEPTION 'Lobby not found'; END IF;

  IF auth.uid() <> _lobby.team_a_captain_id AND auth.uid() <> _lobby.team_b_captain_id THEN
    RAISE EXCEPTION 'Not a lobby captain';
  END IF;
  IF _lobby.team_b_captain_id IS NULL THEN
    RAISE EXCEPTION 'Opponent not joined yet';
  END IF;
  IF jsonb_array_length(COALESCE(_lobby.veto_state->'steps','[]'::jsonb)) > 0
     OR jsonb_array_length(COALESCE(_lobby.veto_state->'remaining','[]'::jsonb)) > 0 THEN
    RETURN _lobby;
  END IF;

  UPDATE public.scrim_lobbies
  SET status = 'veto',
      veto_state = jsonb_build_object('steps','[]'::jsonb,'remaining',_pool,'picked','[]'::jsonb),
      current_turn_captain_id = _lobby.team_a_captain_id,
      turn_deadline = now() + interval '30 seconds',
      updated_at = now()
  WHERE id = _lobby_id
  RETURNING * INTO _lobby;

  RETURN _lobby;
END;
$$;

REVOKE ALL ON FUNCTION public.start_veto(uuid, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.start_veto(uuid, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_veto_action(_lobby_id uuid, _map text)
RETURNS public.scrim_lobbies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _lobby public.scrim_lobbies;
  _state jsonb;
  _steps jsonb;
  _remaining jsonb;
  _picked jsonb;
  _seq jsonb := '[{"action":"ban","team":"A"},{"action":"ban","team":"B"},{"action":"pick","team":"A"}]'::jsonb;
  _idx int;
  _step jsonb;
  _my_side text;
  _next_team text;
  _next_captain uuid;
  _done boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _lobby FROM public.scrim_lobbies WHERE id = _lobby_id FOR UPDATE;
  IF _lobby.id IS NULL THEN RAISE EXCEPTION 'Lobby not found'; END IF;

  IF _lobby.current_turn_captain_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not your turn';
  END IF;

  _state := _lobby.veto_state;
  _steps := COALESCE(_state->'steps', '[]'::jsonb);
  _remaining := COALESCE(_state->'remaining', '[]'::jsonb);
  _picked := COALESCE(_state->'picked', '[]'::jsonb);
  _idx := jsonb_array_length(_steps);

  IF _idx >= jsonb_array_length(_seq) THEN
    RAISE EXCEPTION 'Veto already complete';
  END IF;
  IF NOT (_remaining @> to_jsonb(_map)) THEN
    RAISE EXCEPTION 'Map not available';
  END IF;

  _step := _seq->_idx;
  _my_side := CASE WHEN auth.uid() = _lobby.team_a_captain_id THEN 'A'
                   WHEN auth.uid() = _lobby.team_b_captain_id THEN 'B' END;
  IF _my_side IS NULL OR _step->>'team' <> _my_side THEN
    RAISE EXCEPTION 'Not your turn';
  END IF;

  SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb) INTO _remaining
    FROM jsonb_array_elements(_remaining) elem
    WHERE elem <> to_jsonb(_map);

  IF (_step->>'action') = 'pick' THEN
    _picked := _picked || to_jsonb(_map);
  END IF;

  _steps := _steps || jsonb_build_array(jsonb_build_object(
    'action', _step->>'action',
    'team', _step->>'team',
    'map', _map,
    'at', to_jsonb(now())
  ));

  _done := jsonb_array_length(_steps) >= jsonb_array_length(_seq);
  _next_team := CASE WHEN _done THEN NULL ELSE (_seq->jsonb_array_length(_steps))->>'team' END;
  _next_captain := CASE _next_team
    WHEN 'A' THEN _lobby.team_a_captain_id
    WHEN 'B' THEN _lobby.team_b_captain_id
    ELSE NULL END;

  UPDATE public.scrim_lobbies
  SET veto_state = jsonb_build_object('steps', _steps, 'remaining', _remaining, 'picked', _picked),
      current_turn_captain_id = _next_captain,
      turn_deadline = CASE WHEN _done THEN NULL ELSE now() + interval '30 seconds' END,
      status = CASE WHEN _done THEN 'active' ELSE 'veto' END,
      updated_at = now()
  WHERE id = _lobby_id
  RETURNING * INTO _lobby;

  RETURN _lobby;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_veto_action(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.submit_veto_action(uuid, text) TO authenticated;

-- =========================================================
-- 5) Hide team sensitive columns (join_code, discord_webhook_url)
-- =========================================================
REVOKE SELECT (join_code, discord_webhook_url) ON public.teams FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.get_my_team_secrets(_team_id uuid)
RETURNS TABLE(join_code text, discord_webhook_url text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_team_member(_team_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a team member';
  END IF;
  RETURN QUERY
    SELECT t.join_code, t.discord_webhook_url
    FROM public.teams t WHERE t.id = _team_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_team_secrets(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_my_team_secrets(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.find_team_by_join_code(_code text)
RETURNS TABLE(id uuid, name text, game text, rank text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, game, rank
  FROM public.teams
  WHERE upper(join_code) = upper(_code)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_team_by_join_code(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.find_team_by_join_code(text) TO authenticated;