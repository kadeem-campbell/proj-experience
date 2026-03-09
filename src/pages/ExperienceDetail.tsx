import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { MobileShell } from "@/components/MobileShell";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Plus, 
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
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { publicItinerariesData } from "@/data/itinerariesData";
import { cn } from "@/lib/utils";
import { PhotoGallery } from "@/components/PhotoGallery";
import { SocialVideoEmbed, TikTokVideo } from "@/components/SocialVideoEmbed";
import { ShareDrawer } from "@/components/ShareDrawer";
import { slugify, generateExperienceUrl } from "@/utils/slugUtils";

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

// Pre-compute all experiences for instant lookup by ID and by slug
const buildExperienceMap = () => {
  const byId = new Map<string, any>();
  const bySlug = new Map<string, any>();
  
  // Add mock experiences with full details
  mockExperiences.forEach(exp => {
    byId.set(exp.id, exp);
    const slugKey = `${slugify(exp.location)}/${slugify(exp.title)}`;
    bySlug.set(slugKey, exp);
  });
  
  // Add experiences from public itineraries
  publicItinerariesData.forEach(itinerary => {
    itinerary.experiences.forEach(exp => {
      if (!byId.has(exp.id)) {
        const fullExp = {
          id: exp.id,
          title: exp.title,
          creator: exp.creator,
          videoThumbnail: exp.videoThumbnail || getDefaultImage(exp.category),
          category: exp.category,
          location: exp.location,
          description: `Experience the best of ${exp.location} with this amazing ${exp.category.toLowerCase()} experience.`,
          duration: "3 hours",
          groupSize: "2-10 people",
          rating: 4.7,
          highlights: ["Local expertise", "Authentic experience", "Photo opportunities", "Small groups"],
          gallery: [exp.videoThumbnail || getDefaultImage(exp.category)],
          bestTime: "Flexible",
          meetingPoints: [{ name: exp.location, type: "Main Location" }]
        };
        byId.set(exp.id, fullExp);
        const slugKey = `${slugify(exp.location)}/${slugify(exp.title)}`;
        bySlug.set(slugKey, fullExp);
      }
    });
  });
  
  return { byId, bySlug };
};

// Build once at module load
const { byId: experienceMapById, bySlug: experienceMapBySlug } = buildExperienceMap();

