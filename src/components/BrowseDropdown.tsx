import { MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cities, City } from "@/data/browseData";
import { useState } from "react";

interface BrowseDropdownProps {
  onSelectCity?: (city: City) => void;
  onClearFilters?: () => void;
}

export const BrowseDropdown = ({ onSelectCity, onClearFilters }: BrowseDropdownProps) => {
  const [open, setOpen] = useState(false);

  const handleCityClick = (city: City) => {
    onSelectCity?.(city);
    setOpen(false);
  };

  const handleShowAll = () => {
    onClearFilters?.();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="h-10 px-4 rounded-full border-border/60 hover:border-primary/50 hover:bg-accent gap-2"
        >
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Cities</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[320px] p-0 bg-popover border-border shadow-lg rounded-xl z-50" 
        align="start"
        sideOffset={8}
      >
        <div className="p-3">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-sm font-semibold text-foreground">Select a city</h3>
            {onClearFilters && (
              <button 
                onClick={handleShowAll}
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Show all
              </button>
            )}
          </div>
          <div className="space-y-1">
            {cities.map((city) => (
              <button
                key={city.id}
                onClick={() => handleCityClick(city)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left group"
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: city.color }}
                >
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {city.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
