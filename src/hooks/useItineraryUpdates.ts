import { useState, useCallback, useEffect } from 'react';

export interface ItineraryUpdate {
  id: string;
  type: 'created' | 'added_experiences' | 'collaborator_added' | 'collaborator_change' | 'experience_added' | 'trip_created' | 'shared' | 'collaborator_invited';
  message: string;
  itineraryId: string;
  itineraryName: string;
  createdAt: string;
  read: boolean;
}

const UPDATES_KEY = 'itinerary_updates';

const loadUpdates = (): ItineraryUpdate[] => {
  try {
    const stored = localStorage.getItem(UPDATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const persistUpdates = (updates: ItineraryUpdate[]) => {
  localStorage.setItem(UPDATES_KEY, JSON.stringify(updates));
  window.dispatchEvent(new CustomEvent('itineraryUpdatesChanged', { detail: updates }));
};

export const useItineraryUpdates = () => {
  const [updates, setUpdates] = useState<ItineraryUpdate[]>(loadUpdates);

  useEffect(() => {
    const handler = (e: CustomEvent<ItineraryUpdate[]>) => setUpdates(e.detail);
    window.addEventListener('itineraryUpdatesChanged', handler as EventListener);
    return () => window.removeEventListener('itineraryUpdatesChanged', handler as EventListener);
  }, []);

  const addUpdate = useCallback((update: Omit<ItineraryUpdate, 'id' | 'createdAt' | 'read'>) => {
    const newUpdate: ItineraryUpdate = {
      ...update,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
      read: false,
    };
    const next = [newUpdate, ...loadUpdates()].slice(0, 50); // keep last 50
    setUpdates(next);
    persistUpdates(next);
    return newUpdate;
  }, []);

  const markAsRead = useCallback((itineraryId: string) => {
    const current = loadUpdates();
    const next = current.map(u => u.itineraryId === itineraryId ? { ...u, read: true } : u);
    setUpdates(next);
    persistUpdates(next);
  }, []);

  const markAllRead = useCallback(() => {
    const current = loadUpdates();
    const next = current.map(u => ({ ...u, read: true }));
    setUpdates(next);
    persistUpdates(next);
  }, []);

  const unreadCount = updates.filter(u => !u.read).length;

  return {
    updates,
    unreadCount,
    addUpdate,
    markAsRead,
    markAllRead,
  };
};
