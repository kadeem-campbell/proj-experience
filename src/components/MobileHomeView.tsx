import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Plus, Layers, MapPin } from "lucide-react";
import { getPopularItineraries } from "@/data/itinerariesData";
import { allExperiences } from "@/hooks/useExperiencesData";
import { useItineraries } from "@/hooks/useItineraries";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { MobileShell } from "@/components/MobileShell";

type TabType = "itineraries" | "experiences";

// Horizontal scroll row component with left padding, overflow right
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
    <div className="mb-8">
      {/* Title - aligned with cards at 16px from left */}
      <button 
        onClick={onTitleClick}
        className="mb-4 block w-full text-left"
        style={{ paddingLeft: '16px', paddingRight: '16px' }}
      >
        <h2 className="text-lg font-bold text-foreground truncate">{title}</h2>
      </button>
      
      {/* Scrollable wrapper */}
      <div 
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide pb-2"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className="inline-flex gap-3 snap-x snap-mandatory" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Itinerary card for horizontal scroll - 3:2 aspect ratio
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
      className="flex-shrink-0 w-[55vw] snap-start cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => navigate(`/public-itinerary/${itinerary.id}`)}
    >
      <div className="relative aspect-[3/2] rounded-xl overflow-hidden bg-muted">
        {coverImage ? (
          <img src={coverImage} alt={itinerary.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Layers className="w-8 h-8 text-primary/40" />
          </div>
        )}
        <button onClick={handleLikeClick} className={cn(
          "absolute top-2 right-2 p-2 rounded-full bg-background/70 backdrop-blur-xl shadow-sm transition-all active:scale-90",
          liked && "bg-destructive/20"
        )}>
          <Heart className={cn("w-4 h-4", liked ? "fill-destructive text-destructive" : "text-foreground")} />
        </button>
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-background/70 backdrop-blur-xl shadow-sm flex items-center gap-1">
          <Layers className="w-3 h-3 text-foreground" />
          <span className="text-xs font-medium text-foreground">{experienceCount}</span>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{itinerary.name}</h3>
        <p className="text-xs text-muted-foreground truncate">
          {experienceCount} {experienceCount === 1 ? 'activity' : 'activities'}
        </p>
      </div>
    </div>
  );
};

