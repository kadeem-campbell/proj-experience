/**
 * Centralized JSON-LD Schema Generation Service v2
 * 
 * Generates structured data from source-of-truth entities.
 * Supports: Product, Destination, Area, Host, Itinerary (TouristTrip),
 * Collection, POI, WebSite, BreadcrumbList.
 * 
 * No manual JSON-LD in templates — all structured data flows through here.
 */

import type { Product, ProductOption, Destination, Area, Host, Theme } from "@/hooks/useProducts";

const BASE = "https://swam.app";

// ============ PRODUCT PAGE SCHEMA (TouristAttraction + Offers) ============
export const generateProductSchema = (
  product: Product,
  options: ProductOption[],
  hosts: Host[],
  destination?: Destination | null,
  area?: Area | null,
) => {
  const location = [area?.name, destination?.name].filter(Boolean).join(", ");

  const offers = options.flatMap(opt =>
    opt.price_options.map(price => ({
      "@type": "Offer",
      name: `${opt.name} - ${price.label}`,
      price: price.amount.toString(),
      priceCurrency: price.currency,
      availability: "https://schema.org/InStock",
      ...(price.original_amount ? { priceValidUntil: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0] } : {}),
    }))
  );

  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: product.title,
    description: product.description,
    url: product.canonical_url || `${BASE}/things-to-do/${destination?.slug || 'explore'}/${product.slug}`,
    image: product.cover_image || product.gallery?.[0],
    ...(product.latitude && product.longitude ? {
      geo: { "@type": "GeoCoordinates", latitude: product.latitude, longitude: product.longitude },
    } : {}),
    ...(location ? {
      address: { "@type": "PostalAddress", addressLocality: area?.name || destination?.name || "", addressRegion: destination?.name || "" },
    } : {}),
    ...(product.rating ? {
      aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating.toString(), bestRating: "5", ratingCount: (product.view_count || 10).toString() },
    } : {}),
    ...(offers.length > 0 ? { offers } : {}),
    ...(hosts.length > 0 ? {
      provider: hosts.map(h => ({
        "@type": "LocalBusiness",
        name: h.display_name || h.username,
        ...(h.avatar_url ? { image: h.avatar_url } : {}),
        ...(h.slug ? { url: `${BASE}/hosts/${h.slug}` } : {}),
      })),
    } : {}),
    ...(product.duration ? { duration: `PT${product.duration.replace(/[^0-9]/g, "")}H` } : {}),
    touristType: "Adventure",
    isAccessibleForFree: false,
  };
};

// ============ DESTINATION PAGE SCHEMA (TouristDestination) ============
export const generateDestinationSchema = (
  destination: Destination,
  products: Product[],
  areas?: Area[],
) => ({
  "@context": "https://schema.org",
  "@type": "TouristDestination",
  name: destination.name,
  description: destination.description,
  url: `${BASE}/${destination.slug}`,
  ...(destination.cover_image ? { image: destination.cover_image } : {}),
  ...(destination.latitude && destination.longitude ? {
    geo: { "@type": "GeoCoordinates", latitude: destination.latitude, longitude: destination.longitude },
  } : {}),
  ...(products.length > 0 ? {
    touristAttraction: products.slice(0, 10).map(p => ({
      "@type": "TouristAttraction", name: p.title,
      url: `${BASE}/things-to-do/${destination.slug}/${p.slug}`,
    })),
  } : {}),
  ...(areas && areas.length > 0 ? {
    containsPlace: areas.map(a => ({
      "@type": "Place", name: a.name, url: `${BASE}/${destination.slug}/${a.slug}`,
    })),
  } : {}),
});

