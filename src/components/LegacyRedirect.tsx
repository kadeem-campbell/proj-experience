/**
 * LegacyRedirect component
 * 
 * Handles /experiences/:slug → /things-to-do/:slug redirects
 * using React Router Navigate for client-side 301-equivalent behavior.
 */

import { Navigate, useParams, useLocation } from "react-router-dom";

export default function LegacyExperienceRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();

  // Redirect /experiences/:slug → /things-to-do/:slug
  const target = slug ? `/things-to-do/${slug}` : "/things-to-do";

  return <Navigate to={target + location.search} replace />;
}

export function LegacyExperienceListRedirect() {
  return <Navigate to="/things-to-do" replace />;
}
