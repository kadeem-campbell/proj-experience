import { Link } from "react-router-dom";
import { generateExperienceUrl } from "@/utils/slugUtils";
import { Heart, Plus, MapPin } from "lucide-react";
import { useLikedExperiences } from "@/hooks/useLikedExperiences";
import { cn } from "@/lib/utils";
import { ItinerarySelector } from "@/components/ItinerarySelector";
...
  return (
    <Link 
      to={generateExperienceUrl(experience.location, experience.title, undefined)}
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
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-2xl border border-white/15 flex items-center justify-center shadow-lg"
            >
              <Heart 
                className={cn(
                  "w-4.5 h-4.5 transition-colors",
                  liked ? "fill-primary text-primary" : "text-white/90"
                )} 
              />
            </button>
            
            <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
              <ItinerarySelector
                experienceId={experience.id}
                experienceData={experienceData}
                onAdd={handleAddSuccess}
              >
              <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-2xl border border-white/15 flex items-center justify-center shadow-lg cursor-pointer hover:bg-white/20 transition-colors">
                  <Plus className="w-4 h-4 text-white/90" />
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
