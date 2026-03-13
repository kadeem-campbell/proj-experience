
-- Allow all authenticated users to insert/update/delete on content tables
-- Experiences
CREATE POLICY "Authenticated users can insert experiences"
ON public.experiences FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update experiences"
ON public.experiences FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete experiences"
ON public.experiences FOR DELETE TO authenticated
USING (true);

-- Categories
CREATE POLICY "Authenticated users can insert categories"
ON public.categories FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
ON public.categories FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
ON public.categories FOR DELETE TO authenticated
USING (true);

-- Cities
CREATE POLICY "Authenticated users can insert cities"
ON public.cities FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update cities"
ON public.cities FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cities"
ON public.cities FOR DELETE TO authenticated
USING (true);

-- Creators
CREATE POLICY "Authenticated users can insert creators"
ON public.creators FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update creators"
ON public.creators FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete creators"
ON public.creators FOR DELETE TO authenticated
USING (true);

-- Collections
CREATE POLICY "Authenticated users can insert collections"
ON public.collections FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update collections"
ON public.collections FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete collections"
ON public.collections FOR DELETE TO authenticated
USING (true);

-- Public Itineraries
CREATE POLICY "Authenticated users can insert public_itineraries"
ON public.public_itineraries FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update public_itineraries"
ON public.public_itineraries FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete public_itineraries"
ON public.public_itineraries FOR DELETE TO authenticated
USING (true);

-- Collection Experiences
CREATE POLICY "Authenticated users can insert collection_experiences"
ON public.collection_experiences FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update collection_experiences"
ON public.collection_experiences FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete collection_experiences"
ON public.collection_experiences FOR DELETE TO authenticated
USING (true);

-- Itinerary Experiences
CREATE POLICY "Authenticated users can insert itinerary_experiences"
ON public.itinerary_experiences FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update itinerary_experiences"
ON public.itinerary_experiences FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete itinerary_experiences"
ON public.itinerary_experiences FOR DELETE TO authenticated
USING (true);

-- Experience Photos
CREATE POLICY "Authenticated users can insert experience_photos"
ON public.experience_photos FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update experience_photos"
ON public.experience_photos FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete experience_photos"
ON public.experience_photos FOR DELETE TO authenticated
USING (true);

-- Experience FAQs
CREATE POLICY "Authenticated users can insert experience_faqs"
ON public.experience_faqs FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update experience_faqs"
ON public.experience_faqs FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete experience_faqs"
ON public.experience_faqs FOR DELETE TO authenticated
USING (true);

-- Collection Items
CREATE POLICY "Authenticated users can insert collection_items"
ON public.collection_items FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update collection_items"
ON public.collection_items FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete collection_items"
ON public.collection_items FOR DELETE TO authenticated
USING (true);
