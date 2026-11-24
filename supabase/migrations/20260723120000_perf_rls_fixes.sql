-- =====================================================================
-- Performance & RLS fixes — generated from a schema/RLS review
-- =====================================================================
-- Read before running. Nothing here is destructive, but:
--   - Index builds on large/live tables should use CREATE INDEX
--     CONCURRENTLY instead, run one statement at a time outside a
--     transaction block (CONCURRENTLY cannot run inside BEGIN...COMMIT,
--     which is how most SQL editors execute a pasted script).
--   - This only rewrites the POLICIES that call is_group_member() /
--     are_co_group_members(). It does NOT modify those functions'
--     internal bodies — they are already marked STABLE, and they
--     filter from ride_group_members using existing indexes.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Indexes: FK/join columns Postgres doesn't auto-index
--    (Only net-new indexes; duplicates of existing ones omitted.)
-- ---------------------------------------------------------------------

-- Composite index for is_group_member() lookups — the existing
-- single-column indexes (group_members_group_idx, group_members_user_idx)
-- don't cover the two-column equality scan efficiently.
CREATE INDEX IF NOT EXISTS idx_ride_group_members_group_user
  ON ride_group_members (group_id, user_id);

-- FK column not auto-indexed
CREATE INDEX IF NOT EXISTS idx_ride_group_members_ride_id
  ON ride_group_members (ride_id);

-- rides: group_id FK not auto-indexed
CREATE INDEX IF NOT EXISTS idx_rides_group_id ON rides (group_id);

-- Partial index for the most common rides query (open + upcoming)
CREATE INDEX IF NOT EXISTS idx_rides_status_depart
  ON rides (status, depart_at) WHERE status = 'open'::ride_status;

-- ride_groups: FK columns not auto-indexed
CREATE INDEX IF NOT EXISTS idx_ride_groups_created_by ON ride_groups (created_by);
CREATE INDEX IF NOT EXISTS idx_ride_groups_driver_id ON ride_groups (driver_id);
CREATE INDEX IF NOT EXISTS idx_ride_groups_status_depart ON ride_groups (status, depart_at);

-- ratings: FK columns not auto-indexed
CREATE INDEX IF NOT EXISTS idx_ratings_group_id ON ratings (group_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee_id ON ratings (ratee_id);

-- user_roles: FK column not auto-indexed
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);


-- ---------------------------------------------------------------------
-- 2. RLS: wrap auth.uid() so it's cached once per query, not re-run
--    per row (Supabase advisor: auth_rls_initplan)
-- ---------------------------------------------------------------------

-- profiles
ALTER POLICY "Users can view their own profile" ON profiles
  USING ((select auth.uid()) = id);

ALTER POLICY "Users can update their own profile" ON profiles
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

ALTER POLICY "Users can insert their own profile" ON profiles
  WITH CHECK ((select auth.uid()) = id);

ALTER POLICY "Co-group members can view each other's profile" ON profiles
  USING (are_co_group_members((select auth.uid()), id));

-- user_roles
ALTER POLICY "Users can view their own roles" ON user_roles
  USING ((select auth.uid()) = user_id);

-- rides
ALTER POLICY "Users can create their own rides" ON rides
  WITH CHECK ((select auth.uid()) = creator_id);

ALTER POLICY "Users can delete their own rides" ON rides
  USING ((select auth.uid()) = creator_id);

ALTER POLICY "Users can update their own rides" ON rides
  USING ((select auth.uid()) = creator_id);

-- messages
ALTER POLICY "Group members can read messages" ON messages
  USING (is_group_member(group_id, (select auth.uid())));

ALTER POLICY "Group members can send messages" ON messages
  WITH CHECK (
    (select auth.uid()) = user_id
    AND is_group_member(group_id, (select auth.uid()))
  );

-- trip_locations
ALTER POLICY "driver inserts trip locations" ON trip_locations
  WITH CHECK (
    user_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM ride_groups g
      WHERE g.id = trip_locations.group_id
      AND g.driver_id = (select auth.uid())
    )
  );

ALTER POLICY "group members read trip locations" ON trip_locations
  USING (is_group_member(group_id, (select auth.uid())));

-- ratings
ALTER POLICY "Members can rate co-riders" ON ratings
  WITH CHECK (
    (select auth.uid()) = rater_id
    AND rater_id <> ratee_id
    AND is_group_member(group_id, (select auth.uid()))
    AND is_group_member(group_id, ratee_id)
  );

-- ride_groups
ALTER POLICY "Group creators can update group" ON ride_groups
  USING ((select auth.uid()) = created_by);

ALTER POLICY "Members or creators can view their groups" ON ride_groups
  USING (
    is_group_member(id, (select auth.uid()))
    OR (select auth.uid()) = created_by
  );

ALTER POLICY "Users can create groups" ON ride_groups
  WITH CHECK ((select auth.uid()) = created_by);

-- ride_group_members (SELECT/DELETE only — INSERT/UPDATE are replaced,
-- not just rewrapped, in section 3 below)
ALTER POLICY "Members can view group membership" ON ride_group_members
  USING (is_group_member(group_id, (select auth.uid())));

ALTER POLICY "Users can leave their group" ON ride_group_members
  USING ((select auth.uid()) = user_id);

-- join_requests
ALTER POLICY "requester cancels or target driver decides" ON join_requests
  USING (
    requester_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = join_requests.target_ride_id
      AND r.creator_id = (select auth.uid())
    )
  );

ALTER POLICY "requester creates" ON join_requests
  WITH CHECK (requester_id = (select auth.uid()));

ALTER POLICY "requester or target driver reads" ON join_requests
  USING (
    requester_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM rides r
      WHERE r.id = join_requests.target_ride_id
      AND r.creator_id = (select auth.uid())
    )
  );

-- Not touched: "Any authenticated user can view rides", "Anyone
-- authenticated can view ratings", "College domains are public" —
-- all USING (true), no auth.uid() call, nothing to wrap.


-- ---------------------------------------------------------------------
-- 3. RLS: consolidate duplicate permissive policies on
--    ride_group_members (Supabase advisor: multiple_permissive_policies)
-- ---------------------------------------------------------------------

-- Drop the two separate INSERT policies and replace with one
DROP POLICY IF EXISTS "Group creator can add members" ON ride_group_members;
DROP POLICY IF EXISTS "Users can add themselves to a group" ON ride_group_members;

CREATE POLICY "Creator or self can add member" ON ride_group_members
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM ride_groups g
      WHERE g.id = ride_group_members.group_id
      AND g.created_by = (select auth.uid())
    )
  );

-- Drop the two separate UPDATE policies and replace with one
DROP POLICY IF EXISTS "Group creator updates members" ON ride_group_members;
DROP POLICY IF EXISTS "driver updates member status in own group" ON ride_group_members;

CREATE POLICY "Creator or driver can update members" ON ride_group_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ride_groups g
      WHERE g.id = ride_group_members.group_id
      AND ((select auth.uid()) = g.created_by OR (select auth.uid()) = g.driver_id)
    )
  );
