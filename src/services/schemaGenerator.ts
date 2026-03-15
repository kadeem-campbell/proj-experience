/**
 * Centralized JSON-LD Schema Generation Service
 * 
 * Generates structured data from source-of-truth entities.
 * Each page class has its own schema template.
 */

import type { Product, ProductOption, Destination, Area, Host, Theme } from "@/hooks/useProducts";

// ============ PRODUCT PAGE SCHEMA ============
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
      ...(price.original_amount ? { priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] } : {}),
    }))
  );

  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: product.title,
    description: product.description,
    url: product.canonical_url || `https://swam.app/things-to-do/${destination?.slug || 'explore'}/${area?.slug || 'area'}/${product.slug}`,
    image: product.cover_image || product.gallery?.[0],
    ...(product.latitude && product.longitude ? {
      geo: {
        "@type": "GeoCoordinates",
        latitude: product.latitude,
        longitude: product.longitude,
      },
    } : {}),
    ...(location ? {
      address: {
        "@type": "PostalAddress",
        addressLocality: area?.name || destination?.name || "",
        addressRegion: destination?.name || "",
      },
    } : {}),
    ...(product.rating ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating.toString(),
        bestRating: "5",
        ratingCount: (product.view_count || 10).toString(),
      },
    } : {}),
    ...(offers.length > 0 ? { offers } : {}),
    ...(hosts.length > 0 ? {
      provider: hosts.map(h => ({
        "@type": "LocalBusiness",
        name: h.display_name || h.username,
        ...(h.avatar_url ? { image: h.avatar_url } : {}),
      })),
    } : {}),
    ...(product.duration ? { duration: `PT${product.duration.replace(/[^0-9]/g, "")}H` } : {}),
    touristType: "Adventure",
    isAccessibleForFree: false,
  };
};

// ============ DESTINATION PAGE SCHEMA ============
export const generateDestinationSchema = (
  destination: Destination,
  products: Product[],
) => {
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: destination.name,
    description: destination.description,
    url: `https://swam.app/${destination.slug}`,
    ...(destination.cover_image ? { image: destination.cover_image } : {}),
    ...(destination.latitude && destination.longitude ? {
      geo: {
        "@type": "GeoCoordinates",
        latitude: destination.latitude,
        longitude: destination.longitude,
      },
    } : {}),
    ...(products.length > 0 ? {
      touristAttraction: products.slice(0, 10).map(p => ({
        "@type": "TouristAttraction",
        name: p.title,
        url: `https://swam.app/things-to-do/${destination.slug}/${p.slug}`,
      })),
    } : {}),
  };
};

// ============ HOST PAGE SCHEMA ============
export const generateHostSchema = (host: Host) => {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: host.display_name || host.username,
    url: `https://swam.app/hosts/${host.slug}`,
    ...(host.avatar_url ? { image: host.avatar_url } : {}),
    ...(host.bio ? { description: host.bio } : {}),
  };
};

// ============ ITINERARY PAGE SCHEMA ============
export const generateItinerarySchema = (
  itinerary: { name: string; slug: string; description?: string; experiences: any[] },
) => {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: itinerary.name,
    description: itinerary.description || `Curated itinerary: ${itinerary.name}`,
    url: `https://swam.app/itineraries/${itinerary.slug}`,
    numberOfItems: itinerary.experiences?.length || 0,
    itemListElement: (itinerary.experiences || []).slice(0, 20).map((exp: any, idx: number) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: exp.title,
      url: `https://swam.app/things-to-do/explore/${exp.slug || exp.id}`,
    })),
  };
};

// ============ COLLECTION PAGE SCHEMA ============
export const generateCollectionSchema = (
  collection: { name: string; slug: string; description?: string },
  items: { title?: string; name?: string; slug?: string; id: string }[],
  collectionType: "experiences" | "itineraries",
) => {
  const prefix = collectionType === "experiences" ? "experience-collections" : "itinerary-collections";
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: collection.name,
    description: collection.description || `Curated collection: ${collection.name}`,
    url: `https://swam.app/${prefix}/${collection.slug}`,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 20).map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.title || item.name || "",
    })),
  };
};

// ============ WEBSITE SCHEMA (homepage) ============
export const generateWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SWAM",
  url: "https://swam.app",
  description: "Discover experiences, activities and things to do across East Africa. Build and share travel itineraries.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://swam.app/search?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
});
