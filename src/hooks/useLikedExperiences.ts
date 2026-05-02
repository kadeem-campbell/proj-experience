import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';
export type LikedEntityType = 'product' | 'poi';

export interface LikedExperience {
  id: string;
  title: string;
  creator: string;
  videoThumbnail: string;
  category: string;
  location: string;
  price: string;
  likedAt: string;
  // Entity-agnostic identity for the canonical itinerary_items model.
  // Defaults to 'product' for callers that don't set it explicitly.
  entityType?: LikedEntityType;
  entityId?: string;
  // Planning fields
  notes?: string;
  scheduledTime?: string;
  estimatedDuration?: number; // in minutes
  timeSlot?: TimeSlot;
}

const STORAGE_KEY = 'likedExperiences';

// Module-level shared state so guests AND authed users see consistent counts
// across the app (Profile counter, Liked page, card hearts).
let sharedLiked: LikedExperience[] = [];
const likedListeners = new Set<(next: LikedExperience[]) => void>();
let initialised = false;
let dbLoadedForUserId: string | null = null;
let dbLoadInFlightForUserId: string | null = null;

const setShared = (next: LikedExperience[]) => {
  sharedLiked = next;
  likedListeners.forEach((l) => l(next));
};

const persistGuest = (next: LikedExperience[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('likedExperiencesChanged', { detail: next }));
};

const initFromLocalOnce = () => {
  if (initialised) return;
  initialised = true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) sharedLiked = JSON.parse(stored);
  } catch {
    sharedLiked = [];
  }
};

const loadFromDb = async (userId: string) => {
  if (dbLoadedForUserId === userId) return;
  if (dbLoadInFlightForUserId === userId) return;
  dbLoadInFlightForUserId = userId;
  try {
    const { data, error } = await supabase
      .from('user_likes')
      .select('*')
      .eq('user_id', userId)
      .in('item_type', ['product', 'poi'])
      .order('created_at', { ascending: false });
    if (error) throw error;

    const merged: LikedExperience[] = (data || []).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meta = (row.item_data || {}) as Record<string, any>;
      return {
        id: row.item_id,
        title: meta.title || '',
        creator: meta.creator || '',
        videoThumbnail: meta.videoThumbnail || meta.video_thumbnail || '',
        category: meta.category || '',
        location: meta.location || '',
        price: meta.price || '',
        likedAt: row.created_at,
        entityType: (row.item_type === 'poi' ? 'poi' : 'product') as LikedEntityType,
        entityId: row.item_id,
      };
    });

    setShared(merged);
    dbLoadedForUserId = userId;
  } catch (err) {
    console.error('Error loading liked items:', err);
  } finally {
    dbLoadInFlightForUserId = null;
  }
};

