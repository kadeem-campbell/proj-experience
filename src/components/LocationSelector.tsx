import { useState } from "react";
import { MapPin, X, ChevronRight, Globe } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const availableCities = [
  { id: "zanzibar", name: "Zanzibar", emoji: "🏝️" },
  { id: "dar-es-salaam", name: "Dar es Salaam", emoji: "🌆" },
  { id: "nairobi", name: "Nairobi", emoji: "🦁" },
];

const comingSoonCities = [
  "Addis Ababa", "Kigali", "Kampala", "Entebbe", "Mombasa", "Cape Town", "Lagos", "Accra"
];

interface LocationSelectorProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

const CityRequestModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const [requested, setRequested] = useState(false);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-border">
        <div className="relative px-5 pt-4 pb-8">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>

          <div className="text-center pt-6 pb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Coming to a city near you soon</h2>
            <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
              We're expanding across East Africa and beyond. Request your city and be the first to know when we launch.
            </p>
          </div>

          <div className="space-y-2 mb-6">
            {comingSoonCities.map((city) => (
              <button
                key={city}
                onClick={() => setRequested(true)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-muted/50 border border-border/50 active:scale-[0.98] transition-all"
              >
                <span className="text-sm font-medium text-foreground">{city}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>

          {requested && (
            <div className="text-center py-3 px-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium text-primary">🎉 Request received! We'll notify you.</p>
            </div>
          )}

          <div className="pb-[env(safe-area-inset-bottom,8px)]" />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export const LocationSelector = ({ selectedCity, onCityChange }: LocationSelectorProps) => {
  const [cityModalOpen, setCityModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        {availableCities.map((city) => (
          <button
            key={city.id}
            onClick={() => onCityChange(city.name)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 border",
              selectedCity === city.name
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/60 text-foreground border-border/50"
            )}
          >
            <span>{city.emoji}</span>
            <span>{city.name}</span>
          </button>
        ))}
        <button
          onClick={() => setCityModalOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-muted/40 text-muted-foreground border border-dashed border-border/60 active:scale-95 transition-all"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>More</span>
        </button>
      </div>
      <CityRequestModal open={cityModalOpen} onOpenChange={setCityModalOpen} />
    </>
  );
};
