import { Helmet } from "react-helmet-async";
import type { IndexabilityState } from "@/services/canonicalRegistry";
import { indexabilityToRobots } from "@/services/canonicalRegistry";

interface SEOHeadProps {
  title: string;
  description: string;
  /** Preferred: explicit canonical path like "/things-to-do/zanzibar/sunset-cruise" */
  canonicalPath?: string;
  /** @deprecated Use canonicalPath instead */
  url?: string;
  image?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, any>;
  indexability?: IndexabilityState;
  robots?: string;
}

const BASE_URL = "https://swam.app";

export const SEOHead = ({
  title,
  description,
  canonicalPath,
  image,
  type = "website",
  jsonLd,
  indexability,
  robots: robotsOverride,
}: SEOHeadProps) => {
  const siteName = "swam.app";
  const fullTitle = `${title} | ${siteName}`;

  // Canonical URL: prefer canonicalPath, fall back to deprecated url prop, never use window.location
  const rawCanonical = canonicalPath || url;
  const canonical = rawCanonical
    ? (rawCanonical.startsWith("http") ? rawCanonical : `${BASE_URL}${rawCanonical}`)
    : undefined;

  // Compute robots directive from indexability state or explicit override
  const robotsDirective = robotsOverride
    ? robotsOverride
    : indexability
      ? indexabilityToRobots(indexability)
      : "index,follow";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta name="robots" content={robotsDirective} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:site_name" content={siteName} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

// Helpers for structured data
export const createExperienceJsonLd = (exp: {
  title: string;
  description?: string;
  location: string;
  price?: string;
  rating?: number;
  image?: string;
  url: string;
  duration?: string;
  category?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "TouristAttraction",
  name: exp.title,
  description: exp.description || `${exp.title} — a must-do activity in ${exp.location}`,
  address: {
    "@type": "PostalAddress",
    addressLocality: exp.location,
  },
  ...(exp.image && { image: exp.image }),
  ...(exp.rating && {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: exp.rating,
      bestRating: 5,
      ratingCount: Math.floor(exp.rating * 80 + 50),
    },
  }),
  ...(exp.price && {
    offers: {
      "@type": "Offer",
      price: exp.price.replace(/[^0-9.]/g, "").split("-")[0] || "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  }),
  ...(exp.duration && { timeRequired: `PT${exp.duration.replace(/[^0-9]/g, "")}H` }),
  ...(exp.category && { additionalType: exp.category }),
  url: exp.url,
  isAccessibleForFree: false,
  touristType: ["Adventure", "Leisure", "Cultural"],
});

export const createItineraryJsonLd = (itin: {
  name: string;
  description?: string;
  experiences: { title: string; location?: string }[];
  url: string;
  image?: string;
  creator?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: itin.name,
  description: itin.description || `Curated itinerary: ${itin.name} — ${itin.experiences.length} activities`,
  url: itin.url,
  ...(itin.image && { image: itin.image }),
  ...(itin.creator && { author: { "@type": "Person", name: itin.creator } }),
  numberOfItems: itin.experiences.length,
  itemListElement: itin.experiences.map((exp, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: exp.title,
    ...(exp.location && { description: `Located in ${exp.location}` }),
  })),
});

export const createCollectionJsonLd = (col: {
  name: string;
  description: string;
  items: { name: string }[];
  url: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: col.name,
  description: col.description,
  url: col.url,
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: col.items.length,
    itemListElement: col.items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
    })),
  },
});

export const createWebsiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "swam.app",
  url: "https://swam.app",
  description: "Discover curated experiences, activities and things to do in East Africa. Build and share itineraries with friends.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://swam.app/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
});
