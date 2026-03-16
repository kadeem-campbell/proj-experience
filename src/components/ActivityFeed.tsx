/**
 * Activity Feed — useful feed showing new itineraries from followed hosts,
 * trending routes, updates to saved plans.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFollows } from '@/hooks/useSocialGraph';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, Heart, Copy, Users } from 'lucide-react';

export const ActivityFeed = () => {
  const { user } = useAuth();
  const { following } = useFollows();

  const followedHostIds = following
    .filter((f: any) => f.followed_type === 'host')
    .map((f: any) => f.followed_id);

  const followedDestIds = following
    .filter((f: any) => f.followed_type === 'destination')
    .map((f: any) => f.followed_id);

  // New itineraries from followed hosts
  const { data: feedItineraries = [] } = useQuery({
    queryKey: ['feed-itineraries', followedHostIds],
    queryFn: async () => {
      if (followedHostIds.length === 0) return [];
      const { data } = await supabase
        .from('public_itineraries')
        .select('*')
        .in('creator_id', followedHostIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: followedHostIds.length > 0,
  });

  // Trending itineraries (by copy/like count)
  const { data: trendingItineraries = [] } = useQuery({
    queryKey: ['feed-trending'],
    queryFn: async () => {
      const { data } = await supabase
        .from('public_itineraries')
        .select('*')
        .eq('is_active', true)
        .order('like_count', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const allItems = [
    ...feedItineraries.map((i: any) => ({ ...i, feedType: 'followed' })),
    ...trendingItineraries.map((i: any) => ({ ...i, feedType: 'trending' })),
  ];

  // Deduplicate
  const uniqueItems = allItems.filter(
    (item, idx, arr) => arr.findIndex((i) => i.id === item.id) === idx
  );

  if (uniqueItems.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Follow hosts and destinations to see your feed</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {uniqueItems.slice(0, 15).map((item: any) => (
        <Link
          key={item.id}
          to={`/itineraries/${item.slug}`}
          className="block"
        >
          <Card className="p-4 hover:bg-muted/30 transition-colors">
            <div className="flex gap-3">
              {item.cover_image && (
                <img src={item.cover_image} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  {item.feedType === 'followed' ? (
                    <Badge variant="outline" className="text-[10px] gap-0.5"><Users className="w-2.5 h-2.5" /> Following</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] gap-0.5"><TrendingUp className="w-2.5 h-2.5" /> Trending</Badge>
                  )}
                </div>
                <p className="text-sm font-medium truncate">{item.name}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  {item.like_count > 0 && (
                    <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {item.like_count}</span>
                  )}
                  {item.copy_count > 0 && (
                    <span className="flex items-center gap-0.5"><Copy className="w-3 h-3" /> {item.copy_count} copies</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
};
