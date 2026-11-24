
-- 1. Extend ride_groups
ALTER TABLE public.ride_groups
  ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS total_fare_estimate numeric,
  ADD COLUMN IF NOT EXISTS total_distance_km numeric,
  ADD COLUMN IF NOT EXISTS total_duration_min numeric,
  ADD COLUMN IF NOT EXISTS route_polyline text,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- 2. Extend ride_group_members
ALTER TABLE public.ride_group_members
  ADD COLUMN IF NOT EXISTS pickup_lat double precision,
  ADD COLUMN IF NOT EXISTS pickup_lng double precision,
  ADD COLUMN IF NOT EXISTS pickup_label text,
  ADD COLUMN IF NOT EXISTS dest_lat double precision,
  ADD COLUMN IF NOT EXISTS dest_lng double precision,
  ADD COLUMN IF NOT EXISTS dest_label text,
  ADD COLUMN IF NOT EXISTS leg_distance_km numeric,
  ADD COLUMN IF NOT EXISTS share_amount numeric,
  ADD COLUMN IF NOT EXISTS member_status text NOT NULL DEFAULT 'accepted' CHECK (member_status IN ('pending','accepted','declined','left'));

-- 3. trip_locations
CREATE TABLE IF NOT EXISTS public.trip_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.ride_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  heading double precision,
  speed double precision,
  accuracy double precision,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trip_locations_group_recorded_idx ON public.trip_locations(group_id, recorded_at DESC);

GRANT SELECT, INSERT ON public.trip_locations TO authenticated;
GRANT ALL ON public.trip_locations TO service_role;

ALTER TABLE public.trip_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group members read trip locations"
  ON public.trip_locations FOR SELECT TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "driver inserts trip locations"
  ON public.trip_locations FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.ride_groups g
      WHERE g.id = group_id AND g.driver_id = auth.uid()
    )
  );

-- 4. join_requests
CREATE TABLE IF NOT EXISTS public.join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_ride_id uuid REFERENCES public.rides(id) ON DELETE SET NULL,
  pickup_lat double precision,
  pickup_lng double precision,
  pickup_label text,
  dest_lat double precision,
  dest_lng double precision,
  dest_label text,
  seats_requested integer NOT NULL DEFAULT 1,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_ride_id, requester_id)
);
CREATE INDEX IF NOT EXISTS join_requests_target_idx ON public.join_requests(target_ride_id, status);
CREATE INDEX IF NOT EXISTS join_requests_requester_idx ON public.join_requests(requester_id, status);

GRANT SELECT, INSERT, UPDATE ON public.join_requests TO authenticated;
GRANT ALL ON public.join_requests TO service_role;

ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "requester or target driver reads"
  ON public.join_requests FOR SELECT TO authenticated
  USING (
    requester_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.rides r WHERE r.id = target_ride_id AND r.creator_id = auth.uid())
  );

CREATE POLICY "requester creates"
  ON public.join_requests FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "requester cancels or target driver decides"
  ON public.join_requests FOR UPDATE TO authenticated
  USING (
    requester_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.rides r WHERE r.id = target_ride_id AND r.creator_id = auth.uid())
  );

CREATE TRIGGER join_requests_updated_at
  BEFORE UPDATE ON public.join_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Extend ride_group_members RLS so drivers can update member rows in their group
CREATE POLICY "driver updates member status in own group"
  ON public.ride_group_members FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ride_groups g
      WHERE g.id = group_id AND g.driver_id = auth.uid()
    )
  );

-- 6. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.join_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_group_members;

-- 7. Only allow verified-email users to appear as verified in profiles.
-- Update handle_new_user to sync verified flag; also a trigger on email_confirmed_at.
CREATE OR REPLACE FUNCTION public.sync_email_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET verified = (NEW.email_confirmed_at IS NOT NULL)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  EXECUTE FUNCTION public.sync_email_verified();

REVOKE EXECUTE ON FUNCTION public.sync_email_verified() FROM PUBLIC, anon, authenticated;
