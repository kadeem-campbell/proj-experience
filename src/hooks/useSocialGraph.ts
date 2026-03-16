/**
 * Social Graph hooks — follows, saves, questions, notifications, quality scores
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── Follows ───
export const useFollows = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: following = [] } = useQuery({
    queryKey: ['user-follows', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('user_follows')
        .select('*')
        .eq('follower_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const isFollowing = (id: string, type: string) =>
    following.some((f: any) => f.followed_id === id && f.followed_type === type);

  const toggleFollow = async (followedId: string, followedType: string) => {
    if (!user) return;
    const existing = following.find(
      (f: any) => f.followed_id === followedId && f.followed_type === followedType
    );
    if (existing) {
      await supabase.from('user_follows').delete().eq('id', (existing as any).id);
    } else {
      await supabase.from('user_follows').insert({
        follower_id: user.id,
        followed_id: followedId,
        followed_type: followedType,
      });
    }
    qc.invalidateQueries({ queryKey: ['user-follows', user.id] });
  };

  const followerCount = (id: string, type: string) =>
    useQuery({
      queryKey: ['follower-count', id, type],
      queryFn: async () => {
        const { count } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('followed_id', id)
          .eq('followed_type', type);
        return count || 0;
      },
    });

  return { following, isFollowing, toggleFollow, followerCount };
};

// ─── Saves ───
export const useSaves = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: saves = [] } = useQuery({
    queryKey: ['user-saves', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('user_saves')
        .select('*')
        .eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const isSaved = (itemId: string, itemType: string) =>
    saves.some((s: any) => s.item_id === itemId && s.item_type === itemType);

  const toggleSave = async (itemId: string, itemType: string) => {
    if (!user) return;
    const existing = saves.find(
      (s: any) => s.item_id === itemId && s.item_type === itemType
    );
    if (existing) {
      await supabase.from('user_saves').delete().eq('id', (existing as any).id);
    } else {
      await supabase.from('user_saves').insert({
        user_id: user.id,
        item_id: itemId,
        item_type: itemType,
      });
    }
    qc.invalidateQueries({ queryKey: ['user-saves', user.id] });
  };

  return { saves, isSaved, toggleSave };
};

// ─── Questions ───
export const useQuestions = (entityId: string, entityType: string = 'experience') => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions', entityId, entityType],
    queryFn: async () => {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .order('vote_count', { ascending: false });
      return data || [];
    },
    enabled: !!entityId,
  });

  const { data: answers = [] } = useQuery({
    queryKey: ['answers', entityId],
    queryFn: async () => {
      if (!questions.length) return [];
      const qIds = questions.map((q: any) => q.id);
      const { data } = await supabase
        .from('answers')
        .select('*')
        .in('question_id', qIds)
        .order('is_best', { ascending: false });
      return data || [];
    },
    enabled: questions.length > 0,
  });

  const askQuestion = async (body: string) => {
    if (!user) return;
    await supabase.from('questions').insert({
      entity_id: entityId,
      entity_type: entityType,
      user_id: user.id,
      body,
    });
    qc.invalidateQueries({ queryKey: ['questions', entityId] });
  };

  const answerQuestion = async (questionId: string, body: string) => {
    if (!user) return;
    await supabase.from('answers').insert({
      question_id: questionId,
      user_id: user.id,
      body,
    });
    qc.invalidateQueries({ queryKey: ['answers', entityId] });
  };

  return { questions, answers, isLoading, askQuestion, answerQuestion };
};

// ─── Notifications ───
export const useNotifications = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['notifications', user?.id] });
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    qc.invalidateQueries({ queryKey: ['notifications', user?.id] });
  };

  return { notifications, unreadCount, isLoading, markRead, markAllRead };
};

// ─── Experience Relationships (pairings, substitutions) ───
export const useExperienceRelationships = (sourceId: string) => {
  const { data: relationships = [] } = useQuery({
    queryKey: ['experience-relationships', sourceId],
    queryFn: async () => {
      const { data } = await supabase
        .from('experience_relationships')
        .select('*')
        .or(`source_id.eq.${sourceId},target_id.eq.${sourceId}`)
        .order('score', { ascending: false });
      return data || [];
    },
    enabled: !!sourceId,
  });

  const pairings = relationships.filter((r: any) => r.relationship_type === 'pairing');
  const substitutions = relationships.filter((r: any) => r.relationship_type === 'substitution');
  const similar = relationships.filter((r: any) => r.relationship_type === 'similar');

  return { pairings, substitutions, similar, relationships };
};

// ─── Quality Scores ───
export const useQualityScores = (entityType?: string) => {
  return useQuery({
    queryKey: ['quality-scores', entityType],
    queryFn: async () => {
      let q = supabase.from('quality_scores').select('*');
      if (entityType) q = q.eq('entity_type', entityType);
      const { data } = await q.order('overall_score', { ascending: true });
      return data || [];
    },
  });
};

// ─── Redirect Registry ───
export const useRedirectRegistry = () => {
  const qc = useQueryClient();

  const { data: redirects = [], isLoading } = useQuery({
    queryKey: ['redirect-registry'],
    queryFn: async () => {
      const { data } = await supabase
        .from('redirect_registry')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const addRedirect = async (sourcePath: string, targetPath: string, statusCode = 301) => {
    await supabase.from('redirect_registry').insert({
      source_path: sourcePath,
      target_path: targetPath,
      status_code: statusCode,
    });
    qc.invalidateQueries({ queryKey: ['redirect-registry'] });
  };

  const removeRedirect = async (id: string) => {
    await supabase.from('redirect_registry').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['redirect-registry'] });
  };

  const updateRedirect = async (id: string, data: any) => {
    await supabase.from('redirect_registry').update(data).eq('id', id);
    qc.invalidateQueries({ queryKey: ['redirect-registry'] });
  };

  return { redirects, isLoading, addRedirect, removeRedirect, updateRedirect };
};

// ─── Included in itineraries ───
export const useIncludedInItineraries = (experienceId: string) => {
  return useQuery({
    queryKey: ['included-in-itineraries', experienceId],
    queryFn: async () => {
      const { data } = await supabase
        .from('itinerary_experiences')
        .select('itinerary_id, public_itineraries(id, name, slug, cover_image, like_count)')
        .eq('experience_id', experienceId);
      return (data || [])
        .map((d: any) => d.public_itineraries)
        .filter(Boolean);
    },
    enabled: !!experienceId,
  });
};
