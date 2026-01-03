-- Fix critical security issues

-- 1. Fix database function search paths to prevent function hijacking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. Create security definer function for safe role checking
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. Fix role escalation vulnerability - prevent users from updating their own role
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile (except role)"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND (role IS NULL OR role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())));

-- 4. Add admin-only role update policy
CREATE POLICY "Admins can update user roles"
ON public.profiles
FOR UPDATE
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

-- 5. Add missing DELETE policy for profiles (admin only)
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (public.get_current_user_role() = 'admin');

-- 6. Add missing UPDATE/DELETE policies for bookings
CREATE POLICY "Users can update own bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any booking"
ON public.bookings
FOR UPDATE
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can delete own bookings"
ON public.bookings
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any booking"
ON public.bookings
FOR DELETE
USING (public.get_current_user_role() = 'admin');

-- 7. Add missing UPDATE/DELETE policies for chatbot_interactions
CREATE POLICY "Users can update own chatbot interactions"
ON public.chatbot_interactions
FOR UPDATE
USING ((auth.uid() = user_id) OR (user_id IS NULL))
WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL));

CREATE POLICY "Users can delete own chatbot interactions"
ON public.chatbot_interactions
FOR DELETE
USING ((auth.uid() = user_id) OR (user_id IS NULL));