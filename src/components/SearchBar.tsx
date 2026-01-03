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
      {/* City Selector */}
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4" />
        <span>Exploring</span>
        <select 
          value={selectedCity}
          onChange={(e) => onCityChange(e.target.value)}
          className="bg-transparent border-none text-accent font-medium cursor-pointer hover:text-primary transition-colors"
        >
          <option value="Dar Es Salaam">Dar Es Salaam</option>
          <option value="New York">New York</option>
          <option value="London">London</option>
          <option value="Tokyo">Tokyo</option>
          <option value="Paris">Paris</option>
        </select>
      </div>

      {/* Main Search Bar */}
      <div className="relative bg-muted rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => { const val = e.target.value; setSearchQuery(val); if (val.trim() === '') onSearch(''); }}
              onKeyPress={handleKeyPress}
              placeholder='Tell me what you want... e.g., "Party with fish"'
              className="pl-12 pr-4 py-6 text-lg bg-transparent border-none focus:ring-0 placeholder:text-muted-foreground"
            />
          </div>
          <Button
            onClick={handleSearch}
            className="rounded-full p-3 bg-accent hover:bg-accent/90 text-accent-foreground"
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