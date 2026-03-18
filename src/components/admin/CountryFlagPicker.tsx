import { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { code: "tz", name: "Tanzania", emoji: "🇹🇿" },
  { code: "ke", name: "Kenya", emoji: "🇰🇪" },
  { code: "ug", name: "Uganda", emoji: "🇺🇬" },
  { code: "rw", name: "Rwanda", emoji: "🇷🇼" },
  { code: "et", name: "Ethiopia", emoji: "🇪🇹" },
  { code: "za", name: "South Africa", emoji: "🇿🇦" },
  { code: "ng", name: "Nigeria", emoji: "🇳🇬" },
  { code: "gh", name: "Ghana", emoji: "🇬🇭" },
  { code: "mz", name: "Mozambique", emoji: "🇲🇿" },
  { code: "mg", name: "Madagascar", emoji: "🇲🇬" },
  { code: "mw", name: "Malawi", emoji: "🇲🇼" },
  { code: "zm", name: "Zambia", emoji: "🇿🇲" },
  { code: "zw", name: "Zimbabwe", emoji: "🇿🇼" },
  { code: "bw", name: "Botswana", emoji: "🇧🇼" },
  { code: "na", name: "Namibia", emoji: "🇳🇦" },
  { code: "sn", name: "Senegal", emoji: "🇸🇳" },
  { code: "ci", name: "Côte d'Ivoire", emoji: "🇨🇮" },
  { code: "cm", name: "Cameroon", emoji: "🇨🇲" },
  { code: "ma", name: "Morocco", emoji: "🇲🇦" },
  { code: "eg", name: "Egypt", emoji: "🇪🇬" },
  { code: "tn", name: "Tunisia", emoji: "🇹🇳" },
  { code: "dz", name: "Algeria", emoji: "🇩🇿" },
  { code: "mu", name: "Mauritius", emoji: "🇲🇺" },
  { code: "sc", name: "Seychelles", emoji: "🇸🇨" },
  { code: "cv", name: "Cape Verde", emoji: "🇨🇻" },
  { code: "ao", name: "Angola", emoji: "🇦🇴" },
  { code: "cd", name: "DR Congo", emoji: "🇨🇩" },
  { code: "sd", name: "Sudan", emoji: "🇸🇩" },
  { code: "so", name: "Somalia", emoji: "🇸🇴" },
  { code: "dj", name: "Djibouti", emoji: "🇩🇯" },
  { code: "er", name: "Eritrea", emoji: "🇪🇷" },
  { code: "bi", name: "Burundi", emoji: "🇧🇮" },
  { code: "ss", name: "South Sudan", emoji: "🇸🇸" },
  { code: "gm", name: "Gambia", emoji: "🇬🇲" },
  { code: "sl", name: "Sierra Leone", emoji: "🇸🇱" },
  { code: "lr", name: "Liberia", emoji: "🇱🇷" },
  { code: "gw", name: "Guinea-Bissau", emoji: "🇬🇼" },
  { code: "gn", name: "Guinea", emoji: "🇬🇳" },
  { code: "ml", name: "Mali", emoji: "🇲🇱" },
  { code: "bf", name: "Burkina Faso", emoji: "🇧🇫" },
  { code: "ne", name: "Niger", emoji: "🇳🇪" },
  { code: "td", name: "Chad", emoji: "🇹🇩" },
  { code: "cf", name: "Central African Republic", emoji: "🇨🇫" },
  { code: "cg", name: "Republic of the Congo", emoji: "🇨🇬" },
  { code: "ga", name: "Gabon", emoji: "🇬🇦" },
  { code: "gq", name: "Equatorial Guinea", emoji: "🇬🇶" },
  { code: "st", name: "São Tomé and Príncipe", emoji: "🇸🇹" },
  { code: "tg", name: "Togo", emoji: "🇹🇬" },
  { code: "bj", name: "Benin", emoji: "🇧🇯" },
  { code: "sz", name: "Eswatini", emoji: "🇸🇿" },
  { code: "ls", name: "Lesotho", emoji: "🇱🇸" },
  { code: "km", name: "Comoros", emoji: "🇰🇲" },
  { code: "ly", name: "Libya", emoji: "🇱🇾" },
  { code: "mr", name: "Mauritania", emoji: "🇲🇷" },
];

const flagUrl = (code: string) =>
  `https://hatscripts.github.io/circle-flags/flags/${code}.svg`;

interface CountryFlagPickerProps {
  value: string;
  onSelect: (url: string, emoji: string) => void;
}

export const CountryFlagPicker = ({ value, onSelect }: CountryFlagPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const selected = COUNTRIES.find(c => value?.includes(c.code));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 w-full h-9 px-3 rounded-md border border-input bg-background text-sm",
            "hover:bg-accent/50 transition-colors text-left"
          )}
        >
          {selected ? (
            <>
              <img src={flagUrl(selected.code)} alt={selected.name} className="w-5 h-5 rounded-full" />
              <span>{selected.name}</span>
            </>
          ) : value ? (
            <>
              <img src={value} alt="" className="w-5 h-5 rounded-full" />
              <span className="text-muted-foreground text-xs truncate">{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select country flag…</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b border-border">
          <Input
            placeholder="Search countries…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <ScrollArea className="h-[240px]">
          <div className="p-1">
            {filtered.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onSelect(flagUrl(c.code), c.emoji);
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm transition-colors",
                  "hover:bg-accent/80",
                  value?.includes(c.code) && "bg-accent"
                )}
              >
                <img src={flagUrl(c.code)} alt={c.name} className="w-5 h-5 rounded-full flex-shrink-0" />
                <span>{c.name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No countries found</p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
