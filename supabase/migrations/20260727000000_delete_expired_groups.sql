CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE OR REPLACE FUNCTION public.delete_expired_groups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete ride_groups that have been completed or cancelled, 
  -- and whose depart_at time was more than 24 hours ago.
  -- Delete child records first in case ON DELETE CASCADE is not set on their foreign keys.
  DELETE FROM public.messages WHERE group_id IN (
    SELECT id FROM public.ride_groups WHERE status IN ('completed', 'cancelled') AND depart_at < now() - interval '1 day'
  );
  DELETE FROM public.ratings WHERE group_id IN (
    SELECT id FROM public.ride_groups WHERE status IN ('completed', 'cancelled') AND depart_at < now() - interval '1 day'
  );
  DELETE FROM public.ride_group_members WHERE group_id IN (
    SELECT id FROM public.ride_groups WHERE status IN ('completed', 'cancelled') AND depart_at < now() - interval '1 day'
  );

  -- Finally delete the groups
  DELETE FROM public.ride_groups
  WHERE status IN ('completed', 'cancelled')
    AND depart_at < now() - interval '1 day';
END;
$$;

-- Schedule it to run every hour (on the hour)
SELECT cron.schedule(
    'delete-expired-groups-hourly',
    '0 * * * *', 
    'SELECT public.delete_expired_groups()'
);