export default function ExperienceDetail() {
  // Support both old /experience/:id and new /experience/:location/:slug URLs
  const { id, location: locationParam, slug } = useParams();
  const navigate = useNavigate();
  const { itineraries, removeExperience, isInItinerary } = useItineraries();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const isMobile = useIsMobile();

  // Smart back navigation - go to referrer or default to experiences
  const handleGoBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/experiences');
    }
  };

  // Instant lookup - no loading state needed for cached data
  const experience = useMemo(() => {
    // New SEO-friendly URL format: /experience/:location/:slug
    if (locationParam && slug) {
      const slugKey = `${locationParam}/${slug}`;
      if (experienceMapBySlug.has(slugKey)) {
        return experienceMapBySlug.get(slugKey);
      }
    }
    
    // Legacy URL format: /experience/:id
    if (id) {
      // Check pre-computed map first (instant)
      if (experienceMapById.has(id)) {
        return experienceMapById.get(id);
      }
      
      // Fallback: check user's itineraries
      for (const userItinerary of itineraries) {
        const userExp = userItinerary.experiences.find(exp => exp.id === id);
        if (userExp) {
          return {
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
          };
        }
      }
    }
    
    return null;
  }, [id, locationParam, slug, itineraries]);

  // Check if experience is in active itinerary
  const inItinerary = isInItinerary(experience?.id || '');

  // Generate consistent social proof numbers based on id
  const socialProof = useMemo(() => {
    const expId = experience?.id || id || '';
    if (!expId) return { added: 0, planning: 0, trending: false };
    const hash = expId.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    const added = Math.abs(hash % 800) + 150;
    const planning = Math.abs((hash * 7) % 50) + 5;
    const trending = added > 500;
    return { added, planning, trending };
  }, [experience?.id, id]);

  // Generate SEO-friendly share URL
  const shareUrl = useMemo(() => {
    if (!experience) return window.location.href;
    const baseUrl = window.location.hostname === 'localhost' ? window.location.origin : 'https://swam.app';
    return `${baseUrl}${generateExperienceUrl(experience.location, experience.title)}`;
  }, [experience]);

  useEffect(() => {
    if (experience) {
      document.title = `${experience.title} in ${experience.location} | Add to Your Itinerary`;
    }
    return () => { document.title = 'Experience East Africa'; };
  }, [experience]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: experience?.title, url: shareUrl });
      } catch {
        await navigator.clipboard.writeText(shareUrl);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  if (!experience) {
    if (isMobile) {
      return (
        <MobileShell hideTopBar>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h1 className="text-xl font-bold mb-3">Experience not found</h1>
              <Link to="/"><Button size="sm">Back to Discover</Button></Link>
            </div>
          </div>
        </MobileShell>
      );
    }
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

  // Mobile: wrap with MobileShell
  if (isMobile) {
    return (
      <MobileShell hideTopBar>
        <div className="bg-background overflow-y-auto">
          {/* Photo Gallery at Top */}
          <div className="relative">
            {gallery.length > 1 ? (
              <PhotoGallery images={gallery} title={experience.title} />
            ) : experience.videoUrl ? (
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <video
                  ref={videoRef}
                  poster={experience.videoThumbnail}
                  className="w-full h-full object-cover"
                  muted loop playsInline autoPlay
                >
                  <source src={experience.videoUrl} type="video/mp4" />
                </video>
              </div>
            ) : (
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img src={gallery[0]} alt={experience.title} className="w-full h-full object-cover" />
              </div>
            )}
            {/* Back button */}
            <button 
              onClick={handleGoBack}
              className="absolute top-4 left-4 p-2 rounded-full bg-background/70 backdrop-blur-xl z-10"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            {/* Share button - uses ShareDrawer */}
            <ShareDrawer title={experience.title} url={shareUrl}>
              <button 
                className="absolute top-4 right-4 p-2 rounded-full bg-background/70 backdrop-blur-xl z-10"
              >
                <Share2 className="w-5 h-5 text-foreground" />
              </button>
            </ShareDrawer>
          </div>

          {/* Content */}
          <div className="px-4 py-4">
            {/* Title & meta */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className="bg-foreground text-background border-0 font-medium">
                {experience.category}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                <span className="font-medium text-foreground">{experience.rating}</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight mb-2">{experience.title}</h1>
            <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
              <MapPin className="w-4 h-4" />
              <span>{experience.location}</span>
            </div>

            {/* Add to Itinerary CTA - moved to top */}
            <div className="mb-6">
              <ItinerarySelector
                experienceId={experience.id}
                experienceData={{
                  id: experience.id,
                  title: experience.title,
                  creator: experience.creator,
                  videoThumbnail: experience.videoThumbnail,
                  category: experience.category,
                  location: experience.location,
                  price: "",
                }}
                onAdd={() => {
                  setJustAdded(true);
                  setTimeout(() => setJustAdded(false), 2000);
                }}
              >
                <Button 
                  size="lg"
                  className={cn(
                    "w-full h-14 rounded-2xl font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90",
                    justAdded && "animate-pulse"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add to Itinerary
                  </span>
                </Button>
              </ItinerarySelector>
            </div>

            {/* Quick Info Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-medium">{experience.duration}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-medium">{experience.groupSize}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-medium">Best: {experience.bestTime}</span>
              </div>
            </div>

            {/* Social Video Embeds */}
            <SocialVideoEmbed 
              experienceTitle={experience.title}
              location={experience.location}
              className="mb-6"
            />

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">About this experience</h2>
              <p className="text-muted-foreground leading-relaxed">{experience.description}</p>
            </div>

            {/* Highlights */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">What makes it special</h2>
              <div className="grid grid-cols-1 gap-3">
                {experience.highlights?.map((item: string, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meeting Points */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Where to find it</h2>
              <div className="space-y-2">
                {experience.meetingPoints?.map((point: { name: string; type: string }, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{point.name}</p>
                      <p className="text-xs text-muted-foreground">{point.type}</p>
                    </div>
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
          </div>
        </div>
      </MobileShell>
    );
  }

  // Desktop
  return (
    <MainLayout showItineraryPanel={false}>
      <div className="min-h-screen bg-background overflow-y-auto">
        {/* Header Nav */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
            <button 
              onClick={handleGoBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Back</span>
            </button>
            
            <div className="flex items-center gap-2">
              {socialProof.trending && (
                <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-0">
                  <Flame className="w-3 h-3" />
                  Trending
                </Badge>
              )}
              <ShareDrawer title={experience.title} url={shareUrl}>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Share2 className="w-4 h-4" />
                </Button>
              </ShareDrawer>
            </div>
          </div>
        </header>

        {/* Main Content - Desktop: Two Column, Mobile: Single Column */}
        <main className="max-w-7xl mx-auto">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            
            {/* Left Column - Media */}
            <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:overflow-hidden">
              {/* Photo Gallery */}
              <div className="relative h-full">
                {gallery.length > 1 ? (
                  <div className="lg:h-full">
                    <PhotoGallery images={gallery} title={experience.title} className="lg:h-full" />
                  </div>
                ) : experience.videoUrl ? (
                  <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full overflow-hidden bg-muted">
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
                  </div>
                ) : (
                  <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full overflow-hidden bg-muted">
                    <img 
                      src={gallery[0]} 
                      alt={experience.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Gradient overlay for desktop */}
                <div className="hidden lg:block absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                
                {/* Desktop overlay content */}
                <div className="hidden lg:flex absolute bottom-0 left-0 right-0 p-8 flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-foreground/90 text-background border-0">
                      {experience.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-white/90 text-sm">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{experience.rating}</span>
                    </div>
                  </div>
                  <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight">
                    {experience.title}
                  </h1>
                  <div className="flex items-center gap-2 text-white/80">
                    <MapPin className="w-4 h-4" />
                    <span>{experience.location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="px-4 py-6 lg:py-8 lg:px-0 lg:pr-8">
              {/* Mobile-only title section */}
              <div className="lg:hidden">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge className="bg-foreground text-background border-0 font-medium">
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

                <h1 className="text-2xl font-bold tracking-tight mb-2">
                  {experience.title}
                </h1>

                <div className="flex items-center gap-1.5 text-muted-foreground mb-6">
                  <MapPin className="w-4 h-4" />
                  <span>{experience.location}</span>
                </div>
              </div>

              {/* Desktop social proof header */}
              <div className="hidden lg:flex items-center gap-3 mb-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span><strong className="text-foreground">{socialProof.added}</strong> travelers added this</span>
                </div>
              </div>

              {/* Live Planning Indicator */}
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
                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-medium">{experience.duration}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-medium">{experience.groupSize}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium">Best: {experience.bestTime}</span>
                </div>
              </div>

              {/* Indicative Pricing Section */}
              <div className="mb-6 p-4 rounded-2xl bg-muted/50 border border-border">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  Typical prices people are paying
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">$15 - $75</span>
                  <span className="text-sm text-muted-foreground">per person</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Prices vary by provider and season. This is informational only.
                </p>
              </div>

              {/* Desktop CTA - Inline */}
              <div className="hidden lg:block mb-8">
                <ItinerarySelector
                  experienceId={experience.id}
                  experienceData={{
                    id: experience.id,
                    title: experience.title,
                    creator: experience.creator,
                    videoThumbnail: experience.videoThumbnail,
                    category: experience.category,
                    location: experience.location,
                    price: "",
                  }}
                  onAdd={() => {
                    setJustAdded(true);
                    setTimeout(() => setJustAdded(false), 2000);
                  }}
                >
                  <Button 
                    size="lg"
                    className={cn(
                      "w-full h-14 rounded-2xl font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90",
                      justAdded && "animate-pulse"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Add to Itinerary
                      {itineraries.filter(i => i.experiences.some(e => e.id === experience.id)).length > 0 && (
                        <span className="ml-1 px-2 py-0.5 rounded-full bg-primary-foreground/20 text-xs">
                          {itineraries.filter(i => i.experiences.some(e => e.id === experience.id)).length}
                        </span>
                      )}
                    </span>
                  </Button>
                </ItinerarySelector>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  <span className="text-primary font-medium">{socialProof.added}</span> travelers have added this to their trip
                </p>
              </div>

              {/* Social Video Embeds */}
              <SocialVideoEmbed 
                experienceTitle={experience.title}
                location={experience.location}
                className="mb-8"
              />

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-3 lg:text-xl">About this experience</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {experience.description}
                </p>
              </div>

              {/* Highlights */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 lg:text-xl">What makes it special</h2>
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
                <h2 className="text-lg font-semibold mb-4 lg:text-xl">Where to find it</h2>
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

              {/* Spacer */}
              <div className="h-8" />
            </div>
          </div>
        </main>
      </div>
    </MainLayout>
  );
}
