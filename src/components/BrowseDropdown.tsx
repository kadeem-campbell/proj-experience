import { useState } from "react";
import { LayoutGrid, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cities, City, ExperienceCategory } from "@/data/browseData";
import { cn } from "@/lib/utils";

interface BrowseDropdownProps {
  onSelectCity?: (city: City) => void;
  onSelectCategory?: (city: City, category: ExperienceCategory) => void;
}

export const BrowseDropdown = ({ onSelectCity, onSelectCategory }: BrowseDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const handleCityClick = (city: City) => {
    setSelectedCity(city);
    onSelectCity?.(city);
  };

  const handleCategoryClick = (category: ExperienceCategory) => {
    if (selectedCity) {
      onSelectCategory?.(selectedCity, category);
      setOpen(false);
      setSelectedCity(null);
    }
  };

  const handleBack = () => {
    setSelectedCity(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-10 w-10 rounded-lg hover:bg-muted"
        >
          <LayoutGrid className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[400px] p-0 bg-card border-border shadow-xl z-50" 
        align="start"
        sideOffset={8}
      >
        {!selectedCity ? (
          // Cities View - "Browse All"
          <div className="p-4">
            <h3 className="text-lg font-bold mb-4">Browse All</h3>
            <div className="grid grid-cols-2 gap-2">
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleCityClick(city)}
                  className="relative h-24 rounded-lg overflow-hidden group transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: city.color }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/30" />
                  <img 
                    src={city.image} 
                    alt={city.name}
                    className="absolute right-0 bottom-0 w-16 h-16 object-cover rounded-tl-lg opacity-80 group-hover:opacity-100 transition-opacity rotate-12 translate-x-2 translate-y-2"
                  />
                  <span className="absolute top-3 left-3 font-bold text-white text-base">
                    {city.name}
                  </span>
                  <ChevronRight className="absolute bottom-2 right-2 w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Categories View for selected city
          <div>
            {/* City Header with gradient */}
            <div 
              className="relative h-28 p-4"
              style={{ 
                background: `linear-gradient(180deg, ${selectedCity.color} 0%, ${selectedCity.color}80 60%, transparent 100%)` 
              }}
            >
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h2 className="text-2xl font-bold text-white">{selectedCity.name}</h2>
            </div>

            {/* Categories Grid */}
            <div className="p-4 pt-0">
              <h4 className="text-sm text-muted-foreground mb-3">Categories</h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedCity.categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className={cn(
                      "p-4 rounded-lg text-left transition-all",
                      "hover:scale-[1.02] hover:shadow-md",
                      "bg-muted hover:bg-muted/80"
                    )}
                  >
                    <div 
                      className="w-3 h-3 rounded-full mb-2"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium text-sm">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
