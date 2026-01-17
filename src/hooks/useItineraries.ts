import { useState, useEffect, useCallback } from 'react';
import { LikedExperience } from './useLikedExperiences';

export interface Itinerary {
  id: string;
  name: string;
  experiences: LikedExperience[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  collaborators: string[];
  creatorName?: string;
  coverImage?: string;
}

// Sample public itineraries - 30+ experiences each
export const publicItinerariesData: Itinerary[] = [
  {
    id: 'public-zanzibar-1',
    name: 'Zanzibar Paradise',
    experiences: [
      { id: 'zanzibar-1', title: 'Stone Town Walking Tour', creator: 'ZanzibarGuide', videoThumbnail: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=400', category: 'Culture', location: 'Stone Town', price: '$20', likedAt: new Date().toISOString() },
      { id: 'zanzibar-2', title: 'Spice Farm Visit', creator: 'SpiceExpert', videoThumbnail: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', category: 'Food', location: 'Zanzibar', price: '$30', likedAt: new Date().toISOString() },
      { id: 'zanzibar-3', title: 'Nungwi Beach Day', creator: 'BeachLife', videoThumbnail: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=400', category: 'Beach', location: 'Nungwi', price: '$0', likedAt: new Date().toISOString() },
      { id: 'zanzibar-4', title: 'Sunset Dhow Cruise', creator: 'OceanViews', videoThumbnail: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400', category: 'Adventure', location: 'Zanzibar', price: '$45', likedAt: new Date().toISOString() },
      { id: 'zanzibar-5', title: 'Prison Island Tour', creator: 'IslandHopper', videoThumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400', category: 'Adventure', location: 'Zanzibar', price: '$35', likedAt: new Date().toISOString() },
      { id: 'zanzibar-6', title: 'Jozani Forest Walk', creator: 'WildlifeExpert', videoThumbnail: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400', category: 'Wildlife', location: 'Zanzibar', price: '$25', likedAt: new Date().toISOString() },
      { id: 'zanzibar-7', title: 'Kendwa Beach Party', creator: 'PartyPro', videoThumbnail: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400', category: 'Nightlife', location: 'Kendwa', price: '$15', likedAt: new Date().toISOString() },
      { id: 'zanzibar-8', title: 'Dolphin Swimming', creator: 'MarineLife', videoThumbnail: 'https://images.unsplash.com/photo-1607153333879-c174d265f1d2?w=400', category: 'Adventure', location: 'Kizimkazi', price: '$50', likedAt: new Date().toISOString() },
      { id: 'zanzibar-9', title: 'Forodhani Night Market', creator: 'FoodieZanzibar', videoThumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', category: 'Food', location: 'Stone Town', price: '$10', likedAt: new Date().toISOString() },
      { id: 'zanzibar-10', title: 'Scuba Diving Experience', creator: 'DiveMaster', videoThumbnail: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400', category: 'Adventure', location: 'Mnemba', price: '$80', likedAt: new Date().toISOString() },
      { id: 'zanzibar-11', title: 'Traditional Cooking Class', creator: 'ChefZanzibar', videoThumbnail: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400', category: 'Food', location: 'Stone Town', price: '$40', likedAt: new Date().toISOString() },
      { id: 'zanzibar-12', title: 'Paje Kitesurf Lesson', creator: 'KitePro', videoThumbnail: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400', category: 'Adventure', location: 'Paje', price: '$60', likedAt: new Date().toISOString() },
      { id: 'zanzibar-13', title: 'The Rock Restaurant', creator: 'DiningGuide', videoThumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400', category: 'Food', location: 'Michamvi', price: '$50', likedAt: new Date().toISOString() },
      { id: 'zanzibar-14', title: 'Mnarani Natural Aquarium', creator: 'NatureGuide', videoThumbnail: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400', category: 'Wildlife', location: 'Nungwi', price: '$10', likedAt: new Date().toISOString() },
      { id: 'zanzibar-15', title: 'Palace Museum Visit', creator: 'HistoryBuff', videoThumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', category: 'Culture', location: 'Stone Town', price: '$5', likedAt: new Date().toISOString() },
      { id: 'zanzibar-16', title: 'Nakupenda Sandbank', creator: 'BeachLover', videoThumbnail: 'https://images.unsplash.com/photo-1520942702018-0862200e6873?w=400', category: 'Beach', location: 'Zanzibar', price: '$40', likedAt: new Date().toISOString() },
      { id: 'zanzibar-17', title: 'Sunset Yoga Session', creator: 'YogaZen', videoThumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400', category: 'Wellness', location: 'Paje', price: '$20', likedAt: new Date().toISOString() },
      { id: 'zanzibar-18', title: 'Mangapwani Slave Caves', creator: 'HistoryGuide', videoThumbnail: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400', category: 'Culture', location: 'Mangapwani', price: '$15', likedAt: new Date().toISOString() },
      { id: 'zanzibar-19', title: 'Snorkeling Safari', creator: 'MarineExplorer', videoThumbnail: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=400', category: 'Adventure', location: 'Mnemba', price: '$45', likedAt: new Date().toISOString() },
      { id: 'zanzibar-20', title: 'Spice Plantation Lunch', creator: 'CulinaryTours', videoThumbnail: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', category: 'Food', location: 'Zanzibar', price: '$35', likedAt: new Date().toISOString() },
      { id: 'zanzibar-21', title: 'Matemwe Beach Walk', creator: 'CoastalGuide', videoThumbnail: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=400', category: 'Beach', location: 'Matemwe', price: '$0', likedAt: new Date().toISOString() },
      { id: 'zanzibar-22', title: 'Freddie Mercury House', creator: 'MusicHistory', videoThumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', category: 'Culture', location: 'Stone Town', price: '$10', likedAt: new Date().toISOString() },
      { id: 'zanzibar-23', title: 'Deep Sea Fishing', creator: 'FishingCharter', videoThumbnail: 'https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=400', category: 'Adventure', location: 'Zanzibar', price: '$200', likedAt: new Date().toISOString() },
      { id: 'zanzibar-24', title: 'Swahili Doors Photography', creator: 'PhotoTour', videoThumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', category: 'Culture', location: 'Stone Town', price: '$25', likedAt: new Date().toISOString() },
      { id: 'zanzibar-25', title: 'Sunset Beach Massage', creator: 'WellnessZanzibar', videoThumbnail: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400', category: 'Wellness', location: 'Nungwi', price: '$30', likedAt: new Date().toISOString() },
      { id: 'zanzibar-26', title: 'Local Village Visit', creator: 'CommunityTours', videoThumbnail: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400', category: 'Culture', location: 'Zanzibar', price: '$20', likedAt: new Date().toISOString() },
      { id: 'zanzibar-27', title: 'Seaweed Farm Tour', creator: 'FarmGuide', videoThumbnail: 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=400', category: 'Culture', location: 'Paje', price: '$15', likedAt: new Date().toISOString() },
      { id: 'zanzibar-28', title: 'Zanzibar Film Festival', creator: 'ArtsGuide', videoThumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400', category: 'Culture', location: 'Stone Town', price: '$25', likedAt: new Date().toISOString() },
      { id: 'zanzibar-29', title: 'Paddle Boarding', creator: 'WaterSports', videoThumbnail: 'https://images.unsplash.com/photo-1526188717906-ab4a2f949f78?w=400', category: 'Adventure', location: 'Kendwa', price: '$30', likedAt: new Date().toISOString() },
      { id: 'zanzibar-30', title: 'Reef Conservation Dive', creator: 'OceanConservation', videoThumbnail: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400', category: 'Adventure', location: 'Mnemba', price: '$100', likedAt: new Date().toISOString() },
    ],
    createdAt: '2024-05-12T14:00:00Z',
    updatedAt: '2024-05-18T10:00:00Z',
    isPublic: true,
    collaborators: [],
    creatorName: 'IslandHopper',
    coverImage: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=400'
  },
  {
    id: 'public-dar-1',
    name: 'Dar es Salaam Nights',
    experiences: [
      { id: 'dar-1', title: 'Kariakoo Market Tour', creator: 'DarGuide', videoThumbnail: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400', category: 'Culture', location: 'Dar es Salaam', price: '$15', likedAt: new Date().toISOString() },
      { id: 'dar-2', title: 'Coco Beach Sunset', creator: 'BeachLover', videoThumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400', category: 'Beach', location: 'Dar es Salaam', price: '$0', likedAt: new Date().toISOString() },
      { id: 'dar-3', title: 'Street Food Adventure', creator: 'FoodieExplorer', videoThumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400', category: 'Food', location: 'Dar es Salaam', price: '$20', likedAt: new Date().toISOString() },
      { id: 'dar-4', title: 'Village Museum Tour', creator: 'HistoryGuide', videoThumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', category: 'Culture', location: 'Dar es Salaam', price: '$10', likedAt: new Date().toISOString() },
      { id: 'dar-5', title: 'Slipway Shopping', creator: 'ShoppingGuide', videoThumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400', category: 'Shopping', location: 'Dar es Salaam', price: '$0', likedAt: new Date().toISOString() },
      { id: 'dar-6', title: 'Nyama Choma BBQ', creator: 'GrillMaster', videoThumbnail: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400', category: 'Food', location: 'Dar es Salaam', price: '$25', likedAt: new Date().toISOString() },
      { id: 'dar-7', title: 'Bongoyo Island Trip', creator: 'IslandExplorer', videoThumbnail: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=400', category: 'Adventure', location: 'Dar es Salaam', price: '$40', likedAt: new Date().toISOString() },
      { id: 'dar-8', title: 'Askari Monument Walk', creator: 'CityGuide', videoThumbnail: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400', category: 'Culture', location: 'Dar es Salaam', price: '$5', likedAt: new Date().toISOString() },
      { id: 'dar-9', title: 'Tingatinga Art Gallery', creator: 'ArtLover', videoThumbnail: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=400', category: 'Art', location: 'Dar es Salaam', price: '$0', likedAt: new Date().toISOString() },
      { id: 'dar-10', title: 'Fish Market Experience', creator: 'SeafoodGuide', videoThumbnail: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400', category: 'Food', location: 'Dar es Salaam', price: '$15', likedAt: new Date().toISOString() },
      { id: 'dar-11', title: 'National Museum Visit', creator: 'MuseumGuide', videoThumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', category: 'Culture', location: 'Dar es Salaam', price: '$8', likedAt: new Date().toISOString() },
      { id: 'dar-12', title: 'Mbudya Island Snorkeling', creator: 'SnorkelPro', videoThumbnail: 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=400', category: 'Adventure', location: 'Dar es Salaam', price: '$50', likedAt: new Date().toISOString() },
      { id: 'dar-13', title: 'Kivukoni Fish Market', creator: 'LocalGuide', videoThumbnail: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400', category: 'Culture', location: 'Dar es Salaam', price: '$10', likedAt: new Date().toISOString() },
      { id: 'dar-14', title: 'Azania Front Lutheran Church', creator: 'ArchitectureGuide', videoThumbnail: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=400', category: 'Culture', location: 'Dar es Salaam', price: '$0', likedAt: new Date().toISOString() },
      { id: 'dar-15', title: 'Oyster Bay Beach Walk', creator: 'BeachGuide', videoThumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400', category: 'Beach', location: 'Dar es Salaam', price: '$0', likedAt: new Date().toISOString() },
      { id: 'dar-16', title: 'Rooftop Bar Hopping', creator: 'NightlifeGuide', videoThumbnail: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400', category: 'Nightlife', location: 'Dar es Salaam', price: '$30', likedAt: new Date().toISOString() },
      { id: 'dar-17', title: 'Botanical Gardens Walk', creator: 'NatureGuide', videoThumbnail: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400', category: 'Nature', location: 'Dar es Salaam', price: '$5', likedAt: new Date().toISOString() },
      { id: 'dar-18', title: 'Pugu Hills Hike', creator: 'HikingGuide', videoThumbnail: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400', category: 'Adventure', location: 'Dar es Salaam', price: '$25', likedAt: new Date().toISOString() },
      { id: 'dar-19', title: 'Makumbusho Village', creator: 'CultureGuide', videoThumbnail: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400', category: 'Culture', location: 'Dar es Salaam', price: '$8', likedAt: new Date().toISOString() },
      { id: 'dar-20', title: 'Sunset Dhow Cruise', creator: 'SailingGuide', videoThumbnail: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400', category: 'Adventure', location: 'Dar es Salaam', price: '$60', likedAt: new Date().toISOString() },
      { id: 'dar-21', title: 'Tanzania Coffee Tasting', creator: 'CoffeeExpert', videoThumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', category: 'Food', location: 'Dar es Salaam', price: '$20', likedAt: new Date().toISOString() },
      { id: 'dar-22', title: 'Craft Beer Brewery Tour', creator: 'BeerGuide', videoThumbnail: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400', category: 'Food', location: 'Dar es Salaam', price: '$25', likedAt: new Date().toISOString() },
      { id: 'dar-23', title: 'Local Music Night', creator: 'MusicGuide', videoThumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', category: 'Nightlife', location: 'Dar es Salaam', price: '$15', likedAt: new Date().toISOString() },
      { id: 'dar-24', title: 'Spa Day Experience', creator: 'WellnessGuide', videoThumbnail: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400', category: 'Wellness', location: 'Dar es Salaam', price: '$80', likedAt: new Date().toISOString() },
      { id: 'dar-25', title: 'Tennis at Gymkhana', creator: 'SportsGuide', videoThumbnail: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400', category: 'Sports', location: 'Dar es Salaam', price: '$20', likedAt: new Date().toISOString() },
      { id: 'dar-26', title: 'Sunset Kayaking', creator: 'KayakGuide', videoThumbnail: 'https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=400', category: 'Adventure', location: 'Dar es Salaam', price: '$35', likedAt: new Date().toISOString() },
      { id: 'dar-27', title: 'Indian Ocean Fishing', creator: 'FishingGuide', videoThumbnail: 'https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=400', category: 'Adventure', location: 'Dar es Salaam', price: '$150', likedAt: new Date().toISOString() },
      { id: 'dar-28', title: 'Sunday Brunch Scene', creator: 'BrunchGuide', videoThumbnail: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', category: 'Food', location: 'Dar es Salaam', price: '$40', likedAt: new Date().toISOString() },
      { id: 'dar-29', title: 'Street Art Walking Tour', creator: 'StreetArtGuide', videoThumbnail: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=400', category: 'Art', location: 'Dar es Salaam', price: '$15', likedAt: new Date().toISOString() },
      { id: 'dar-30', title: 'Morning Yoga on Beach', creator: 'YogaGuide', videoThumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400', category: 'Wellness', location: 'Dar es Salaam', price: '$15', likedAt: new Date().toISOString() },
    ],
    createdAt: '2024-04-10T08:00:00Z',
    updatedAt: '2024-04-15T16:00:00Z',
    isPublic: true,
    collaborators: [],
    creatorName: 'TanzaniaExplorer',
    coverImage: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=400'
  },
  {
    id: 'public-nairobi-1',
    name: 'Nairobi Safari City',
    experiences: [
      { id: 'nairobi-1', title: 'Nairobi National Park', creator: 'SafariPro', videoThumbnail: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?w=400', category: 'Wildlife', location: 'Nairobi', price: '$50', likedAt: new Date().toISOString() },
      { id: 'nairobi-2', title: 'Giraffe Centre Visit', creator: 'WildlifeKenya', videoThumbnail: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=400', category: 'Wildlife', location: 'Nairobi', price: '$25', likedAt: new Date().toISOString() },
      { id: 'nairobi-3', title: 'Karen Blixen Museum', creator: 'HistoryBuff', videoThumbnail: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400', category: 'Culture', location: 'Nairobi', price: '$15', likedAt: new Date().toISOString() },
      { id: 'nairobi-4', title: 'David Sheldrick Elephant', creator: 'ElephantLover', videoThumbnail: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=400', category: 'Wildlife', location: 'Nairobi', price: '$50', likedAt: new Date().toISOString() },
      { id: 'nairobi-5', title: 'Kazuri Beads Factory', creator: 'CraftGuide', videoThumbnail: 'https://images.unsplash.com/photo-1582655006941-f8b4cac8ad03?w=400', category: 'Culture', location: 'Nairobi', price: '$10', likedAt: new Date().toISOString() },
      { id: 'nairobi-6', title: 'Carnivore Restaurant', creator: 'MeatLover', videoThumbnail: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400', category: 'Food', location: 'Nairobi', price: '$45', likedAt: new Date().toISOString() },
      { id: 'nairobi-7', title: 'Maasai Market Shopping', creator: 'ShoppingGuide', videoThumbnail: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400', category: 'Shopping', location: 'Nairobi', price: '$0', likedAt: new Date().toISOString() },
      { id: 'nairobi-8', title: 'Bomas of Kenya', creator: 'CultureGuide', videoThumbnail: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400', category: 'Culture', location: 'Nairobi', price: '$20', likedAt: new Date().toISOString() },
      { id: 'nairobi-9', title: 'Uhuru Gardens Monument', creator: 'HistoryGuide', videoThumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', category: 'Culture', location: 'Nairobi', price: '$10', likedAt: new Date().toISOString() },
      { id: 'nairobi-10', title: 'Nairobi Railway Museum', creator: 'TrainBuff', videoThumbnail: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400', category: 'Culture', location: 'Nairobi', price: '$8', likedAt: new Date().toISOString() },
      { id: 'nairobi-11', title: 'Hell\'s Gate Cycling', creator: 'AdventureGuide', videoThumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', category: 'Adventure', location: 'Nairobi', price: '$40', likedAt: new Date().toISOString() },
      { id: 'nairobi-12', title: 'Lake Naivasha Day Trip', creator: 'LakeGuide', videoThumbnail: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400', category: 'Nature', location: 'Nairobi', price: '$80', likedAt: new Date().toISOString() },
      { id: 'nairobi-13', title: 'Kenyatta Conference Center', creator: 'CityGuide', videoThumbnail: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400', category: 'Culture', location: 'Nairobi', price: '$5', likedAt: new Date().toISOString() },
      { id: 'nairobi-14', title: 'Karura Forest Walk', creator: 'NatureGuide', videoThumbnail: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400', category: 'Nature', location: 'Nairobi', price: '$6', likedAt: new Date().toISOString() },
      { id: 'nairobi-15', title: 'Ngong Hills Hike', creator: 'HikingGuide', videoThumbnail: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400', category: 'Adventure', location: 'Nairobi', price: '$30', likedAt: new Date().toISOString() },
      { id: 'nairobi-16', title: 'Coffee Plantation Tour', creator: 'CoffeeGuide', videoThumbnail: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400', category: 'Food', location: 'Nairobi', price: '$35', likedAt: new Date().toISOString() },
      { id: 'nairobi-17', title: 'Art Gallery Hopping', creator: 'ArtGuide', videoThumbnail: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=400', category: 'Art', location: 'Nairobi', price: '$0', likedAt: new Date().toISOString() },
      { id: 'nairobi-18', title: 'Westgate Mall Experience', creator: 'ShoppingGuide', videoThumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400', category: 'Shopping', location: 'Nairobi', price: '$0', likedAt: new Date().toISOString() },
      { id: 'nairobi-19', title: 'Kenyan BBQ Night', creator: 'FoodGuide', videoThumbnail: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400', category: 'Food', location: 'Nairobi', price: '$30', likedAt: new Date().toISOString() },
      { id: 'nairobi-20', title: 'Nairobi National Archives', creator: 'HistoryBuff', videoThumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', category: 'Culture', location: 'Nairobi', price: '$5', likedAt: new Date().toISOString() },
      { id: 'nairobi-21', title: 'Safari Walk Experience', creator: 'WildlifeGuide', videoThumbnail: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?w=400', category: 'Wildlife', location: 'Nairobi', price: '$20', likedAt: new Date().toISOString() },
      { id: 'nairobi-22', title: 'Blankets and Wine', creator: 'MusicGuide', videoThumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', category: 'Nightlife', location: 'Nairobi', price: '$25', likedAt: new Date().toISOString() },
      { id: 'nairobi-23', title: 'Nairobi Street Art Tour', creator: 'StreetArtGuide', videoThumbnail: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=400', category: 'Art', location: 'Nairobi', price: '$20', likedAt: new Date().toISOString() },
      { id: 'nairobi-24', title: 'Rooftop Bar Sunset', creator: 'NightlifeGuide', videoThumbnail: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400', category: 'Nightlife', location: 'Nairobi', price: '$0', likedAt: new Date().toISOString() },
      { id: 'nairobi-25', title: 'Ostrich Farm Visit', creator: 'FarmGuide', videoThumbnail: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400', category: 'Wildlife', location: 'Nairobi', price: '$15', likedAt: new Date().toISOString() },
      { id: 'nairobi-26', title: 'Swahili Cooking Class', creator: 'ChefGuide', videoThumbnail: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400', category: 'Food', location: 'Nairobi', price: '$50', likedAt: new Date().toISOString() },
      { id: 'nairobi-27', title: 'Matatu Culture Tour', creator: 'CultureGuide', videoThumbnail: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=400', category: 'Culture', location: 'Nairobi', price: '$25', likedAt: new Date().toISOString() },
      { id: 'nairobi-28', title: 'Photography Safari', creator: 'PhotoGuide', videoThumbnail: 'https://images.unsplash.com/photo-1547970810-dc1eac37d174?w=400', category: 'Wildlife', location: 'Nairobi', price: '$100', likedAt: new Date().toISOString() },
      { id: 'nairobi-29', title: 'Wine Tasting Evening', creator: 'WineGuide', videoThumbnail: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400', category: 'Food', location: 'Nairobi', price: '$40', likedAt: new Date().toISOString() },
      { id: 'nairobi-30', title: 'Nairobi by Night Tour', creator: 'NightGuide', videoThumbnail: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400', category: 'Nightlife', location: 'Nairobi', price: '$35', likedAt: new Date().toISOString() },
    ],
    createdAt: '2024-03-05T12:00:00Z',
    updatedAt: '2024-03-10T18:00:00Z',
    isPublic: true,
    collaborators: [],
    creatorName: 'KenyaAdventurer',
    coverImage: 'https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=400'
  },
];

const STORAGE_KEY = 'itineraries';
const ACTIVE_ITINERARY_KEY = 'activeItineraryId';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useItineraries = () => {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [activeItineraryId, setActiveItineraryId] = useState<string | null>(null);

  // Load itineraries from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedActiveId = localStorage.getItem(ACTIVE_ITINERARY_KEY);
    
    if (stored) {
      const parsed = JSON.parse(stored);
      setItineraries(parsed);
      
      // Set active itinerary
      if (storedActiveId && parsed.find((i: Itinerary) => i.id === storedActiveId)) {
        setActiveItineraryId(storedActiveId);
      } else if (parsed.length > 0) {
        setActiveItineraryId(parsed[0].id);
      }
    } else {
      // Create default itinerary
      const defaultItinerary: Itinerary = {
        id: generateId(),
        name: 'My Trip',
        experiences: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: false,
        collaborators: []
      };
      setItineraries([defaultItinerary]);
      setActiveItineraryId(defaultItinerary.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultItinerary]));
      localStorage.setItem(ACTIVE_ITINERARY_KEY, defaultItinerary.id);
    }

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setItineraries(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const saveItineraries = useCallback((newItineraries: Itinerary[]) => {
    setItineraries(newItineraries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItineraries));
    window.dispatchEvent(new CustomEvent('itinerariesChanged', { detail: newItineraries }));
  }, []);

  const activeItinerary = itineraries.find(i => i.id === activeItineraryId) || null;

  const setActiveItinerary = useCallback((id: string) => {
    setActiveItineraryId(id);
    localStorage.setItem(ACTIVE_ITINERARY_KEY, id);
  }, []);

  const createItinerary = useCallback((name: string): Itinerary => {
    const newItinerary: Itinerary = {
      id: generateId(),
      name,
      experiences: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false,
      collaborators: []
    };
    const updated = [...itineraries, newItinerary];
    saveItineraries(updated);
    setActiveItinerary(newItinerary.id);
    return newItinerary;
  }, [itineraries, saveItineraries, setActiveItinerary]);

  const deleteItinerary = useCallback((id: string) => {
    const updated = itineraries.filter(i => i.id !== id);
    if (updated.length === 0) {
      // Always keep at least one itinerary
      const defaultItinerary: Itinerary = {
        id: generateId(),
        name: 'My Trip',
        experiences: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: false,
        collaborators: []
      };
      saveItineraries([defaultItinerary]);
      setActiveItinerary(defaultItinerary.id);
    } else {
      saveItineraries(updated);
      if (activeItineraryId === id) {
        setActiveItinerary(updated[0].id);
      }
    }
  }, [itineraries, activeItineraryId, saveItineraries, setActiveItinerary]);

  const renameItinerary = useCallback((id: string, newName: string) => {
    const updated = itineraries.map(i =>
      i.id === id ? { ...i, name: newName, updatedAt: new Date().toISOString() } : i
    );
    saveItineraries(updated);
  }, [itineraries, saveItineraries]);

  const addExperience = useCallback((experience: Omit<LikedExperience, 'likedAt'>) => {
    if (!activeItineraryId) return false;
    
    const updated = itineraries.map(i => {
      if (i.id !== activeItineraryId) return i;
      
      // Check if already exists
      if (i.experiences.some(e => e.id === experience.id)) return i;
      
      return {
        ...i,
        experiences: [...i.experiences, { ...experience, likedAt: new Date().toISOString() }],
        updatedAt: new Date().toISOString()
      };
    });
    saveItineraries(updated);
    return true;
  }, [activeItineraryId, itineraries, saveItineraries]);

  const addExperienceToItinerary = useCallback((itineraryId: string, experience: Omit<LikedExperience, 'likedAt'>) => {
    const updated = itineraries.map(i => {
      if (i.id !== itineraryId) return i;
      
      // Check if already exists
      if (i.experiences.some(e => e.id === experience.id)) return i;
      
      return {
        ...i,
        experiences: [...i.experiences, { ...experience, likedAt: new Date().toISOString() }],
        updatedAt: new Date().toISOString()
      };
    });
    saveItineraries(updated);
    return true;
  }, [itineraries, saveItineraries]);

  const removeExperience = useCallback((experienceId: string) => {
    if (!activeItineraryId) return;
    
    const updated = itineraries.map(i => {
      if (i.id !== activeItineraryId) return i;
      return {
        ...i,
        experiences: i.experiences.filter(e => e.id !== experienceId),
        updatedAt: new Date().toISOString()
      };
    });
    saveItineraries(updated);
  }, [activeItineraryId, itineraries, saveItineraries]);

  const reorderExperiences = useCallback((startIndex: number, endIndex: number) => {
    if (!activeItineraryId) return;
    
    const updated = itineraries.map(i => {
      if (i.id !== activeItineraryId) return i;
      
      const experiences = [...i.experiences];
      const [removed] = experiences.splice(startIndex, 1);
      experiences.splice(endIndex, 0, removed);
      
      return { ...i, experiences, updatedAt: new Date().toISOString() };
    });
    saveItineraries(updated);
  }, [activeItineraryId, itineraries, saveItineraries]);

  const togglePublic = useCallback((id: string) => {
    const updated = itineraries.map(i =>
      i.id === id ? { ...i, isPublic: !i.isPublic, updatedAt: new Date().toISOString() } : i
    );
    saveItineraries(updated);
  }, [itineraries, saveItineraries]);

  const addCollaborator = useCallback((itineraryId: string, email: string) => {
    const updated = itineraries.map(i => {
      if (i.id !== itineraryId) return i;
      if (i.collaborators.includes(email)) return i;
      return {
        ...i,
        collaborators: [...i.collaborators, email],
        updatedAt: new Date().toISOString()
      };
    });
    saveItineraries(updated);
  }, [itineraries, saveItineraries]);

  const removeCollaborator = useCallback((itineraryId: string, email: string) => {
    const updated = itineraries.map(i => {
      if (i.id !== itineraryId) return i;
      return {
        ...i,
        collaborators: i.collaborators.filter(c => c !== email),
        updatedAt: new Date().toISOString()
      };
    });
    saveItineraries(updated);
  }, [itineraries, saveItineraries]);

  const isInItinerary = useCallback((experienceId: string) => {
    return activeItinerary?.experiences.some(e => e.id === experienceId) || false;
  }, [activeItinerary]);

  const getShareUrl = useCallback((itineraryId: string) => {
    return `${window.location.origin}/itinerary/${itineraryId}`;
  }, []);

  const copyItinerary = useCallback((sourceItinerary: Itinerary, newName?: string, targetItineraryId?: string) => {
    if (targetItineraryId) {
      // Merge into existing itinerary
      const updated = itineraries.map(i => {
        if (i.id !== targetItineraryId) return i;
        
        const existingIds = new Set(i.experiences.map(e => e.id));
        const newExperiences = sourceItinerary.experiences.filter(e => !existingIds.has(e.id));
        
        return {
          ...i,
          experiences: [...i.experiences, ...newExperiences],
          updatedAt: new Date().toISOString()
        };
      });
      saveItineraries(updated);
      return itineraries.find(i => i.id === targetItineraryId) || null;
    } else {
      // Create new copy
      const newItinerary: Itinerary = {
        id: generateId(),
        name: newName || `${sourceItinerary.name} (Copy)`,
        experiences: sourceItinerary.experiences.map(e => ({ ...e, likedAt: new Date().toISOString() })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: false,
        collaborators: []
      };
      const updated = [...itineraries, newItinerary];
      saveItineraries(updated);
      setActiveItinerary(newItinerary.id);
      return newItinerary;
    }
  }, [itineraries, saveItineraries, setActiveItinerary]);

  return {
    itineraries,
    activeItinerary,
    activeItineraryId,
    setActiveItinerary,
    createItinerary,
    deleteItinerary,
    renameItinerary,
    addExperience,
    addExperienceToItinerary,
    removeExperience,
    reorderExperiences,
    togglePublic,
    addCollaborator,
    removeCollaborator,
    isInItinerary,
    getShareUrl,
    copyItinerary,
    experienceCount: activeItinerary?.experiences.length || 0
  };
};
