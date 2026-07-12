
-- Helper: are two users in any shared ride group
CREATE OR REPLACE FUNCTION public.are_co_group_members(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.ride_group_members m1
    JOIN public.ride_group_members m2 ON m1.group_id = m2.group_id
    WHERE m1.user_id = _a AND m2.user_id = _b
  );
$$;

REVOKE EXECUTE ON FUNCTION public.are_co_group_members(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.are_co_group_members(uuid, uuid) TO authenticated;

-- Tighten profiles SELECT: drop the wide-open policy, add owner + co-group-member policies
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Co-group members can view each other's profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.are_co_group_members(auth.uid(), id));

-- Safe public view for cross-user listings (name, college, avatar, verified, rating only)
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = off) AS
SELECT
  id,
  full_name,
  college,
  department,
  year,
  avatar_url,
  verified,
  rating_avg,
  rating_count
FROM public.profiles;

REVOKE ALL ON public.profiles_public FROM public, anon;
GRANT SELECT ON public.profiles_public TO authenticated;
