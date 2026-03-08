import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { ExperienceCard } from "@/components/ExperienceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Compass, X, Heart, Plus, MapPin } from "lucide-react";
import { LocationSelector } from "@/components/LocationSelector";
import { useIsMobile } from "@/hooks/use-mobile";
import { allExperiences } from "@/hooks/useExperiencesData";
import { MobileShell } from "@/components/MobileShell";
import { useItineraries } from "@/hooks/useItineraries";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { cn } from "@/lib/utils";

const tags = ["All", "Beaches", "Water Sports", "Nightlife", "Wildlife", "Adventure", "Food", "Culture", "Wellness"];

const tagToCategoryMap: Record<string, string> = {
  "Beaches": "Beach",
  "Water Sports": "Adventure",
  "Nightlife": "Nightlife",
  "Wildlife": "Wildlife",
  "Adventure": "Adventure",
  "Food": "Food",
  "Culture": "Culture",
  "Wellness": "Wellness",
};

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
  const initialTag = searchParams.get("tag");
  const matchedTag = initialTag ? tags.find(t => t.toLowerCase() === initialTag.toLowerCase()) || "All" : "All";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);
  const [activeTag, setActiveTag] = useState(matchedTag);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const tagScrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const experiences = allExperiences;

  // Filter by tag
  const tagFilteredExperiences = activeTag === "All"
    ? experiences
    : experiences.filter(e => e.category === (tagToCategoryMap[activeTag] || activeTag));
  
  const filteredExperiences = tagFilteredExperiences.filter((experience) => {
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
    const handleTagClick = (tag: string, index: number) => {
      setActiveTag(tag);
      const container = tagScrollRef.current;
      if (container) {
        const buttons = container.querySelectorAll('button');
        const btn = buttons[index];
        if (btn) {
          const containerRect = container.getBoundingClientRect();
          const btnRect = btn.getBoundingClientRect();
          const scrollLeft = container.scrollLeft + (btnRect.left - containerRect.left);
          container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
      }
    };

    // Group by category for horizontal rows
    const adventureItems = tagFilteredExperiences.filter(e => e.category === "Adventure").slice(0, 10);
    const foodItems = tagFilteredExperiences.filter(e => e.category === "Food").slice(0, 10);
    const beachItems = tagFilteredExperiences.filter(e => e.category === "Beach").slice(0, 10);
    const wildlifeItems = tagFilteredExperiences.filter(e => e.category === "Wildlife").slice(0, 10);
    const partyItems = tagFilteredExperiences.filter(e => e.category === "Party" || e.category === "Nightlife").slice(0, 10);
    const cultureItems = tagFilteredExperiences.filter(e => e.category === "Culture").slice(0, 10);
    const allItems = tagFilteredExperiences.slice(0, 10);
    const moreItems = tagFilteredExperiences.slice(10, 20);

    const locationRow = (
      <div className="px-4 py-2 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        <LocationSelector selectedCity="" onCityChange={() => {}} />
      </div>
    );

    const tagPills = (
      <div className="flex items-center">
        <button
          onClick={() => setActiveTag("All")}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap border flex-shrink-0 mr-2",
            activeTag === "All"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/80 text-foreground border-border/50"
          )}
        >
          All
        </button>
        <div ref={tagScrollRef} className="overflow-x-auto scrollbar-hide flex-1" style={{ scrollbarWidth: 'none' }}>
          <div className="inline-flex gap-2" style={{ paddingRight: '16px' }}>
            {tags.filter(t => t !== "All").map((tag, index) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag, index)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap border",
                  activeTag === tag
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/80 text-foreground border-border/50"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    );

    return (
      <MobileShell headerContent={<div>{locationRow}{tagPills}</div>} hideAvatar>
        <div className="mb-6 pt-2" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
          <h1 className="text-2xl font-bold text-foreground">All Experiences</h1>
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

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 md:px-8 lg:px-10 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 hover:bg-muted/70">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              <h1 className="text-lg md:text-2xl font-bold">All Experiences</h1>
            </div>
            <span className="text-muted-foreground text-xs md:text-sm">({experiences.length})</span>
          </div>
          
          <div className="flex items-center bg-muted/50 border border-border/50 rounded-full px-4 py-2 max-w-md hover:bg-muted/70 hover:border-border transition-all duration-200">
            <Search className="w-4 h-4 text-muted-foreground mr-3" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search experiences..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm placeholder:text-muted-foreground/60"
              style={{ fontSize: '14px' }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-10 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 md:gap-6">
            {filteredExperiences.slice(0, visibleCount).map((experience) => (
              <ExperienceCard key={experience.id} {...experience} compact />
            ))}
          </div>

          {visibleCount < filteredExperiences.length && (
            <div ref={loadMoreRef} className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
            </div>
          )}

          {filteredExperiences.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-base">No experiences found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ExperiencesPage;
