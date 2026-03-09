import { useState, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Plus, Layers, MapPin, Compass, Map, Share2, MapPinned, Sparkles, Search, Check } from "lucide-react";
import { getPopularItineraries } from "@/data/itinerariesData";
import { allExperiences } from "@/hooks/useExperiencesData";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { cn } from "@/lib/utils";
import { MobileShell } from "@/components/MobileShell";
import { MobileSearchOverlay } from "@/components/MobileSearchOverlay";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

const mapCities = [
  { name: "Zanzibar", available: true },
  { name: "Dar es Salaam", available: true },
  { name: "Entebbe", available: false, launchDate: "18 March" },
  { name: "Kampala", available: false, launchDate: "20 March" },
  { name: "Nairobi", available: false, launchDate: "21 March" },
  { name: "Cape Town", available: false, launchDate: "1 April" },
];


const cities = ["Zanzibar", "Dar es Salaam", "Nairobi", "Kigali", "Kampala"];

const discoverySlides = [
  {
    icon: Compass,
    title: "Discover experiences",
    subtitle: "Find the best things to do in your city",
    colorClass: "bg-experience-color",
    textClass: "text-experience-color",
    bgClass: "bg-experience-color/10",
    ctas: [
      { label: "Find Experiences", primary: true, route: "/experiences" },
    ],
  },
  {
    icon: Map,
    title: "Explore itineraries",
    subtitle: "Plan your perfect trip with local guides",
    colorClass: "bg-itinerary-color",
    textClass: "text-itinerary-color",
    bgClass: "bg-itinerary-color/10",
    ctas: [
      { label: "Explore Itineraries", primary: true, route: "/itineraries" },
    ],
  },
  {
    icon: MapPinned,
    title: "Create an itinerary",
    subtitle: "Build and share your own travel plans",
    colorClass: "bg-social-color",
    textClass: "text-social-color",
    bgClass: "bg-social-color/10",
    ctas: [
      { label: "Create Itinerary", primary: true, route: "/itineraries?create=true" },
    ],
  },
];

const DiscoveryCard = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const navigate = useNavigate();
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const slide = discoverySlides[activeSlide];
  const Icon = slide.icon;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0 && activeSlide < discoverySlides.length - 1) {
        setActiveSlide(activeSlide + 1);
      } else if (diff < 0 && activeSlide > 0) {
        setActiveSlide(activeSlide - 1);
      }
    }
  };

  return (
    <div
      className="mx-4 mt-1 mb-0 py-5 px-4 rounded-2xl relative overflow-hidden"
      style={{
        background: `linear-gradient(to bottom, hsl(var(--muted)), hsl(var(--background)))`,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bars */}
      <div className="flex gap-1.5 mb-5">
        {discoverySlides.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveSlide(i)}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i === activeSlide ? s.colorClass : "bg-foreground/15"
            )}
          />
        ))}
      </div>

        {/* Content - centered */}
        <div className="flex flex-col items-center text-center gap-3 mb-4">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", slide.bgClass)}>
            <Icon className={cn("w-5 h-5", slide.textClass)} />
          </div>
          <div>
            <h3 className="text-[17px] font-bold text-foreground">{slide.title}</h3>
            <p className="text-sm text-muted-foreground">{slide.subtitle}</p>
          </div>
        </div>

        {/* CTAs - centered */}
        <div className="flex gap-2 justify-center">
          {slide.ctas.map((cta, i) => (
            <button
              key={i}
              onClick={() => navigate(cta.route)}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95",
                cta.primary
                  ? cn(slide.colorClass, "text-white")
                  : "bg-muted text-foreground"
              )}
            >
              {cta.label}
            </button>
          ))}
      </div>
    </div>
  );
};

