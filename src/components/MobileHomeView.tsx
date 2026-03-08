import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Plus, Layers, MapPin, Compass, Map, Share2 } from "lucide-react";
import { getPopularItineraries } from "@/data/itinerariesData";
import { allExperiences } from "@/hooks/useExperiencesData";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { cn } from "@/lib/utils";
import { MobileShell } from "@/components/MobileShell";

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

  const itineraries = getPopularItineraries();
  const experiences = allExperiences;

  const adventureExperiences = experiences.filter(e => e.category === "Adventure").slice(0, 10);
  const foodExperiences = experiences.filter(e => e.category === "Food").slice(0, 10);
  const beachExperiences = experiences.filter(e => e.category === "Beach").slice(0, 10);

  // Header: just SWAM logo
  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <h1 className="text-xl font-black tracking-tight text-foreground">SWAM</h1>
    </div>
  );

  return (
    <MobileShell headerContent={headerContent} hideAvatar notFixed>
      {/* Uber-style pillar hero */}
      <PillarHero />

      {/* Alternating content */}
      <HorizontalScrollRow 
        title="Attractions you can't miss"
        variant="itinerary"
        onTitleClick={() => navigate("/itineraries")}
      >
        {itineraries.slice(0, 6).map((itinerary) => (
          <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
        ))}
      </HorizontalScrollRow>

      <HorizontalScrollRow 
        title="Available in Dar Es Salaam next weekend"
        variant="experience"
        onTitleClick={() => navigate("/experiences")}
      >
        {experiences.slice(0, 8).map((experience) => (
          <MobileExperienceCard key={experience.id} experience={experience} />
        ))}
      </HorizontalScrollRow>

      <HorizontalScrollRow 
        title="Curated by locals"
        variant="itinerary"
        onTitleClick={() => navigate("/itineraries")}
      >
        {itineraries.slice(3, 9).map((itinerary) => (
          <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
        ))}
      </HorizontalScrollRow>

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

      <HorizontalScrollRow 
        title="Weekend getaways"
        variant="itinerary"
        onTitleClick={() => navigate("/itineraries")}
      >
        {itineraries.slice(1, 7).map((itinerary) => (
          <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
        ))}
      </HorizontalScrollRow>

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

      <HorizontalScrollRow 
        title="Popular this week"
        variant="itinerary"
        onTitleClick={() => navigate("/itineraries")}
      >
        {itineraries.slice(2, 8).map((itinerary) => (
          <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
        ))}
      </HorizontalScrollRow>

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
