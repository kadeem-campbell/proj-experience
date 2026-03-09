import { ExternalLink, Play, Video } from "lucide-react";
import { cn } from "@/lib/utils";

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
  instagramVideos?: InstagramVideo[];
  className?: string;
}

const CARD_HEIGHT = "h-48";

export const SocialVideoEmbed = ({ 
  experienceTitle, 
  location, 
  tiktokVideos = [], 
  instagramVideos = [],
  className 
}: SocialVideoEmbedProps) => {

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
        {/* TikTok videos — inline iframe players at card size */}
        {tiktokVideos.map((video) => (
          <div
            key={video.videoId}
            className="flex-shrink-0 snap-start rounded-xl overflow-hidden bg-foreground/10 relative"
            style={{ width: '128px', height: '192px', touchAction: 'pan-x' }}
          >
            {/* Block vertical scroll inside iframe */}
            <div 
              className="absolute inset-0 z-10" 
              style={{ pointerEvents: 'none' }}
              onTouchMove={(e) => e.preventDefault()}
            />
            {/* Clip top (share icons ~40px) and bottom (related ~60px) at scaled size */}
            <div style={{ 
              width: '325px', 
              height: '400px',
              transform: 'scale(0.394)', 
              transformOrigin: 'top left',
              marginTop: '-16px',
              overflow: 'hidden'
            }}>
              <iframe
                src={`https://www.tiktok.com/embed/v2/${video.videoId}?hide_share=1`}
                className="border-0"
                style={{ width: '325px', height: '550px', marginTop: '-40px' }}
                allow="autoplay; encrypted-media"
                allowFullScreen
                scrolling="no"
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
          </div>
        ))}

        {/* TikTok search — only if no specific videos */}
        {tiktokVideos.length === 0 && (
          <button
            onClick={() => window.open(
              `https://www.tiktok.com/search?q=${encodeURIComponent(`${experienceTitle} ${location}`)}`, 
              '_blank'
            )}
            className="flex-shrink-0 relative group cursor-pointer snap-start"
          >
            <div className={cn("w-32", CARD_HEIGHT, "rounded-xl bg-gradient-to-br from-[hsl(var(--primary)/0.8)] via-[hsl(var(--accent)/0.6)] to-[hsl(var(--primary))] flex flex-col items-center justify-center gap-3 transition-transform group-hover:scale-[1.02] group-active:scale-[0.98]")}>
              <div className="w-10 h-10 rounded-full bg-background/20 backdrop-blur flex items-center justify-center">
                <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
              </div>
              <div className="text-center px-2">
                <p className="text-primary-foreground font-semibold text-xs">TikTok</p>
                <p className="text-primary-foreground/80 text-[10px]">Search Videos</p>
              </div>
            </div>
            <div className="absolute top-2 right-2 p-1 rounded-full bg-foreground/20 backdrop-blur">
              <ExternalLink className="w-2.5 h-2.5 text-primary-foreground" />
            </div>
          </button>
        )}

        {/* Instagram placeholder */}
        <button
          onClick={() => window.open(
            `https://www.instagram.com/explore/tags/${encodeURIComponent(experienceTitle.replace(/\s+/g, '').toLowerCase())}`, 
            '_blank'
          )}
          className="flex-shrink-0 relative group cursor-pointer snap-start"
        >
          <div className={cn("w-32", CARD_HEIGHT, "rounded-xl bg-gradient-to-br from-[hsl(var(--accent))] via-[hsl(var(--primary)/0.7)] to-[hsl(var(--secondary))] flex flex-col items-center justify-center gap-3 transition-transform group-hover:scale-[1.02] group-active:scale-[0.98]")}>
            <div className="w-10 h-10 rounded-full bg-background/20 backdrop-blur flex items-center justify-center">
              <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
            </div>
            <div className="text-center px-2">
              <p className="text-primary-foreground font-semibold text-xs">Instagram</p>
              <p className="text-primary-foreground/80 text-[10px]">Explore Reels</p>
            </div>
          </div>
          <div className="absolute top-2 right-2 p-1 rounded-full bg-foreground/20 backdrop-blur">
            <ExternalLink className="w-2.5 h-2.5 text-primary-foreground" />
          </div>
        </button>
      </div>
    </div>
  );
};
