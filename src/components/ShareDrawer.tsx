import { useState } from "react";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Copy, 
  MessageCircle, 
  Check,
  Send,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ShareDrawerProps {
  title: string;
  url?: string;
  children: React.ReactNode;
  onInvite?: () => void;
}

const ShareContent = ({ 
  shareUrl, 
  shareText, 
  onClose,
  onInvite,
}: { 
  shareUrl: string; 
  shareText: string; 
  onClose: () => void;
  onInvite?: () => void;
}) => {
  const [copied, setCopied] = useState(false);

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

  const shareOptions = [
    {
      name: "Copy Link",
      icon: copied ? Check : Copy,
      onClick: handleCopy,
      className: copied ? "text-green-500" : ""
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      onClick: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`, '_blank');
        onClose();
      }
    },
    ...(onInvite ? [{
      name: "Invite",
      icon: Send,
      onClick: () => { onInvite(); onClose(); },
      className: "",
    }] : []),
  ];

  return (
    <div>
      <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${shareOptions.length}, 1fr)` }}>
        {shareOptions.map((option) => (
          <button
            key={option.name}
            onClick={option.onClick}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors select-none outline-none focus:outline-none ${option.className || ''}`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${option.className?.includes('text-green') ? 'bg-green-100' : 'bg-muted'}`}>
              <option.icon className="w-4 h-4" />
            </div>
            <span className="text-[11px] text-muted-foreground">{option.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export const ShareDrawer = ({ title, url, children, onInvite }: ShareDrawerProps) => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const shareUrl = url || window.location.href;
  const shareText = `Check out: ${title}`;

  const handleTriggerClick = async () => {
    setOpen(true);
  };

  // Desktop: use Popover
  if (!isMobile) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild onClick={(e) => {
          e.preventDefault();
          handleTriggerClick();
        }}>
          {children}
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end" sideOffset={8}>
          <p className="text-sm font-semibold mb-3">Share</p>
          <ShareContent 
            shareUrl={shareUrl} 
            shareText={shareText} 
            onClose={() => setOpen(false)}
            onInvite={onInvite}
          />
        </PopoverContent>
      </Popover>
    );
  }

  // Mobile: use Drawer
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild onClick={(e) => {
        e.preventDefault();
        handleTriggerClick();
      }}>
        {children}
      </DrawerTrigger>
      <DrawerContent className="max-h-[60vh] pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-center">Share</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <ShareContent 
            shareUrl={shareUrl} 
            shareText={shareText} 
            onClose={() => setOpen(false)}
            onInvite={onInvite}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
