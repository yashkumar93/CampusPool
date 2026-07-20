-- ============================================================
-- Fix RLS policies for ride accept/decline flow
-- ============================================================
-- Problem: When a host accepts a join request, respondJoinRequest()
-- tries to INSERT a ride_group_member row for the requester. But
-- the INSERT policy only allows auth.uid() = user_id (self-insert).
-- The host's auth.uid() != requester_id, so the insert is blocked.
--
-- Similarly, the UPDATE policy for ride_group_members only allows
-- the group driver to update. For passenger-hosted rides, driver_id
-- is NULL, so fare recomputation fails silently.
-- ============================================================

-- 1. Allow group creators to add other users as members
CREATE POLICY "Group creator can add members"
  ON public.ride_group_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ride_groups g
      WHERE g.id = group_id AND g.created_by = auth.uid()
    )
  );

-- 2. Allow group creators to update member rows (covers passenger hosts
--    where driver_id may be NULL, so the existing driver-only policy won't match)
CREATE POLICY "Group creator updates members"
  ON public.ride_group_members FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ride_groups g
      WHERE g.id = group_id AND g.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ride_groups g
      WHERE g.id = group_id AND g.created_by = auth.uid()
    )
  );
