// Browse hierarchy: Cities → Experience Categories

export interface ExperienceCategory {
  id: string;
  name: string;
  color: string;
  image?: string;
}

export interface City {
  id: string;
  name: string;
  color: string;
  image: string;
  categories: ExperienceCategory[];
}

export const cities: City[] = [
  {
    id: 'zanzibar',
    name: 'Zanzibar',
    color: 'hsl(200, 70%, 50%)', // Blue
    image: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=400',
    categories: [
      { id: 'spice-tours', name: 'Spice Tours', color: 'hsl(30, 70%, 50%)' },
      { id: 'beach-clubs', name: 'Beach Clubs', color: 'hsl(200, 80%, 55%)' },
      { id: 'diving', name: 'Diving', color: 'hsl(180, 60%, 45%)' },
      { id: 'stone-town', name: 'Stone Town', color: 'hsl(35, 50%, 45%)' },
      { id: 'sunset-spots', name: 'Sunset Spots', color: 'hsl(20, 80%, 55%)' },
      { id: 'nightlife', name: 'Nightlife', color: 'hsl(280, 70%, 50%)' },
    ]
  },
  {
    id: 'dar-es-salaam',
    name: 'Dar es Salaam',
    color: 'hsl(15, 80%, 55%)', // Orange
    image: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=400',
    categories: [
      { id: 'water-sports', name: 'Water Sports', color: 'hsl(200, 70%, 50%)' },
      { id: 'local-food', name: 'Local Food', color: 'hsl(30, 70%, 50%)' },
      { id: 'nightlife', name: 'Nightlife', color: 'hsl(280, 70%, 55%)' },
      { id: 'markets', name: 'Markets', color: 'hsl(45, 70%, 50%)' },
      { id: 'beaches', name: 'Beaches', color: 'hsl(200, 80%, 55%)' },
    ]
  },
  {
    id: 'nairobi',
    name: 'Nairobi',
    color: 'hsl(120, 50%, 45%)', // Green
    image: 'https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=400',
    categories: [
      { id: 'safari', name: 'Safari', color: 'hsl(45, 70%, 50%)' },
      { id: 'nightlife', name: 'Nightlife', color: 'hsl(280, 70%, 50%)' },
      { id: 'food-tours', name: 'Food Tours', color: 'hsl(15, 80%, 55%)' },
      { id: 'art-culture', name: 'Art & Culture', color: 'hsl(340, 60%, 55%)' },
      { id: 'markets', name: 'Markets', color: 'hsl(30, 60%, 50%)' },
    ]
  },
  {
    id: 'addis-ababa',
    name: 'Addis Ababa',
    color: 'hsl(45, 80%, 50%)', // Gold
    image: 'https://images.unsplash.com/photo-1578147488616-da9c23597803?w=400',
    categories: [
      { id: 'coffee-tours', name: 'Coffee Tours', color: 'hsl(30, 50%, 40%)' },
      { id: 'historical-sites', name: 'Historical Sites', color: 'hsl(35, 60%, 45%)' },
      { id: 'local-cuisine', name: 'Local Cuisine', color: 'hsl(15, 70%, 50%)' },
      { id: 'nightlife', name: 'Nightlife', color: 'hsl(280, 70%, 55%)' },
      { id: 'markets', name: 'Markets', color: 'hsl(45, 70%, 50%)' },
    ]
  },
  {
    id: 'kigali',
    name: 'Kigali',
    color: 'hsl(160, 60%, 45%)', // Teal
    image: 'https://images.unsplash.com/photo-1580746738893-e6c7e79c4fc2?w=400',
    categories: [
      { id: 'gorilla-trekking', name: 'Gorilla Trekking', color: 'hsl(120, 40%, 40%)' },
      { id: 'art-galleries', name: 'Art Galleries', color: 'hsl(340, 60%, 55%)' },
      { id: 'local-food', name: 'Local Food', color: 'hsl(30, 70%, 50%)' },
      { id: 'nightlife', name: 'Nightlife', color: 'hsl(280, 70%, 55%)' },
      { id: 'lake-kivu', name: 'Lake Kivu', color: 'hsl(200, 70%, 50%)' },
    ]
  },
  {
    id: 'kampala',
    name: 'Kampala',
    color: 'hsl(340, 70%, 55%)', // Pink
    image: 'https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=400',
    categories: [
      { id: 'nightlife', name: 'Nightlife', color: 'hsl(280, 70%, 50%)' },
      { id: 'food-markets', name: 'Food Markets', color: 'hsl(30, 70%, 50%)' },
      { id: 'cultural-tours', name: 'Cultural Tours', color: 'hsl(45, 60%, 50%)' },
      { id: 'lake-victoria', name: 'Lake Victoria', color: 'hsl(200, 70%, 50%)' },
      { id: 'adventure', name: 'Adventure', color: 'hsl(120, 50%, 45%)' },
    ]
  },
  {
    id: 'entebbe',
    name: 'Entebbe',
    color: 'hsl(200, 60%, 50%)', // Light Blue
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400',
    categories: [
      { id: 'wildlife', name: 'Wildlife', color: 'hsl(120, 50%, 45%)' },
      { id: 'botanical-gardens', name: 'Botanical Gardens', color: 'hsl(100, 60%, 45%)' },
      { id: 'beaches', name: 'Beaches', color: 'hsl(200, 80%, 55%)' },
      { id: 'water-sports', name: 'Water Sports', color: 'hsl(180, 60%, 50%)' },
      { id: 'day-trips', name: 'Day Trips', color: 'hsl(45, 70%, 50%)' },
    ]
  },
];

// Get all unique categories across all cities
export const getAllCategories = (): ExperienceCategory[] => {
  const categoryMap = new Map<string, ExperienceCategory>();
  cities.forEach(city => {
    city.categories.forEach(cat => {
      if (!categoryMap.has(cat.id)) {
        categoryMap.set(cat.id, cat);
      }
    });
  });
  return Array.from(categoryMap.values());
};
