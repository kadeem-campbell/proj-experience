import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Plus, 
  Minus,
  Check,
  ArrowLeft, 
  Share2, 
  MapPin, 
  Users, 
  Clock, 
  Star, 
  Copy,
  MessageCircle,
  Flame,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Calendar,
  Zap
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useItineraries } from "@/hooks/useItineraries";
import { publicItinerariesData } from "@/data/itinerariesData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Mock data
import partyImage from "@/assets/party-experience.jpg";
import beachImage from "@/assets/beach-experience.jpg";
import foodImage from "@/assets/food-experience.jpg";
import wildlifeImage from "@/assets/wildlife-experience.jpg";
import jetskiImage from "@/assets/jetski-experience.jpg";
import adventureImage from "@/assets/adventure-experience.jpg";

const mockExperiences = [
  {
    id: "1",
    title: "Jet Ski Adventure",
    creator: "JohnDoe",
    videoThumbnail: jetskiImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    category: "Water Sports",
    location: "Dar es Salaam",
    description: "Experience the thrill of high-speed jet skiing through crystal-clear waters. Perfect for adventure seekers looking for an adrenaline rush on the beautiful coastline.",
    duration: "2 hours",
    groupSize: "4-8 people",
    rating: 4.8,
    highlights: ["Crystal clear waters", "Professional guides", "Photo opportunities", "Beginner friendly"],
    gallery: [jetskiImage, beachImage, adventureImage, partyImage],
    bestTime: "Morning",
    meetingPoints: [
      { name: "Coco Beach Marina", type: "Main Location" },
      { name: "Ocean Road Pier", type: "Alternative" }
    ]
  },
  {
    id: "2",
    title: "Beach Party Extravaganza",
    creator: "BeachVibes",
    videoThumbnail: partyImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    category: "Party",
    location: "Zanzibar",
    description: "All-night beach party with world-class DJs and tropical vibes. Dance under the stars on pristine white sand beaches.",
    duration: "5 hours",
    groupSize: "10-100 people",
    rating: 4.7,
    highlights: ["World-class DJs", "Beach setting", "Tropical cocktails", "Unforgettable atmosphere"],
    gallery: [partyImage, beachImage, foodImage, jetskiImage],
    bestTime: "Evening",
    meetingPoints: [
      { name: "Nungwi Beach Club", type: "Main Venue" }
    ]
  },
  {
    id: "3",
    title: "Safari Wildlife Experience",
    creator: "WildlifePro",
    videoThumbnail: wildlifeImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    category: "Wildlife",
    location: "Serengeti",
    description: "Guided safari through the Serengeti with expert rangers. Witness the incredible wildlife of East Africa.",
    duration: "6 hours",
    groupSize: "2-6 people",
    rating: 4.9,
    highlights: ["Big Five sightings", "Expert guides", "Premium vehicles", "Sunrise views"],
    gallery: [wildlifeImage, adventureImage, beachImage, foodImage],
    bestTime: "Morning",
    meetingPoints: [
      { name: "Seronera Airstrip", type: "Main pickup" }
    ]
  },
  {
    id: "4",
    title: "Local Food Tasting Tour",
    creator: "FoodieGuide",
    videoThumbnail: foodImage,
    category: "Food",
    location: "Stone Town",
    description: "Taste the best local dishes with a culinary expert. Explore the vibrant spice markets and hidden food gems.",
    duration: "3 hours",
    groupSize: "4-10 people",
    rating: 4.6,
    highlights: ["Authentic cuisine", "Spice markets", "Local secrets", "Cultural immersion"],
    gallery: [foodImage, partyImage, beachImage, wildlifeImage],
    bestTime: "Afternoon",
    meetingPoints: [
      { name: "Forodhani Gardens", type: "Main spot" }
    ]
  },
  {
    id: "5",
    title: "Tropical Beach Paradise",
    creator: "BeachLover",
    videoThumbnail: beachImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    category: "Beach",
    location: "Kendwa",
    description: "Relax on pristine sands and swim in turquoise waters. Experience the ultimate tropical beach day.",
    duration: "4 hours",
    groupSize: "2-12 people",
    rating: 4.7,
    highlights: ["White sand beaches", "Crystal clear water", "Relaxation", "Snorkeling spots"],
    gallery: [beachImage, jetskiImage, partyImage, adventureImage],
    bestTime: "Morning",
    meetingPoints: [
      { name: "Kendwa Rocks Beach", type: "Main beach" }
    ]
  },
  {
    id: "6",
    title: "Mountain Climbing Adventure",
    creator: "AdventureSeeker",
    videoThumbnail: adventureImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    category: "Adventure",
    location: "Mount Kilimanjaro",
    description: "Challenge yourself with a guided climb and breathtaking views. Conquer the roof of Africa.",
    duration: "8 hours",
    groupSize: "1-5 people",
    rating: 4.8,
    highlights: ["Summit views", "Expert guides", "Achievement", "Stunning landscapes"],
    gallery: [adventureImage, wildlifeImage, beachImage, foodImage],
    bestTime: "Morning",
    meetingPoints: [
      { name: "Machame Gate", type: "Main route" }
    ]
  }
];

