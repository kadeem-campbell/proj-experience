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
  tag?: 'popular' | 'fave';
  startDate?: string;
  theme?: string;
}

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

    // Listen for storage changes (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setItineraries(JSON.parse(e.newValue));
      }
    };

    // Listen for same-tab itinerary changes
    const handleItinerariesChanged = (e: CustomEvent<Itinerary[]>) => {
      setItineraries(e.detail);
    };

    // Listen for active itinerary changes
    const handleActiveItineraryChanged = (e: CustomEvent<string>) => {
      setActiveItineraryId(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('itinerariesChanged', handleItinerariesChanged as EventListener);
    window.addEventListener('activeItineraryChanged', handleActiveItineraryChanged as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('itinerariesChanged', handleItinerariesChanged as EventListener);
      window.removeEventListener('activeItineraryChanged', handleActiveItineraryChanged as EventListener);
    };
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
    window.dispatchEvent(new CustomEvent('activeItineraryChanged', { detail: id }));
  }, []);

  const createItinerary = useCallback((name: string, initialExperiences?: LikedExperience[]): Itinerary => {
    const newItinerary: Itinerary = {
      id: generateId(),
      name,
      experiences: initialExperiences || [],
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

  const updateExperienceDetails = useCallback((experienceId: string, updates: Partial<LikedExperience>, targetItineraryId?: string) => {
    const itineraryIdToUpdate = targetItineraryId || activeItineraryId;
    if (!itineraryIdToUpdate) return;
    
    const updated = itineraries.map(i => {
      if (i.id !== itineraryIdToUpdate) return i;
      return {
        ...i,
        experiences: i.experiences.map(e => 
          e.id === experienceId ? { ...e, ...updates } : e
        ),
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

  const updateItineraryCover = useCallback((id: string, coverImage: string) => {
    const updated = itineraries.map(i =>
      i.id === id ? { ...i, coverImage, updatedAt: new Date().toISOString() } : i
    );
    saveItineraries(updated);
  }, [itineraries, saveItineraries]);

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
    updateItineraryCover,
    updateExperienceDetails,
    experienceCount: activeItinerary?.experiences.length || 0
  };
};
