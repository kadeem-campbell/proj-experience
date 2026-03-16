import { useState, useCallback } from "react";
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
import { Heart, Copy, MessageCircle, Check, Share2, Bookmark } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useLikedExperiences } from "@/hooks/useLikedExperiences";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { getProductShareUrl, getItineraryShareUrl } from "@/utils/shareUrl";

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
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isLiked: isLocalLiked, toggleLike: toggleLocalLike } = useLikedExperiences();
  const { isAuthenticated } = useAuth();

  const liked = isAuthenticated
    ? isDbLiked(entityId, entityType)
    : isLocalLiked(entityId);

  const shareUrl =
    entityType === "itinerary"
      ? getItineraryShareUrl(entityId)
      : getProductShareUrl(slug || entityId);

  const handleSave = async () => {
    if ("vibrate" in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(entityId, entityType, entityData);
    } else {
      toggleLocalLike(entityData);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 600);
    } catch {
      setCopied(false);
    }
  };

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`Check out: ${title}\n${shareUrl}`)}`,
      "_blank"
    );
    onClose();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        onClose();
      } catch {}
    } else {
      handleCopy();
    }
  };

  const actions = [
    {
      name: "Wishlist",
      icon: liked ? Heart : Heart,
      onClick: handleSave,
      active: liked,
    },
    {
      name: "Share",
      icon: Share2,
      onClick: handleShare,
    },
    {
      name: "Copy Link",
      icon: copied ? Check : Copy,
      onClick: handleCopy,
      active: copied,
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      onClick: handleWhatsApp,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((action) => (
        <button
          key={action.name}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            action.onClick();
          }}
          className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors select-none outline-none focus:outline-none active:bg-muted/50"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              action.active
                ? "bg-primary/15"
                : "bg-muted"
            )}
          >
            <action.icon
              className={cn(
                "w-4 h-4 transition-colors",
                action.active && action.name === "Wishlist"
                  ? "fill-primary text-primary"
                  : action.active
                  ? "text-green-500"
                  : "text-foreground"
              )}
            />
          </div>
          <span className="text-[11px] text-muted-foreground leading-tight text-center">
            {action.name}
          </span>
        </button>
      ))}
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
    entityId,
    entityType,
    entityData,
    title,
    slug,
    onClose: () => setOpen(false),
  };

  if (!isMobile) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild onClick={handleOpen}>
          {children}
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="end" sideOffset={8}>
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
        <DrawerContent className="max-h-[50vh] pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
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
