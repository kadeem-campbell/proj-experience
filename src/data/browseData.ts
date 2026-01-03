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
    id: 'london',
    name: 'London',
    color: 'hsl(340, 82%, 52%)', // Pink
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400',
    categories: [
      { id: 'street-art', name: 'Street Art', color: 'hsl(280, 70%, 50%)' },
      { id: 'canals', name: 'Canals', color: 'hsl(200, 70%, 50%)' },
      { id: 'bar-crawls', name: 'Bar Crawls', color: 'hsl(30, 80%, 50%)' },
      { id: 'museums', name: 'Museums', color: 'hsl(160, 60%, 45%)' },
      { id: 'parks', name: 'Parks', color: 'hsl(120, 50%, 45%)' },
      { id: 'food-tours', name: 'Food Tours', color: 'hsl(15, 80%, 55%)' },
    ]
  },
  {
    id: 'manchester',
    name: 'Manchester',
    color: 'hsl(160, 60%, 45%)', // Teal
    image: 'https://images.unsplash.com/photo-1515586838455-8f8f940d6853?w=400',
    categories: [
      { id: 'football', name: 'Football', color: 'hsl(0, 70%, 50%)' },
      { id: 'music-venues', name: 'Music Venues', color: 'hsl(280, 60%, 55%)' },
      { id: 'northern-quarter', name: 'Northern Quarter', color: 'hsl(45, 80%, 50%)' },
      { id: 'breweries', name: 'Breweries', color: 'hsl(30, 60%, 45%)' },
    ]
  },
  {
    id: 'lagos',
    name: 'Lagos',
    color: 'hsl(45, 90%, 50%)', // Gold
    image: 'https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?w=400',
    categories: [
      { id: 'street-food', name: 'Street Food', color: 'hsl(15, 80%, 55%)' },
      { id: 'nightlife', name: 'Nightlife', color: 'hsl(280, 70%, 50%)' },
      { id: 'beaches', name: 'Beaches', color: 'hsl(200, 70%, 50%)' },
      { id: 'markets', name: 'Markets', color: 'hsl(45, 70%, 50%)' },
      { id: 'art-galleries', name: 'Art Galleries', color: 'hsl(340, 60%, 55%)' },
    ]
  },
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
    ]
  },
  {
    id: 'cape-town',
    name: 'Cape Town',
    color: 'hsl(280, 60%, 55%)', // Purple
    image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400',
    categories: [
      { id: 'hiking', name: 'Hiking', color: 'hsl(120, 50%, 45%)' },
      { id: 'wine-tasting', name: 'Wine Tasting', color: 'hsl(340, 70%, 50%)' },
      { id: 'beaches', name: 'Beaches', color: 'hsl(200, 70%, 50%)' },
      { id: 'townships', name: 'Townships', color: 'hsl(45, 60%, 50%)' },
    ]
  },
  {
    id: 'rio',
    name: 'Rio de Janeiro',
    color: 'hsl(120, 60%, 45%)', // Green
    image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400',
    categories: [
      { id: 'surfing', name: 'Surfing', color: 'hsl(200, 80%, 50%)' },
      { id: 'samba', name: 'Samba', color: 'hsl(45, 90%, 50%)' },
      { id: 'favela-tours', name: 'Favela Tours', color: 'hsl(280, 60%, 50%)' },
      { id: 'beach-sports', name: 'Beach Sports', color: 'hsl(340, 70%, 55%)' },
    ]
  },
  {
    id: 'dar-es-salaam',
    name: 'Dar Es Salaam',
    color: 'hsl(15, 80%, 55%)', // Orange
    image: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=400',
    categories: [
      { id: 'water-sports', name: 'Water Sports', color: 'hsl(200, 70%, 50%)' },
      { id: 'local-food', name: 'Local Food', color: 'hsl(30, 70%, 50%)' },
      { id: 'nightlife', name: 'Nightlife', color: 'hsl(280, 70%, 55%)' },
      { id: 'markets', name: 'Markets', color: 'hsl(45, 70%, 50%)' },
    ]
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    color: 'hsl(0, 70%, 55%)', // Red
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400',
    categories: [
      { id: 'ramen', name: 'Ramen', color: 'hsl(30, 70%, 50%)' },
      { id: 'temples', name: 'Temples', color: 'hsl(0, 60%, 45%)' },
      { id: 'anime', name: 'Anime Districts', color: 'hsl(280, 80%, 55%)' },
      { id: 'izakaya', name: 'Izakaya Hopping', color: 'hsl(45, 70%, 50%)' },
    ]
  },
  {
    id: 'paris',
    name: 'Paris',
    color: 'hsl(340, 60%, 55%)', // Rose
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400',
    categories: [
      { id: 'cafes', name: 'Cafés', color: 'hsl(30, 50%, 45%)' },
      { id: 'art', name: 'Art & Museums', color: 'hsl(45, 70%, 50%)' },
      { id: 'wine-bars', name: 'Wine Bars', color: 'hsl(340, 70%, 50%)' },
      { id: 'patisseries', name: 'Patisseries', color: 'hsl(340, 50%, 60%)' },
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
