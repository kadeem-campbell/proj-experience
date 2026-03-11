import { Link } from "react-router-dom";
import { Heart, Plus, MapPin } from "lucide-react";
import { useLikedExperiences } from "@/hooks/useLikedExperiences";
import { cn } from "@/lib/utils";
import { ItinerarySelector } from "@/components/ItinerarySelector";

interface Experience {
  id: string;
  title: string;
  creator: string;
  views?: string;
  videoThumbnail: string;
  videoUrl?: string;
  category: string;
  location: string;
  price: string;
}

interface AppStoreCardViewProps {
  experiences: Experience[];
}

export const AppStoreCardView = ({ experiences }: AppStoreCardViewProps) => {
  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      {experiences.map((experience) => (
        <AppStoreCard key={experience.id} experience={experience} />
      ))}
    </div>
  );
};

const AppStoreCard = ({ experience }: { experience: Experience }) => {
  const { isLiked, toggleLike } = useLikedExperiences();

  const liked = isLiked(experience.id);

  const experienceData = {
    id: experience.id,
    title: experience.title,
    creator: experience.creator,
    videoThumbnail: experience.videoThumbnail,
    category: experience.category,
    location: experience.location,
    price: experience.price
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike(experienceData);
  };

  const handleAddSuccess = () => {
    // No toast - optimistic UI update only
  };

  return (
    <Link 
      to={`/experience/${experience.id}`}
      className="block w-full"
    >
      <div className="relative w-full rounded-2xl overflow-hidden">
        {/* Image - tall aspect ratio like App Store */}
        <div className="relative aspect-[4/5] w-full">
          <img
            src={experience.videoThumbnail}
            alt={experience.title}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient overlay - cleaner, no weird shade */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 text-foreground px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide backdrop-blur-sm">
              {experience.category}
            </span>
          </div>

          {/* Action buttons - top right */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={handleLikeClick}
              className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-lg"
            >
              <Heart 
                className={cn(
                  "w-4.5 h-4.5 transition-colors",
                  liked ? "fill-destructive text-destructive" : "text-white/90"
                )} 
              />
            </button>
            
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <ItinerarySelector
                experienceId={experience.id}
                experienceData={experienceData}
                onAdd={handleAddSuccess}
              >
                <div className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-2xl border border-white/30 flex items-center justify-center shadow-sm cursor-pointer hover:bg-white/80 transition-colors">
                  <Plus className="w-5 h-5 text-neutral-700" />
                </div>
              </ItinerarySelector>
            </div>
          </div>

          {/* Content overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            <h2 className="text-xl font-bold text-white line-clamp-2">
              {experience.title}
            </h2>
            
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{experience.location}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">
                by {experience.creator}
              </span>
              <span className="font-bold text-white text-lg">{experience.price}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AppStoreCardView;
