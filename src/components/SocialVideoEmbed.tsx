import { useState, useEffect, useRef } from "react";
import { ExternalLink, Play, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TikTokVideo {
  videoId: string;
  url: string;
  author?: string;
}

export interface InstagramVideo {
  url: string;
  author?: string;
}

interface SocialVideoEmbedProps {
  experienceTitle: string;
  location: string;
  tiktokVideos?: TikTokVideo[];
  instagramVideos?: InstagramVideo[];
  className?: string;
}

const TikTokEmbed = ({ videoId, url, author }: TikTokVideo) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Set the blockquote HTML
    containerRef.current.innerHTML = `
      <blockquote class="tiktok-embed" cite="${url}" data-video-id="${videoId}" style="max-width:200px;min-width:200px;">
        <section></section>
      </blockquote>
    `;

    // Load TikTok embed script
    const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');
    if (existingScript) {
      // Re-trigger embed processing
      (window as any).tiktokEmbed?.lib?.render();
      setLoaded(true);
    } else {
      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      script.onload = () => setLoaded(true);
      document.body.appendChild(script);
    }
  }, [videoId, url]);

  return (
    <div className="flex-shrink-0 w-[200px] snap-start">
      <div 
        ref={containerRef} 
        className="relative rounded-xl overflow-hidden"
        style={{ minHeight: '350px' }}
      />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse rounded-xl" style={{ width: 200, height: 350 }}>
          <Play className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        <span>{author || 'Open in TikTok'}</span>
      </a>
    </div>
  );
};

export const SocialVideoEmbed = ({ 
  experienceTitle, 
  location, 
  tiktokVideos = [], 
  instagramVideos = [],
  className 
}: SocialVideoEmbedProps) => {
  const hasTikTok = tiktokVideos.length > 0;

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
        {/* Real TikTok embeds */}
        {tiktokVideos.map((video) => (
          <TikTokEmbed key={video.videoId} {...video} />
        ))}

        {/* TikTok search card */}
        <button
          onClick={() => window.open(
            `https://www.tiktok.com/search?q=${encodeURIComponent(`${experienceTitle} ${location}`)}`, 
            '_blank'
          )}
          className="flex-shrink-0 relative group cursor-pointer snap-start"
        >
          <div className="w-32 h-48 rounded-xl bg-gradient-to-br from-[hsl(var(--primary)/0.8)] via-[hsl(var(--accent)/0.6)] to-[hsl(var(--primary))] flex flex-col items-center justify-center gap-3 transition-transform group-hover:scale-[1.02]">
            <div className="w-12 h-12 rounded-full bg-background/20 backdrop-blur flex items-center justify-center">
              <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
            </div>
            <div className="text-center px-2">
              <p className="text-primary-foreground font-semibold text-sm">TikTok</p>
              <p className="text-primary-foreground/80 text-xs">{hasTikTok ? 'Find More' : 'Search Videos'}</p>
            </div>
          </div>
          <div className="absolute top-2 right-2 p-1 rounded-full bg-foreground/20 backdrop-blur">
            <ExternalLink className="w-3 h-3 text-primary-foreground" />
          </div>
        </button>

        {/* Instagram placeholder card */}
        <button
          onClick={() => window.open(
            `https://www.instagram.com/explore/tags/${encodeURIComponent(experienceTitle.replace(/\s+/g, '').toLowerCase())}`, 
            '_blank'
          )}
          className="flex-shrink-0 relative group cursor-pointer snap-start"
        >
          <div className="w-32 h-48 rounded-xl bg-gradient-to-br from-[hsl(var(--accent))] via-[hsl(var(--primary)/0.7)] to-[hsl(var(--secondary))] flex flex-col items-center justify-center gap-3 transition-transform group-hover:scale-[1.02]">
            <div className="w-12 h-12 rounded-full bg-background/20 backdrop-blur flex items-center justify-center">
              <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
            </div>
            <div className="text-center px-2">
              <p className="text-primary-foreground font-semibold text-sm">Instagram</p>
              <p className="text-primary-foreground/80 text-xs">Explore Reels</p>
            </div>
          </div>
          <div className="absolute top-2 right-2 p-1 rounded-full bg-foreground/20 backdrop-blur">
            <ExternalLink className="w-3 h-3 text-primary-foreground" />
          </div>
        </button>
      </div>
    </div>
  );
};
