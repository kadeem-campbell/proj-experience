import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { slugify } from "@/utils/slugUtils";
import { Layers, MapPin, Search, ChevronRight, Bookmark } from "lucide-react";
import catBeaches from "@/assets/cat-beaches.png";
import catNightlife from "@/assets/cat-nightlife.png";
import catNature from "@/assets/cat-nature.png";
import catAdventure from "@/assets/cat-adventure.png";
import catFood from "@/assets/cat-food.png";
import catSafari from "@/assets/cat-safari.png";
import { usePopularItineraries, usePublicItineraries } from "@/hooks/usePublicItineraries";
import { useProductListings } from "@/hooks/useProductListings";
import { generateProductPageUrl } from "@/utils/slugUtils";
import { useHomeCarousels } from "@/hooks/useHomeCarousels";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { CardActionMenu } from "@/components/CardActionMenu";
import { cn } from "@/lib/utils";
import { MobileShell } from "@/components/MobileShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const filterCategories = [
  { label: "Beaches", category: "Beach", icon: catBeaches },
  { label: "Nightlife", category: "Nightlife", icon: catNightlife },
  { label: "Nature", category: "Nature", icon: catNature },
  { label: "Adventure", category: "Adventure", icon: catAdventure },
  { label: "Food", category: "Food", icon: catFood },
  { label: "Safari", category: "Safari", icon: catSafari },
];

const rotatingPlaceholders = [
  "Search the best beaches",
  "Search cultural experiences",
  "Search food tours",
  "Search hidden gems",
  "Search sunset spots",
];

