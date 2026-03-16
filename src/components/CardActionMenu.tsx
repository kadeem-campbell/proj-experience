import { useState, useCallback, useRef } from "react";
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
import { Heart, Copy, MessageCircle, Check, Share2, Plus, Minus, Layers } from "lucide-react";
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
}: Omit<CardActionMenuProps, "children"> & { onClose: () => void }) => {
  const [copied, setCopied] = useState(false);
  const [showItineraryPicker, setShowItineraryPicker] = useState(false);
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState("");
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
    const alreadyAdded = isExpInItinerary(itinerary.id);
    if ("vibrate" in navigator) navigator.vibrate(10);
    if (alreadyAdded) {
      removeExperienceFromItinerary(itinerary.id, entityId);
      toast.success(`Removed from "${itinerary.name}"`);
    } else {
      const expData = entityType === "experience" ? entityData : {
        id: entityId, title, creator: "", videoThumbnail: entityData?.coverImage || "", category: "", location: "", price: "",
      };
      const result = addExperienceToItinerary(itinerary.id, expData);
      if (result.alreadyExists) { toast.error(`Already in "${itinerary.name}"`); return; }
      setActiveItinerary(itinerary.id);
      setJustAdded(itinerary.id);
      if (justAddedTimer.current) clearTimeout(justAddedTimer.current);
      justAddedTimer.current = setTimeout(() => setJustAdded(null), 1500);
      toast.success(`Added to "${itinerary.name}"`);
    }
  };

  const handleCreateNew = async () => {
    if (!newName.trim()) return;
    if ("vibrate" in navigator) navigator.vibrate(10);
    const newIt = await createItinerary(newName.trim());
    if (entityType === "experience") {
      await addExperienceToItinerary(newIt.id, entityData);
      toast.success(`Created "${newName.trim()}" and added`);
    } else {
      // For itinerary type: copy experiences into the new itinerary
      const exps = entityData?.experiences || [];
      for (const exp of exps.slice(0, 20)) {
        await addExperienceToItinerary(newIt.id, {
          id: exp.id, title: exp.title || "", creator: exp.creator || "",
          videoThumbnail: exp.videoThumbnail || "", category: exp.category || "",
          location: exp.location || "", price: exp.price || "",
        });
      }
      toast.success(`Created "${newName.trim()}" with ${Math.min(exps.length, 20)} activities`);
    }
    setNewName("");
    setShowNewInput(false);
    setShowItineraryPicker(false);
    onClose();
  };

  const sortedItineraries = [...itineraries].sort((a, b) => {
    const aIn = isExpInItinerary(a.id) ? 0 : 1;
    const bIn = isExpInItinerary(b.id) ? 0 : 1;
    return aIn - bIn;
  });

  const ctaLabel = entityType === "itinerary" ? "Use this itinerary" : "Add to itinerary";

  // --- Itinerary picker sub-view ---
  if (showItineraryPicker) {
    return (
      <div>
        <button
          onClick={() => setShowItineraryPicker(false)}
          className="text-xs text-muted-foreground px-1 mb-2 active:opacity-70"
        >
          ← Back
        </button>

        {/* Create new — always on top */}
        <div className="border-b border-border pb-2 mb-1">
          {showNewInput ? (
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Itinerary name"
                className="h-10 text-sm"
                style={{ fontSize: "16px" }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateNew();
                  if (e.key === "Escape") { setShowNewInput(false); setNewName(""); }
                }}
              />
              <Button size="sm" className="h-10 px-4" onClick={handleCreateNew} disabled={!newName.trim()}>
                Add
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewInput(true)}
              className="w-full flex items-center gap-2 px-2 py-2.5 text-sm font-semibold text-primary active:bg-muted rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create new itinerary
            </button>
          )}
        </div>

        {/* Existing itineraries */}
        <div className="max-h-[40vh] overflow-y-auto -mx-1">
          {sortedItineraries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No itineraries yet</p>
          ) : (
            sortedItineraries.map((it) => {
              const added = isExpInItinerary(it.id);
              const wasJust = justAdded === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => handleToggleItinerary(it)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-3 text-left transition-colors active:bg-muted/80 rounded-lg",
                    added && "bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", it.id === activeItineraryId ? "bg-primary" : "bg-muted-foreground/30")} />
                    <span className="text-sm font-medium truncate">{it.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">({it.experiences.length})</span>
                  </div>
                  {added ? (
                    wasJust ? <Check className="w-5 h-5 text-primary flex-shrink-0 animate-in zoom-in-50 duration-200" /> : <Minus className="w-5 h-5 text-destructive flex-shrink-0" />
                  ) : (
                    <Plus className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
              );
            })
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
  };

  if (!isMobile) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild onClick={handleOpen}>
          {children}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end" sideOffset={8}>
          <ActionMenuContent {...sharedProps} />
        </PopoverContent>
      </Popover>
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
    </>
  );
};
