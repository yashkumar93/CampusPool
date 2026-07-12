-- Update handle_new_user() trigger to dynamically resolve the college from metadata or email domain
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _college TEXT := 'VIT-AP';
  _domain TEXT;
BEGIN
  _domain := lower(split_part(NEW.email, '@', 2));
  
  -- If metadata explicitly specifies college, use it. Otherwise resolve from email domain
  IF NEW.raw_user_meta_data->>'college' IS NOT NULL THEN
    _college := NEW.raw_user_meta_data->>'college';
  ELSIF _domain IN ('vitap.ac.in', 'vitapstudent.ac.in') THEN
    _college := 'VIT-AP';
  ELSIF _domain IN ('vit.ac.in', 'vitstudent.ac.in') THEN
    _college := 'VIT';
  ELSIF _domain IN ('srmist.edu.in', 'srmuniv.ac.in') THEN
    _college := 'SRM';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, college)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    _college
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;