// Experience card for horizontal scroll - 4:3 aspect ratio
const MobileExperienceCard = ({ experience }: { experience: any }) => {
  const navigate = useNavigate();
  const [localLiked, setLocalLiked] = useState(false);
  const { addExperienceToItinerary, activeItinerary, isInItinerary, removeExperienceFromItinerary } = useItineraries();
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();

  const liked = isAuthenticated ? isDbLiked(experience.id, 'experience') : localLiked;
  const inItinerary = isInItinerary(experience.id);

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

  const handleAddClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ('vibrate' in navigator) navigator.vibrate(10);
    if (activeItinerary) {
      if (inItinerary) {
        removeExperienceFromItinerary(activeItinerary.id, experience.id);
      } else {
        addExperienceToItinerary(activeItinerary.id, experience);
      }
    }
  };

  return (
    <div 
      className="flex-shrink-0 w-[55vw] snap-start cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => navigate(`/experience/${experience.id}`)}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
        {experience.videoThumbnail ? (
          <img src={experience.videoThumbnail} alt={experience.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <button onClick={handleLikeClick} className={cn(
          "absolute top-2 right-2 p-2 rounded-full bg-background/70 backdrop-blur-xl shadow-sm transition-all active:scale-90",
          liked && "bg-destructive/20"
        )}>
          <Heart className={cn("w-4 h-4", liked ? "fill-destructive text-destructive" : "text-foreground")} />
        </button>
        <button onClick={handleAddClick} className={cn(
          "absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90",
          inItinerary ? "bg-primary text-primary-foreground" : "bg-background/70 backdrop-blur-xl shadow-sm"
        )}>
          <Plus className={cn("w-4 h-4", inItinerary ? "rotate-45" : "text-foreground")} />
        </button>
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-1 text-foreground">{experience.title}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{experience.location}</span>
        </div>
        {experience.price && (
          <p className="text-xs text-muted-foreground">~{experience.price}</p>
        )}
      </div>
    </div>
  );
};

export const MobileHomeView = () => {
  const [activeTab, setActiveTab] = useState<TabType>("itineraries");
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const itineraries = getPopularItineraries();
  const experiences = allExperiences;

  const adventureExperiences = experiences.filter(e => e.category === "Adventure").slice(0, 10);
  const foodExperiences = experiences.filter(e => e.category === "Food").slice(0, 10);
  const beachExperiences = experiences.filter(e => e.category === "Beach").slice(0, 10);
  const wildlifeExperiences = experiences.filter(e => e.category === "Wildlife").slice(0, 10);
  const partyExperiences = experiences.filter(e => e.category === "Party").slice(0, 10);

  const displayName = userProfile?.full_name || userProfile?.username || user?.email?.split('@')[0] || "you";

  const tabPills = (
    <div className="flex gap-2">
      <button
        onClick={() => setActiveTab("itineraries")}
        className={cn(
          "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
          activeTab === "itineraries" 
            ? "bg-foreground text-background" 
            : "bg-muted text-foreground"
        )}
      >
        Itineraries
      </button>
      <button
        onClick={() => setActiveTab("experiences")}
        className={cn(
          "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
          activeTab === "experiences" 
            ? "bg-foreground text-background" 
            : "bg-muted text-foreground"
        )}
      >
        Experiences
      </button>
    </div>
  );

  return (
    <MobileShell headerContent={tabPills}>
      {/* Greeting - Spotify "Made for X" style */}
      <div className="mb-6 pt-2" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
        <h1 className="text-2xl font-bold text-foreground">
          Made for {displayName}
        </h1>
      </div>

      {activeTab === "itineraries" ? (
        <>
          <HorizontalScrollRow 
            title="Attractions you can't miss"
            onTitleClick={() => navigate("/itineraries")}
          >
            {itineraries.slice(0, 6).map((itinerary) => (
              <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
            ))}
          </HorizontalScrollRow>

          <HorizontalScrollRow 
            title="Available in Dar Es Salaam next weekend"
            onTitleClick={() => navigate("/experiences?location=dar")}
          >
            {experiences.slice(0, 8).map((experience) => (
              <MobileExperienceCard key={experience.id} experience={experience} />
            ))}
          </HorizontalScrollRow>

          <HorizontalScrollRow 
            title="Curated by locals"
            onTitleClick={() => navigate("/itineraries")}
          >
            {itineraries.slice(3, 9).map((itinerary) => (
              <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
            ))}
          </HorizontalScrollRow>

          {adventureExperiences.length > 0 && (
            <HorizontalScrollRow 
              title="Adventure awaits"
              onTitleClick={() => navigate("/experiences?category=adventure")}
            >
              {adventureExperiences.map((experience) => (
                <MobileExperienceCard key={experience.id} experience={experience} />
              ))}
            </HorizontalScrollRow>
          )}

          {foodExperiences.length > 0 && (
            <HorizontalScrollRow 
              title="Taste the local flavors"
              onTitleClick={() => navigate("/experiences?category=food")}
            >
              {foodExperiences.map((experience) => (
                <MobileExperienceCard key={experience.id} experience={experience} />
              ))}
            </HorizontalScrollRow>
          )}
        </>
      ) : (
        <>
          <HorizontalScrollRow 
            title="Available in Dar Es Salaam next weekend"
            onTitleClick={() => navigate("/experiences?location=dar")}
          >
            {experiences.slice(0, 8).map((experience) => (
              <MobileExperienceCard key={experience.id} experience={experience} />
            ))}
          </HorizontalScrollRow>

          {adventureExperiences.length > 0 && (
            <HorizontalScrollRow 
              title="Adventure awaits"
              onTitleClick={() => navigate("/experiences?category=adventure")}
            >
              {adventureExperiences.map((experience) => (
                <MobileExperienceCard key={experience.id} experience={experience} />
              ))}
            </HorizontalScrollRow>
          )}

          {beachExperiences.length > 0 && (
            <HorizontalScrollRow 
              title="Beach vibes"
              onTitleClick={() => navigate("/experiences?category=beach")}
            >
              {beachExperiences.map((experience) => (
                <MobileExperienceCard key={experience.id} experience={experience} />
              ))}
            </HorizontalScrollRow>
          )}

          {foodExperiences.length > 0 && (
            <HorizontalScrollRow 
              title="Taste the local flavors"
              onTitleClick={() => navigate("/experiences?category=food")}
            >
              {foodExperiences.map((experience) => (
                <MobileExperienceCard key={experience.id} experience={experience} />
              ))}
            </HorizontalScrollRow>
          )}

          {wildlifeExperiences.length > 0 && (
            <HorizontalScrollRow 
              title="Wildlife encounters"
              onTitleClick={() => navigate("/experiences?category=wildlife")}
            >
              {wildlifeExperiences.map((experience) => (
                <MobileExperienceCard key={experience.id} experience={experience} />
              ))}
            </HorizontalScrollRow>
          )}

          {partyExperiences.length > 0 && (
            <HorizontalScrollRow 
              title="Nightlife & parties"
              onTitleClick={() => navigate("/experiences?category=party")}
            >
              {partyExperiences.map((experience) => (
                <MobileExperienceCard key={experience.id} experience={experience} />
              ))}
            </HorizontalScrollRow>
          )}

          <HorizontalScrollRow 
            title="Curated collections"
            onTitleClick={() => navigate("/itineraries")}
          >
            {itineraries.slice(0, 6).map((itinerary) => (
              <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
            ))}
          </HorizontalScrollRow>
        </>
      )}
    </MobileShell>
  );
};
