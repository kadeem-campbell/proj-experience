import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cities = [
  'Zanzibar', 'Dar es Salaam', 'Nairobi', 'Mombasa', 'Cape Town',
  'Marrakech', 'Lagos', 'Accra', 'Kigali', 'Victoria Falls',
  'Serengeti', 'Maasai Mara', 'Luxor', 'Cairo', 'Casablanca',
  'Durban', 'Johannesburg', 'Addis Ababa', 'Lamu', 'Diani',
];

const nameTemplates = [
  '{city} Paradise', '{city} Adventure', '{city} Nights', '{city} Explorer',
  '{city} Vibes', 'Best of {city}', '{city} Ultimate Guide', '{city} Hidden Gems',
  '{city} Foodie Tour', '{city} Culture Trip', '{city} Beach Life', '{city} Safari Days',
  '{city} Weekend', '{city} Escape', '{city} Discovery', 'Exploring {city}',
  '{city} Bucket List', '{city} Must-Sees', '{city} Local Secrets', '{city} Journey',
];

const categories = ['Culture', 'Food', 'Adventure', 'Beach', 'Wildlife', 'Nightlife', 'Wellness'];
const experienceNames: Record<string, string[]> = {
  Culture: ['Walking Tour', 'Museum Visit', 'Historical Site', 'Art Gallery', 'Local Market', 'Traditional Dance', 'Heritage Walk', 'Architecture Tour', 'Monument Visit', 'Cultural Festival'],
  Food: ['Street Food Tour', 'Cooking Class', 'Fine Dining', 'Local Restaurant', 'Food Market', 'Coffee Tasting', 'Wine Tasting', 'Spice Tour', 'BBQ Experience', 'Brunch Spot'],
  Adventure: ['Hiking Trail', 'Water Sports', 'Zip Line', 'Scuba Diving', 'Snorkeling', 'Kayaking', 'Cycling Tour', 'Rock Climbing', 'Bungee Jump', 'Parasailing'],
  Beach: ['Beach Day', 'Sunset Beach', 'Beach Club', 'Island Hopping', 'Beach Yoga', 'Sandbank Visit', 'Beach Massage', 'Beach Walk', 'Swimming Spot', 'Beach BBQ'],
  Wildlife: ['Safari Drive', 'Bird Watching', 'Animal Sanctuary', 'Nature Reserve', 'Conservation Visit', 'Wildlife Photography', 'Elephant Orphanage', 'Giraffe Center', 'Marine Life Tour', 'Forest Walk'],
  Nightlife: ['Rooftop Bar', 'Live Music', 'Beach Party', 'Club Night', 'Jazz Evening', 'Sunset Drinks', 'Bar Hopping', 'Night Market', 'Casino Night', 'Pub Crawl'],
  Wellness: ['Spa Day', 'Yoga Session', 'Meditation Class', 'Hot Springs', 'Beach Massage', 'Retreat Center', 'Wellness Resort', 'Sound Healing', 'Thermal Bath', 'Holistic Therapy'],
};

const thumbnails = [
  'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=400',
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
  'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=400',
  'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
  'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
  'https://images.unsplash.com/photo-1547970810-dc1eac37d174?w=400',
  'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=400',
];