const CategoryFilterPills = ({ 
  activeCategory, 
  onCategoryChange 
}: { 
  activeCategory: string; 
  onCategoryChange: (cat: string) => void;
}) => {
  return (
    <div className="px-4 pb-3">
      <div className="flex justify-between">
        {filterCategories.map((cat) => {
          const isActive = activeCategory === cat.category;
          return (
            <button
              key={cat.label}
              onClick={() => onCategoryChange(isActive ? "" : cat.category)}
              className="flex flex-col items-center gap-1 transition-all active:scale-95"
            >
              <div className={cn(
                "w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-all overflow-hidden",
                isActive 
                  ? "ring-2 ring-primary bg-primary/5" 
                  : "bg-muted"
              )}>
                <img src={cat.icon} alt={cat.label} className="w-9 h-9 object-contain" />
              </div>
              <span className={cn(
                "text-[11px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {cat.label}
              </span>
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

// Itinerary card — same size as experience card
const MobileItineraryCard = ({ itinerary }: { itinerary: any }) => {
  const navigate = useNavigate();
  const experienceCount = itinerary.experiences?.length || 0;
  const coverImage = itinerary.coverImage || itinerary.experiences?.[0]?.videoThumbnail;

  return (
    <div 
      className="flex-shrink-0 w-[44vw] snap-start cursor-pointer active:scale-[0.97] transition-transform duration-100 will-change-transform"
      onClick={() => navigate(`/itineraries/${itinerary.id}`)}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {coverImage ? (
          <img src={coverImage} alt={itinerary.name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Layers className="w-8 h-8 text-primary/40" />
          </div>
        )}
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <CardActionMenu
            entityId={itinerary.id}
            entityType="itinerary"
            entityData={{ id: itinerary.id, name: itinerary.name, coverImage, creatorName: itinerary.creatorName }}
            title={itinerary.name}
          >
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-2xl border border-white/15 shadow-lg transition-all duration-150 active:scale-90">
              <Bookmark className="w-3.5 h-3.5 text-white/90" />
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

// Experience card — no heart on homepage, action menu top-right
const MobileExperienceCard = ({ experience }: { experience: any }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="flex-shrink-0 w-[44vw] snap-start cursor-pointer active:scale-[0.97] transition-transform duration-100 will-change-transform"
      onClick={() => navigate(generateProductPageUrl((experience as any).location || '', experience.title, (experience as any).slug))}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {experience.videoThumbnail ? (
          <img src={experience.videoThumbnail} alt={experience.title} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
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
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-2xl border border-white/15 shadow-lg transition-all duration-150 active:scale-90">
              <Bookmark className="w-3.5 h-3.5 text-white/90" />
            </button>
          </CardActionMenu>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm text-foreground truncate">{experience.title}</h3>
        <p className="text-xs text-muted-foreground truncate">{experience.location}</p>
        {experience.price && (
          <p className="text-xs text-muted-foreground truncate">{experience.price} typical</p>
        )}
      </div>
    </div>
  );
};

// POI card
const MobilePoiCard = ({ poi, destinationSlug }: { poi: any; destinationSlug?: string }) => {
  const navigate = useNavigate();

  return (
    <div 
      className="flex-shrink-0 w-[36vw] snap-start cursor-pointer active:scale-[0.97] transition-transform duration-100 will-change-transform"
      onClick={() => navigate(`/things-to-do/${destinationSlug || 'zanzibar'}/${poi.slug}`)}
    >
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted">
        {poi.cover_image ? (
          <img src={poi.cover_image} alt={poi.name} loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-foreground/10 to-foreground/5 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-[13px] font-bold line-clamp-2 leading-tight">{poi.name}</p>
          <p className="text-white/60 text-[10px] font-medium mt-0.5 capitalize">{poi.poi_type}</p>
        </div>
      </div>
    </div>
  );
};

// Static alias map
const cityAliases: Record<string, string[]> = {
  "Zanzibar": ["Zanzibar", "Stone Town", "Kendwa", "Nungwi", "Paje", "Jambiani"],
  "Dar es Salaam": ["Dar es Salaam", "Dar Es Salaam", "Dar"],
};

const matchesCity = (location: string, city: string): boolean => {
  if (!city) return true;
  const aliases = cityAliases[city] || [city];
  return aliases.some(a => location.toLowerCase().includes(a.toLowerCase()));
};

const itineraryMatchesCity = (itinerary: any, city: string): boolean => {
  if (!city) return true;
  if (itinerary.name?.toLowerCase().includes(city.toLowerCase())) return true;
  return itinerary.experiences?.some((e: any) => matchesCity(e.location || "", city)) || false;
};

const categoryLabelMap: Record<string, string> = {
  "Beach": "Beaches",
  "Nightlife": "Nightlife",
  "Wildlife": "Wildlife",
  "Adventure": "Adventures",
  "Food": "Food spots",
  "Culture": "Cultural experiences",
  "Water Sports": "Water sports",
};

export const MobileHomeView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCity, setSelectedCity] = useState(() => {
    const urlCity = searchParams.get("city");
    if (urlCity) return urlCity;
    try { return localStorage.getItem("swam_selected_city") || ""; } catch { return ""; }
  });
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const { data: allItinerariesData = [] } = usePublicItineraries();
  const allExpsData = useProductListings();
  const { data: homeCarousels = [] } = useHomeCarousels();

  // Fetch destinations to map selectedCity name → destination ID
  const { data: allDestinations = [] } = useQuery({
    queryKey: ["home-destinations"],
    queryFn: async () => {
      const { data } = await supabase.from("destinations").select("id, name, slug").eq("is_active", true);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const selectedDestId = useMemo(() => {
    if (!selectedCity) return null;
    const d = allDestinations.find((d: any) => d.name.toLowerCase() === selectedCity.toLowerCase() || d.slug === selectedCity.toLowerCase());
    return d?.id || null;
  }, [selectedCity, allDestinations]);

  // POIs for third carousel
  const { data: pois = [] } = useQuery({
    queryKey: ["home-pois"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pois")
        .select("id, name, slug, poi_type, cover_image, destination_id")
        .eq("is_active", true)
        .order("name");
      if (error) return [];
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
    const city = searchParams.get("city");
    if (city) {
      setSelectedCity(city);
    } else {
      // Fallback to localStorage when no URL param
      try {
        const persisted = localStorage.getItem("swam_selected_city") || "";
        setSelectedCity(persisted);
      } catch {
        setSelectedCity("");
      }
    }
  }, [searchParams]);

  const handleCityChange = useCallback((city: string) => {
    setSelectedCity(city);
  }, []);

  const itineraries = useMemo(() => {
    if (!selectedCity) return allItinerariesData;
    return allItinerariesData.filter(it => itineraryMatchesCity(it, selectedCity));
  }, [selectedCity, allItinerariesData]);

  const experiences = useMemo(() => {
    let filtered = allExpsData;
    if (selectedCity) {
      filtered = filtered.filter(e => matchesCity(e.location || "", selectedCity));
    }
    return filtered;
  }, [selectedCity, allExpsData]);

  const matchesCategory = useCallback((expCategory: string, filterCategory: string) => {
    if (!filterCategory) return true;
    const norm = expCategory?.toLowerCase() || '';
    const filter = filterCategory.toLowerCase();
    if (norm === filter) return true;
    if (filter === 'nature' && norm === 'wildlife') return true;
    if (filter === 'safari' && norm === 'safari') return true;
    return false;
  }, []);

  const categoryExperiences = useMemo(() => {
    if (!activeCategory) return experiences;
    return experiences.filter(e => matchesCategory(e.category, activeCategory));
  }, [experiences, activeCategory, matchesCategory]);

  const categoryItineraries = useMemo(() => {
    if (!activeCategory) return itineraries;
    return itineraries.filter(it => 
      it.experiences?.some((e: any) => matchesCategory(e.category, activeCategory))
    );
  }, [itineraries, activeCategory, matchesCategory]);

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
    return categoryExperiences.filter(e => {
      const fields = [e.title, e.location, e.category, e.creator].map(f => normalizeText(f || "")).join(" ");
      return terms.some(term => termMatches(term, fields));
    });
  }, [searchQuery, categoryExperiences]);

  const filteredItineraries = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = normalizeText(searchQuery);
    const terms = q.split(" ").filter(t => t.length > 1);
    if (terms.length === 0) return [];
    return categoryItineraries.filter(it => {
      const fields = [it.name, it.creatorName].map(f => normalizeText(f || "")).join(" ");
      const expMatch = it.experiences?.some((exp: any) => {
        const ef = [exp.title, exp.location, exp.category].map((f: string) => normalizeText(f || "")).join(" ");
        return terms.some(term => termMatches(term, ef));
      });
      return terms.some(term => termMatches(term, fields)) || expMatch;
    });
  }, [searchQuery, categoryItineraries]);

  const hasSearchResults = searchQuery.trim().length > 0;

  const cityLabel = selectedCity || "your city";
  const catLabel = activeCategory ? categoryLabelMap[activeCategory] || activeCategory : "";

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
          {searchQuery && (
            <button
              onClick={(e) => { e.stopPropagation(); setSearchQuery(""); }}
              className="p-1 rounded-full hover:bg-background/50"
            >
              <span className="text-muted-foreground text-sm">✕</span>
            </button>
          )}
        </button>
      </div>

      {/* Category filter pills */}
      <CategoryFilterPills activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

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
      {/* Dynamic collection-driven carousels — filtered by selected destination */}
      {homeCarousels.length > 0 ? (
        homeCarousels
          .filter((carousel) => {
            // If carousel has no destination restrictions → show always
            if (carousel.destinationIds.length === 0) return true;
            // If no city selected → show all carousels
            if (!selectedDestId) return true;
            // Only show if the carousel is assigned to the selected destination
            return carousel.destinationIds.includes(selectedDestId);
          })
          .map((carousel) => {
            const title = carousel.name.replace('{city}', selectedCity || 'your city');
            const resolvedSlug = carousel.slug.replace('city', selectedCity ? slugify(selectedCity) : 'city');
          
            if (carousel.contentType === 'itinerary') {
              const items = carousel.itemIds.length > 0
                ? categoryItineraries.filter(it => carousel.itemIds.includes(it.dbId || it.id))
                : categoryItineraries.slice(0, 6);
              if (items.length === 0) return null;
              return (
                <HorizontalScrollRow
                  key={carousel.id}
                  title={activeCategory ? `${catLabel} — ${title}` : title}
                   onTitleClick={() => navigate(`/collections/${resolvedSlug}`)}
                >
                  {items.slice(0, 8).map((itinerary) => (
                    <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
                  ))}
                </HorizontalScrollRow>
              );
            } else {
              const items = carousel.itemIds.length > 0
                ? categoryExperiences.filter(exp => carousel.itemIds.includes(exp.id))
                : categoryExperiences.slice(0, 8);
              if (items.length === 0) return null;
              return (
                <HorizontalScrollRow
                  key={carousel.id}
                  title={activeCategory ? `${catLabel} — ${title}` : title}
                  onTitleClick={() => navigate(`/collections/${resolvedSlug}`)}
                >
                  {items.slice(0, 10).map((experience) => (
                    <MobileExperienceCard key={experience.id} experience={experience} />
                  ))}
                </HorizontalScrollRow>
              );
            }
          })
      ) : (
        <>
          {categoryItineraries.length > 0 && (
            <HorizontalScrollRow title={selectedCity ? `Top in ${selectedCity}` : "Attractions you can't miss"}>
              {categoryItineraries.slice(0, 6).map((itinerary) => (
                <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
              ))}
            </HorizontalScrollRow>
          )}
          {categoryExperiences.length > 0 && (
            <HorizontalScrollRow title={`Available in ${cityLabel} next weekend`}>
              {categoryExperiences.slice(0, 8).map((experience) => (
                <MobileExperienceCard key={experience.id} experience={experience} />
              ))}
            </HorizontalScrollRow>
          )}
        </>
      )}

      {/* POI Carousel — filtered by destination, links to POI pages */}
      {pois.length > 0 && (() => {
        const destSlug = selectedCity ? slugify(selectedCity) : '';
        const filteredPois = selectedDestId
          ? pois.filter((p: any) => p.destination_id === selectedDestId)
          : pois;
        if (filteredPois.length === 0) return null;
        return (
          <HorizontalScrollRow title="Places to explore">
            {filteredPois.slice(0, 10).map((poi: any) => (
              <MobilePoiCard key={poi.id} poi={poi} destinationSlug={destSlug || 'zanzibar'} />
            ))}
          </HorizontalScrollRow>
        );
      })()}

      {activeCategory && categoryExperiences.length === 0 && categoryItineraries.length === 0 && (
        <div className="text-center py-12 px-4">
          <p className="text-sm text-muted-foreground">No {catLabel.toLowerCase()} found</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Try a different category</p>
        </div>
      )}
      </>
      )}
    </MobileShell>
  );
};
