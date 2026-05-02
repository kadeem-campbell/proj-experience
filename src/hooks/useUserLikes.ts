import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserLike {
  id: string;
  user_id: string;
  item_id: string;
  item_type: 'experience' | 'itinerary' | 'poi';
  // Existing cards read flexible cached metadata from this object.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item_data: Record<string, any>;
  created_at: string;
}

const LOCAL_STORAGE_KEY = 'user_likes_cache';

let sharedLikes: UserLike[] = [];
let sharedLoading = true;
let loadedLikesForUserId: string | null = null;
let likesFetchInFlightForUserId: string | null = null;
const likeListeners = new Set<() => void>();

const emitLikes = () => likeListeners.forEach((listener) => listener());
const setSharedLikes = (likes: UserLike[]) => {
  sharedLikes = likes;
  emitLikes();
};
const setSharedLoading = (loading: boolean) => {
  sharedLoading = loading;
  emitLikes();
};

export const useUserLikes = () => {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState(() => ({ likes: sharedLikes, loading: sharedLoading }));
  const { likes, loading } = snapshot;

  useEffect(() => {
    const listener = () => setSnapshot({ likes: sharedLikes, loading: sharedLoading });
    likeListeners.add(listener);
    return () => { likeListeners.delete(listener); };
  }, []);

  // Fetch likes from database
  const fetchLikes = useCallback(async () => {
    if (!user?.id) {
      setSharedLikes([]);
      setSharedLoading(false);
      loadedLikesForUserId = null;
      return;
    }

    if (loadedLikesForUserId === user.id) {
      setSharedLoading(false);
      return;
    }

    if (likesFetchInFlightForUserId === user.id) return;
    likesFetchInFlightForUserId = user.id;

    try {
      const { data, error } = await supabase
        .from('user_likes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedLikes = (data || []).map(like => ({
        ...like,
        item_type: like.item_type as 'experience' | 'itinerary' | 'poi',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        item_data: like.item_data as Record<string, any>
      }));
      
      setSharedLikes(typedLikes);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(typedLikes));
      loadedLikesForUserId = user.id;
    } catch (error) {
      console.error('Error fetching likes:', error);
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        setSharedLikes(JSON.parse(cached));
      }
    } finally {
      likesFetchInFlightForUserId = null;
      setSharedLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  // Toggle like with OPTIMISTIC update - instant UI, background DB sync
  const toggleLike = async (
    itemId: string, 
    itemType: 'experience' | 'itinerary' | 'poi',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    itemData: Record<string, any>
  ): Promise<boolean> => {
    if (!user?.id) return false;

    const existingLike = likes.find(l => l.item_id === itemId && l.item_type === itemType);

    if (existingLike) {
      // Optimistically remove
      setSharedLikes(sharedLikes.filter(l => l.id !== existingLike.id));
      window.dispatchEvent(new CustomEvent('userLikesChanged', { 
        detail: { action: 'removed', itemId, itemType } 
      }));

      // Background DB delete
      supabase
        .from('user_likes')
        .delete()
        .eq('id', existingLike.id)
        .then(({ error }) => {
          if (error) {
            // Rollback on error
            setSharedLikes([existingLike, ...sharedLikes]);
            console.error('Error removing like:', error);
          }
        });
      
      return false;
    } else {
      // Optimistically add
      const tempId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      const optimisticLike: UserLike = {
        id: tempId,
        user_id: user.id,
        item_id: itemId,
        item_type: itemType,
        item_data: itemData,
        created_at: new Date().toISOString(),
      };
      
      setSharedLikes([optimisticLike, ...sharedLikes]);
      window.dispatchEvent(new CustomEvent('userLikesChanged', { 
        detail: { action: 'added', itemId, itemType } 
      }));

      // Background DB insert
      supabase
        .from('user_likes')
        .insert({
          user_id: user.id,
          item_id: itemId,
          item_type: itemType,
          item_data: itemData
        })
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            // Rollback on error
            setSharedLikes(sharedLikes.filter(l => l.id !== tempId));
            console.error('Error adding like:', error);
          } else if (data) {
            // Replace temp with real
            setSharedLikes(sharedLikes.map(l => l.id === tempId ? {
              ...data,
              item_type: data.item_type as 'experience' | 'itinerary' | 'poi',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              item_data: data.item_data as Record<string, any>
            } : l));
          }
        });
      
      return true;
    }
  };

  const isLiked = useCallback((itemId: string, itemType: 'experience' | 'itinerary' | 'poi' = 'experience'): boolean => {
    return likes.some(l => l.item_id === itemId && l.item_type === itemType);
  }, [likes]);

  const getLikesByType = useCallback((itemType: 'experience' | 'itinerary' | 'poi'): UserLike[] => {
    return likes.filter(l => l.item_type === itemType);
  }, [likes]);

  return {
    likes,
    loading,
    toggleLike,
    isLiked,
    getLikesByType,
    likedExperiences: getLikesByType('experience'),
    likedItineraries: getLikesByType('itinerary'),
    likedPois: getLikesByType('poi'),
    experienceCount: getLikesByType('experience').length,
    itineraryCount: getLikesByType('itinerary').length,
    poiCount: getLikesByType('poi').length,
    totalCount: likes.length,
    refresh: fetchLikes
  };
};
