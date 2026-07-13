DROP POLICY IF EXISTS "Members can view their groups" ON public.ride_groups;

CREATE POLICY "Members or creators can view their groups"
  ON public.ride_groups FOR SELECT TO authenticated
  USING (public.is_group_member(id, auth.uid()) OR auth.uid() = created_by);
