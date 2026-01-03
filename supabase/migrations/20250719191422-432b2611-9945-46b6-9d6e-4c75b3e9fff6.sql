-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE experience_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE user_role AS ENUM ('user', 'admin', 'team_member');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create experiences table
CREATE TABLE public.experiences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  category TEXT NOT NULL,
  creator TEXT NOT NULL,
  video_thumbnail TEXT,
  images TEXT[],
  duration_hours INTEGER,
  max_participants INTEGER,
  status experience_status DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_itineraries table for saved experiences
CREATE TABLE public.user_itineraries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  experience_id UUID REFERENCES public.experiences(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, experience_id)
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  experience_id UUID REFERENCES public.experiences(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  participants INTEGER DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  status booking_status DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bulk_uploads table for API integration
CREATE TABLE public.bulk_uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  uploaded_by UUID REFERENCES public.profiles(id),
  file_name TEXT,
  total_records INTEGER,
  successful_records INTEGER,
  failed_records INTEGER,
  status TEXT DEFAULT 'processing',
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for experiences (public read, admin/team write)
CREATE POLICY "Anyone can view active experiences" ON public.experiences
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins and team can manage experiences" ON public.experiences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'team_member')
    )
  );

-- Create RLS policies for user_itineraries
CREATE POLICY "Users can manage own itinerary" ON public.user_itineraries
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for bookings
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for bulk_uploads
CREATE POLICY "Team can manage bulk uploads" ON public.bulk_uploads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'team_member')
    )
  );

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_experiences_updated_at
  BEFORE UPDATE ON public.experiences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample experiences
INSERT INTO public.experiences (title, description, location, price, category, creator, video_thumbnail, duration_hours, max_participants) VALUES
('Jet Ski Adventure', 'High-speed water adventure with stunning coastal views', 'Miami Beach, FL', 149.99, 'Water Sports', 'AquaAdventures', '/src/assets/jetski-experience.jpg', 2, 6),
('Food Tour Experience', 'Authentic local cuisine tour through historic districts', 'New Orleans, LA', 89.99, 'Food & Dining', 'Local Flavors', '/src/assets/food-experience.jpg', 3, 12),
('Wildlife Safari', 'Close encounters with exotic wildlife in natural habitat', 'Everglades, FL', 199.99, 'Wildlife', 'Nature Guides', '/src/assets/wildlife-experience.jpg', 4, 8),
('Beach Relaxation', 'Premium beach experience with exclusive amenities', 'Malibu, CA', 129.99, 'Beach', 'Coastal Escapes', '/src/assets/beach-experience.jpg', 6, 4),
('Adventure Hiking', 'Guided mountain trail adventure with breathtaking views', 'Rocky Mountains, CO', 179.99, 'Adventure', 'Mountain Guides', '/src/assets/adventure-experience.jpg', 5, 10),
('Party Boat Experience', 'Luxury party boat with DJ, drinks, and sunset views', 'Key West, FL', 249.99, 'Nightlife', 'Sunset Parties', '/src/assets/party-experience.jpg', 4, 20);