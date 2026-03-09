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

const CARD_WIDTH = "w-32";
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
        {/* TikTok video cards — each opens that specific video URL only */}
        {tiktokVideos.map((video) => (
          <button
            key={video.videoId}
            onClick={() => window.open(video.url, '_blank')}
            className="flex-shrink-0 relative group cursor-pointer snap-start"
          >
            <div className={cn(CARD_WIDTH, CARD_HEIGHT, "rounded-xl bg-gradient-to-br from-foreground/90 to-foreground/70 flex flex-col items-center justify-center gap-2 transition-transform group-hover:scale-[1.02] group-active:scale-[0.98] overflow-hidden relative")}>
              {/* TikTok branding gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              
              {/* Play button */}
              <div className="relative z-10 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
              </div>
              
              <div className="relative z-10 text-center px-2">
                <p className="text-background font-semibold text-xs">TikTok</p>
                <p className="text-background/70 text-[10px] truncate max-w-[100px]">
                  {video.author || 'Watch Video'}
                </p>
              </div>
            </div>
            <div className="absolute top-2 right-2 p-1 rounded-full bg-black/40 backdrop-blur z-10">
              <ExternalLink className="w-2.5 h-2.5 text-background" />
            </div>
          </button>
        ))}

        {/* Only show TikTok search if NO specific videos exist */}
        {tiktokVideos.length === 0 && (
          <button
            onClick={() => window.open(
              `https://www.tiktok.com/search?q=${encodeURIComponent(`${experienceTitle} ${location}`)}`, 
              '_blank'
            )}
            className="flex-shrink-0 relative group cursor-pointer snap-start"
          >
            <div className={cn(CARD_WIDTH, CARD_HEIGHT, "rounded-xl bg-gradient-to-br from-[hsl(var(--primary)/0.8)] via-[hsl(var(--accent)/0.6)] to-[hsl(var(--primary))] flex flex-col items-center justify-center gap-3 transition-transform group-hover:scale-[1.02] group-active:scale-[0.98]")}>
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

        {/* Instagram placeholder card — always show */}
        <button
          onClick={() => window.open(
            `https://www.instagram.com/explore/tags/${encodeURIComponent(experienceTitle.replace(/\s+/g, '').toLowerCase())}`, 
            '_blank'
          )}
          className="flex-shrink-0 relative group cursor-pointer snap-start"
        >
          <div className={cn(CARD_WIDTH, CARD_HEIGHT, "rounded-xl bg-gradient-to-br from-[hsl(var(--accent))] via-[hsl(var(--primary)/0.7)] to-[hsl(var(--secondary))] flex flex-col items-center justify-center gap-3 transition-transform group-hover:scale-[1.02] group-active:scale-[0.98]")}>
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
