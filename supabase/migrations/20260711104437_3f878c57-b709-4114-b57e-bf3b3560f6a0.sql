
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('student', 'admin');
CREATE TYPE public.ride_role AS ENUM ('passenger', 'driver');
CREATE TYPE public.ride_status AS ENUM ('open', 'matched', 'completed', 'cancelled');
CREATE TYPE public.vehicle_type AS ENUM ('any', 'bike', 'car', 'auto', 'cab');
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  college TEXT NOT NULL DEFAULT 'VIT-AP',
  department TEXT,
  year TEXT,
  gender public.gender_type,
  phone TEXT,
  hostel TEXT,
  avatar_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT true,
  bio TEXT,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- ============ RIDES ============
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.ride_role NOT NULL,
  pickup_label TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  dest_label TEXT NOT NULL,
  dest_lat DOUBLE PRECISION NOT NULL,
  dest_lng DOUBLE PRECISION NOT NULL,
  depart_at TIMESTAMPTZ NOT NULL,
  flex_minutes INTEGER NOT NULL DEFAULT 15,
  seats INTEGER NOT NULL DEFAULT 1,
  vehicle_type public.vehicle_type NOT NULL DEFAULT 'any',
  estimated_cost NUMERIC(10,2),
  notes TEXT,
  status public.ride_status NOT NULL DEFAULT 'open',
  group_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX rides_depart_at_idx ON public.rides(depart_at);
CREATE INDEX rides_status_idx ON public.rides(status);
CREATE INDEX rides_creator_idx ON public.rides(creator_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rides TO authenticated;
GRANT ALL ON public.rides TO service_role;

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Any authenticated user can view rides"
  ON public.rides FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create their own rides"
  ON public.rides FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update their own rides"
  ON public.rides FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete their own rides"
  ON public.rides FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- ============ RIDE GROUPS ============
CREATE TABLE public.ride_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  depart_at TIMESTAMPTZ NOT NULL,
  pickup_label TEXT NOT NULL,
  dest_label TEXT NOT NULL,
  status public.ride_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.ride_groups TO authenticated;
GRANT ALL ON public.ride_groups TO service_role;

ALTER TABLE public.ride_groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ride_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.ride_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES public.rides(id) ON DELETE SET NULL,
  role public.ride_role NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX group_members_user_idx ON public.ride_group_members(user_id);
CREATE INDEX group_members_group_idx ON public.ride_group_members(group_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ride_group_members TO authenticated;
GRANT ALL ON public.ride_group_members TO service_role;

ALTER TABLE public.ride_group_members ENABLE ROW LEVEL SECURITY;

-- Security definer helper to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.ride_group_members WHERE group_id = _group_id AND user_id = _user_id);
$$;

CREATE POLICY "Members can view their groups"
  ON public.ride_groups FOR SELECT TO authenticated
  USING (public.is_group_member(id, auth.uid()));
CREATE POLICY "Users can create groups"
  ON public.ride_groups FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group creators can update group"
  ON public.ride_groups FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Members can view group membership"
  ON public.ride_group_members FOR SELECT TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Users can add themselves to a group"
  ON public.ride_group_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave their group"
  ON public.ride_group_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ MESSAGES ============
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.ride_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX messages_group_created_idx ON public.messages(group_id, created_at);

GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can read messages"
  ON public.messages FOR SELECT TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Group members can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_group_member(group_id, auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============ RATINGS ============
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.ride_groups(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ratee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, rater_id, ratee_id)
);

GRANT SELECT, INSERT ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view ratings"
  ON public.ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members can rate co-riders"
  ON public.ratings FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = rater_id
    AND rater_id <> ratee_id
    AND public.is_group_member(group_id, auth.uid())
    AND public.is_group_member(group_id, ratee_id)
  );

-- Trigger to update ratee's avg rating
CREATE OR REPLACE FUNCTION public.update_profile_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    rating_count = (SELECT COUNT(*) FROM public.ratings WHERE ratee_id = NEW.ratee_id),
    rating_avg = (SELECT COALESCE(AVG(stars), 0) FROM public.ratings WHERE ratee_id = NEW.ratee_id)
  WHERE id = NEW.ratee_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profile_rating_after_insert
AFTER INSERT ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.update_profile_rating();

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _college TEXT := 'VIT-AP';
  _domain TEXT;
BEGIN
  _domain := lower(split_part(NEW.email, '@', 2));
  IF _domain IN ('vitap.ac.in', 'vitapstudent.ac.in') THEN
    _college := 'VIT-AP';
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

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ UPDATED_AT TRIGGER ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER rides_updated_at BEFORE UPDATE ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
