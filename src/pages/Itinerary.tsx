import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, User, MapPin, Calendar, DollarSign, Trash2 } from "lucide-react";
import { useLikedExperiences } from "@/hooks/useLikedExperiences";
import { Link } from "react-router-dom";

const Itinerary = () => {
  const { likedExperiences, toggleLike } = useLikedExperiences();

  const handleRemove = (experienceId: string) => {
    const experience = likedExperiences.find(exp => exp.id === experienceId);
    if (experience) {
      toggleLike(experience);
    }
  };

  if (likedExperiences.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 px-6">
          <div className="max-w-md mx-auto text-center py-20">
            <Heart className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-4">Your Itinerary is Empty</h1>
            <p className="text-muted-foreground mb-6">
              Start exploring experiences and save them to your itinerary!
            </p>
            <Link to="/">
              <Button>Explore Experiences</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        {/* Vertical scrollable layout like TikTok */}
        <div className="max-w-md mx-auto">
          <div className="space-y-4 p-4">
            {likedExperiences.map((experience, index) => (
              <Card key={experience.id} className="h-[80vh] rounded-lg overflow-hidden relative">
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${experience.videoThumbnail})` }}
                >
                  <div className="absolute inset-0 bg-black/40" />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 h-full flex flex-col justify-between p-6 text-white">
                  {/* Top Section - Remove button */}
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(experience.id)}
                      className="text-white hover:bg-white/20"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Bottom Section - Experience Details */}
                  <div className="space-y-4">
                    {/* Category Badge */}
                    <Badge className="bg-primary/90 text-primary-foreground">
                      {experience.category}
                    </Badge>

                    {/* Title */}
                    <h1 className="text-2xl font-bold leading-tight">
                      {experience.title}
                    </h1>

                    {/* Creator Info */}
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{experience.creator}</span>
                    </div>

                    {/* Location & Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{experience.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-bold text-accent text-xl">
                          {experience.price}
                        </span>
                      </div>
                    </div>

                    {/* Saved Date */}
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Saved on {new Date(experience.likedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Link to={`/experience/${experience.id}`} className="flex-1">
                        <Button className="w-full bg-white text-black hover:bg-white/90">
                          View Details
                        </Button>
                      </Link>
                      <Button className="flex-1 bg-primary hover:bg-primary/90">
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Itinerary;