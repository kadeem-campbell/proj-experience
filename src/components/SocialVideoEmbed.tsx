import { useState, useEffect } from "react";
import { ExternalLink, Play, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrapingProxy } from "@/utils/ScrapingProxy";

interface VideoEmbed {
  platform: 'tiktok' | 'instagram';
  url: string;
  thumbnailUrl?: string;
  title?: string;
  author?: string;
  embedHtml?: string;
}

interface SocialVideoEmbedProps {
  experienceTitle: string;
  location: string;
  className?: string;
}

export const SocialVideoEmbed = ({ experienceTitle, location, className }: SocialVideoEmbedProps) => {
  const [videos, setVideos] = useState<VideoEmbed[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoEmbed | null>(null);

  useEffect(() => {
    // For now, we'll use placeholder videos with TikTok oEmbed
    // In production, this would search for relevant videos
    const fetchVideos = async () => {
      setLoading(true);
      
      // Simulated video data - in production this would come from a search API
      // TikTok oEmbed is publicly accessible without API keys
      const mockVideos: VideoEmbed[] = [
        {
          platform: 'tiktok',
          url: `https://www.tiktok.com/search?q=${encodeURIComponent(`${experienceTitle} ${location}`)}`,
          title: `${experienceTitle} on TikTok`,
          author: 'TikTok Search',
        },
      ];
      
      setVideos(mockVideos);
      setLoading(false);
    };

    fetchVideos();
  }, [experienceTitle, location]);

  const handleVideoClick = (video: VideoEmbed) => {
    // Open TikTok/Instagram search in new tab
    window.open(video.url, '_blank');
  };

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          Related Videos
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className="flex-shrink-0 w-32 h-48 rounded-xl bg-muted animate-pulse snap-start"
            />
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) return null;

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
        {/* TikTok Search Card */}
        <button
          onClick={() => handleVideoClick({
            platform: 'tiktok',
            url: `https://www.tiktok.com/search?q=${encodeURIComponent(`${experienceTitle} ${location}`)}`,
            title: 'Search TikTok'
          })}
          className="flex-shrink-0 relative group cursor-pointer snap-start"
        >
          <div className="w-32 h-48 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex flex-col items-center justify-center gap-3 transition-transform group-hover:scale-[1.02]">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
            <div className="text-center px-2">
              <p className="text-white font-semibold text-sm">TikTok</p>
              <p className="text-white/80 text-xs">Search Videos</p>
            </div>
          </div>
          <div className="absolute top-2 right-2 p-1 rounded-full bg-black/30 backdrop-blur">
            <ExternalLink className="w-3 h-3 text-white" />
          </div>
        </button>

        {/* Instagram Search Card */}
        <button
          onClick={() => handleVideoClick({
            platform: 'instagram',
            url: `https://www.instagram.com/explore/tags/${encodeURIComponent(experienceTitle.replace(/\s+/g, '').toLowerCase())}`,
            title: 'Search Instagram'
          })}
          className="flex-shrink-0 relative group cursor-pointer snap-start"
        >
          <div className="w-32 h-48 rounded-xl bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 flex flex-col items-center justify-center gap-3 transition-transform group-hover:scale-[1.02]">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
            <div className="text-center px-2">
              <p className="text-white font-semibold text-sm">Instagram</p>
              <p className="text-white/80 text-xs">Explore Reels</p>
            </div>
          </div>
          <div className="absolute top-2 right-2 p-1 rounded-full bg-black/30 backdrop-blur">
            <ExternalLink className="w-3 h-3 text-white" />
          </div>
        </button>

        {/* YouTube Search Card */}
        <button
          onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${experienceTitle} ${location}`)}`, '_blank')}
          className="flex-shrink-0 relative group cursor-pointer snap-start"
        >
          <div className="w-32 h-48 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex flex-col items-center justify-center gap-3 transition-transform group-hover:scale-[1.02]">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
            <div className="text-center px-2">
              <p className="text-white font-semibold text-sm">YouTube</p>
              <p className="text-white/80 text-xs">Watch Videos</p>
            </div>
          </div>
          <div className="absolute top-2 right-2 p-1 rounded-full bg-black/30 backdrop-blur">
            <ExternalLink className="w-3 h-3 text-white" />
          </div>
        </button>
      </div>
    </div>
  );
};