export const useLikedExperiences = () => {
  const [likedExperiences, setLikedExperiences] = useState<LikedExperience[]>(() => {
    initFromLocalOnce();
    return sharedLiked;
  });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const listener = (next: LikedExperience[]) => setLikedExperiences(next);
    likedListeners.add(listener);
    return () => { likedListeners.delete(listener); };
  }, []);

  // Track auth user; switch the source of truth between localStorage and user_likes.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      if (uid) {
        loadFromDb(uid);
      } else {
        dbLoadedForUserId = null;
        // Re-hydrate from local storage on sign-out
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          setShared(stored ? JSON.parse(stored) : []);
        } catch {
          setShared([]);
        }
      }
    });
    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      if (uid) loadFromDb(uid);
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  // Cross-tab + same-tab sync for guests
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (!userId && e.key === STORAGE_KEY && e.newValue) {
        setShared(JSON.parse(e.newValue));
      }
    };
    const handleCustom = (e: CustomEvent) => {
      if (!userId) setShared(e.detail);
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('likedExperiencesChanged', handleCustom as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('likedExperiencesChanged', handleCustom as EventListener);
    };
  }, [userId]);

  const toggleLike = useCallback((experience: Omit<LikedExperience, 'likedAt'>) => {
    const isCurrentlyLiked = sharedLiked.some((exp) => exp.id === experience.id);
    let next: LikedExperience[];
    if (isCurrentlyLiked) {
      next = sharedLiked.filter((exp) => exp.id !== experience.id);
    } else {
      next = [
        ...sharedLiked,
        { ...experience, likedAt: new Date().toISOString() },
      ];
    }
    setShared(next);

    if (userId) {
      // Background sync to user_likes (item_type='product' unless explicitly poi)
      const itemType = experience.entityType === 'poi' ? 'poi' : 'product';
      const itemId = experience.entityId || experience.id;
      if (isCurrentlyLiked) {
        supabase
          .from('user_likes')
          .delete()
          .eq('user_id', userId)
          .eq('item_id', itemId)
          .eq('item_type', itemType)
          .then(({ error }) => { if (error) console.error('Error removing like:', error); });
      } else {
        supabase
          .from('user_likes')
          .insert({
            user_id: userId,
            item_id: itemId,
            item_type: itemType,
            item_data: {
              title: experience.title,
              creator: experience.creator,
              videoThumbnail: experience.videoThumbnail,
              category: experience.category,
              location: experience.location,
              price: experience.price,
            },
          })
          .then(({ error }) => { if (error) console.error('Error adding like:', error); });
      }
    } else {
      persistGuest(next);
    }

    return !isCurrentlyLiked;
  }, [userId]);

  const isLiked = useCallback((experienceId: string) => {
    return likedExperiences.some((exp) => exp.id === experienceId);
  }, [likedExperiences]);

  const exportLikedExperiences = (format: 'csv' | 'txt' | 'docx') => {
    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const headers = ['Title', 'Creator', 'Location', 'Price', 'Category', 'Liked At'];
      const escapeCSV = (value: string) => {
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };
      const rows = likedExperiences.map((exp) => [
        escapeCSV(exp.title),
        escapeCSV(exp.creator),
        escapeCSV(exp.location),
        escapeCSV(exp.price),
        escapeCSV(exp.category),
        escapeCSV(new Date(exp.likedAt).toLocaleDateString()),
      ].join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `liked-experiences-${dateStr}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'txt') {
      const txtContent = likedExperiences.map((exp) =>
        `${exp.title}\nCreator: ${exp.creator}\nLocation: ${exp.location}\nPrice: ${exp.price}\nCategory: ${exp.category}\nLiked on: ${new Date(exp.likedAt).toLocaleDateString()}\n\n`,
      ).join('---\n\n');

      const blob = new Blob([txtContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `liked-experiences-${dateStr}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'docx') {
      import('docx').then(({ Document, Paragraph, TextRun, Packer }) => {
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'My Liked Things to Do', bold: true, size: 32 })],
              }),
              ...likedExperiences.flatMap((exp) => [
                new Paragraph({ children: [new TextRun({ text: '', break: 1 })] }),
                new Paragraph({ children: [new TextRun({ text: exp.title, bold: true, size: 24 })] }),
                new Paragraph({ children: [new TextRun({ text: `Creator: ${exp.creator}` })] }),
                new Paragraph({ children: [new TextRun({ text: `Location: ${exp.location}` })] }),
                new Paragraph({ children: [new TextRun({ text: `Price: ${exp.price}` })] }),
                new Paragraph({ children: [new TextRun({ text: `Category: ${exp.category}` })] }),
                new Paragraph({ children: [new TextRun({ text: `Liked on: ${new Date(exp.likedAt).toLocaleDateString()}` })] }),
              ]),
            ],
          }],
        });

        Packer.toBlob(doc).then((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `liked-things-to-do-${dateStr}.docx`;
          link.click();
          URL.revokeObjectURL(url);
        });
      });
    }
  };

  return {
    likedExperiences,
    toggleLike,
    isLiked,
    exportLikedExperiences,
    count: likedExperiences.length,
  };
};
