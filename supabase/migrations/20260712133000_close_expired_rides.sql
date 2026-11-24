CREATE OR REPLACE FUNCTION public.close_expired_rides()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.rides
  SET status = 'completed'
  WHERE status = 'open'
    AND now() > (depart_at + (flex_minutes * interval '1 minute'));
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.close_expired_rides() TO authenticated;
