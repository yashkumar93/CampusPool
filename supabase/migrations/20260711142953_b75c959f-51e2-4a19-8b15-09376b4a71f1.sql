REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;