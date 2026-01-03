import { useState, useRef, useEffect } from "react";
import { Heart, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLikedExperiences } from "@/hooks/useLikedExperiences";
import { Link } from "react-router-dom";

interface ExperienceCardProps {
  id: string;
  title: string;
  creator: string;
  views: string;
  videoThumbnail: string;
  videoUrl?: string;
  category: string;
  location: string;
  price: string;
}

export const ExperienceCard = ({
  id,
  title,
  creator,
  views,
  videoThumbnail,
  videoUrl,
  category,
  location,
  price,
}: ExperienceCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isLiked, toggleLike } = useLikedExperiences();

  useEffect(() => {
    if (isHovered && videoRef.current && videoUrl) {
      videoRef.current.play();
      setIsPlaying(true);
    } else if (!isHovered && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isHovered, videoUrl]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleLike({
      id,
      title,
      creator,
      videoThumbnail,
      category,
      location,
      price
    });
  };

  return (
    <Link to={`/experience/${id}`}>
      <Card 
        className="relative overflow-hidden rounded-2xl bg-card border-0 cursor-pointer hover-scale group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Video/Thumbnail with Gradient Overlay */}
        <div className="relative aspect-[3/4] overflow-hidden">
        {videoUrl ? (
          <video
            ref={videoRef}
            poster={videoThumbnail}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            muted
            loop
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <img
            src={videoThumbnail}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 video-overlay" />
        
        {/* Heart/Like Button */}
        <button
          onClick={handleLike}
          className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-200 ${
            isLiked(id) 
              ? 'bg-red-500 text-white' 
              : 'bg-black/50 text-white hover:bg-black/70'
          }`}
        >
          <Heart 
            className={`w-5 h-5 ${isLiked(id) ? 'fill-current bounce-heart' : ''}`} 
          />
        </button>

        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
            {category}
          </span>
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-bold text-lg mb-2 line-clamp-2">{title}</h3>
          
          {/* Creator Info */}
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">{creator}</span>
            <span className="text-xs text-white/70">• {views} views</span>
          </div>
          
          {/* Location & Price */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80">{location}</span>
            <span className="font-bold text-accent">{price}</span>
          </div>
        </div>
        </div>
      </Card>
    </Link>
  );
};