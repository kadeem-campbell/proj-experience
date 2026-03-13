import { useState } from "react";
import { Play, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

export interface TikTokVideo {
  videoId: string;
  url: string;
  author?: string;
  thumbnailUrl?: string;
}

export interface InstagramVideo {
  url: string;
  author?: string;
  thumbnailUrl?: string;
}

interface SocialVideoEmbedProps {
  experienceTitle: string;
  location: string;
  tiktokVideos?: TikTokVideo[];
  instagramEmbed?: string;
  className?: string;
}

const CARD_HEIGHT = "h-48";

export const SocialVideoEmbed = ({ 
  experienceTitle, 
  location, 
  tiktokVideos = [], 
  instagramEmbed,
  className 
}: SocialVideoEmbedProps) => {
  const [activeVideo, setActiveVideo] = useState<TikTokVideo | null>(null);
  const [showInstagram, setShowInstagram] = useState(false);

  const hasTikTok = tiktokVideos.length > 0;
  const hasInstagram = !!instagramEmbed && instagramEmbed.trim() !== '';

  // Normalize Instagram URL to embeddable format
  const instagramEmbedUrl = hasInstagram
    ? instagramEmbed!.includes('/embed') 
      ? instagramEmbed! 
      : instagramEmbed!.replace(/\/?(\?.*)?$/, '/embed/')
    : '';

  // Don't render if no embeds available
  if (!hasTikTok && !hasInstagram) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Video className="w-5 h-5 text-primary" />
        See it on Social
      </h3>
      <p className="text-sm text-muted-foreground mb-3">
        Watch videos from travelers who experienced this
      </p>
      
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
        {/* TikTok video cards — tap to open drawer with full embed */}
        {tiktokVideos.map((video) => (
          <button
            key={video.videoId}
            onClick={() => setActiveVideo(video)}
            className="flex-shrink-0 relative group cursor-pointer snap-start"
          >
            <div className={cn("w-32", CARD_HEIGHT, "rounded-xl bg-gradient-to-br from-foreground/90 to-foreground/70 flex flex-col items-center justify-center gap-2 transition-transform group-hover:scale-[1.02] group-active:scale-[0.98] overflow-hidden relative")}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#25F4EE] via-[#FE2C55] to-[#25F4EE]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              
              <div className="relative z-10 w-12 h-12 rounded-full bg-[#FE2C55] flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </div>
              <div className="relative z-10 text-center px-2">
                <p className="text-white font-bold text-xs">TikTok</p>
                <p className="text-white/70 text-[10px] truncate max-w-[100px]">
                  @{video.author || 'Watch'}
                </p>
              </div>
            </div>
          </button>
        ))}

        {/* Instagram embed card — only if embed link exists */}
        {hasInstagram && (
          <button
            onClick={() => setShowInstagram(true)}
            className="flex-shrink-0 relative group cursor-pointer snap-start"
          >
            <div className={cn("w-32", CARD_HEIGHT, "rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex flex-col items-center justify-center gap-3 transition-transform group-hover:scale-[1.02] group-active:scale-[0.98]")}>
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="text-center px-2">
                <p className="text-white font-semibold text-xs">Instagram</p>
                <p className="text-white/80 text-[10px]">Watch Reel</p>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* TikTok embed drawer */}
      <Drawer open={!!activeVideo} onOpenChange={(open) => !open && setActiveVideo(null)}>
        <DrawerContent className="max-h-[85vh] overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-2 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center">
                <Play className="w-3 h-3 text-background fill-background ml-0.5" />
              </div>
              <div>
                <p className="text-sm font-semibold">TikTok</p>
                {activeVideo?.author && (
                  <p className="text-xs text-muted-foreground">@{activeVideo.author}</p>
                )}
              </div>
            </div>
            <button 
              onClick={() => setActiveVideo(null)}
              className="p-1.5 rounded-full bg-muted hover:bg-muted/80"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          {activeVideo && (
            <div className="w-full flex justify-center px-4 pb-6 overflow-hidden">
              <div className="rounded-xl overflow-hidden" style={{ width: '100%', maxWidth: '340px', height: '600px' }}>
                <iframe
                  src={`https://www.tiktok.com/embed/v2/${activeVideo.videoId}`}
                  className="border-0"
                  style={{ width: '100%', height: '100%' }}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  scrolling="no"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* Instagram embed drawer */}
      <Drawer open={showInstagram} onOpenChange={setShowInstagram}>
        <DrawerContent className="max-h-[85vh] overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-2 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
                <Play className="w-3 h-3 text-white fill-white ml-0.5" />
              </div>
              <p className="text-sm font-semibold">Instagram</p>
            </div>
            <button 
              onClick={() => setShowInstagram(false)}
              className="p-1.5 rounded-full bg-muted hover:bg-muted/80"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          {hasInstagram && (
            <div className="w-full flex justify-center px-4 pb-6 overflow-hidden">
              <div className="rounded-xl overflow-hidden" style={{ width: '100%', maxWidth: '400px', minHeight: '500px' }}>
                <iframe
                  src={instagramEmbed}
                  className="border-0"
                  style={{ width: '100%', height: '600px' }}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  scrolling="no"
                />
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};
