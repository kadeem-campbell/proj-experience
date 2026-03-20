import { MapPin, ChevronDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDestinations, BrowseDestination } from "@/hooks/useDestinations";
import { useCurrency } from "@/hooks/useCurrency";
import { useState } from "react";

interface BrowseDropdownProps {
  onSelectCity?: (dest: BrowseDestination) => void;
  onClearFilters?: () => void;
}

export const BrowseDropdown = ({ onSelectCity, onClearFilters }: BrowseDropdownProps) => {
  const [open, setOpen] = useState(false);
  const { data: destinations = [] } = useDestinations();
  const { currency, updateCurrency, CURRENCIES } = useCurrency();

  const handleClick = (dest: BrowseDestination) => {
    onSelectCity?.(dest);
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
          <span className="text-sm font-medium">Destinations</span>
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
            <h3 className="text-sm font-semibold text-foreground">Select destination</h3>
            {onClearFilters && (
              <button 
                onClick={handleShowAll}
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Show all
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-[220px] overflow-y-auto">
            {destinations.map((dest) => (
              <button
                key={dest.id}
                onClick={() => handleClick(dest)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left group"
              >
                {dest.flag_svg_url ? (
                  <img src={dest.flag_svg_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                ) : dest.cover_image ? (
                  <img src={dest.cover_image} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                )}
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {dest.name}
                </span>
              </button>
            ))}
          </div>

          {/* Currency selector */}
          <div className="border-t border-border mt-3 pt-3">
            <div className="flex items-center gap-2 px-1 mb-2">
              <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Currency</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CURRENCIES.map(c => (
                <button
                  key={c.code}
                  onClick={() => updateCurrency(c.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    currency === c.code
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
