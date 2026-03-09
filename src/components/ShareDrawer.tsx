import { useState } from "react";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerTrigger,
  DrawerClose
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { 
  Copy, 
  MessageCircle, 
  Mail, 
  Twitter, 
  Facebook,
  Check,
  Share2 
} from "lucide-react";
import { toast } from "sonner";

interface ShareDrawerProps {
  title: string;
  url?: string;
  children: React.ReactNode;
}

export const ShareDrawer = ({ title, url, children }: ShareDrawerProps) => {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  
  const shareUrl = url || window.location.href;
  const shareText = `Check out: ${title}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        setOpen(false);
      } catch (e) {
        // User cancelled
      }
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
        setOpen(false);
      }
    },
    {
      name: "Twitter",
      icon: Twitter,
      onClick: () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        setOpen(false);
      }
    },
    {
      name: "Facebook",
      icon: Facebook,
      onClick: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        setOpen(false);
      }
    },
    {
      name: "Email",
      icon: Mail,
      onClick: () => {
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`, '_blank');
        setOpen(false);
      }
    }
  ];

  // Use native share on supported devices first
  const handleTriggerClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch (e) {
        // User cancelled or not supported, fall through to drawer
      }
    }
    setOpen(true);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild onClick={(e) => {
        e.preventDefault();
        handleTriggerClick();
      }}>
        {children}
      </DrawerTrigger>
      <DrawerContent className="max-h-[60vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-center">Share</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <div className="grid grid-cols-5 gap-4">
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={option.onClick}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted transition-colors ${option.className || ''}`}
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <option.icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-muted-foreground">{option.name}</span>
              </button>
            ))}
          </div>

          {/* URL preview */}
          <div className="mt-4 p-3 rounded-xl bg-muted flex items-center gap-2">
            <div className="flex-1 truncate text-sm text-muted-foreground">
              {shareUrl}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCopy}
              className="flex-shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
