import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapPin, ChevronLeft, Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileShell } from "@/components/MobileShell";
import { MainLayout } from "@/components/layouts/MainLayout";
import { cn } from "@/lib/utils";

const cities = [
  { name: "Zanzibar", available: true },
  { name: "Dar es Salaam", available: true },
  { name: "Nairobi", available: false, launchDate: "April 2026" },
  { name: "Kigali", available: false, launchDate: "May 2026" },
  { name: "Kampala", available: false, launchDate: "May 2026" },
  { name: "Entebbe", available: false, launchDate: "June 2026" },
  { name: "Addis Ababa", available: false, launchDate: "June 2026" },
];

const CityList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentCity = searchParams.get("city") || "";
  const [selectedCity, setSelectedCity] = useState(currentCity);

  const handleCityClick = (cityName: string) => {
    if (selectedCity === cityName) {
      // Deselect
      setSelectedCity("");
      navigate("/");
    } else {
      setSelectedCity(cityName);
      navigate(`/?city=${encodeURIComponent(cityName)}`);
    }
  };

  return (
    <div className="px-4 pt-2 pb-8">
      <p className="text-sm text-muted-foreground mb-5">Select a city to explore experiences</p>

      <div className="space-y-2.5">
        {cities.map((city) => (
          <button
            key={city.name}
            disabled={!city.available}
            onClick={() => city.available && handleCityClick(city.name)}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left",
              city.available
                ? selectedCity === city.name
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-card border border-border/60 active:scale-[0.98]"
                : "bg-muted/40 border border-border/30 opacity-60"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              city.available ? "bg-primary/10" : "bg-muted"
            )}>
              <MapPin className={cn("w-5 h-5", city.available ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "text-[15px] font-semibold",
                city.available ? "text-foreground" : "text-muted-foreground"
              )}>
                {city.name}
              </h3>
              {!city.available && city.launchDate && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Coming {city.launchDate}
                </p>
              )}
              {city.available && (
                <p className="text-xs text-primary mt-0.5">Available now</p>
              )}
            </div>
            {city.available && selectedCity === city.name && (
              <Check className="w-5 h-5 text-primary shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function Map() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (isMobile) {
    const headerContent = (
      <div className="flex items-center gap-3 w-full px-4">
        <button onClick={() => {
          if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
          } else {
            navigate('/');
          }
        }} className="p-1">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Choose a city</h1>
      </div>
    );

    return (
      <MobileShell headerContent={headerContent} hideTopBar notFixed>
        <CityList />
      </MobileShell>
    );
  }

  return (
    <MainLayout showItineraryPanel={false}>
      <div className="max-w-lg mx-auto py-12">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Choose a city</h1>
        <CityList />
      </div>
    </MainLayout>
  );
}
