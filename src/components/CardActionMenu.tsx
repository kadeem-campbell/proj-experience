import { useState, useCallback, useRef } from "react";
import { CreateItineraryDrawer } from "@/components/CreateItineraryDrawer";
import { useNavigate } from "react-router-dom";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Heart, Copy, MessageCircle, Check, Share2, Plus, Minus, Layers, ExternalLink, Search, X, ListPlus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useLikedExperiences } from "@/hooks/useLikedExperiences";
import { useAuth } from "@/hooks/useAuth";
import { useItineraries } from "@/hooks/useItineraries";
import { cn } from "@/lib/utils";
import { getProductShareUrl, getItineraryShareUrl } from "@/utils/shareUrl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CardActionMenuProps {
  entityId: string;
  entityType: "experience" | "itinerary";
  entityData: any;
  title: string;
  slug?: string;
  children: React.ReactNode;
}

const ActionMenuContent = ({
  entityId,
  entityType,
  entityData,
  title,
  slug,
  onClose,
  onOpenCreateDrawer,
}: Omit<CardActionMenuProps, "children"> & { onClose: () => void; onOpenCreateDrawer: () => void }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showItineraryPicker, setShowItineraryPicker] = useState(false);
  const [addItinerarySearch, setAddItinerarySearch] = useState("");
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const justAddedTimer = useRef<NodeJS.Timeout | null>(null);

  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isLiked: isLocalLiked, toggleLike: toggleLocalLike } = useLikedExperiences();
  const { isAuthenticated } = useAuth();
  const {
    itineraries,
    activeItineraryId,
    setActiveItinerary,
    createItinerary,
    addExperienceToItinerary,
    addExperiencesToItinerary,
    removeExperienceFromItinerary,
  } = useItineraries();

  const liked = isDbLiked(entityId, entityType) || isLocalLiked(entityId);

  const shareUrl =
    entityType === "itinerary"
      ? getItineraryShareUrl(entityId)
      : getProductShareUrl(slug || entityId);

  const isExpInItinerary = (itineraryId: string) => {
    const it = itineraries.find((i) => i.id === itineraryId);
    return it?.experiences.some((e) => e.id === entityId) || false;
  };

  // --- handlers ---
  const handleSave = async () => {
    if ("vibrate" in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(entityId, entityType, entityData);
    }
    // Always toggle local likes too so card hearts stay in sync
    toggleLocalLike({
      id: entityId,
      title: entityData?.title || title,
      creator: entityData?.creator || "",
      videoThumbnail: entityData?.videoThumbnail || entityData?.video_thumbnail || entityData?.coverImage || "",
      category: entityData?.category || "",
      location: entityData?.location || "",
      price: entityData?.price || "",
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => { setCopied(false); onClose(); }, 600);
    } catch { setCopied(false); }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Check out: ${title}\n${shareUrl}`)}`, "_blank");
    onClose();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, url: shareUrl }); onClose(); } catch {}
    } else { handleCopy(); }
  };

  const handleToggleItinerary = (itinerary: any) => {
    if ("vibrate" in navigator) navigator.vibrate(10);

    // For itinerary entities, copy ALL experiences into the target itinerary
    if (entityType === "itinerary") {
      const exps = entityData?.experiences || [];
      if (exps.length === 0) {
        toast.error("No experiences to add");
        return;
      }

      const { addedCount } = addExperiencesToItinerary(
        itinerary.id,
        exps.slice(0, 30).map((exp: any) => ({
          id: exp.id,
          title: exp.title || "",
          creator: exp.creator || "",
          videoThumbnail: exp.videoThumbnail || exp.video_thumbnail || "",
          category: exp.category || "",
          location: exp.location || "",
          price: exp.price || "",
        }))
      );

      setActiveItinerary(itinerary.id);
      if (addedCount > 0) {
        setJustAdded(itinerary.id);
        if (justAddedTimer.current) clearTimeout(justAddedTimer.current);
        justAddedTimer.current = setTimeout(() => setJustAdded(null), 1500);
        toast.success(`Added ${addedCount} activities to "${itinerary.name}"`);
      } else {
        toast.info(`All activities already in "${itinerary.name}"`);
      }
      onClose();
      return;
    }

    // Single experience toggle
    const alreadyAdded = isExpInItinerary(itinerary.id);
    if (alreadyAdded) {
      removeExperienceFromItinerary(itinerary.id, entityId);
      toast.success(`Removed from "${itinerary.name}"`);
    } else {
      const result = addExperienceToItinerary(itinerary.id, entityData);
      if (result.alreadyExists) { toast.error(`Already in "${itinerary.name}"`); return; }
      setActiveItinerary(itinerary.id);
      setJustAdded(itinerary.id);
      if (justAddedTimer.current) clearTimeout(justAddedTimer.current);
      justAddedTimer.current = setTimeout(() => setJustAdded(null), 1500);
      toast.success(`Added to "${itinerary.name}"`);
    }
  };

  const sortedItineraries = [...itineraries].sort((a, b) => {
    const aIn = isExpInItinerary(a.id) ? 0 : 1;
    const bIn = isExpInItinerary(b.id) ? 0 : 1;
    return aIn - bIn;
  });

  const ctaLabel = entityType === "itinerary" ? "Use this itinerary" : "Add to itinerary";

  // --- Itinerary picker sub-view (matches PoiDetail "Add to itinerary" drawer) ---
  if (showItineraryPicker) {
    const q = addItinerarySearch.trim().toLowerCase();
    const filteredItineraries = q
      ? sortedItineraries.filter((it) => it.name.toLowerCase().includes(q))
      : sortedItineraries;

    return (
      <div className="-mx-4 -mb-4 flex flex-col">
        <div className="px-4 pt-1 pb-2 text-center">
          <h3 className="font-semibold text-base">Add to itinerary</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {entityType === "itinerary" ? "Save this itinerary to your collection" : "Save this experience to your collection"}
          </p>
        </div>

        {/* New itinerary row */}
        <button
          onClick={() => {
            setShowItineraryPicker(false);
            onOpenCreateDrawer();
          }}
          className="w-full flex items-center gap-3 p-4 border-y border-border/30 hover:bg-muted/40 active:bg-muted/60 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <span className="font-semibold text-sm text-primary">New itinerary</span>
        </button>

        {/* Search */}
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

        {/* List */}
        <div className="px-2 pb-4 max-h-[45vh] overflow-y-auto">
          {filteredItineraries.length > 0 ? (
            filteredItineraries.map((itin) => {
              const coverImg = itin.coverImage || itin.experiences?.[0]?.videoThumbnail;
              const added = isExpInItinerary(itin.id);
              return (
                <button
                  key={itin.id}
                  onClick={() => handleToggleItinerary(itin)}
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
                  <span className={cn(
                    "text-xs font-medium px-3 py-1.5 rounded-full",
                    added ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                  )}>
                    {added ? "Added" : "Add"}
                  </span>
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
    );
  }

  // --- Main view ---
  const shareActions = [
    { name: "Like", icon: Heart, onClick: handleSave, active: liked },
    { name: "Share", icon: Share2, onClick: handleShare },
    { name: "Copy Link", icon: copied ? Check : Copy, onClick: handleCopy, active: copied },
    { name: "WhatsApp", icon: MessageCircle, onClick: handleWhatsApp },
  ];

  return (
    <div className="space-y-3">
      {/* Share row */}
      <div className="grid grid-cols-4 gap-2">
        {shareActions.map((action) => (
          <button
            key={action.name}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); action.onClick(); }}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors select-none outline-none focus:outline-none active:bg-muted/50"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", action.active ? "bg-primary/15" : "bg-muted")}>
              <action.icon className={cn("w-4 h-4 transition-colors", action.active && action.name === "Wishlist" ? "fill-primary text-primary" : action.active ? "text-green-500" : "text-foreground")} />
            </div>
            <span className="text-[11px] text-muted-foreground leading-tight text-center">{action.name}</span>
          </button>
        ))}
      </div>

      {/* Add to itinerary CTA — below share row */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowItineraryPicker(true); }}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all active:scale-[0.98] active:opacity-90"
      >
        <Layers className="w-4 h-4" />
        {ctaLabel}
      </button>
    </div>
  );
};

export const CardActionMenu = ({
  entityId,
  entityType,
  entityData,
  title,
  slug,
  children,
}: CardActionMenuProps) => {
  const [open, setOpen] = useState(false);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const isMobile = useIsMobile();

  const handleOpen = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
    },
    []
  );

  const sharedProps = {
    entityId, entityType, entityData, title, slug,
    onClose: () => setOpen(false),
    onOpenCreateDrawer: () => {
      setOpen(false);
      setTimeout(() => setShowCreateDrawer(true), 300);
    },
  };

  if (!isMobile) {
    return (
      <>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild onClick={handleOpen}>
            {children}
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end" sideOffset={8}>
            <ActionMenuContent {...sharedProps} />
          </PopoverContent>
        </Popover>
        <CreateItineraryDrawer open={showCreateDrawer} onOpenChange={setShowCreateDrawer} />
      </>
    );
  }

  return (
    <>
      <div onClick={handleOpen} onTouchEnd={handleOpen}>
        {children}
      </div>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[65vh] pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-center text-sm">{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <ActionMenuContent {...sharedProps} />
          </div>
        </DrawerContent>
      </Drawer>
      <CreateItineraryDrawer open={showCreateDrawer} onOpenChange={setShowCreateDrawer} />
    </>
  );
};