const prices = ['$0', '$10', '$15', '$20', '$25', '$30', '$40', '$50', '$60', '$80', '$100', '$150'];
const creatorNames = ['TravelPro', 'LocalGuide', 'AdventureSeeker', 'FoodieExplorer', 'CultureBuff', 'BeachLover', 'SafariExpert', 'WildlifeWatcher', 'NightOwl', 'WellnessGuru', 'IslandHopper', 'CityExplorer', 'NatureEnthusiast', 'PartyPlanner', 'RelaxationSeeker'];
const timeSlots = ['morning', 'afternoon', 'evening', 'night'];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Get city IDs
    const { data: cityRows } = await supabase.from('cities').select('id, name');
    const cityMap = new Map(cityRows?.map(c => [c.name, c.id]) || []);

    // Get creator IDs
    const { data: creatorRows } = await supabase.from('creators').select('id, username');
    const creatorMap = new Map(creatorRows?.map(c => [c.username, c.id]) || []);

    // Get experience IDs for linking
    const { data: expRows } = await supabase.from('experiences').select('id, title');
    const expMap = new Map(expRows?.map(e => [e.title, e.id]) || []);

    const usedSlugs = new Set<string>();
    const itineraries: any[] = [];

    // Generate 200 public itineraries (100 popular + 100 fave)
    for (let batch = 0; batch < 2; batch++) {
      const tag = batch === 0 ? 'popular' : 'fave';
      for (let i = 0; i < 100; i++) {
        const cityIdx = batch === 0 ? i % cities.length : (i + 5) % cities.length;
        const templateIdx = batch === 0 ? i % nameTemplates.length : (i + 10) % nameTemplates.length;
        const city = cities[cityIdx];
        const name = nameTemplates[templateIdx].replace('{city}', city);
        let slug = slugify(name);
        if (usedSlugs.has(slug)) slug = `${slug}-${batch}-${i}`;
        usedSlugs.add(slug);

        const creatorIdx = batch === 0 ? i % creatorNames.length : (i + 3) % creatorNames.length;

        // Generate experiences JSON for this itinerary
        const experiences = [];
        const expCount = 10 + (i % 5);
        // Always include Sea Walk
        experiences.push({
          id: expMap.get('Zanzibar Sea Walk') || '7',
          title: 'Zanzibar Sea Walk',
          creator: 'ChristineNampeera',
          videoThumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
          category: 'Adventure',
          location: 'Zanzibar',
          price: '$45',
          likedAt: new Date().toISOString(),
          timeSlot: 'morning',
        });

        for (let j = 0; j < expCount; j++) {
          const cat = categories[j % categories.length];
          const template = experienceNames[cat][j % experienceNames[cat].length];
          const title = `${city} ${template}`;
          experiences.push({
            id: `${slug}-exp-${j}`,
            title,
            creator: creatorNames[j % creatorNames.length],
            videoThumbnail: thumbnails[j % thumbnails.length],
            category: cat,
            location: city,
            price: prices[j % prices.length],
            likedAt: new Date().toISOString(),
            timeSlot: timeSlots[j % timeSlots.length],
          });
        }

        itineraries.push({
          name,
          slug,
          cover_image: thumbnails[cityIdx % thumbnails.length],
          city_id: cityMap.get(city) || null,
          creator_id: creatorMap.get(creatorNames[creatorIdx]) || null,
          experiences: JSON.stringify(experiences),
          trips: '[]',
          tag,
          like_count: Math.floor(Math.random() * 800) + 50,
          view_count: Math.floor(Math.random() * 5000) + 200,
        });
      }
    }

    // Insert in batches of 50
    let inserted = 0;
    for (let i = 0; i < itineraries.length; i += 50) {
      const batch = itineraries.slice(i, i + 50);
      const { error } = await supabase.from('public_itineraries').insert(batch);
      if (error) {
        console.error('Insert error:', error);
        return new Response(JSON.stringify({ error: error.message, inserted }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      inserted += batch.length;
    }

    // Now seed some mock likes on experiences
    // Get all experience IDs
    const { data: allExps } = await supabase.from('experiences').select('id, title');
    if (allExps && allExps.length > 0) {
      // Update like_count with realistic numbers
      for (const exp of allExps) {
        const likeCount = Math.floor(Math.random() * 500) + 50;
        const viewCount = Math.floor(Math.random() * 10000) + 500;
        await supabase.from('experiences').update({ like_count: likeCount, view_count: viewCount }).eq('id', exp.id);
      }
    }

    // Link experiences to cities
    const { data: exps } = await supabase.from('experiences').select('id, location');
    if (exps) {
      for (const exp of exps) {
        const cityId = cityMap.get(exp.location);
        if (cityId) {
          await supabase.from('experiences').update({ city_id: cityId }).eq('id', exp.id);
        }
      }
    }

    // Link experiences to creators
    const { data: exps2 } = await supabase.from('experiences').select('id, creator');
    if (exps2) {
      for (const exp of exps2) {
        const creatorId = creatorMap.get(exp.creator);
        if (creatorId) {
          await supabase.from('experiences').update({ creator_id: creatorId }).eq('id', exp.id);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      itineraries_inserted: inserted,
      message: 'All data seeded successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
