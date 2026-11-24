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
  rating_count,
  driving_license
FROM public.profiles;

REVOKE ALL ON public.profiles_public FROM public, anon;
GRANT SELECT ON public.profiles_public TO authenticated;
