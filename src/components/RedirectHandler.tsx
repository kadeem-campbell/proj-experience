/**
 * RedirectHandler — checks the current path against the redirect registry
 * and performs client-side redirects for legacy routes.
 */
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Static redirects that don't need DB lookup
const STATIC_REDIRECTS: Record<string, string> = {
  '/saved': '/liked',
  '/discover': '/',
  '/map': '/zanzibar/map',
  '/explore/map': '/zanzibar/map',
  '/travelers': '/profile',
  '/travellers': '/profile',
};

export const RedirectHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Check static redirects first
  useEffect(() => {
    const target = STATIC_REDIRECTS[location.pathname];
    if (target) {
      navigate(target, { replace: true });
      return;
    }

    // Handle /experiences/* → /things-to-do/*
    if (location.pathname.startsWith('/experiences')) {
      const rest = location.pathname.replace('/experiences', '/things-to-do');
      navigate(rest, { replace: true });
      return;
    }

    // Handle /itinerary/ → /itineraries/
    if (location.pathname.startsWith('/itinerary/')) {
      const rest = location.pathname.replace('/itinerary/', '/itineraries/');
      navigate(rest, { replace: true });
      return;
    }
  }, [location.pathname, navigate]);

  // Check DB redirects for non-static paths
  const { data: dbRedirects = [] } = useQuery({
    queryKey: ['redirect-check', location.pathname],
    queryFn: async () => {
      const { data } = await supabase
        .from('redirect_registry')
        .select('target_path')
        .eq('source_path', location.pathname)
        .eq('is_active', true)
        .limit(1);
      return data || [];
    },
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (dbRedirects.length > 0) {
      navigate(dbRedirects[0].target_path, { replace: true });
    }
  }, [dbRedirects, navigate]);

  return null;
};
