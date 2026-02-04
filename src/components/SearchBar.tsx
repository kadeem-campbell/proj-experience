import { useState } from "react";
import { Search, ArrowRight, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
}

export const SearchBar = ({ onSearch, selectedCity, onCityChange }: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="max-w-4xl mx-auto mb-8">
      {/* Main Search Bar */}
      <div className="relative bg-muted/60 rounded-2xl p-6 border border-border/50">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-foreground/70 w-5 h-5" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => { const val = e.target.value; setSearchQuery(val); if (val.trim() === '') onSearch(''); }}
              onKeyPress={handleKeyPress}
              placeholder='What do you want to explore?'
              className="pl-12 pr-4 py-7 text-lg bg-background/40 border border-border/60 rounded-xl focus:ring-1 focus:ring-accent/50 placeholder:text-foreground/50"
            />
          </div>
          <Button
            onClick={handleSearch}
            className="rounded-full p-3.5 bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <ArrowRight className="w-6 h-6" />
          </Button>
        </div>
        
        {/* Social Media Integration Hint */}
        <div className="mt-4 text-sm text-muted-foreground">
          <span>💡 Tip: Paste TikTok or Instagram links to find similar experiences</span>
        </div>
      </div>
    </div>
  );
};