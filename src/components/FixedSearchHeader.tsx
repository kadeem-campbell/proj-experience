import { useState, useRef } from "react";
import { Search, MapPin, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { City, cities } from "@/data/browseData";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Category tags for quick filtering
const categoryTags = [
  { id: "water-sports", name: "Water Sports", color: "hsl(200, 70%, 50%)" },
  { id: "party", name: "Party", color: "hsl(280, 70%, 55%)" },
  { id: "food", name: "Food", color: "hsl(30, 70%, 50%)" },
  { id: "beach", name: "Beach", color: "hsl(180, 60%, 50%)" },
  { id: "safari", name: "Safari", color: "hsl(45, 70%, 50%)" },
  { id: "adventure", name: "Adventure", color: "hsl(120, 50%, 45%)" },
  { id: "culture", name: "Culture", color: "hsl(340, 60%, 55%)" },
  { id: "wellness", name: "Wellness", color: "hsl(160, 60%, 45%)" },
];

interface FixedSearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCity: City | null;
  onCitySelect: (city: City | null) => void;
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  onMobileSearchClick?: () => void;
  isMobile?: boolean;
}

export const FixedSearchHeader = ({
  searchQuery,
  onSearchChange,
  selectedCity,
  onCitySelect,
  selectedCategory,
  onCategorySelect,
  onMobileSearchClick,
  isMobile = false,
}: FixedSearchHeaderProps) => {
  const [locationOpen, setLocationOpen] = useState(false);
  const tagsContainerRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      onCategorySelect(null);
    } else {
      onCategorySelect(categoryName);
    }
  };

  const clearFilters = () => {
    onCitySelect(null);
    onCategorySelect(null);
  };

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
      {/* Search bar row */}
      <div className="px-3 md:px-6 py-3">
        <div className="flex items-center gap-2 max-w-4xl mx-auto md:mx-0">
          {/* Search input */}
          <div className="flex-1 min-w-0">
            {isMobile ? (
              <button
                onClick={onMobileSearchClick}
                className="flex items-center w-full bg-muted/80 border border-border/60 rounded-xl px-4 py-3 text-left"
              >
                <Search className="w-5 h-5 text-foreground/70 mr-3 shrink-0" />
                <span className="text-foreground/50 text-base truncate">
                  {searchQuery || "Search experiences..."}
                </span>
              </button>
            ) : (
              <div className="flex items-center bg-muted/80 border border-border/60 rounded-xl px-4 py-2.5">
                <Search className="w-5 h-5 text-foreground/70 mr-3 shrink-0" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search experiences..."
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-base placeholder:text-foreground/50"
                  style={{ fontSize: '16px' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange("")}
                    className="ml-2 p-1 hover:bg-muted rounded-full"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location + Category tags row */}
      <div className="px-3 md:px-6 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide" ref={tagsContainerRef}>
          {/* Location picker */}
          <Popover open={locationOpen} onOpenChange={setLocationOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "shrink-0 rounded-full gap-1.5 px-3 h-8 border-border/60",
                  selectedCity && "border-primary bg-primary/10 text-primary"
                )}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-sm">{selectedCity?.name || "Location"}</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-48 p-2">
              <div className="space-y-1">
                {selectedCity && (
                  <button
                    onClick={() => {
                      onCitySelect(null);
                      setLocationOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md"
                  >
                    <X className="w-4 h-4" />
                    Clear location
                  </button>
                )}
                {cities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => {
                      onCitySelect(city);
                      setLocationOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                      selectedCity?.id === city.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: city.color }}
                    />
                    {city.name}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Separator */}
          <div className="w-px h-5 bg-border/60 shrink-0" />

          {/* Category tags */}
          {categoryTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleCategoryClick(tag.name)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                selectedCategory === tag.name
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/80 text-foreground/80 hover:bg-muted"
              )}
            >
              {tag.name}
            </button>
          ))}

          {/* Clear filters */}
          {(selectedCity || selectedCategory) && (
            <>
              <div className="w-px h-5 bg-border/60 shrink-0" />
              <button
                onClick={clearFilters}
                className="shrink-0 px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
