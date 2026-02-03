import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LikedExperience } from './useLikedExperiences';

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  experiences: LikedExperience[];
  createdAt: string;
}

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
  trips?: Trip[];
  activeTripId?: string;
}

const STORAGE_KEY = 'itineraries';
const ACTIVE_ITINERARY_KEY = 'activeItineraryId';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useItineraries = () => {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [activeItineraryId, setActiveItineraryIdState] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convert DB row to Itinerary
  const dbToItinerary = (row: any): Itinerary => ({
    id: row.id,
    name: row.name,
    experiences: (row.experiences as LikedExperience[]) || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isPublic: row.is_public || false,
    collaborators: row.collaborators || [],
    coverImage: row.cover_image,
    tag: row.tag as 'popular' | 'fave' | undefined,
    startDate: row.start_date,
    theme: row.theme,
    trips: (row.trips as Trip[]) || [],
    activeTripId: row.active_trip_id
  });

  // Convert Itinerary to DB format
  const itineraryToDb = (itinerary: Itinerary, uid: string) => ({
    id: itinerary.id,
    user_id: uid,
    name: itinerary.name,
    experiences: JSON.parse(JSON.stringify(itinerary.experiences)),
    trips: JSON.parse(JSON.stringify(itinerary.trips || [])),
    active_trip_id: itinerary.activeTripId || null,
    is_public: itinerary.isPublic,
    collaborators: itinerary.collaborators,
    cover_image: itinerary.coverImage || null,
    tag: itinerary.tag || null,
    start_date: itinerary.startDate || null,
    theme: itinerary.theme || null
  });

  // Sync localStorage itineraries to database for new user
  const syncLocalToDatabase = useCallback(async (uid: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const localItineraries: Itinerary[] = JSON.parse(stored);
    if (localItineraries.length === 0) return;

    // Check if user already has itineraries
    const { data: existing } = await supabase
      .from('itineraries')
      .select('id')
      .eq('user_id', uid)
      .limit(1);

    if (existing && existing.length > 0) {
      // User already has itineraries, don't overwrite
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_ITINERARY_KEY);
      return;
    }

    // Upload local itineraries to database
    for (const itinerary of localItineraries) {
      const dbData = itineraryToDb({
        ...itinerary,
        id: crypto.randomUUID() // Generate proper UUID for database
      }, uid);

      await supabase.from('itineraries').insert(dbData);
    }

    // Clear localStorage after sync
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_ITINERARY_KEY);
  }, []);

  // Load itineraries from database or localStorage
  const loadItineraries = useCallback(async (uid: string | null) => {
    setIsLoading(true);
    
    if (uid) {
      // First sync any local itineraries
      await syncLocalToDatabase(uid);

      // Load from database
      const { data, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading itineraries:', error);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const loaded = data.map(dbToItinerary);
        setItineraries(loaded);
        
        const storedActiveId = localStorage.getItem(ACTIVE_ITINERARY_KEY);
        if (storedActiveId && loaded.find(i => i.id === storedActiveId)) {
          setActiveItineraryIdState(storedActiveId);
        } else {
          setActiveItineraryIdState(loaded[0].id);
          localStorage.setItem(ACTIVE_ITINERARY_KEY, loaded[0].id);
        }
      } else {
        // Create default itinerary for new user
        const newId = crypto.randomUUID();
        const defaultItinerary: Itinerary = {
          id: newId,
          name: 'My Trip',
          experiences: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPublic: false,
          collaborators: []
        };

        await supabase.from('itineraries').insert(itineraryToDb(defaultItinerary, uid));
        setItineraries([defaultItinerary]);
        setActiveItineraryIdState(newId);
        localStorage.setItem(ACTIVE_ITINERARY_KEY, newId);
      }
    } else {
      // Load from localStorage for unauthenticated users
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedActiveId = localStorage.getItem(ACTIVE_ITINERARY_KEY);

      if (stored) {
        const parsed = JSON.parse(stored);
        setItineraries(parsed);

        if (storedActiveId && parsed.find((i: Itinerary) => i.id === storedActiveId)) {
          setActiveItineraryIdState(storedActiveId);
        } else if (parsed.length > 0) {
          setActiveItineraryIdState(parsed[0].id);
        }
      } else {
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
        setActiveItineraryIdState(defaultItinerary.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultItinerary]));
        localStorage.setItem(ACTIVE_ITINERARY_KEY, defaultItinerary.id);
      }
    }
    
    setIsLoading(false);
  }, [syncLocalToDatabase]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id || null;
      setUserId(newUserId);
      
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        loadItineraries(newUserId);
      }
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      loadItineraries(uid);
    });

    return () => subscription.unsubscribe();
  }, [loadItineraries]);

  // Listen for cross-tab and same-tab updates (for unauthenticated users)
  useEffect(() => {
    if (userId) return; // Only for unauthenticated users

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setItineraries(JSON.parse(e.newValue));
      }
    };

    const handleItinerariesChanged = (e: CustomEvent<Itinerary[]>) => {
      setItineraries(e.detail);
    };

    const handleActiveItineraryChanged = (e: CustomEvent<string>) => {
      setActiveItineraryIdState(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('itinerariesChanged', handleItinerariesChanged as EventListener);
    window.addEventListener('activeItineraryChanged', handleActiveItineraryChanged as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('itinerariesChanged', handleItinerariesChanged as EventListener);
      window.removeEventListener('activeItineraryChanged', handleActiveItineraryChanged as EventListener);
    };
  }, [userId]);

  // Save itineraries (to DB or localStorage)
  const saveItineraries = useCallback(async (newItineraries: Itinerary[]) => {
    setItineraries(newItineraries);

    if (userId) {
      // Save to database - batch update all modified itineraries
      for (const itinerary of newItineraries) {
        const dbData = itineraryToDb(itinerary, userId);
        await supabase
          .from('itineraries')
          .upsert(dbData, { onConflict: 'id' });
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItineraries));
      window.dispatchEvent(new CustomEvent('itinerariesChanged', { detail: newItineraries }));
    }
  }, [userId]);

  const activeItinerary = itineraries.find(i => i.id === activeItineraryId) || null;

  const setActiveItinerary = useCallback((id: string) => {
    setActiveItineraryIdState(id);
    localStorage.setItem(ACTIVE_ITINERARY_KEY, id);
    window.dispatchEvent(new CustomEvent('activeItineraryChanged', { detail: id }));
  }, []);

  const createItinerary = useCallback(async (name: string, initialExperiences?: LikedExperience[]): Promise<Itinerary> => {
    const newId = userId ? crypto.randomUUID() : generateId();
    const newItinerary: Itinerary = {
      id: newId,
      name,
      experiences: initialExperiences || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false,
      collaborators: []
    };

    if (userId) {
      await supabase.from('itineraries').insert(itineraryToDb(newItinerary, userId));
    }

    const updated = [...itineraries, newItinerary];
    setItineraries(updated);
    
    if (!userId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('itinerariesChanged', { detail: updated }));
    }
    
    setActiveItinerary(newId);
    return newItinerary;
  }, [userId, itineraries, setActiveItinerary]);

  const deleteItinerary = useCallback(async (id: string) => {
    if (userId) {
      await supabase.from('itineraries').delete().eq('id', id);
    }

    let updated = itineraries.filter(i => i.id !== id);
    
    if (updated.length === 0) {
      const newId = userId ? crypto.randomUUID() : generateId();
      const defaultItinerary: Itinerary = {
        id: newId,
        name: 'My Trip',
        experiences: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: false,
        collaborators: []
      };
      
      if (userId) {
        await supabase.from('itineraries').insert(itineraryToDb(defaultItinerary, userId));
      }
      
      updated = [defaultItinerary];
      setItineraries(updated);
      setActiveItinerary(newId);
    } else {
      setItineraries(updated);
      if (activeItineraryId === id) {
        setActiveItinerary(updated[0].id);
      }
    }

    if (!userId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('itinerariesChanged', { detail: updated }));
    }
  }, [userId, itineraries, activeItineraryId, setActiveItinerary]);

  const renameItinerary = useCallback(async (id: string, newName: string) => {
    const updated = itineraries.map(i =>
      i.id === id ? { ...i, name: newName, updatedAt: new Date().toISOString() } : i
    );
    await saveItineraries(updated);
  }, [itineraries, saveItineraries]);

  const addExperience = useCallback(async (experience: Omit<LikedExperience, 'likedAt'>) => {
    if (!activeItineraryId) return false;

    const updated = itineraries.map(i => {
      if (i.id !== activeItineraryId) return i;
      if (i.experiences.some(e => e.id === experience.id)) return i;
      return {
        ...i,
        experiences: [...i.experiences, { ...experience, likedAt: new Date().toISOString() }],
        updatedAt: new Date().toISOString()
      };
    });
    await saveItineraries(updated);
    return true;
  }, [activeItineraryId, itineraries, saveItineraries]);

  const addExperienceToItinerary = useCallback(async (itineraryId: string, experience: Omit<LikedExperience, 'likedAt'>) => {
    const updated = itineraries.map(i => {
      if (i.id !== itineraryId) return i;
      return {
        ...i,
        experiences: [...i.experiences, { ...experience, likedAt: new Date().toISOString() }],
        updatedAt: new Date().toISOString()
      };
    });
    await saveItineraries(updated);
    return true;
  }, [itineraries, saveItineraries]);

  const removeExperience = useCallback(async (experienceId: string) => {
    if (!activeItineraryId) return;

    const updated = itineraries.map(i => {
      if (i.id !== activeItineraryId) return i;
      return {
        ...i,
        experiences: i.experiences.filter(e => e.id !== experienceId),
        updatedAt: new Date().toISOString()
      };
    });
    await saveItineraries(updated);
  }, [activeItineraryId, itineraries, saveItineraries]);

  const updateExperienceDetails = useCallback(async (experienceId: string, updates: Partial<LikedExperience>, targetItineraryId?: string) => {
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
    await saveItineraries(updated);
  }, [activeItineraryId, itineraries, saveItineraries]);

  const reorderExperiences = useCallback(async (startIndex: number, endIndex: number) => {
    if (!activeItineraryId) return;

    const updated = itineraries.map(i => {
      if (i.id !== activeItineraryId) return i;
      const experiences = [...i.experiences];
      const [removed] = experiences.splice(startIndex, 1);
      experiences.splice(endIndex, 0, removed);
      return { ...i, experiences, updatedAt: new Date().toISOString() };
    });
    await saveItineraries(updated);
  }, [activeItineraryId, itineraries, saveItineraries]);

  const togglePublic = useCallback(async (id: string) => {
    const updated = itineraries.map(i =>
      i.id === id ? { ...i, isPublic: !i.isPublic, updatedAt: new Date().toISOString() } : i
    );
    await saveItineraries(updated);
  }, [itineraries, saveItineraries]);

  const addCollaborator = useCallback(async (itineraryId: string, email: string) => {
    const updated = itineraries.map(i => {
      if (i.id !== itineraryId) return i;
      if (i.collaborators.includes(email)) return i;
      return {
        ...i,
        collaborators: [...i.collaborators, email],
        updatedAt: new Date().toISOString()
      };
    });
    await saveItineraries(updated);
  }, [itineraries, saveItineraries]);

  const removeCollaborator = useCallback(async (itineraryId: string, email: string) => {
    const updated = itineraries.map(i => {
      if (i.id !== itineraryId) return i;
      return {
        ...i,
        collaborators: i.collaborators.filter(c => c !== email),
        updatedAt: new Date().toISOString()
      };
    });
    await saveItineraries(updated);
  }, [itineraries, saveItineraries]);

  const isInItinerary = useCallback((experienceId: string) => {
    return activeItinerary?.experiences.some(e => e.id === experienceId) || false;
  }, [activeItinerary]);

  const getShareUrl = useCallback((itineraryId: string) => {
    return `${window.location.origin}/itinerary/${itineraryId}`;
  }, []);

  const copyItinerary = useCallback(async (sourceItinerary: Itinerary, newName?: string, targetItineraryId?: string) => {
    if (targetItineraryId) {
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
      await saveItineraries(updated);
      return itineraries.find(i => i.id === targetItineraryId) || null;
    } else {
      const newId = userId ? crypto.randomUUID() : generateId();
      const newItinerary: Itinerary = {
        id: newId,
        name: newName || `${sourceItinerary.name} (Copy)`,
        experiences: sourceItinerary.experiences.map(e => ({ ...e, likedAt: new Date().toISOString() })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: false,
        collaborators: []
      };
      
      if (userId) {
        await supabase.from('itineraries').insert(itineraryToDb(newItinerary, userId));
      }
      
      const updated = [...itineraries, newItinerary];
      setItineraries(updated);
      
      if (!userId) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('itinerariesChanged', { detail: updated }));
      }
      
      setActiveItinerary(newId);
      return newItinerary;
    }
  }, [userId, itineraries, saveItineraries, setActiveItinerary]);

  const updateItineraryCover = useCallback(async (id: string, coverImage: string) => {
    const updated = itineraries.map(i =>
      i.id === id ? { ...i, coverImage, updatedAt: new Date().toISOString() } : i
    );
    await saveItineraries(updated);
  }, [itineraries, saveItineraries]);

  const createTrip = useCallback(async (itineraryId: string, tripName: string, startDate: string, endDate?: string, scheduledExperiences?: LikedExperience[]): Promise<Trip | null> => {
    const newTrip: Trip = {
      id: generateId(),
      name: tripName,
      startDate,
      endDate,
      experiences: scheduledExperiences || [],
      createdAt: new Date().toISOString()
    };

    const updated = itineraries.map(i => {
      if (i.id !== itineraryId) return i;
      const existingTrips = i.trips || [];
      return {
        ...i,
        trips: [...existingTrips, newTrip],
        activeTripId: newTrip.id,
        updatedAt: new Date().toISOString()
      };
    });

    await saveItineraries(updated);
    return newTrip;
  }, [itineraries, saveItineraries]);

  const deleteTrip = useCallback(async (itineraryId: string, tripId: string) => {
    const updated = itineraries.map(i => {
      if (i.id !== itineraryId) return i;
      const remainingTrips = (i.trips || []).filter(t => t.id !== tripId);
      return {
        ...i,
        trips: remainingTrips,
        activeTripId: i.activeTripId === tripId ? remainingTrips[0]?.id : i.activeTripId,
        updatedAt: new Date().toISOString()
      };
    });
    await saveItineraries(updated);
  }, [itineraries, saveItineraries]);

  const renameTrip = useCallback(async (itineraryId: string, tripId: string, newName: string) => {
    const updated = itineraries.map(i => {
      if (i.id !== itineraryId) return i;
      return {
        ...i,
        trips: (i.trips || []).map(t => t.id === tripId ? { ...t, name: newName } : t),
        updatedAt: new Date().toISOString()
      };
    });
    await saveItineraries(updated);
  }, [itineraries, saveItineraries]);

  const setActiveTrip = useCallback(async (itineraryId: string, tripId: string) => {
    const updated = itineraries.map(i => {
      if (i.id !== itineraryId) return i;
      return { ...i, activeTripId: tripId, updatedAt: new Date().toISOString() };
    });
    await saveItineraries(updated);
  }, [itineraries, saveItineraries]);

  const updateTripExperiences = useCallback(async (itineraryId: string, tripId: string, experiences: LikedExperience[]) => {
    const updated = itineraries.map(i => {
      if (i.id !== itineraryId) return i;
      return {
        ...i,
        trips: (i.trips || []).map(t => t.id === tripId ? { ...t, experiences } : t),
        updatedAt: new Date().toISOString()
      };
    });
    await saveItineraries(updated);
  }, [itineraries, saveItineraries]);

  return {
    itineraries,
    activeItinerary,
    activeItineraryId,
    isLoading,
    isAuthenticated: !!userId,
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
    experienceCount: activeItinerary?.experiences.length || 0,
    createTrip,
    deleteTrip,
    renameTrip,
    setActiveTrip,
    updateTripExperiences
  };
};
