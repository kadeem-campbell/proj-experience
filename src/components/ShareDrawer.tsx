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
import { Button } from "@/components/ui/button";
import { 
  Copy, 
  MessageCircle, 
  Check,
  Send,
  Users,
  Download,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ShareDrawerProps {
  title: string;
  url?: string;
  children: React.ReactNode;
  onExportCSV?: () => void;
  onExportXLSX?: () => void;
  onInvite?: () => void;
  onCollab?: () => void;
}

const ShareContent = ({ 
  shareUrl, 
  shareText, 
  title, 
  onClose,
  onExportCSV,
  onExportXLSX,
  onInvite,
  onCollab,
}: { 
  shareUrl: string; 
  shareText: string; 
  title: string; 
  onClose: () => void;
  onExportCSV?: () => void;
  onExportXLSX?: () => void;
  onInvite?: () => void;
  onCollab?: () => void;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1000);
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
    ...(onCollab ? [{
      name: "Collab",
      icon: Users,
      onClick: () => { onCollab(); onClose(); },
      className: "",
    }] : []),
  ];

  return (
    <div className="space-y-3">
      <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${shareOptions.length}, 1fr)` }}>
        {shareOptions.map((option) => (
          <button
            key={option.name}
            onClick={option.onClick}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted transition-colors ${option.className || ''}`}
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <option.icon className="w-4 h-4" />
            </div>
            <span className="text-[11px] text-muted-foreground">{option.name}</span>
          </button>
        ))}
      </div>

      {/* Export row */}
      {(onExportCSV || onExportXLSX) && (
        <div className="flex gap-2">
          {onExportCSV && (
            <button onClick={() => { onExportCSV(); onClose(); }} className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-muted/50 active:bg-muted transition-colors">
              <Download className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium">Export CSV</span>
            </button>
          )}
          {onExportXLSX && (
            <button onClick={() => { onExportXLSX(); onClose(); }} className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-muted/50 active:bg-muted transition-colors">
              <Download className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium">Export XLSX</span>
            </button>
          )}
        </div>
      )}

      {/* URL preview */}
      <div className="p-2.5 rounded-xl bg-muted flex items-center gap-2">
        <div className="flex-1 truncate text-xs text-muted-foreground">
          {shareUrl}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleCopy}
          className="flex-shrink-0 h-7 w-7 p-0"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  );
};

export const ShareDrawer = ({ title, url, children, onExportCSV, onExportXLSX, onInvite, onCollab }: ShareDrawerProps) => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const shareUrl = url || window.location.href;
  const shareText = `Check out: ${title}`;

  const handleTriggerClick = async () => {
    if (isMobile && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch (e) {
        // Fall through to drawer
      }
    }
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
            title={title} 
            onClose={() => setOpen(false)}
            onExportCSV={onExportCSV}
            onExportXLSX={onExportXLSX}
            onInvite={onInvite}
            onCollab={onCollab}
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
            title={title} 
            onClose={() => setOpen(false)}
            onExportCSV={onExportCSV}
            onExportXLSX={onExportXLSX}
            onInvite={onInvite}
            onCollab={onCollab}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
