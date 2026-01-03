import { useState, useEffect, useCallback } from 'react';
import { SocialMediaFeedService } from '@/utils/SocialMediaFeedService';

interface SocialMediaPost {
  id: string;
  platform: 'instagram' | 'tiktok' | 'twitter';
  user: string;
  content: string;
  timestamp: string;
  location?: string;
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
  hashtags: string[];
  media?: {
    type: 'image' | 'video';
    url: string;
  };
  originalUrl?: string;
}

export const useLiveSocialFeed = () => {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchFeed = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newPosts = await SocialMediaFeedService.fetchLiveFeed();
      setPosts(newPosts);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch social media feed');
      console.error('Error fetching social media feed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFeed();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [fetchFeed]);

  const refreshFeed = useCallback(() => {
    fetchFeed();
  }, [fetchFeed]);

  return {
    posts,
    isLoading,
    error,
    lastUpdated,
    refreshFeed
  };
};