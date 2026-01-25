import { LikedExperience, TimeSlot } from '@/hooks/useLikedExperiences';

export interface PublicItinerary {
  id: string;
  name: string;
  experiences: LikedExperience[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  collaborators: string[];
  creatorName?: string;
  coverImage?: string;
  tag?: 'popular' | 'fave';
}

// Base cities and their cover images
const cities = [
  { name: 'Zanzibar', country: 'Tanzania', coverImage: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=400' },
  { name: 'Dar es Salaam', country: 'Tanzania', coverImage: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=400' },
  { name: 'Nairobi', country: 'Kenya', coverImage: 'https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=400' },
  { name: 'Mombasa', country: 'Kenya', coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400' },
  { name: 'Cape Town', country: 'South Africa', coverImage: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400' },
  { name: 'Marrakech', country: 'Morocco', coverImage: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=400' },
  { name: 'Lagos', country: 'Nigeria', coverImage: 'https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?w=400' },
  { name: 'Accra', country: 'Ghana', coverImage: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400' },
  { name: 'Kigali', country: 'Rwanda', coverImage: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400' },
  { name: 'Victoria Falls', country: 'Zimbabwe', coverImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400' },
  { name: 'Serengeti', country: 'Tanzania', coverImage: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?w=400' },
  { name: 'Maasai Mara', country: 'Kenya', coverImage: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400' },
  { name: 'Luxor', country: 'Egypt', coverImage: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=400' },
  { name: 'Cairo', country: 'Egypt', coverImage: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=400' },
  { name: 'Casablanca', country: 'Morocco', coverImage: 'https://images.unsplash.com/photo-1569383746724-6f1b882b8f46?w=400' },
  { name: 'Durban', country: 'South Africa', coverImage: 'https://images.unsplash.com/photo-1577948000111-9c970dfe3743?w=400' },
  { name: 'Johannesburg', country: 'South Africa', coverImage: 'https://images.unsplash.com/photo-1577948000111-9c970dfe3743?w=400' },
  { name: 'Addis Ababa', country: 'Ethiopia', coverImage: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400' },
  { name: 'Lamu', country: 'Kenya', coverImage: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=400' },
  { name: 'Diani', country: 'Kenya', coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400' },
];

// Itinerary name templates
const nameTemplates = [
  '{city} Paradise',
  '{city} Adventure',
  '{city} Nights',
  '{city} Explorer',
  '{city} Vibes',
  'Best of {city}',
  '{city} Ultimate Guide',
  '{city} Hidden Gems',
  '{city} Foodie Tour',
  '{city} Culture Trip',
  '{city} Beach Life',
  '{city} Safari Days',
  '{city} Weekend',
  '{city} Escape',
  '{city} Discovery',
  'Exploring {city}',
  '{city} Bucket List',
  '{city} Must-Sees',
  '{city} Local Secrets',
  '{city} Journey',
];

// Experience templates by category with suggested time slots
const experienceTemplates: Record<string, { items: string[]; timeSlot: TimeSlot }> = {
  Culture: {
    items: ['Walking Tour', 'Museum Visit', 'Historical Site', 'Art Gallery', 'Local Market',
      'Traditional Dance', 'Heritage Walk', 'Architecture Tour', 'Monument Visit', 'Cultural Festival'],
    timeSlot: 'morning'
  },
  Food: {
    items: ['Street Food Tour', 'Cooking Class', 'Fine Dining', 'Local Restaurant', 'Food Market',
      'Coffee Tasting', 'Wine Tasting', 'Spice Tour', 'BBQ Experience', 'Brunch Spot'],
    timeSlot: 'afternoon'
  },
  Adventure: {
    items: ['Hiking Trail', 'Water Sports', 'Zip Line', 'Scuba Diving', 'Snorkeling',
      'Kayaking', 'Cycling Tour', 'Rock Climbing', 'Bungee Jump', 'Parasailing'],
    timeSlot: 'morning'
  },
  Beach: {
    items: ['Beach Day', 'Sunset Beach', 'Beach Club', 'Island Hopping', 'Beach Yoga',
      'Sandbank Visit', 'Beach Massage', 'Beach Walk', 'Swimming Spot', 'Beach BBQ'],
    timeSlot: 'afternoon'
  },
  Wildlife: {
    items: ['Safari Drive', 'Bird Watching', 'Animal Sanctuary', 'Nature Reserve', 'Conservation Visit',
      'Wildlife Photography', 'Elephant Orphanage', 'Giraffe Center', 'Marine Life Tour', 'Forest Walk'],
    timeSlot: 'morning'
  },
  Nightlife: {
    items: ['Rooftop Bar', 'Live Music', 'Beach Party', 'Club Night', 'Jazz Evening',
      'Sunset Drinks', 'Bar Hopping', 'Night Market', 'Casino Night', 'Pub Crawl'],
    timeSlot: 'night'
  },
  Wellness: {
    items: ['Spa Day', 'Yoga Session', 'Meditation Class', 'Hot Springs', 'Beach Massage',
      'Retreat Center', 'Wellness Resort', 'Sound Healing', 'Thermal Bath', 'Holistic Therapy'],
    timeSlot: 'evening'
  }
};

const thumbnails = [
  'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=400',
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
  'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=400',
  'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
  'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400',
  'https://images.unsplash.com/photo-1607153333879-c174d265f1d2?w=400',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
  'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400',
  'https://images.unsplash.com/photo-1559339352-11d2bd2722f3?w=400',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
  'https://images.unsplash.com/photo-1547970810-dc1eac37d174?w=400',
  'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=400',
  'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=400',
  'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400',
  'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
  'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400',
];

const creators = [
  'TravelPro', 'LocalGuide', 'AdventureSeeker', 'FoodieExplorer', 'CultureBuff',
  'BeachLover', 'SafariExpert', 'WildlifeWatcher', 'NightOwl', 'WellnessGuru',
  'IslandHopper', 'CityExplorer', 'NatureEnthusiast', 'PartyPlanner', 'RelaxationSeeker'
];

const prices = ['$0', '$10', '$15', '$20', '$25', '$30', '$40', '$50', '$60', '$80', '$100', '$150'];

function generateExperiences(city: string, count: number): LikedExperience[] {
  const experiences: LikedExperience[] = [];
  const categories = Object.keys(experienceTemplates) as (keyof typeof experienceTemplates)[];
  
  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const templateData = experienceTemplates[category];
    const template = templateData.items[i % templateData.items.length];
    
    experiences.push({
      id: `${city.toLowerCase().replace(/\s/g, '-')}-gen-${i}`,
      title: `${city} ${template}`,
      creator: creators[i % creators.length],
      videoThumbnail: thumbnails[i % thumbnails.length],
      category,
      location: city,
      price: prices[i % prices.length],
      likedAt: new Date().toISOString(),
      timeSlot: templateData.timeSlot
    });
  }
  
  return experiences;
}

function generateItineraries(): PublicItinerary[] {
  const itineraries: PublicItinerary[] = [];
  let id = 0;
  
  // Generate 100 "Most Popular" itineraries
  for (let i = 0; i < 100; i++) {
    const city = cities[i % cities.length];
    const nameTemplate = nameTemplates[i % nameTemplates.length];
    const name = nameTemplate.replace('{city}', city.name);
    
    itineraries.push({
      id: `popular-${id++}`,
      name,
      experiences: generateExperiences(city.name, 10 + (i % 5)),
      createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: true,
      collaborators: [],
      creatorName: creators[i % creators.length],
      coverImage: city.coverImage,
      tag: 'popular'
    });
  }
  
  // Generate 100 "Our Faves" itineraries
  for (let i = 0; i < 100; i++) {
    const city = cities[(i + 5) % cities.length];
    const nameTemplate = nameTemplates[(i + 10) % nameTemplates.length];
    const name = nameTemplate.replace('{city}', city.name);
    
    itineraries.push({
      id: `fave-${id++}`,
      name,
      experiences: generateExperiences(city.name, 10 + (i % 5)),
      createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: true,
      collaborators: [],
      creatorName: creators[(i + 3) % creators.length],
      coverImage: city.coverImage,
      tag: 'fave'
    });
  }
  
  return itineraries;
}

export const publicItinerariesData = generateItineraries();

// Helper functions to filter by tag
export const getPopularItineraries = () => publicItinerariesData.filter(i => i.tag === 'popular');
export const getFaveItineraries = () => publicItinerariesData.filter(i => i.tag === 'fave');
