import { useMemo, useState } from "react";
import { Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

export interface TikTokVideo {
  videoId?: string;
  url: string;
  author?: string;
  thumbnailUrl?: string;
}

const extractTikTokVideoId = (url: string): string => {
  const match = url.match(/\/video\/(\d+)/);
  if (match?.[1]) return match[1];
  if (/^\d+$/.test(url.trim())) return url.trim();
  return '';
};

interface SocialVideoEmbedProps {
  experienceTitle: string;
  location: string;
  tiktokVideos?: TikTokVideo[];
  className?: string;
}

/**
 * TikTok-only social video embed — horizontally scrollable cards that open immersive playback drawers.
 */
export const SocialVideoEmbed = ({ 
  experienceTitle, 
  location, 
  tiktokVideos = [], 
  className 
}: SocialVideoEmbedProps) => {
  const [activeVideo, setActiveVideo] = useState<TikTokVideo | null>(null);

  const validVideos = useMemo(() => 
    tiktokVideos
      .map(v => ({ ...v, videoId: v.videoId || extractTikTokVideoId(v.url) }))
      .filter(v => v.videoId),
    [tiktokVideos]
  );

  if (validVideos.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-lg font-semibold flex items-center gap-2">
        Watch it live
      </h3>
      
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
        {validVideos.map((video, idx) => (
          <button
            key={video.videoId || idx}
            onClick={() => setActiveVideo(video)}
            className="flex-shrink-0 relative group cursor-pointer snap-start"
          >
            <div className="w-28 h-44 rounded-2xl bg-muted flex flex-col items-center justify-center gap-2 transition-transform group-hover:scale-[1.02] group-active:scale-[0.98] overflow-hidden relative border border-border">
              <div className="w-11 h-11 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">
                {validVideos.length > 1 ? `Video ${idx + 1}` : 'Play video'}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* TikTok drawer — video only, no chrome */}
      <Drawer open={!!activeVideo} onOpenChange={(open) => !open && setActiveVideo(null)}>
        <DrawerContent className="max-h-[75vh] overflow-hidden border-border bg-background">
          <div className="flex items-center justify-end px-3 pt-2 pb-1">
            <button 
              onClick={() => setActiveVideo(null)}
              className="p-1.5 rounded-full bg-muted hover:bg-muted/80"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>
          {activeVideo && (
            <div className="w-full flex justify-center pb-4 overflow-hidden">
              <div className="rounded-xl overflow-hidden" style={{ width: '100%', maxWidth: '320px', height: '520px' }}>
                <iframe
                  src={`https://www.tiktok.com/embed/v2/${activeVideo.videoId}?autoplay=1`}
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
    </div>
  );
};