// Horizontal scroll row component
const HorizontalScrollRow = ({ 
  title, 
  onTitleClick,
  variant = "default",
  children 
}: { 
  title: string;
  onTitleClick?: () => void;
  variant?: "itinerary" | "experience" | "default";
  children: React.ReactNode;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const chevronColor = variant === "itinerary" ? "text-itinerary-color" : variant === "experience" ? "text-experience-color" : "text-muted-foreground";

  return (
    <div className="py-5">
      <button 
        onClick={onTitleClick}
        className="mb-3 flex items-center gap-1.5 w-full text-left px-4"
      >
        <h2 className="text-[17px] font-bold text-foreground">{title}</h2>
        <span className={cn("text-lg font-semibold", chevronColor)}>›</span>
      </button>
      <div 
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
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
  const [localLiked, setLocalLiked] = useState(false);
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();

  const liked = isAuthenticated ? isDbLiked(itinerary.id, 'itinerary') : localLiked;
  const experienceCount = itinerary.experiences?.length || 0;
  const coverImage = itinerary.coverImage || itinerary.experiences?.[0]?.videoThumbnail;

  const handleLikeClick = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ('vibrate' in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(itinerary.id, 'itinerary', {
        id: itinerary.id, name: itinerary.name, coverImage: itinerary.coverImage,
        creatorName: itinerary.creatorName, experiences: itinerary.experiences?.slice(0, 3)
      });
    } else {
      setLocalLiked(!localLiked);
    }
  };

  return (
    <div 
      className="flex-shrink-0 w-[44vw] snap-start cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => navigate(`/itineraries/${itinerary.id}`)}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {coverImage ? (
          <img src={coverImage} alt={itinerary.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-itinerary-color/20 to-itinerary-color/5 flex items-center justify-center">
            <Layers className="w-8 h-8 text-itinerary-color/40" />
          </div>
        )}
        <button onClick={handleLikeClick} className={cn(
          "absolute top-2 right-2 p-2 rounded-full backdrop-blur-xl shadow-sm transition-all active:scale-90",
          liked ? "bg-experience-color/20" : "bg-white/80 hover:bg-itinerary-color/10"
        )}>
          <Heart className={cn("w-4 h-4", liked ? "fill-experience-color text-experience-color" : "text-foreground")} />
        </button>
        <div className={cn(
          "absolute top-2 left-2 px-2 py-1 rounded-full backdrop-blur-xl shadow-sm flex items-center gap-1",
          "bg-white/80 hover:bg-itinerary-color/10 transition-colors"
        )}>
          <Layers className="w-3 h-3 text-foreground" />
          <span className="text-xs font-medium text-foreground">{experienceCount}</span>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{itinerary.name}</h3>
        <p className="text-xs text-muted-foreground truncate">
          {itinerary.creatorName || 'Local Creator'}
        </p>
      </div>
    </div>
  );
};

// Experience card with + button
const MobileExperienceCard = ({ experience }: { experience: any }) => {
  const navigate = useNavigate();
  const [localLiked, setLocalLiked] = useState(false);
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();

  const liked = isAuthenticated ? isDbLiked(experience.id, 'experience') : localLiked;

  const handleLikeClick = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ('vibrate' in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(experience.id, 'experience', {
        id: experience.id, title: experience.title,
        videoThumbnail: experience.videoThumbnail, location: experience.location, category: experience.category
      });
    } else {
      setLocalLiked(!localLiked);
    }
  };

  return (
    <div 
      className="flex-shrink-0 w-[44vw] snap-start cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => navigate(`/experience/${experience.id}`)}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {experience.videoThumbnail ? (
          <img src={experience.videoThumbnail} alt={experience.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-experience-color/20 to-experience-color/5" />
        )}
        <button onClick={handleLikeClick} className={cn(
          "absolute top-2 right-2 p-2 rounded-full backdrop-blur-xl shadow-sm transition-all active:scale-90",
          liked ? "bg-experience-color/20" : "bg-white/80 hover:bg-experience-color/10"
        )}>
          <Heart className={cn("w-4 h-4", liked ? "fill-experience-color text-experience-color" : "text-foreground")} />
        </button>
        <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
          <ItinerarySelector
            experienceId={experience.id}
            experienceData={{
              id: experience.id, title: experience.title, creator: experience.creator || '',
              videoThumbnail: experience.videoThumbnail || '', category: experience.category || '',
              location: experience.location || '', price: experience.price || '',
            }}
          >
            <button className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xl shadow-sm transition-all active:scale-90",
              "bg-white/80 hover:bg-experience-color/10"
            )}>
              <Plus className="w-4 h-4 text-foreground" />
            </button>
          </ItinerarySelector>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{experience.title}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{experience.location}</span>
        </div>
      </div>
    </div>
  );
};


