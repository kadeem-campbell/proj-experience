import { LayoutGrid, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cities, City } from "@/data/browseData";

interface BrowseDropdownProps {
  onSelectCity?: (city: City) => void;
  onClearFilters?: () => void;
}

export const BrowseDropdown = ({ onSelectCity, onClearFilters }: BrowseDropdownProps) => {
  const handleCityClick = (city: City) => {
    onSelectCity?.(city);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-10 px-3 rounded-lg hover:bg-muted gap-2"
        >
          <LayoutGrid className="h-5 w-5" />
          <span className="text-sm font-medium">Browse City</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[400px] p-0 bg-card border-border shadow-xl z-50" 
        align="start"
        sideOffset={8}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Browse City</h3>
            {onClearFilters && (
              <button 
                onClick={onClearFilters}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Show all
              </button>
            )}
          </div>
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
      </PopoverContent>
    </Popover>
  );
};
