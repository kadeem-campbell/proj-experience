import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { ExperienceCard } from "@/components/ExperienceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Compass, X, Heart, Plus, MapPin } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { allExperiences } from "@/hooks/useExperiencesData";
import { MobileShell } from "@/components/MobileShell";
import { useItineraries } from "@/hooks/useItineraries";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { cn } from "@/lib/utils";

// Horizontal scroll row - identical to itineraries/homepage
const HorizontalScrollRow = ({ 
  title, 
  children 
}: { 
  title: string;
  children: React.ReactNode;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div className="mb-8">
      <div className="mb-4" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
        <h2 className="text-base font-bold text-foreground truncate">{title}</h2>
      </div>
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

// Experience card for horizontal scroll - 4:3 aspect, same as homepage
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
              id: experience.id,
              title: experience.title,
              creator: experience.creator || '',
              videoThumbnail: experience.videoThumbnail || '',
              category: experience.category || '',
              location: experience.location || '',
              price: experience.price || '',
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

const ExperiencesPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const addToId = searchParams.get("addTo");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);
  const [addedCount, setAddedCount] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { addExperienceToItinerary, itineraries } = useItineraries();
  
  const experiences = allExperiences;
  const addToItinerary = addToId ? itineraries.find(i => i.id === addToId) : null;
  
  const filteredExperiences = experiences.filter((experience) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      experience.title.toLowerCase().includes(q) ||
      experience.location?.toLowerCase().includes(q) ||
      experience.category?.toLowerCase().includes(q) ||
      experience.creator?.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredExperiences.length) {
          setVisibleCount(prev => Math.min(prev + 12, filteredExperiences.length));
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [visibleCount, filteredExperiences.length]);

  if (isMobile) {
    // Group by category for horizontal rows
    const adventureItems = experiences.filter(e => e.category === "Adventure").slice(0, 10);
    const foodItems = experiences.filter(e => e.category === "Food").slice(0, 10);
    const beachItems = experiences.filter(e => e.category === "Beach").slice(0, 10);
    const wildlifeItems = experiences.filter(e => e.category === "Wildlife").slice(0, 10);
    const partyItems = experiences.filter(e => e.category === "Party" || e.category === "Nightlife").slice(0, 10);
    const cultureItems = experiences.filter(e => e.category === "Culture").slice(0, 10);
    const allItems = experiences.slice(0, 10);
    const moreItems = experiences.slice(10, 20);

    return (
      <MobileShell hideAvatar>
        {/* Add-to banner when coming from Create flow */}
        {addToItinerary && (
          <div className="mx-4 mb-4 mt-2 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Adding to</p>
              <p className="text-sm font-bold text-foreground truncate">{addToItinerary.name}</p>
              {addedCount > 0 && <p className="text-xs text-primary font-medium">{addedCount} added</p>}
            </div>
            <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => navigate(`/itineraries/${addToId}`)}>
              Done
            </Button>
          </div>
        )}

        <div className="mb-6 pt-2" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
          <h1 className="text-2xl font-bold text-foreground">{addToItinerary ? 'Add Experiences' : 'All Experiences'}</h1>
        </div>

        {allItems.length > 0 && (
          <HorizontalScrollRow title="Trending now">
            {allItems.map(exp => <MobileExperienceCard key={exp.id} experience={exp} />)}
          </HorizontalScrollRow>
        )}

        {beachItems.length > 0 && (
          <HorizontalScrollRow title="Beach vibes">
            {beachItems.map(exp => <MobileExperienceCard key={exp.id} experience={exp} />)}
          </HorizontalScrollRow>
        )}

        {adventureItems.length > 0 && (
          <HorizontalScrollRow title="Adventure awaits">
            {adventureItems.map(exp => <MobileExperienceCard key={exp.id} experience={exp} />)}
          </HorizontalScrollRow>
        )}

        {foodItems.length > 0 && (
          <HorizontalScrollRow title="Taste the local flavors">
            {foodItems.map(exp => <MobileExperienceCard key={exp.id} experience={exp} />)}
          </HorizontalScrollRow>
        )}

        {wildlifeItems.length > 0 && (
          <HorizontalScrollRow title="Wildlife encounters">
            {wildlifeItems.map(exp => <MobileExperienceCard key={exp.id} experience={exp} />)}
          </HorizontalScrollRow>
        )}

        {partyItems.length > 0 && (
          <HorizontalScrollRow title="Nightlife & parties">
            {partyItems.map(exp => <MobileExperienceCard key={exp.id} experience={exp} />)}
          </HorizontalScrollRow>
        )}

        {cultureItems.length > 0 && (
          <HorizontalScrollRow title="Culture & heritage">
            {cultureItems.map(exp => <MobileExperienceCard key={exp.id} experience={exp} />)}
          </HorizontalScrollRow>
        )}

        {moreItems.length > 0 && (
          <HorizontalScrollRow title="More to explore">
            {moreItems.map(exp => <MobileExperienceCard key={exp.id} experience={exp} />)}
          </HorizontalScrollRow>
        )}
      </MobileShell>
    );
  }

  // Desktop: featured section fills viewport, rest scrolls
  const featuredExperiences = filteredExperiences.slice(0, 10);
  const restExperiences = filteredExperiences.slice(10);

  return (
    <MainLayout showSidebar={false}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-6 lg:px-10 py-4">
          <div className="max-w-[1600px] mx-auto flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-muted/70">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" />
                <h1 className="text-xl lg:text-2xl font-bold">All Experiences</h1>
              </div>
              <span className="text-muted-foreground text-sm">({experiences.length})</span>
            </div>
            <div className="flex items-center bg-muted/50 border border-border/50 rounded-full px-4 py-2 w-80 hover:bg-muted/70 hover:border-border transition-all duration-200">
              <Search className="w-4 h-4 text-muted-foreground mr-3" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search experiences..."
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Featured section - fills remaining viewport */}
          {featuredExperiences.length > 0 && (
            <div className="h-[calc(100vh-80px)] flex flex-col px-6 lg:px-10 py-6">
              <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
                <h2 className="text-lg font-bold mb-4">Attractions you can't miss</h2>
                <div className="flex-1 grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-fr">
                  {featuredExperiences.map((experience) => (
                    <ExperienceCard key={experience.id} {...experience} compact />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Rest of experiences - normal scroll */}
          {restExperiences.length > 0 && (
            <div className="px-6 lg:px-10 py-6">
              <div className="max-w-[1600px] mx-auto">
                <h2 className="text-lg font-bold mb-4">More to explore</h2>
                <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
                  {restExperiences.slice(0, visibleCount - 10).map((experience) => (
                    <ExperienceCard key={experience.id} {...experience} compact />
                  ))}
                </div>
              </div>
            </div>
          )}

          {visibleCount < filteredExperiences.length && (
            <div ref={loadMoreRef} className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
            </div>
          )}

          {filteredExperiences.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No experiences found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ExperiencesPage;
