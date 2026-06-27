
-- 1) Restrict scrim_lobbies UPDATE: forbid client-side changes to status/final_* columns
DROP POLICY IF EXISTS "Lobby captains can update their lobby" ON public.scrim_lobbies;
CREATE POLICY "Lobby captains can update non-result fields"
ON public.scrim_lobbies FOR UPDATE TO authenticated
USING (team_a_captain_id = auth.uid() OR team_b_captain_id = auth.uid())
WITH CHECK (
  (team_a_captain_id = auth.uid() OR team_b_captain_id = auth.uid())
  AND status NOT IN ('completed','disputed')
  AND final_team_a_score IS NULL
  AND final_team_b_score IS NULL
  AND final_screenshot_url IS NULL
);

-- 2) Server-side finalize RPC: only way to set status=completed/disputed
CREATE OR REPLACE FUNCTION public.finalize_lobby_result(_lobby_id uuid)
RETURNS public.scrim_lobbies
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _lobby public.scrim_lobbies;
  _r1 public.lobby_results;
  _r2 public.lobby_results;
  _match boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _lobby FROM public.scrim_lobbies WHERE id = _lobby_id FOR UPDATE;
  IF _lobby.id IS NULL THEN RAISE EXCEPTION 'Lobby not found'; END IF;
  IF auth.uid() <> _lobby.team_a_captain_id AND auth.uid() <> _lobby.team_b_captain_id THEN
    RAISE EXCEPTION 'Not a lobby captain';
  END IF;
  IF _lobby.status IN ('completed') THEN RETURN _lobby; END IF;

  SELECT * INTO _r1 FROM public.lobby_results WHERE lobby_id = _lobby_id AND submitted_by = _lobby.team_a_captain_id;
  SELECT * INTO _r2 FROM public.lobby_results WHERE lobby_id = _lobby_id AND submitted_by = _lobby.team_b_captain_id;
  IF _r1.id IS NULL OR _r2.id IS NULL THEN
    RETURN _lobby; -- need both submissions
  END IF;

  _match := _r1.team_a_score = _r2.team_a_score AND _r1.team_b_score = _r2.team_b_score;

  UPDATE public.scrim_lobbies
  SET status = CASE WHEN _match THEN 'completed' ELSE 'disputed' END,
      final_team_a_score = CASE WHEN _match THEN _r1.team_a_score ELSE NULL END,
      final_team_b_score = CASE WHEN _match THEN _r1.team_b_score ELSE NULL END,
      final_screenshot_url = CASE WHEN _match THEN COALESCE(_r1.screenshot_url, _r2.screenshot_url) ELSE NULL END,
      updated_at = now()
  WHERE id = _lobby_id
  RETURNING * INTO _lobby;
  RETURN _lobby;
END;
$$;
GRANT EXECUTE ON FUNCTION public.finalize_lobby_result(uuid) TO authenticated;

-- 3) Validate map veto pool inside start_veto
CREATE OR REPLACE FUNCTION public.start_veto(_lobby_id uuid, _pool jsonb)
RETURNS public.scrim_lobbies
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _lobby public.scrim_lobbies;
  _len int;
  _bad int;
  _dups int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _lobby FROM public.scrim_lobbies WHERE id = _lobby_id FOR UPDATE;
  IF _lobby.id IS NULL THEN RAISE EXCEPTION 'Lobby not found'; END IF;
  IF auth.uid() <> _lobby.team_a_captain_id AND auth.uid() <> _lobby.team_b_captain_id THEN
    RAISE EXCEPTION 'Not a lobby captain';
  END IF;
  IF _lobby.team_b_captain_id IS NULL THEN RAISE EXCEPTION 'Opponent not joined yet'; END IF;

  IF _pool IS NULL OR jsonb_typeof(_pool) <> 'array' THEN
    RAISE EXCEPTION 'Pool must be a JSON array';
  END IF;
  _len := jsonb_array_length(_pool);
  IF _len < 3 OR _len > 30 THEN
    RAISE EXCEPTION 'Pool must contain between 3 and 30 maps';
  END IF;
  SELECT count(*) INTO _bad FROM jsonb_array_elements(_pool) e
    WHERE jsonb_typeof(e) <> 'string'
       OR length(e #>> '{}') = 0
       OR length(e #>> '{}') > 64;
  IF _bad > 0 THEN RAISE EXCEPTION 'Pool contains invalid map entries'; END IF;
  SELECT _len - count(DISTINCT e #>> '{}') INTO _dups FROM jsonb_array_elements(_pool) e;
  IF _dups > 0 THEN RAISE EXCEPTION 'Pool contains duplicate maps'; END IF;

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

-- 4) Allow uploaders to delete their own match screenshots
DROP POLICY IF EXISTS "Owners can delete their match screenshots" ON storage.objects;
CREATE POLICY "Owners can delete their match screenshots"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'match-screenshots'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
