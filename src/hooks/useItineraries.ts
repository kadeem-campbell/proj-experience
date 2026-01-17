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

// Sample public itineraries from other users - now focused on East Africa
export const publicItinerariesData: Itinerary[] = [
  {
    id: 'public-zanzibar-1',
    name: 'Zanzibar Paradise',
    experiences: [
      { id: 'zanzibar-1', title: 'Stone Town Walking Tour', creator: 'ZanzibarGuide', videoThumbnail: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=400', category: 'Culture', location: 'Stone Town', price: '$20', likedAt: new Date().toISOString() },
      { id: 'zanzibar-2', title: 'Spice Farm Visit', creator: 'SpiceExpert', videoThumbnail: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', category: 'Food', location: 'Zanzibar', price: '$30', likedAt: new Date().toISOString() },
      { id: 'zanzibar-3', title: 'Nungwi Beach Day', creator: 'BeachLife', videoThumbnail: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=400', category: 'Beach', location: 'Nungwi', price: '$0', likedAt: new Date().toISOString() },
      { id: 'zanzibar-4', title: 'Sunset Dhow Cruise', creator: 'OceanViews', videoThumbnail: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400', category: 'Adventure', location: 'Zanzibar', price: '$45', likedAt: new Date().toISOString() },
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
    ],
    createdAt: '2024-03-05T12:00:00Z',
    updatedAt: '2024-03-10T18:00:00Z',
    isPublic: true,
    collaborators: [],
    creatorName: 'KenyaAdventurer',
    coverImage: 'https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=400'
  },
  {
    id: 'public-kigali-1',
    name: 'Kigali Culture Trail',
    experiences: [
      { id: 'kigali-1', title: 'Genocide Memorial', creator: 'RwandaGuide', videoThumbnail: 'https://images.unsplash.com/photo-1580746738893-e6c7e79c4fc2?w=400', category: 'Culture', location: 'Kigali', price: '$10', likedAt: new Date().toISOString() },
      { id: 'kigali-2', title: 'Inema Arts Center', creator: 'ArtLover', videoThumbnail: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=400', category: 'Art', location: 'Kigali', price: '$5', likedAt: new Date().toISOString() },
      { id: 'kigali-3', title: 'Local Coffee Experience', creator: 'CoffeeMaster', videoThumbnail: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400', category: 'Food', location: 'Kigali', price: '$20', likedAt: new Date().toISOString() },
    ],
    createdAt: '2024-02-20T09:00:00Z',
    updatedAt: '2024-02-25T14:00:00Z',
    isPublic: true,
    collaborators: [],
    creatorName: 'RwandaExplorer',
    coverImage: 'https://images.unsplash.com/photo-1580746738893-e6c7e79c4fc2?w=400'
  },
  {
    id: 'public-addis-1',
    name: 'Addis Ababa Coffee & Culture',
    experiences: [
      { id: 'addis-1', title: 'Ethiopian Coffee Ceremony', creator: 'CoffeeOrigins', videoThumbnail: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', category: 'Food', location: 'Addis Ababa', price: '$15', likedAt: new Date().toISOString() },
      { id: 'addis-2', title: 'Merkato Market Tour', creator: 'MarketGuide', videoThumbnail: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400', category: 'Culture', location: 'Addis Ababa', price: '$20', likedAt: new Date().toISOString() },
      { id: 'addis-3', title: 'National Museum Visit', creator: 'HistoryBuff', videoThumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', category: 'Culture', location: 'Addis Ababa', price: '$10', likedAt: new Date().toISOString() },
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    isPublic: true,
    collaborators: [],
    creatorName: 'EthiopiaLover',
    coverImage: 'https://images.unsplash.com/photo-1578147488616-da9c23597803?w=400'
  },
  {
    id: 'public-kampala-1',
    name: 'Kampala Vibes',
    experiences: [
      { id: 'kampala-1', title: 'Owino Market Adventure', creator: 'UgandaGuide', videoThumbnail: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400', category: 'Culture', location: 'Kampala', price: '$10', likedAt: new Date().toISOString() },
      { id: 'kampala-2', title: 'Rolex Street Food Tour', creator: 'StreetFoodie', videoThumbnail: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', category: 'Food', location: 'Kampala', price: '$15', likedAt: new Date().toISOString() },
      { id: 'kampala-3', title: 'Ndere Cultural Centre', creator: 'CultureKeeper', videoThumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400', category: 'Culture', location: 'Kampala', price: '$25', likedAt: new Date().toISOString() },
    ],
    createdAt: '2024-06-01T11:00:00Z',
    updatedAt: '2024-06-05T15:00:00Z',
    isPublic: true,
    collaborators: [],
    creatorName: 'UgandaAdventurer',
    coverImage: 'https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=400'
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
