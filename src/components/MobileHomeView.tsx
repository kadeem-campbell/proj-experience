import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { slugify } from "@/utils/slugUtils";
import { Layers, MapPin, Search, ChevronRight, Plus } from "lucide-react";

import catBeaches from "@/assets/cat-beaches.png";
import catNightlife from "@/assets/cat-nightlife.png";
import catNature from "@/assets/cat-nature.png";
import catAdventure from "@/assets/cat-adventure.png";
import catFood from "@/assets/cat-food.png";
import catSafari from "@/assets/cat-safari.png";

import { usePublicItineraries } from "@/hooks/usePublicItineraries";
import { useProductListings } from "@/hooks/useProductListings";
import { generateProductPageUrl } from "@/utils/slugUtils";
import { useHomeCarousels } from "@/hooks/useHomeCarousels";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { CardActionMenu } from "@/components/CardActionMenu";
import { cn } from "@/lib/utils";
import { MobileShell } from "@/components/MobileShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import type { HomeCarousel } from "@/hooks/useHomeCarousels";

const rotatingPlaceholders = [
  "Search the best beaches",
  "Search cultural experiences",
  "Search food tours",
  "Search hidden gems",
  "Search sunset spots",
];

// Dynamic tag-based filter pills derived from carousel tags
const TagFilterPills = ({ 
  tags,
  activeTag, 
  onTagChange 
}: { 
  tags: string[];
  activeTag: string; 
  onTagChange: (tag: string) => void;
}) => {
  if (tags.length === 0) return null;
  return (
    <div className="px-4 pb-3">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {tags.map((tag) => {
          const isActive = activeTag === tag;
          return (
            <button
              key={tag}
              onClick={() => onTagChange(isActive ? "" : tag)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-medium transition-all active:scale-95 shrink-0",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Horizontal scroll row component
const HorizontalScrollRow = ({ 
  title, 
  onTitleClick,
  children 
}: { 
  title: string;
  onTitleClick?: () => void;
  children: React.ReactNode;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="py-5 mb-2">
      <button 
        onClick={onTitleClick}
        className="mb-3 flex items-center gap-1.5 w-full text-left px-4 group active:opacity-70 transition-opacity duration-100"
      >
        <h2 className="text-[17px] font-bold text-foreground">{title}</h2>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-active:text-foreground transition-colors" />
      </button>
      <div 
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide pb-1 will-change-scroll"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', transform: 'translateZ(0)' }}
      >
        <div className="inline-flex gap-3 snap-x snap-mandatory px-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// Itinerary card
const MobileItineraryCard = ({ itinerary }: { itinerary: any }) => {
  const navigate = useNavigate();
  const experienceCount = itinerary.experiences?.length || 0;
  const coverImage = itinerary.coverImage || itinerary.experiences?.[0]?.videoThumbnail;

  return (
    <div 
      className="group/card flex-shrink-0 w-[44vw] snap-start cursor-pointer active:scale-[0.97] transition-transform duration-100 will-change-transform"
      onClick={() => navigate(`/itineraries/${itinerary.slug || itinerary.id}`)}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {coverImage ? (
          <img src={coverImage} alt={itinerary.name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Layers className="w-8 h-8 text-primary/40" />
          </div>
        )}
        <div className="absolute bottom-2.5 right-2.5 z-10" onClick={(e) => e.stopPropagation()}>
          <CardActionMenu
            entityId={itinerary.id}
            entityType="itinerary"
            entityData={{ id: itinerary.id, name: itinerary.name, coverImage, creatorName: itinerary.creatorName, experiences: itinerary.experiences }}
            title={itinerary.name}
          >
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-foreground/80 backdrop-blur-xl shadow-lg transition-all duration-150 active:scale-90">
              <Plus className="w-5 h-5 text-background" />
            </button>
          </CardActionMenu>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{itinerary.name}</h3>
        <p className="text-xs text-muted-foreground">{experienceCount} activities</p>
      </div>
    </div>
  );
};

// Experience/Product card
const MobileExperienceCard = ({ experience }: { experience: any }) => {
  const navigate = useNavigate();
  const { convert } = useCurrency();

  const displayPrice = useMemo(() => {
    if (experience.averagePrice) {
      return `${convert(experience.averagePrice)} avg`;
    }
    return experience.price || '';
  }, [experience.averagePrice, experience.price, convert]);

  return (
    <div 
      className="group/card flex-shrink-0 w-[44vw] snap-start cursor-pointer active:scale-[0.97] transition-transform duration-100 will-change-transform"
      onClick={() => navigate(generateProductPageUrl((experience as any).location || '', experience.title, (experience as any).slug))}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {experience.videoThumbnail ? (
          <img src={experience.videoThumbnail} alt={experience.title} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute bottom-2.5 right-2.5 z-10" onClick={(e) => e.stopPropagation()}>
          <CardActionMenu
            entityId={experience.id}
            entityType="experience"
            entityData={{
              id: experience.id, title: experience.title, creator: experience.creator || '',
              videoThumbnail: experience.videoThumbnail || '', category: experience.category || '',
              location: experience.location || '', price: experience.price || '',
            }}
            title={experience.title}
            slug={(experience as any).slug}
          >
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-foreground/80 backdrop-blur-xl shadow-lg transition-all duration-150 active:scale-90">
              <Plus className="w-5 h-5 text-background" />
            </button>
          </CardActionMenu>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm text-foreground truncate">{experience.title}</h3>
        {displayPrice && (
          <p className="text-xs text-muted-foreground truncate">{displayPrice}</p>
        )}
      </div>
    </div>
  );
};

// POI card — same visual style as experience cards (not tall/skinny)
const MobilePoiCard = ({ poi, destinationSlug }: { poi: any; destinationSlug?: string }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="group/card flex-shrink-0 w-[44vw] snap-start cursor-pointer active:scale-[0.97] transition-transform duration-100 will-change-transform"
      onClick={() => navigate(`/things-to-do/${destinationSlug || 'explore'}/${poi.slug}`)}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {poi.cover_image ? (
          <img src={poi.cover_image} alt={poi.name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-primary/40" />
          </div>
        )}
        <div className="absolute bottom-2.5 right-2.5 z-10" onClick={(e) => e.stopPropagation()}>
          <CardActionMenu
            entityId={poi.id}
            entityType="experience"
            entityData={{
              id: poi.id, title: poi.name, creator: '',
              videoThumbnail: poi.cover_image || '', category: poi.poi_type || '',
              location: '', price: '',
            }}
            title={poi.name}
            slug={poi.slug}
          >
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-foreground/80 backdrop-blur-xl shadow-lg transition-all duration-150 active:scale-90">
              <Plus className="w-5 h-5 text-background" />
            </button>
          </CardActionMenu>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm text-foreground truncate">{poi.name}</h3>
        {poi.poi_type && (
          <p className="text-xs text-muted-foreground truncate capitalize">{poi.poi_type}</p>
        )}
      </div>
    </div>
  );
};


export const MobileHomeView = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const selectedCity = searchParams.get("city") || (() => { try { return localStorage.getItem("swam_selected_city") || ""; } catch { return ""; } })();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeTag, setActiveTag] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const { data: allItinerariesData = [] } = usePublicItineraries();
  const allExpsData = useProductListings();
  const { data: homeCarousels = [] } = useHomeCarousels();

  // Fetch destinations to map selectedCity name → destination ID
  const { data: allDestinations = [] } = useQuery({
    queryKey: ["home-destinations"],
    queryFn: async () => {
      const { data } = await supabase.from("destinations").select("id, name, slug, cover_image, display_order").eq("is_active", true).order("display_order");
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const selectedDestId = useMemo(() => {
    if (!selectedCity) return null;
    const cityLower = selectedCity.toLowerCase();
    const d = allDestinations.find((d: any) => d.name.toLowerCase() === cityLower || d.slug === cityLower);
    return d?.id || null;
  }, [selectedCity, allDestinations]);

  const selectedDestSlug = useMemo(() => {
    if (!selectedCity) return '';
    const d = allDestinations.find((d: any) => d.name.toLowerCase() === selectedCity.toLowerCase() || d.slug === selectedCity.toLowerCase());
    return d?.slug || slugify(selectedCity);
  }, [selectedCity, allDestinations]);

  // POIs
  const { data: pois = [] } = useQuery({
    queryKey: ["home-pois"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pois")
        .select("id, name, slug, poi_type, cover_image, destination_id")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % rotatingPlaceholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    setSearchQuery(q || "");
  }, [searchParams]);

  // City-filtered itineraries — match by destination_id from public_itineraries
  const itineraries = useMemo(() => {
    if (!selectedDestId) return allItinerariesData;
    return allItinerariesData.filter(it => {
      // Match by destination_id on the itinerary itself
      if ((it as any).destinationId === selectedDestId) return true;
      // Fallback: name match
      if (it.name?.toLowerCase().includes(selectedCity.toLowerCase())) return true;
      return false;
    });
  }, [selectedDestId, selectedCity, allItinerariesData]);

  // City-filtered products
  const experiences = useMemo(() => {
    if (!selectedDestId) return allExpsData;
    return allExpsData.filter(e => e.destinationId === selectedDestId);
  }, [selectedDestId, allExpsData]);

  // Derive unique tags from visible carousels for filter pills
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    homeCarousels.forEach(c => {
      if (c.tag) tags.add(c.tag);
    });
    return Array.from(tags).sort();
  }, [homeCarousels]);

  const normalizeText = (text: string) => text.toLowerCase().replace(/[-_&]/g, " ").replace(/\s+/g, " ").trim();
  const stem = (word: string) => word.replace(/(es|s|ing|ed)$/i, "");
  
  const termMatches = (term: string, field: string) => {
    if (field.includes(term)) return true;
    const stemmed = stem(term);
    if (stemmed.length > 2 && field.includes(stemmed)) return true;
    return field.split(" ").some(w => w.startsWith(term) || w.startsWith(stemmed));
  };

  const filteredExperiences = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = normalizeText(searchQuery);
    const terms = q.split(" ").filter(t => t.length > 1);
    if (terms.length === 0) return [];
    return experiences.filter(e => {
      const fields = [e.title, e.location, e.category, e.creator].map(f => normalizeText(f || "")).join(" ");
      return terms.some(term => termMatches(term, fields));
    });
  }, [searchQuery, experiences]);

  const filteredItineraries = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = normalizeText(searchQuery);
    const terms = q.split(" ").filter(t => t.length > 1);
    if (terms.length === 0) return [];
    return itineraries.filter(it => {
      const fields = [it.name, it.creatorName].map(f => normalizeText(f || "")).join(" ");
      const expMatch = it.experiences?.some((exp: any) => {
        const ef = [exp.title, exp.location, exp.category].map((f: string) => normalizeText(f || "")).join(" ");
        return terms.some(term => termMatches(term, ef));
      });
      return terms.some(term => termMatches(term, fields)) || expMatch;
    });
  }, [searchQuery, itineraries]);

  const hasSearchResults = searchQuery.trim().length > 0;

  // City-filtered POIs
  const filteredPois = useMemo(() => {
    if (!selectedDestId) return pois;
    return pois.filter((p: any) => p.destination_id === selectedDestId);
  }, [pois, selectedDestId]);

  return (
    <MobileShell hideAvatar notFixed>
      {/* Search bar */}
      <div className="px-4 pb-3">
        <button
          onClick={() => navigate("/search")}
          className="w-full flex items-center gap-3 px-4 py-3 bg-muted rounded-full text-left transition-colors duration-150 active:bg-muted/70"
        >
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <span className="text-[15px] text-muted-foreground flex-1 truncate">
            {searchQuery || rotatingPlaceholders[placeholderIndex]}
          </span>
        </button>
      </div>

      {/* Category icon row */}
      <div className="px-4 pb-3">
        <div className="flex justify-between">
          {[
            { label: "Nightlife", icon: catNightlife, tag: "Nightlife" },
            { label: "Nature", icon: catNature, tag: "Nature" },
            { label: "Adventure", icon: catAdventure, tag: "Adventure" },
            { label: "Food", icon: catFood, tag: "Food" },
            { label: "Safari", icon: catSafari, tag: "Safari" },
          ].map((cat) => {
            const isActive = activeTag === cat.tag;
            return (
              <button
                key={cat.label}
                onClick={() => setActiveTag(isActive ? "" : cat.tag)}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
              >
                <div className={cn(
                  "w-14 h-14 rounded-full overflow-hidden flex items-center justify-center transition-all",
                  isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "bg-muted"
                )}>
                  <img src={cat.icon} alt={cat.label} className="w-full h-full object-cover" />
                </div>
                <span className={cn(
                  "text-[11px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>


      {/* Search results */}
      {hasSearchResults ? (
        <div className="px-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">
              Results for "{searchQuery}"
            </h2>
            <button onClick={() => setSearchQuery("")} className="text-xs text-primary font-medium">Clear</button>
          </div>
          
          {filteredExperiences.length === 0 && filteredItineraries.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No results found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
            </div>
          ) : (
            <>
              {filteredItineraries.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Itineraries</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {filteredItineraries.slice(0, 6).map(it => (
                      <MobileItineraryCard key={it.id} itinerary={it} />
                    ))}
                  </div>
                </div>
              )}
              {filteredExperiences.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Experiences</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {filteredExperiences.slice(0, 12).map(exp => (
                      <MobileExperienceCard key={exp.id} experience={exp} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
      <>
      {/* Dynamic collection-driven carousels */}
      {homeCarousels.length > 0 ? (
        (() => {
          // Filter carousels by market
          let visibleCarousels = homeCarousels.filter((carousel) => {
            if (carousel.destinationIds.length === 0) {
              return !selectedDestId;
            }
            if (!selectedDestId) return false;
            return carousel.destinationIds.includes(selectedDestId);
          });

          // Filter by active tag
          if (activeTag) {
            visibleCarousels = visibleCarousels.filter(c => c.tag === activeTag);
          }

          const destSlug = selectedDestSlug;

          const elements: React.ReactNode[] = [];
          visibleCarousels.forEach((carousel) => {
            const title = carousel.name.replace(/\{city\}/g, selectedCity || 'Explore');
            const resolvedSlug = carousel.slug.replace('city', destSlug || 'explore');
          
            if (carousel.contentType === 'poi') {
              let carouselPois = carousel.itemIds.length > 0
                ? pois.filter((p: any) => carousel.itemIds.includes(p.id))
                : filteredPois;
              if (carouselPois.length === 0) return;
              elements.push(
                <HorizontalScrollRow
                  key={carousel.id}
                  title={title}
                  onTitleClick={() => navigate(`/${destSlug || 'explore'}`)}
                >
                  {carouselPois.slice(0, 10).map((poi: any) => (
                    <MobilePoiCard key={poi.id} poi={poi} destinationSlug={destSlug} />
                  ))}
                </HorizontalScrollRow>
              );
            } else if (carousel.contentType === 'itinerary') {
              let items: any[];
              if (carousel.itemIds.length > 0) {
                items = allItinerariesData.filter(it => carousel.itemIds.includes(it.dbId || it.id));
              } else {
                items = itineraries.slice(0, 6);
              }
              if (items.length === 0) return;
              elements.push(
                <HorizontalScrollRow
                  key={carousel.id}
                  title={title}
                  onTitleClick={() => navigate(`/collections/${resolvedSlug}`)}
                >
                  {items.slice(0, 8).map((itinerary) => (
                    <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
                  ))}
                </HorizontalScrollRow>
              );
            } else if (carousel.contentType === 'product') {
              let items: any[];
              if (carousel.itemIds.length > 0) {
                items = allExpsData.filter(exp => carousel.itemIds.includes(exp.id));
              } else {
                items = experiences.slice(0, 8);
              }
              if (items.length === 0) return;
              elements.push(
                <HorizontalScrollRow
                  key={carousel.id}
                  title={title}
                  onTitleClick={() => navigate(`/collections/${resolvedSlug}`)}
                >
                  {items.slice(0, 10).map((experience) => (
                    <MobileExperienceCard key={experience.id} experience={experience} />
                  ))}
                </HorizontalScrollRow>
              );
            }
          });
          if (elements.length > 0) return <>{elements}</>;
          // Fallback: no matching carousels — show default content
          return null;
        })()
      ) : null}

      {/* Fallback: show all content when no carousels are visible */}
      {(() => {
        // Check if any carousel content was rendered
        let visibleCarousels = homeCarousels.filter((carousel) => {
          if (carousel.destinationIds.length === 0) return !selectedDestId;
          if (!selectedDestId) return false;
          return carousel.destinationIds.includes(selectedDestId);
        });
        if (activeTag) visibleCarousels = visibleCarousels.filter(c => c.tag === activeTag);
        
        const hasCarouselContent = visibleCarousels.length > 0;
        if (hasCarouselContent) return null;

        // Show default rows as fallback
        return (
          <>
            {experiences.length > 0 && (
              <HorizontalScrollRow title="Popular Experiences" onTitleClick={() => navigate("/search")}>
                {experiences.slice(0, 10).map((exp) => (
                  <MobileExperienceCard key={exp.id} experience={exp} />
                ))}
              </HorizontalScrollRow>
            )}
            {itineraries.length > 0 && (
              <HorizontalScrollRow title="Top Itineraries" onTitleClick={() => navigate("/itineraries")}>
                {itineraries.slice(0, 8).map((it) => (
                  <MobileItineraryCard key={it.id} itinerary={it} />
                ))}
              </HorizontalScrollRow>
            )}
            {filteredPois.length > 0 && (
              <HorizontalScrollRow title="Places to Visit" onTitleClick={() => navigate(`/${selectedDestSlug || 'explore'}`)}>
                {filteredPois.slice(0, 10).map((poi: any) => (
                  <MobilePoiCard key={poi.id} poi={poi} destinationSlug={selectedDestSlug} />
                ))}
              </HorizontalScrollRow>
            )}
          </>
        );
      })()}
      </>
      )}
    </MobileShell>
  );
};
