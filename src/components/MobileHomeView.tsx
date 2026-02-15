import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Plus, Layers, MapPin, Search, ArrowRight, Compass, Map } from "lucide-react";
import { getPopularItineraries } from "@/data/itinerariesData";
import { allExperiences } from "@/hooks/useExperiencesData";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { LocationSelector } from "@/components/LocationSelector";
import { cn } from "@/lib/utils";
import { MobileShell } from "@/components/MobileShell";

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
    <div className="mb-8">
      <button 
        onClick={onTitleClick}
        className="mb-4 block w-full text-left"
        style={{ paddingLeft: '16px', paddingRight: '16px' }}
      >
        <h2 className="text-lg font-bold text-foreground truncate">{title}</h2>
      </button>
      <div 
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="inline-flex gap-3 snap-x snap-mandatory" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Itinerary card – same 44vw width as experiences
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
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <button onClick={handleLikeClick} className={cn(
          "absolute top-2 right-2 p-2 rounded-full bg-background/70 backdrop-blur-xl shadow-sm transition-all active:scale-90",
          liked && "bg-destructive/20"
        )}>
          <Heart className={cn("w-4 h-4", liked ? "fill-destructive text-destructive" : "text-foreground")} />
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
            <button className="w-8 h-8 rounded-full flex items-center justify-center bg-background/70 backdrop-blur-xl shadow-sm transition-all active:scale-90">
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

// Interactive education hero section (Polarsteps-inspired)
const InteractiveHero = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  
  const features = [
    { icon: Compass, title: "Discover experiences", desc: "Find the best things to do in your city", color: "from-primary/20 to-primary/5" },
    { icon: Map, title: "Build itineraries", desc: "Plan your perfect trip with local picks", color: "from-accent/20 to-accent/5" },
    { icon: Heart, title: "Save & share", desc: "Keep your favourites and share with friends", color: "from-destructive/10 to-destructive/5" },
  ];

  return (
    <div className="mb-6 px-4">
      <div className="rounded-2xl bg-muted/40 border border-border/30 p-5 overflow-hidden">
        <div className="flex gap-2 mb-4">
          {features.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveFeature(i)}
              className={cn(
                "h-1 rounded-full flex-1 transition-all duration-500",
                i === activeFeature ? "bg-primary" : "bg-muted-foreground/20"
              )}
            />
          ))}
        </div>
        
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br transition-all duration-500",
            features[activeFeature].color
          )}>
            {(() => {
              const Icon = features[activeFeature].icon;
              return <Icon className="w-6 h-6 text-foreground" />;
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground mb-1">{features[activeFeature].title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{features[activeFeature].desc}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => navigate("/itineraries")}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold active:scale-[0.98] transition-transform"
          >
            Explore itineraries
          </button>
          <button
            onClick={() => navigate("/experiences")}
            className="flex-1 py-2.5 rounded-xl bg-muted border border-border/50 text-foreground text-sm font-semibold active:scale-[0.98] transition-transform"
          >
            Browse experiences
          </button>
        </div>
      </div>
    </div>
  );
};

export const MobileHomeView = () => {
  const [selectedCity, setSelectedCity] = useState("Zanzibar");
  const navigate = useNavigate();

  const itineraries = getPopularItineraries();
  const experiences = allExperiences;

  const adventureExperiences = experiences.filter(e => e.category === "Adventure").slice(0, 10);
  const foodExperiences = experiences.filter(e => e.category === "Food").slice(0, 10);
  const beachExperiences = experiences.filter(e => e.category === "Beach").slice(0, 10);

  // Header: SWAM logo on left, navigation on right
  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <h1 className="text-xl font-black tracking-tight text-foreground">SWAM</h1>
      <div className="flex gap-3">
        <button
          onClick={() => navigate("/itineraries")}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Itineraries
        </button>
        <button
          onClick={() => navigate("/experiences")}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Experiences
        </button>
      </div>
    </div>
  );

  return (
    <MobileShell headerContent={headerContent} hideAvatar notFixed>
      {/* Search bar */}
      <div className="px-4 mb-4 pt-2">
        <button
          onClick={() => {/* triggers search overlay from MobileShell */}}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/60 border border-border/40"
        >
          <Search className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">What do you want to explore?</span>
        </button>
      </div>

      {/* Location selector */}
      <div className="px-4 mb-5 overflow-x-auto scrollbar-hide">
        <LocationSelector selectedCity={selectedCity} onCityChange={setSelectedCity} />
      </div>

      {/* Interactive education hero */}
      <InteractiveHero />

      {/* Alternating content: itineraries first, then experiences */}
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
        onTitleClick={() => navigate("/experiences")}
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
          onTitleClick={() => navigate("/experiences?tag=Adventure")}
        >
          {adventureExperiences.map((experience) => (
            <MobileExperienceCard key={experience.id} experience={experience} />
          ))}
        </HorizontalScrollRow>
      )}

      <HorizontalScrollRow 
        title="Weekend getaways"
        onTitleClick={() => navigate("/itineraries")}
      >
        {itineraries.slice(1, 7).map((itinerary) => (
          <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
        ))}
      </HorizontalScrollRow>

      {foodExperiences.length > 0 && (
        <HorizontalScrollRow 
          title="Taste the local flavors"
          onTitleClick={() => navigate("/experiences?tag=Food")}
        >
          {foodExperiences.map((experience) => (
            <MobileExperienceCard key={experience.id} experience={experience} />
          ))}
        </HorizontalScrollRow>
      )}

      <HorizontalScrollRow 
        title="Popular this week"
        onTitleClick={() => navigate("/itineraries")}
      >
        {itineraries.slice(2, 8).map((itinerary) => (
          <MobileItineraryCard key={itinerary.id} itinerary={itinerary} />
        ))}
      </HorizontalScrollRow>

      {beachExperiences.length > 0 && (
        <HorizontalScrollRow 
          title="Beach vibes"
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
