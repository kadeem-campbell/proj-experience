import { useMemo, useState, useEffect, useRef } from "react";
import { Play, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

export interface TikTokVideo {
  videoId?: string;
  url: string;
  author?: string;
  thumbnailUrl?: string;
}

/** Extract TikTok video ID from a full URL */
const extractTikTokVideoId = (url: string): string => {
  const match = url.match(/\/video\/(\d+)/);
  if (match?.[1]) return match[1];
  if (/^\d+$/.test(url.trim())) return url.trim();
  return '';
};

export interface InstagramVideo {
  url: string;
  author?: string;
  thumbnailUrl?: string;
}

/**
 * Parse an Instagram URL into a clean permalink suitable for embedding.
 * Handles /reel/, /reels/, /p/, /tv/ paths.
 */
const getInstagramPermalink = (raw: string): string => {
  const trimmed = raw.trim().replace(/\/+$/, '');
  // Match /reel/ or /reels/ or /p/ or /tv/ followed by shortcode
  const match = trimmed.match(/instagram\.com\/(?:reels?|p|tv)\/([^/?#]+)/i);
  if (match?.[1]) {
    return `https://www.instagram.com/reel/${match[1]}/`;
  }
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
};

interface SocialVideoEmbedProps {
  experienceTitle: string;
  location: string;
  tiktokVideos?: TikTokVideo[];
  instagramEmbed?: string;
  className?: string;
}

const CARD_HEIGHT = "h-48";

/**
 * Instagram embed using the official embed.js script.
 * Renders a blockquote that Instagram's script processes into a full embed.
 */
const InstagramEmbed = ({ permalink }: { permalink: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Instagram embed script if not already present
    const existingScript = document.querySelector('script[src*="instagram.com/embed.js"]');
    if (existingScript) {
      // Script already loaded, just reprocess
      (window as any).instgrm?.Embeds?.process?.();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.onload = () => {
      (window as any).instgrm?.Embeds?.process?.();
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove the script on cleanup — it can be reused
    };
  }, [permalink]);

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <blockquote
        className="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink={permalink}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: 0,
          borderRadius: '12px',
          margin: '0 auto',
          maxWidth: '400px',
          minWidth: '280px',
          width: '100%',
          padding: 0,
        }}
      >
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <p className="text-sm text-muted-foreground">Loading Instagram content...</p>
        </div>
      </blockquote>
    </div>
  );
};

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

  const instagramPermalink = useMemo(() => {
    if (!hasInstagram) return '';
    return getInstagramPermalink(instagramEmbed!);
  }, [hasInstagram, instagramEmbed]);

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
        {/* TikTok video cards */}
        {tiktokVideos.map((video, idx) => {
          const resolvedId = video.videoId || extractTikTokVideoId(video.url);
          if (!resolvedId) return null;
          const authorMatch = video.url?.match(/@([^/]+)/);
          const author = video.author || (authorMatch?.[1]) || 'Watch';
          return (
            <button
              key={resolvedId || idx}
              onClick={() => setActiveVideo({ ...video, videoId: resolvedId, author })}
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
                    @{author}
                  </p>
                </div>
              </div>
            </button>
          );
        })}

        {/* Instagram embed card */}
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

      {/* Instagram embed drawer — uses official embed.js */}
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
          {showInstagram && hasInstagram && (
            <div className="w-full px-4 pb-6 overflow-y-auto" data-vaul-no-drag
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <InstagramEmbed permalink={instagramPermalink} />
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};