// Static alias map - defined once outside component
const cityAliases: Record<string, string[]> = {
  "Zanzibar": ["Zanzibar", "Stone Town", "Kendwa", "Nungwi", "Paje", "Jambiani"],
  "Dar es Salaam": ["Dar es Salaam", "Dar Es Salaam", "Dar"],
  "Nairobi": ["Nairobi"],
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

// Pre-compute all data once at module level
const allItinerariesData = getPopularItineraries();
const allExpsData = allExperiences;

export const MobileHomeView = () => {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState("");
  const [cityDrawerOpen, setCityDrawerOpen] = useState(false);

  const handleCityChange = useCallback((city: string) => {
    setSelectedCity(city);
    setCityDrawerOpen(false);
  }, []);

  const itineraries = useMemo(() => {
    if (!selectedCity) return allItinerariesData;
    return allItinerariesData.filter(it => itineraryMatchesCity(it, selectedCity));
  }, [selectedCity]);

  const experiences = useMemo(() => {
    if (!selectedCity) return allExpsData;
    return allExpsData.filter(e => matchesCity(e.location || "", selectedCity));
  }, [selectedCity]);

  const adventureExperiences = useMemo(() => experiences.filter(e => e.category === "Adventure").slice(0, 10), [experiences]);
  const foodExperiences = useMemo(() => experiences.filter(e => e.category === "Food").slice(0, 10), [experiences]);
  const beachExperiences = useMemo(() => experiences.filter(e => e.category === "Beach").slice(0, 10), [experiences]);

  const cityLabel = selectedCity || "your city";

  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <h1 className="text-xl font-black tracking-tight text-foreground">SWAM</h1>
      <div className="flex items-center gap-2">
        {selectedCity && (
          <button
            onClick={() => handleCityChange("")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold"
          >
            <MapPin className="w-3 h-3" />
            {selectedCity}
            <span className="ml-0.5 text-primary/60">✕</span>
          </button>
        )}
        <button onClick={() => setCityDrawerOpen(true)} className="p-2 bg-muted/60 rounded-xl">
          <Map className="w-5 h-5 text-foreground" strokeWidth={2} />
        </button>
      </div>
    </div>
  );

  return (
    <MobileShell headerContent={headerContent} hideAvatar notFixed>

      {/* City selector drawer */}
      <Drawer open={cityDrawerOpen} onOpenChange={setCityDrawerOpen}>
        <DrawerContent className="bg-card border-border">
          <div className="px-5 pt-4 pb-8">
            <h2 className="text-lg font-bold text-foreground mb-1">Choose a city</h2>
            <p className="text-sm text-muted-foreground mb-5">Select a city to explore experiences</p>
            <div className="space-y-2.5">
              {mapCities.map((city) => (
                <button
                  key={city.name}
                  disabled={!city.available}
                  onClick={() => city.available && handleCityChange(selectedCity === city.name ? "" : city.name)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left",
                    city.available
                      ? selectedCity === city.name
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-background border border-border/60 active:scale-[0.98]"
                      : "bg-muted/40 border border-border/30 opacity-60"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    city.available ? "bg-primary/10" : "bg-muted"
                  )}>
                    <MapPin className={cn("w-5 h-5", city.available ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn("text-[15px] font-semibold", city.available ? "text-foreground" : "text-muted-foreground")}>
                      {city.name}
                    </h3>
                    {!city.available && city.launchDate && (
                      <p className="text-xs text-muted-foreground mt-0.5">Coming {city.launchDate}</p>
                    )}
                    {city.available && (
                      <p className="text-xs text-primary mt-0.5">Available now</p>
                    )}
                  </div>
                  {city.available && selectedCity === city.name && (
                    <Check className="w-5 h-5 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Discovery card */}
      <DiscoveryCard />

      {/* Alternating content */}
      {itineraries.length > 0 && (
        <HorizontalScrollRow 
          title={selectedCity ? `Top in ${selectedCity}` : "Attractions you can't miss"}
          variant="itinerary"
          onTitleClick={() => navigate("/itineraries")}
        >
          {itineraries.slice(0, 6).map((itinerary) => (
            <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
          ))}
        </HorizontalScrollRow>
      )}

      {experiences.length > 0 && (
        <HorizontalScrollRow 
          title={`Available in ${cityLabel} next weekend`}
          variant="experience"
          onTitleClick={() => navigate("/experiences")}
        >
          {experiences.slice(0, 8).map((experience) => (
            <MobileExperienceCard key={experience.id} experience={experience} />
          ))}
        </HorizontalScrollRow>
      )}

      {itineraries.length > 3 && (
        <HorizontalScrollRow 
          title="Curated by locals"
          variant="itinerary"
          onTitleClick={() => navigate("/itineraries")}
        >
          {itineraries.slice(3, 9).map((itinerary) => (
            <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
          ))}
        </HorizontalScrollRow>
      )}

      {adventureExperiences.length > 0 && (
        <HorizontalScrollRow 
          title="Adventure awaits"
          variant="experience"
          onTitleClick={() => navigate("/experiences?tag=Adventure")}
        >
          {adventureExperiences.map((experience) => (
            <MobileExperienceCard key={experience.id} experience={experience} />
          ))}
        </HorizontalScrollRow>
      )}

      {itineraries.length > 1 && (
        <HorizontalScrollRow 
          title="Weekend getaways"
          variant="itinerary"
          onTitleClick={() => navigate("/itineraries")}
        >
          {itineraries.slice(1, 7).map((itinerary) => (
            <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
          ))}
        </HorizontalScrollRow>
      )}

      {foodExperiences.length > 0 && (
        <HorizontalScrollRow 
          title="Taste the local flavors"
          variant="experience"
          onTitleClick={() => navigate("/experiences?tag=Food")}
        >
          {foodExperiences.map((experience) => (
            <MobileExperienceCard key={experience.id} experience={experience} />
          ))}
        </HorizontalScrollRow>
      )}

      {itineraries.length > 2 && (
        <HorizontalScrollRow 
          title="Popular this week"
          variant="itinerary"
          onTitleClick={() => navigate("/itineraries")}
        >
          {itineraries.slice(2, 8).map((itinerary) => (
            <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
          ))}
        </HorizontalScrollRow>
      )}

      {beachExperiences.length > 0 && (
        <HorizontalScrollRow 
          title="Beach vibes"
          variant="experience"
          onTitleClick={() => navigate("/experiences?tag=Beaches")}
        >
          {beachExperiences.map((experience) => (
            <MobileExperienceCard key={experience.id} experience={experience} />
          ))}
        </HorizontalScrollRow>
      )}
    </MobileShell>
  );
};
