/**
 * Get the base URL for sharing links.
 * Uses swam.app in production, localhost in development.
 */
export const getShareBaseUrl = (): string => {
  if (typeof window === 'undefined') return 'https://swam.app';
  
  const hostname = window.location.hostname;
  
  // Production domains
  if (hostname === 'swam.app' || 
      hostname === 'www.swam.app' ||
      hostname.endsWith('.lovable.app') ||
      hostname.endsWith('.lovableproject.com')) {
    return 'https://swam.app';
  }
  
  // Development
  return window.location.origin;
};

/**
 * Generate a shareable itinerary URL
 */
export const getItineraryShareUrl = (itineraryId: string): string => {
  return `${getShareBaseUrl()}/itineraries/${itineraryId}`;
};

/**
 * Generate a shareable experience URL
 */
export const getExperienceShareUrl = (experienceSlug: string): string => {
  return `${getShareBaseUrl()}/things-to-do/${experienceSlug}`;
};
