-- Drop the policy that depends on role column first
DROP POLICY IF EXISTS "Users can update own profile except role" ON public.profiles;

-- Create a simpler update policy for profiles
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

-- Now remove the role column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Update handle_new_user to work with user_roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- Assign default role from metadata or 'traveler'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'role', '')::app_role,
      'traveler'
    )
  );
  
  RETURN NEW;
END;
$$;

-- Recreate trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();