// ============ AREA PAGE SCHEMA (Place) ============
export const generateAreaSchema = (
  area: Area,
  destination: Destination,
  products?: Product[],
) => ({
  "@context": "https://schema.org",
  "@type": "Place",
  name: area.name,
  description: area.description,
  url: `${BASE}/${destination.slug}/${area.slug}`,
  ...(area.cover_image ? { image: area.cover_image } : {}),
  ...(area.latitude && area.longitude ? {
    geo: { "@type": "GeoCoordinates", latitude: area.latitude, longitude: area.longitude },
  } : {}),
  containedInPlace: {
    "@type": "TouristDestination",
    name: destination.name,
    url: `${BASE}/${destination.slug}`,
  },
  ...(products && products.length > 0 ? {
    event: products.slice(0, 10).map(p => ({
      "@type": "TouristAttraction", name: p.title,
      url: `${BASE}/things-to-do/${destination.slug}/${p.slug}`,
    })),
  } : {}),
});

// ============ HOST PAGE SCHEMA (LocalBusiness) ============
export const generateHostSchema = (host: Host, products?: Product[]) => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: host.display_name || host.username,
  url: `${BASE}/hosts/${host.slug}`,
  ...(host.avatar_url ? { image: host.avatar_url } : {}),
  ...(host.bio ? { description: host.bio } : {}),
  ...(products && products.length > 0 ? {
    makesOffer: products.slice(0, 10).map(p => ({
      "@type": "Offer", itemOffered: { "@type": "TouristAttraction", name: p.title, url: `${BASE}/things-to-do/explore/${p.slug}` },
    })),
  } : {}),
});

// ============ ITINERARY PAGE SCHEMA (TouristTrip) ============
export const generateItinerarySchema = (
  itinerary: { name: string; slug: string; description?: string; summary?: string; experiences?: any[]; items?: any[]; destination?: string; cover_image?: string },
) => {
  const items = itinerary.items || itinerary.experiences || [];
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: itinerary.name,
    description: itinerary.description || itinerary.summary || `Curated itinerary: ${itinerary.name}`,
    url: `${BASE}/itineraries/${itinerary.slug}`,
    ...(itinerary.cover_image ? { image: itinerary.cover_image } : {}),
    ...(itinerary.destination ? {
      touristType: itinerary.destination,
    } : {}),
    itinerary: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.slice(0, 30).map((exp: any, idx: number) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: exp.title || exp.name || `Stop ${idx + 1}`,
        ...(exp.slug ? { url: `${BASE}/things-to-do/${exp.destination_slug || exp.destination_id || 'explore'}/${exp.slug}` } : {}),
      })),
    },
  };
};

// ============ COLLECTION PAGE SCHEMA (ItemList) ============
export const generateCollectionSchema = (
  collection: { name: string; slug: string; description?: string },
  items: { title?: string; name?: string; slug?: string; id: string }[],
) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: collection.name,
  description: collection.description || `Curated collection: ${collection.name}`,
  url: `${BASE}/collections/${collection.slug}`,
  numberOfItems: items.length,
  itemListElement: items.slice(0, 30).map((item, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: item.title || item.name || "",
  })),
});

// ============ POI SCHEMA (Place) ============
export const generatePoiSchema = (
  poi: { name: string; slug: string; description?: string; latitude?: number; longitude?: number },
  destination?: { name: string; slug: string },
) => ({
  "@context": "https://schema.org",
  "@type": "Place",
  name: poi.name,
  ...(poi.description ? { description: poi.description } : {}),
  url: `${BASE}/things-to-do/${destination?.slug || 'explore'}/${poi.slug}`,
  ...(poi.latitude && poi.longitude ? {
    geo: { "@type": "GeoCoordinates", latitude: poi.latitude, longitude: poi.longitude },
  } : {}),
  ...(destination ? {
    containedInPlace: { "@type": "TouristDestination", name: destination.name },
  } : {}),
});

// ============ BREADCRUMB SCHEMA ============
export const generateBreadcrumbSchema = (
  crumbs: { name: string; url: string }[],
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: c.url.startsWith("http") ? c.url : `${BASE}${c.url}`,
  })),
});

// ============ WEBSITE SCHEMA (homepage) ============
export const generateWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SWAM",
  url: BASE,
  description: "Discover experiences, activities and things to do across East Africa. Build and share travel itineraries.",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${BASE}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
});

// ============ ORGANIZATION SCHEMA ============
export const generateOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SWAM",
  url: BASE,
  logo: `${BASE}/favicon.png`,
  sameAs: [],
});
