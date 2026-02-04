import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { ExperienceCard } from "@/components/ExperienceCard";
import { AppStoreCardView } from "@/components/AppStoreCardView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Compass, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { allExperiences } from "@/hooks/useExperiencesData";

const ExperiencesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('cards');
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Use pre-computed cached data - instant, no recalculation
  const experiences = allExperiences;
  
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

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredExperiences.length) {
          setVisibleCount(prev => Math.min(prev + 12, filteredExperiences.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, filteredExperiences.length]);

  // Mobile App Store-style card view (always show fixed header)
  if (isMobile && viewMode === 'cards') {
    return (
      <div className="min-h-screen w-full bg-background">
        {/* Fixed header - guaranteed to stay at top */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-2 mb-2.5">
              <Link to="/">
                <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold leading-tight">Experiences</h1>
                <p className="text-xs text-muted-foreground">{experiences.length} to explore</p>
              </div>
            </div>
            
            {/* Search - elegant styling matching FixedSearchHeader */}
            <div className="flex items-center bg-muted/60 border border-border/50 rounded-xl px-4 py-2.5">
              <Search className="w-4 h-4 text-foreground/60 mr-2.5 shrink-0" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search experiences..."
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm placeholder:text-foreground/50"
                style={{ fontSize: '16px' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-2 p-1 hover:bg-muted rounded-full"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Content with top padding to account for fixed header */}
        <div className="pt-[120px]">
          {searchQuery ? (
            <div className="p-3">
              <div className="grid grid-cols-2 gap-3">
                {filteredExperiences.slice(0, visibleCount).map((experience) => (
                  <ExperienceCard key={experience.id} {...experience} compact />
                ))}
              </div>
              {filteredExperiences.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">No experiences found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          ) : (
            <AppStoreCardView experiences={filteredExperiences} />
          )}
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 md:h-10 md:w-10">
                <ArrowLeft className="w-4 md:w-5 h-4 md:h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              <h1 className="text-base md:text-2xl font-bold">All Experiences</h1>
            </div>
            <span className="text-muted-foreground text-xs md:text-sm">({experiences.length})</span>
          </div>
          
          {/* Search */}
          <div className="flex items-center bg-muted rounded-full px-3 md:px-4 py-2 max-w-md">
            <Search className="w-4 md:w-5 h-4 md:h-5 text-muted-foreground mr-2 md:mr-3" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search experiences..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm md:text-base placeholder:text-muted-foreground"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        {/* Grid - Responsive breakpoints */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
            {filteredExperiences.slice(0, visibleCount).map((experience) => (
              <ExperienceCard key={experience.id} {...experience} compact />
            ))}
          </div>

          {/* Infinite scroll trigger */}
          {visibleCount < filteredExperiences.length && (
            <div 
              ref={loadMoreRef}
              className="flex justify-center py-6 md:py-8"
            >
              <div className="animate-spin rounded-full h-5 md:h-6 w-5 md:w-6 border-b-2 border-primary"></div>
            </div>
          )}

          {filteredExperiences.length === 0 && (
            <div className="text-center py-8 md:py-12">
              <p className="text-muted-foreground text-sm md:text-base">No experiences found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ExperiencesPage;
