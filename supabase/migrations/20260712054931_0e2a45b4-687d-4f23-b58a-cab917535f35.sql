
DROP POLICY IF EXISTS "driver updates member status in own group" ON public.ride_group_members;

CREATE POLICY "driver updates member status in own group"
  ON public.ride_group_members
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ride_groups g WHERE g.id = ride_group_members.group_id AND g.driver_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ride_groups g WHERE g.id = ride_group_members.group_id AND g.driver_id = auth.uid()));
