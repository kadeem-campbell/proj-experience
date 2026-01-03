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

// Sample public itineraries from other users
export const publicItinerariesData: Itinerary[] = [
  {
    id: 'public-london-1',
    name: 'My London Trip',
    experiences: [
      { id: 'london-1', title: 'Tower of London Tour', creator: 'LondonGuide', videoThumbnail: '', category: 'Culture', location: 'London', price: '$45', likedAt: new Date().toISOString() },
      { id: 'london-2', title: 'Thames River Cruise', creator: 'RiverTours', videoThumbnail: '', category: 'Adventure', location: 'London', price: '$30', likedAt: new Date().toISOString() },
      { id: 'london-3', title: 'West End Show', creator: 'TheatreLover', videoThumbnail: '', category: 'Entertainment', location: 'London', price: '$80', likedAt: new Date().toISOString() },
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    isPublic: true,
    collaborators: [],
    creatorName: 'TravellerEmma',
    coverImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400'
  },
  {
    id: 'public-nigeria-1',
    name: 'Nigeria Trail',
    experiences: [
      { id: 'nigeria-1', title: 'Lagos Street Food Tour', creator: 'NaijaFoodie', videoThumbnail: '', category: 'Food', location: 'Lagos', price: '$25', likedAt: new Date().toISOString() },
      { id: 'nigeria-2', title: 'Lekki Conservation Centre', creator: 'WildNigeria', videoThumbnail: '', category: 'Wildlife', location: 'Lagos', price: '$15', likedAt: new Date().toISOString() },
      { id: 'nigeria-3', title: 'Nike Art Gallery Visit', creator: 'ArtExplorer', videoThumbnail: '', category: 'Culture', location: 'Lagos', price: '$10', likedAt: new Date().toISOString() },
    ],
    createdAt: '2024-02-10T08:00:00Z',
    updatedAt: '2024-02-15T16:00:00Z',
    isPublic: true,
    collaborators: [],
    creatorName: 'AfricanAdventurer',
    coverImage: 'https://images.unsplash.com/photo-1618828665011-0abd973f7bb8?w=400'
  },
  {
    id: 'public-sa-1',
    name: 'SA at Dusk',
    experiences: [
      { id: 'sa-1', title: 'Table Mountain Sunset', creator: 'CapeTownVibes', videoThumbnail: '', category: 'Adventure', location: 'Cape Town', price: '$40', likedAt: new Date().toISOString() },
      { id: 'sa-2', title: 'Camps Bay Beach Evening', creator: 'BeachLover', videoThumbnail: '', category: 'Beach', location: 'Cape Town', price: '$0', likedAt: new Date().toISOString() },
      { id: 'sa-3', title: 'Stellenbosch Wine Tasting', creator: 'WineSommelier', videoThumbnail: '', category: 'Food', location: 'Stellenbosch', price: '$55', likedAt: new Date().toISOString() },
    ],
    createdAt: '2024-03-05T12:00:00Z',
    updatedAt: '2024-03-10T18:00:00Z',
    isPublic: true,
    collaborators: [],
    creatorName: 'SunsetChaser',
    coverImage: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400'
  },
  {
    id: 'public-brazil-1',
    name: 'Water Sports in Brazil',
    experiences: [
      { id: 'brazil-1', title: 'Rio Surfing Lessons', creator: 'BrazilSurf', videoThumbnail: '', category: 'Water Sports', location: 'Rio de Janeiro', price: '$60', likedAt: new Date().toISOString() },
      { id: 'brazil-2', title: 'Jet Ski Adventure', creator: 'WaterSportsPro', videoThumbnail: '', category: 'Water Sports', location: 'Florianópolis', price: '$85', likedAt: new Date().toISOString() },
      { id: 'brazil-3', title: 'Kayak through Mangroves', creator: 'EcoTours', videoThumbnail: '', category: 'Water Sports', location: 'Paraty', price: '$45', likedAt: new Date().toISOString() },
      { id: 'brazil-4', title: 'Stand-up Paddleboard', creator: 'SUPBrazil', videoThumbnail: '', category: 'Water Sports', location: 'Búzios', price: '$35', likedAt: new Date().toISOString() },
    ],
    createdAt: '2024-04-01T09:00:00Z',
    updatedAt: '2024-04-08T11:00:00Z',
    isPublic: true,
    collaborators: [],
    creatorName: 'WaterSportsJunkie',
    coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'
  },
  {
    id: 'public-zanzibar-1',
    name: 'Zanzibar Paradise',
    experiences: [
      { id: 'zanzibar-1', title: 'Stone Town Walking Tour', creator: 'ZanzibarGuide', videoThumbnail: '', category: 'Culture', location: 'Stone Town', price: '$20', likedAt: new Date().toISOString() },
      { id: 'zanzibar-2', title: 'Spice Farm Visit', creator: 'SpiceExpert', videoThumbnail: '', category: 'Food', location: 'Zanzibar', price: '$30', likedAt: new Date().toISOString() },
      { id: 'zanzibar-3', title: 'Nungwi Beach Day', creator: 'BeachLife', videoThumbnail: '', category: 'Beach', location: 'Nungwi', price: '$0', likedAt: new Date().toISOString() },
    ],
    createdAt: '2024-05-12T14:00:00Z',
    updatedAt: '2024-05-18T10:00:00Z',
    isPublic: true,
    collaborators: [],
    creatorName: 'IslandHopper',
    coverImage: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=400'
  }
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

  return {
    itineraries,
    activeItinerary,
    activeItineraryId,
    setActiveItinerary,
    createItinerary,
    deleteItinerary,
    renameItinerary,
    addExperience,
    removeExperience,
    reorderExperiences,
    togglePublic,
    addCollaborator,
    removeCollaborator,
    isInItinerary,
    getShareUrl,
    experienceCount: activeItinerary?.experiences.length || 0
  };
};
