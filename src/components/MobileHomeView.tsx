import { useState, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Heart, Plus, Layers, MapPin, Compass, Map, Share2, MapPinned, Sparkles, Search } from "lucide-react";
import { getPopularItineraries } from "@/data/itinerariesData";
import { allExperiences } from "@/hooks/useExperiencesData";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { cn } from "@/lib/utils";
import { MobileShell } from "@/components/MobileShell";


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
      { label: "Itineraries", primary: true, route: "/itineraries" },
      { label: "Experiences", primary: false, route: "/experiences" },
    ],
  },
  {
    icon: Map,
    title: "Build itineraries",
    subtitle: "Plan your perfect trip with local guides",
    colorClass: "bg-itinerary-color",
    textClass: "text-itinerary-color",
    bgClass: "bg-itinerary-color/10",
    ctas: [
      { label: "Itineraries", primary: true, route: "/itineraries" },
      { label: "Experiences", primary: false, route: "/itineraries" },
    ],
  },
  {
    icon: Share2,
    title: "Save & share",
    subtitle: "Share your adventures with friends",
    colorClass: "bg-social-color",
    textClass: "text-social-color",
    bgClass: "bg-social-color/10",
    ctas: [
      { label: "Get started", primary: true, route: "/experiences" },
      { label: "Learn more", primary: false, route: "/about" },
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

  const sectionBg = variant === "itinerary" 
    ? "bg-itinerary-bg" 
    : variant === "experience" 
    ? "bg-experience-bg" 
    : "";

  const accentColor = variant === "itinerary" 
    ? "bg-itinerary-color" 
    : variant === "experience" 
    ? "bg-experience-color" 
    : "";

  return (
    <div className={cn("py-5", sectionBg)}>
      <button 
        onClick={onTitleClick}
        className="mb-3 block w-full text-left px-4"
      >
        <div className="flex items-center gap-2">
          {accentColor && (
            <span className={cn("w-1 h-5 rounded-full inline-block", accentColor)} />
          )}
          <h2 className="text-[17px] font-bold text-foreground">{title}</h2>
        </div>
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
      onClick={() => navigate(`/public-itinerary/${itinerary.id}`)}
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


export const MobileHomeView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedCity = searchParams.get("city") || "";

  const allItineraries = getPopularItineraries();
  const allExps = allExperiences;

  // City alias mapping for fuzzy location matching
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
    // Check itinerary name
    if (itinerary.name?.toLowerCase().includes(city.toLowerCase())) return true;
    // Check if any experience in itinerary matches
    return itinerary.experiences?.some((e: any) => matchesCity(e.location || "", city)) || false;
  };

  const itineraries = useMemo(() => {
    if (!selectedCity) return allItineraries;
    return allItineraries.filter(it => itineraryMatchesCity(it, selectedCity));
  }, [selectedCity, allItineraries]);

  const experiences = useMemo(() => {
    if (!selectedCity) return allExps;
    return allExps.filter(e => matchesCity(e.location || "", selectedCity));
  }, [selectedCity, allExps]);

  const adventureExperiences = experiences.filter(e => e.category === "Adventure").slice(0, 10);
  const foodExperiences = experiences.filter(e => e.category === "Food").slice(0, 10);
  const beachExperiences = experiences.filter(e => e.category === "Beach").slice(0, 10);

  const cityLabel = selectedCity || "your city";

  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-black tracking-tight text-foreground">SWAM</h1>
        {selectedCity && (
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold"
          >
            <MapPin className="w-3 h-3" />
            {selectedCity}
            <span className="ml-0.5 text-primary/60">✕</span>
          </button>
        )}
      </div>
      <button onClick={() => navigate(selectedCity ? `/map?city=${encodeURIComponent(selectedCity)}` : "/map")} className="p-2 bg-muted/60 rounded-xl">
        <Map className="w-5 h-5 text-foreground" strokeWidth={2} />
      </button>
    </div>
  );

  return (
    <MobileShell headerContent={headerContent} hideAvatar notFixed>

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