export default function ExperienceDetail() {
  const { id } = useParams();
  const { isInItinerary, addExperience, removeExperience, itineraries } = useItineraries();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [experienceData, setExperienceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const { toast } = useToast();

  // Generate consistent social proof numbers based on id
  const socialProof = useMemo(() => {
    if (!id) return { added: 0, planning: 0, trending: false };
    const hash = id.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    const added = Math.abs(hash % 800) + 150;
    const planning = Math.abs((hash * 7) % 50) + 5;
    const trending = added > 500;
    return { added, planning, trending };
  }, [id]);

  useEffect(() => {
    const fetchExperience = async () => {
      try {
        const isUUID = id && id.length === 36 && id.includes('-');
        
        if (isUUID) {
          const { data, error } = await supabase
            .from('experiences')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (error) throw new Error('Experience not found');

          if (data) {
            setExperienceData({
              id: data.id,
              title: data.title,
              creator: data.creator,
              videoThumbnail: data.video_thumbnail || getDefaultImage(data.category),
              category: data.category,
              location: data.location,
              description: data.description,
              duration: `${data.duration_hours} hours`,
              groupSize: `1-${data.max_participants} people`,
              rating: 4.8,
              highlights: ["Unique experience", "Expert guides", "Photo opportunities"],
              gallery: [data.video_thumbnail || getDefaultImage(data.category)],
              bestTime: "Flexible",
              meetingPoints: [{ name: data.location, type: "Main Location" }]
            });
            return;
          }
        }
        
        const mockExperience = mockExperiences.find(exp => exp.id === id);
        if (mockExperience) {
          setExperienceData(mockExperience);
          return;
        }
        
        for (const itinerary of publicItinerariesData) {
          const itineraryExp = itinerary.experiences.find(exp => exp.id === id);
          if (itineraryExp) {
            setExperienceData({
              id: itineraryExp.id,
              title: itineraryExp.title,
              creator: itineraryExp.creator,
              videoThumbnail: itineraryExp.videoThumbnail || getDefaultImage(itineraryExp.category),
              category: itineraryExp.category,
              location: itineraryExp.location,
              description: `Experience the best of ${itineraryExp.location} with this amazing ${itineraryExp.category.toLowerCase()} experience.`,
              duration: "3 hours",
              groupSize: "2-10 people",
              rating: 4.7,
              highlights: ["Local expertise", "Authentic experience", "Photo opportunities", "Small groups"],
              gallery: [itineraryExp.videoThumbnail || getDefaultImage(itineraryExp.category)],
              bestTime: "Flexible",
              meetingPoints: [{ name: itineraryExp.location, type: "Main Location" }]
            });
            return;
          }
        }
        
        for (const userItinerary of itineraries) {
          const userExp = userItinerary.experiences.find(exp => exp.id === id);
          if (userExp) {
            setExperienceData({
              id: userExp.id,
              title: userExp.title,
              creator: userExp.creator,
              videoThumbnail: userExp.videoThumbnail || getDefaultImage(userExp.category),
              category: userExp.category,
              location: userExp.location,
              description: `Experience the best of ${userExp.location} with this amazing ${userExp.category?.toLowerCase() || 'local'} experience.`,
              duration: "3 hours",
              groupSize: "2-10 people",
              rating: 4.7,
              highlights: ["Local expertise", "Authentic experience", "Photo opportunities", "Small groups"],
              gallery: [userExp.videoThumbnail || getDefaultImage(userExp.category)],
              bestTime: "Flexible",
              meetingPoints: [{ name: userExp.location, type: "Main Location" }]
            });
            return;
          }
        }
        
        throw new Error('Experience not found');
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load experience details.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchExperience();
  }, [id, toast, itineraries]);

  const getDefaultImage = (category: string) => {
    const imageMap: { [key: string]: string } = {
      'water-sports': jetskiImage, 'Water Sports': jetskiImage,
      'party': partyImage, 'Party': partyImage,
      'wildlife': wildlifeImage, 'Wildlife': wildlifeImage,
      'food': foodImage, 'Food': foodImage, 'Food & Dining': foodImage,
      'beach': beachImage, 'Beach': beachImage,
      'adventure': adventureImage, 'Adventure': adventureImage,
      'nightlife': partyImage, 'Nightlife': partyImage
    };
    return imageMap[category] || jetskiImage;
  };

  const experience = experienceData || mockExperiences.find(exp => exp.id === id);
  const inItinerary = experience ? isInItinerary(experience.id) : false;

  useEffect(() => {
    if (experience) {
      document.title = `${experience.title} | Add to Your Itinerary`;
    }
    return () => { document.title = 'Experience East Africa'; };
  }, [experience]);

  const handleToggleItinerary = () => {
    if (!experience) return;
    
    if (inItinerary) {
      removeExperience(experience.id);
      toast({ title: "Removed from itinerary", description: `${experience.title} removed` });
      setJustAdded(false);
    } else {
      addExperience({
        id: experience.id,
        title: experience.title,
        creator: experience.creator,
        videoThumbnail: experience.videoThumbnail,
        category: experience.category,
        location: experience.location,
        price: "",
      });
      setJustAdded(true);
      toast({ 
        title: "Added to itinerary! 🎉", 
        description: "Keep exploring and build your perfect trip" 
      });
      setTimeout(() => setJustAdded(false), 2000);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: experience?.title, url: shareUrl });
      } catch {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied!" });
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied!" });
    }
  };

  if (loading) {
    return (
      <MainLayout showItineraryPanel={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!experience) {
    return (
      <MainLayout showItineraryPanel={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-xl font-bold mb-3">Experience not found</h1>
            <Link to="/"><Button size="sm">Back to Discover</Button></Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const gallery = experience.gallery || [experience.videoThumbnail];

  return (
    <MainLayout showItineraryPanel={false}>
      <div className="min-h-screen bg-background">
        {/* Header Nav - Clean & Simple */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Discover</span>
            </Link>
            
            <div className="flex items-center gap-2">
              {socialProof.trending && (
                <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-0">
                  <Flame className="w-3 h-3" />
                  Trending
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleShare}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const text = `Check out: ${experience.title}\n${window.location.href}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto">
          {/* Hero Media */}
          <div className="relative aspect-[4/3] md:aspect-[21/9] overflow-hidden bg-muted">
            {experience.videoUrl ? (
              <video
                ref={videoRef}
                poster={experience.videoThumbnail}
                className="w-full h-full object-cover"
                muted loop playsInline autoPlay
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src={experience.videoUrl} type="video/mp4" />
              </video>
            ) : (
              <img 
                src={gallery[selectedImage]} 
                alt={experience.title} 
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Gallery dots */}
            {!experience.videoUrl && gallery.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {gallery.map((_: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      selectedImage === index ? "bg-white w-5" : "bg-white/50"
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="px-4 py-6 md:py-8">
            {/* Category & Social Proof Row */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge className="bg-primary/10 text-primary border-0 font-medium">
                {experience.category}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                <span className="font-medium text-foreground">{experience.rating}</span>
              </div>
              <span className="text-muted-foreground text-sm">•</span>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{socialProof.added} added this</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              {experience.title}
            </h1>

            {/* Location */}
            <div className="flex items-center gap-1.5 text-muted-foreground mb-6">
              <MapPin className="w-4 h-4" />
              <span>{experience.location}</span>
            </div>

            {/* Live Planning Indicator - Network Effects */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 mb-6">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  <span className="text-primary">{socialProof.planning} people</span> are planning this right now
                </p>
                <p className="text-xs text-muted-foreground">Join them and start building your itinerary</p>
              </div>
            </div>

            {/* Quick Info Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{experience.duration}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{experience.groupSize}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Best: {experience.bestTime}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed mb-8">
              {experience.description}
            </p>

            {/* Highlights */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">What makes it special</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {experience.highlights?.map((item: string, index: number) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meeting Points */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Where to find it</h2>
              <div className="space-y-2">
                {experience.meetingPoints?.map((point: { name: string; type: string }, index: number) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{point.name}</p>
                      <p className="text-xs text-muted-foreground">{point.type}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>

            {/* Creator */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border mb-8">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {experience.creator?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">@{experience.creator}</p>
                <p className="text-sm text-muted-foreground">Experience Creator</p>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                <span className="font-medium">{experience.rating}</span>
              </div>
            </div>

            {/* Spacer for fixed bottom bar */}
            <div className="h-24" />
          </div>
        </main>

        {/* Fixed Bottom CTA - Gamified */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <Button 
              onClick={handleToggleItinerary}
              size="lg"
              className={cn(
                "w-full h-14 rounded-2xl font-semibold text-base transition-all",
                inItinerary 
                  ? "bg-card border-2 border-primary text-primary hover:bg-primary/10" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
                justAdded && "animate-pulse"
              )}
              variant={inItinerary ? "outline" : "default"}
            >
              {inItinerary ? (
                <span className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Added to Itinerary
                  <span className="text-xs opacity-70 ml-1">• tap to remove</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add to My Itinerary
                </span>
              )}
            </Button>
            
            {/* Social proof under button */}
            {!inItinerary && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                <span className="text-primary font-medium">{socialProof.added}</span> travelers have added this to their trip
              </p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
