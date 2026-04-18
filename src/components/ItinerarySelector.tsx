import { useState, useMemo } from "react";
import { Plus, Search, X, ListPlus } from "lucide-react";
import { CreateItineraryDrawer } from "@/components/CreateItineraryDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useItineraries, Itinerary } from "@/hooks/useItineraries";
import { useIsMobile } from "@/hooks/use-mobile";

interface ItinerarySelectorProps {
  experienceId: string;
  experienceData: {
    id: string;
    title: string;
    creator: string;
    videoThumbnail: string;
    category: string;
    location: string;
    price: string;
  };
  onAdd?: () => void;
  onRemove?: () => void;
  children?: React.ReactNode;
}

export const ItinerarySelector = ({
  experienceId,
  experienceData,
  onAdd,
  children,
}: ItinerarySelectorProps) => {
  const [open, setOpen] = useState(false);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [addItinerarySearch, setAddItinerarySearch] = useState("");
  const isMobile = useIsMobile();

  const { itineraries, addExperienceToItinerary, setActiveItinerary } = useItineraries();

  const filteredItineraries = useMemo(() => {
    const q = addItinerarySearch.trim().toLowerCase();
    if (!q) return itineraries;
    return itineraries.filter(i => i.name.toLowerCase().includes(q));
  }, [itineraries, addItinerarySearch]);

  const handleAddToExisting = (itinerary: Itinerary) => {
    if ('vibrate' in navigator) navigator.vibrate(10);
    addExperienceToItinerary(itinerary.id, experienceData);
    setActiveItinerary(itinerary.id);
    setOpen(false);
    setAddItinerarySearch("");
    onAdd?.();
  };

  const sheetContent = (
    <>
      <DrawerHeader className="pb-2 shrink-0">
        <DrawerTitle>Add to itinerary</DrawerTitle>
        <DrawerDescription>Save this experience to your collection</DrawerDescription>
      </DrawerHeader>
      <div className="flex-1 overflow-y-auto min-h-0">
        <button
          onClick={() => {
            setOpen(false);
            setTimeout(() => setShowCreateDrawer(true), 300);
          }}
          className="w-full flex items-center gap-3 p-4 border-b border-border/30 hover:bg-muted/40 active:bg-muted/60 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold text-sm text-primary">New itinerary</span>
        </button>
        <div className="px-4 py-2">
          <div className="flex items-center bg-muted rounded-full px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <Input
              type="text"
              value={addItinerarySearch}
              onChange={(e) => setAddItinerarySearch(e.target.value)}
              placeholder="Search your itineraries..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm"
              style={{ fontSize: '16px' }}
            />
            {addItinerarySearch && (
              <button onClick={() => setAddItinerarySearch("")} className="p-1 rounded-full shrink-0">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        <div className="px-2 pb-2">
          {filteredItineraries.length > 0 ? (
            filteredItineraries.map(itin => {
              const coverImg = itin.coverImage || itin.experiences?.[0]?.videoThumbnail;
              return (
                <button
                  key={itin.id}
                  onClick={() => handleAddToExisting(itin)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 active:bg-muted/60 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                    {coverImg ? (
                      <img src={coverImg} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <ListPlus className="w-4 h-4 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{itin.name}</p>
                    <p className="text-xs text-muted-foreground">{itin.experiences.length} experiences</p>
                  </div>
                  <span className="text-xs font-medium text-primary px-3 py-1.5 rounded-full bg-primary/10">Add</span>
                </button>
              );
            })
          ) : addItinerarySearch.trim() ? (
            <div className="py-6 px-4 text-center">
              <p className="text-sm text-muted-foreground">No itineraries match "<span className="font-medium text-foreground">{addItinerarySearch}</span>"</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No itineraries yet. Create one above!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            {children || (
              <Button
                size="icon"
                className="rounded-full shadow-lg"
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </DrawerTrigger>
          <DrawerContent
            className="max-h-[60vh] overflow-hidden flex flex-col pb-[calc(env(safe-area-inset-bottom,0px)+24px)]"
            onClick={(e) => e.stopPropagation()}
          >
            {sheetContent}
          </DrawerContent>
        </Drawer>
        <CreateItineraryDrawer open={showCreateDrawer} onOpenChange={setShowCreateDrawer} />
      </>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {children || (
            <Button
              size="icon"
              className="rounded-full shadow-lg"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent
          className="w-[360px] max-w-[92vw] p-0 bg-card border-border shadow-xl z-50 flex flex-col max-h-[70vh] overflow-hidden"
          align="end"
          onClick={(e) => e.stopPropagation()}
        >
          {sheetContent}
        </PopoverContent>
      </Popover>
      <CreateItineraryDrawer open={showCreateDrawer} onOpenChange={setShowCreateDrawer} />
    </>
  );
};
