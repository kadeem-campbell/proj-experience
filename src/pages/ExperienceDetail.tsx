import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  Heart,
  MessageCircle,
  Flame,
  TrendingUp,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Calendar,
  Zap,
  CloudSun,
  DollarSign,
  HelpCircle,
  Send,
  ThumbsUp
} from "lucide-react";
import { useItineraries } from "@/hooks/useItineraries";
import { ItinerarySelector } from "@/components/ItinerarySelector";
import { publicItinerariesData } from "@/data/itinerariesData";
import { cn } from "@/lib/utils";
import { PhotoGallery } from "@/components/PhotoGallery";
import { SocialVideoEmbed, TikTokVideo } from "@/components/SocialVideoEmbed";
import { ShareDrawer } from "@/components/ShareDrawer";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useAuth } from "@/hooks/useAuth";
import { slugify, generateExperienceUrl, generateExperienceSlug } from "@/utils/slugUtils";
import catBeaches from "@/assets/cat-beaches.png";
import catNightlife from "@/assets/cat-nightlife.png";
import catNature from "@/assets/cat-nature.png";
import catAdventure from "@/assets/cat-adventure.png";
import catFood from "@/assets/cat-food.png";
import catSafari from "@/assets/cat-safari.png";

// Mock data
import partyImage from "@/assets/party-experience.jpg";
import beachImage from "@/assets/beach-experience.jpg";
import foodImage from "@/assets/food-experience.jpg";
import wildlifeImage from "@/assets/wildlife-experience.jpg";
import jetskiImage from "@/assets/jetski-experience.jpg";
import adventureImage from "@/assets/adventure-experience.jpg";

const categoryIconMap: Record<string, string> = {
  "Beach": catBeaches,
  "Adventure": catAdventure,
  "Party": catNightlife,
  "Wildlife": catSafari,
  "Food": catFood,
  "Water Sports": catAdventure,
  "Nightlife": catNightlife,
  "Culture": catNature,
};

const mockExperiences = [
  {
    id: "7",
    title: "Zanzibar Sea Walk",
    creator: "ChristineNampeera",
    videoThumbnail: beachImage,
    category: "Adventure",
    location: "Zanzibar",
    description: "Walk on the ocean floor with a special helmet that lets you breathe underwater. An unforgettable experience exploring marine life up close in the crystal-clear waters of Zanzibar.",
    duration: "1.5 hours",
    groupSize: "2-8 people",
    rating: 4.9,
    price: "$25 - $60",
    highlights: ["Walk on the ocean floor", "No diving experience needed", "See tropical fish up close", "Professional guides & equipment"],
    gallery: [beachImage, jetskiImage, adventureImage],
    bestTime: "Morning",
    weather: "☀️ Sunny, 28°C avg",
    meetingPoints: [
      { name: "Nungwi Beach", type: "Main Location" },
      { name: "Kendwa Pier", type: "Alternative" }
    ],
    faqs: [
      { q: "Do I need to know how to swim?", a: "No! The helmet keeps your head above water and you walk on the ocean floor.", likes: 12 },
      { q: "What should I bring?", a: "Just a swimsuit and towel. All equipment is provided.", likes: 8 },
    ],
    tiktokVideos: [
      {
        videoId: "7571903191340666123",
        url: "https://www.tiktok.com/@christinenampeera/video/7571903191340666123",
        author: "@christinenampeera"
      }
    ] as TikTokVideo[]
  },
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
    price: "$30 - $80",
    highlights: ["Crystal clear waters", "Professional guides", "Photo opportunities", "Beginner friendly"],
    gallery: [jetskiImage, beachImage, adventureImage, partyImage],
    bestTime: "Morning",
    weather: "🌤️ Warm, 30°C avg",
    meetingPoints: [
      { name: "Coco Beach Marina", type: "Main Location" },
      { name: "Ocean Road Pier", type: "Alternative" }
    ],
    faqs: [],
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
    price: "$15 - $50",
    highlights: ["World-class DJs", "Beach setting", "Tropical cocktails", "Unforgettable atmosphere"],
    gallery: [partyImage, beachImage, foodImage, jetskiImage],
    bestTime: "Evening",
    weather: "🌙 Cool breeze, 25°C",
    meetingPoints: [
      { name: "Nungwi Beach Club", type: "Main Venue" }
    ],
    faqs: [],
  },
  {
    id: "3",
    title: "Safari Wildlife Experience",
    creator: "WildlifePro",
    videoThumbnail: wildlifeImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    category: "Wildlife",
    location: "Zanzibar",
    description: "Guided safari through incredible landscapes with expert rangers. Witness the amazing wildlife of East Africa.",
    duration: "6 hours",
    groupSize: "2-6 people",
    rating: 4.9,
    price: "$80 - $200",
    highlights: ["Big Five sightings", "Expert guides", "Premium vehicles", "Sunrise views"],
    gallery: [wildlifeImage, adventureImage, beachImage, foodImage],
    bestTime: "Morning",
    weather: "🌅 Dry season best",
    meetingPoints: [
      { name: "Jozani Forest", type: "Main route" }
    ],
    faqs: [],
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
    price: "$10 - $35",
    highlights: ["Authentic cuisine", "Spice markets", "Local secrets", "Cultural immersion"],
    gallery: [foodImage, partyImage, beachImage, wildlifeImage],
    bestTime: "Afternoon",
    weather: "🌤️ Warm, 29°C avg",
    meetingPoints: [
      { name: "Forodhani Gardens", type: "Main spot" }
    ],
    faqs: [],
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
    price: "$5 - $20",
    highlights: ["White sand beaches", "Crystal clear water", "Relaxation", "Snorkeling spots"],
    gallery: [beachImage, jetskiImage, partyImage, adventureImage],
    bestTime: "Morning",
    weather: "☀️ Sunny, 31°C avg",
    meetingPoints: [
      { name: "Kendwa Rocks Beach", type: "Main beach" }
    ],
    faqs: [],
  },
  {
    id: "6",
    title: "Mountain Climbing Adventure",
    creator: "AdventureSeeker",
    videoThumbnail: adventureImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    category: "Adventure",
    location: "Zanzibar",
    description: "Challenge yourself with a guided climb and breathtaking views. Experience the heights of East Africa.",
    duration: "8 hours",
    groupSize: "1-5 people",
    rating: 4.8,
    price: "$40 - $120",
    highlights: ["Summit views", "Expert guides", "Achievement", "Stunning landscapes"],
    gallery: [adventureImage, wildlifeImage, beachImage, foodImage],
    bestTime: "Morning",
    weather: "🌤️ Cool at summit, 15°C",
    meetingPoints: [
      { name: "Local guide meetup", type: "Main route" }
    ],
    faqs: [],
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

const buildExperienceMap = () => {
  const byId = new Map<string, any>();
  const bySlug = new Map<string, any>();
  
  mockExperiences.forEach(exp => {
    byId.set(exp.id, exp);
    const titleSlug = slugify(exp.title);
    bySlug.set(titleSlug, exp);
  });
  
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
          price: "$15 - $75",
          highlights: ["Local expertise", "Authentic experience", "Photo opportunities", "Small groups"],
          gallery: [exp.videoThumbnail || getDefaultImage(exp.category)],
          bestTime: "Flexible",
          weather: "🌤️ Tropical climate",
          meetingPoints: [{ name: exp.location, type: "Main Location" }],
          faqs: [],
        };
        byId.set(exp.id, fullExp);
        const titleSlug = slugify(exp.title);
        if (!bySlug.has(titleSlug)) {
          bySlug.set(titleSlug, fullExp);
        }
      }
    });
  });
  
  return { byId, bySlug };
};

const { byId: experienceMapById, bySlug: experienceMapBySlug } = buildExperienceMap();

// FAQ Component
const FAQSection = ({ faqs, experienceId }: { faqs: any[]; experienceId: string }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showAskForm, setShowAskForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [localFaqs, setLocalFaqs] = useState(faqs || []);

  const handleAsk = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    setShowAskForm(true);
  };

  const handleSubmitQuestion = () => {
    if (!newQuestion.trim()) return;
    setLocalFaqs(prev => [...prev, { q: newQuestion.trim(), a: "", likes: 0, pending: true }]);
    setNewQuestion("");
    setShowAskForm(false);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">FAQ</h2>
        <button
          onClick={handleAsk}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium active:scale-95 transition-transform"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Ask
        </button>
      </div>

      {showAskForm && (
        <div className="mb-4 p-3 rounded-xl bg-muted/50 border border-border">
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ask a question about this experience..."
            className="w-full bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none"
            rows={2}
            style={{ fontSize: '16px' }}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowAskForm(false)} className="text-xs text-muted-foreground">Cancel</button>
            <button onClick={handleSubmitQuestion} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              <Send className="w-3 h-3" />
              Submit
            </button>
          </div>
        </div>
      )}

      {localFaqs.length > 0 ? (
        <div className="space-y-3">
          {localFaqs.map((faq: any, index: number) => (
            <div key={index} className="p-3.5 rounded-xl bg-card border border-border">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{faq.q}</p>
                  {faq.a ? (
                    <p className="text-sm text-muted-foreground mt-1.5">{faq.a}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground/60 mt-1 italic">Awaiting answer from the community</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <ThumbsUp className="w-3 h-3" />
                      {faq.likes || 0}
                    </button>
                    {isAuthenticated && !faq.a && (
                      <button className="text-xs text-primary font-medium">Answer</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 px-4 rounded-xl bg-muted/30 border border-border/50">
          <MessageCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No questions yet</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Be the first to ask!</p>
        </div>
      )}
    </div>
  );
};

export default function ExperienceDetail() {
  const { id, location: locationParam, legacySlug, slug } = useParams();
  const navigate = useNavigate();
  const { itineraries, isInItinerary } = useItineraries();
  const { isLiked: isDbLiked, toggleLike: toggleDbLike } = useUserLikes();
  const { isAuthenticated } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [justAdded, setJustAdded] = useState(false);
  const [localLiked, setLocalLiked] = useState(false);
  const isMobile = useIsMobile();

  const handleGoBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/experiences');
    }
  };

  const experience = useMemo(() => {
    if (slug) {
      if (experienceMapBySlug.has(slug)) return experienceMapBySlug.get(slug);
    }
    if (locationParam && legacySlug) {
      if (experienceMapBySlug.has(legacySlug)) return experienceMapBySlug.get(legacySlug);
    }
    if (id) {
      if (experienceMapById.has(id)) return experienceMapById.get(id);
      for (const userItinerary of itineraries) {
        const userExp = userItinerary.experiences.find(exp => exp.id === id);
        if (userExp) {
          return {
            id: userExp.id, title: userExp.title, creator: userExp.creator,
            videoThumbnail: userExp.videoThumbnail || getDefaultImage(userExp.category),
            category: userExp.category, location: userExp.location,
            description: `Experience the best of ${userExp.location} with this amazing ${userExp.category?.toLowerCase() || 'local'} experience.`,
            duration: "3 hours", groupSize: "2-10 people", rating: 4.7, price: "$15 - $75",
            highlights: ["Local expertise", "Authentic experience", "Photo opportunities", "Small groups"],
            gallery: [userExp.videoThumbnail || getDefaultImage(userExp.category)],
            bestTime: "Flexible", weather: "🌤️ Tropical climate",
            meetingPoints: [{ name: userExp.location, type: "Main Location" }],
            faqs: [],
          };
        }
      }
    }
    return null;
  }, [id, locationParam, legacySlug, slug, itineraries]);

  const liked = experience ? (isAuthenticated ? isDbLiked(experience.id, 'experience') : localLiked) : false;

  const handleLikeClick = async () => {
    if (!experience) return;
    if ('vibrate' in navigator) navigator.vibrate(10);
    if (isAuthenticated) {
      await toggleDbLike(experience.id, 'experience', {
        id: experience.id, title: experience.title,
        videoThumbnail: experience.videoThumbnail, location: experience.location, category: experience.category
      });
    } else {
      setLocalLiked(!localLiked);
    }
  };

  const socialProof = useMemo(() => {
    const expId = experience?.id || id || '';
    if (!expId) return { added: 0, planning: 0, trending: false };
    const hash = expId.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    const added = Math.abs(hash % 800) + 150;
    const planning = Math.abs((hash * 7) % 50) + 5;
    const trending = added > 500;
    return { added, planning, trending };
  }, [experience?.id, id]);

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
      <div className="flex items-center justify-center min-h-screen bg-background w-full">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-3">Experience not found</h1>
          <Link to="/"><Button size="sm">Back to Discover</Button></Link>
        </div>
      </div>
    );
  }

  const gallery = experience.gallery || [experience.videoThumbnail];
  const categoryIcon = categoryIconMap[experience.category];

  // Mobile
  if (isMobile) {
    return (
      <MobileShell hideTopBar>
        <div className="bg-background overflow-y-auto">
          {/* Photo Gallery - NO rounded edges */}
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
              className="absolute top-3 left-3 p-2.5 rounded-full bg-background/70 backdrop-blur-xl z-10"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            {/* Share & Like - right side, same row */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <ShareDrawer title={experience.title} url={shareUrl}>
                <button className="p-2.5 rounded-full bg-background/70 backdrop-blur-xl">
                  <Share2 className="w-5 h-5 text-foreground" />
                </button>
              </ShareDrawer>
              <button
                onClick={handleLikeClick}
                className={cn(
                  "p-2.5 rounded-full backdrop-blur-xl transition-all active:scale-90",
                  liked ? "bg-primary/20" : "bg-background/70"
                )}
              >
                <Heart className={cn("w-5 h-5", liked ? "fill-primary text-primary" : "text-foreground")} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-4">
            {/* Category badge with icon + rating */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="border-border font-medium flex items-center gap-1.5 bg-card">
                {categoryIcon && <img src={categoryIcon} alt="" className="w-5 h-5 object-contain" />}
                {experience.category}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                <span className="font-medium text-foreground">{experience.rating}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5" />
                <span><strong className="text-foreground">{socialProof.added}</strong> added</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight mb-2">{experience.title}</h1>
            <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
              <MapPin className="w-4 h-4" />
              <span>{experience.location}</span>
            </div>

            {/* Add to Itinerary CTA */}
            <div className="mb-6">
              <ItinerarySelector
                experienceId={experience.id}
                experienceData={{
                  id: experience.id, title: experience.title, creator: experience.creator,
                  videoThumbnail: experience.videoThumbnail, category: experience.category,
                  location: experience.location, price: experience.price || "",
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

            {/* Quick Info Pills - updated with weather + category icon */}
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
                <CloudSun className="w-4 h-4 text-primary" />
                <span className="font-medium">{(experience.weather || `Best: ${experience.bestTime}`).replace(/[^\w\s,°·\-–—.]/g, '').trim()}</span>
              </div>
            </div>

            {/* Prices per person */}
            <div className="mb-6 p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold">Prices per person</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">{experience.price || "$15 - $75"}</span>
                <span className="text-sm text-muted-foreground">average</span>
              </div>
            </div>

            {/* Social Video Embeds */}
            <SocialVideoEmbed 
              experienceTitle={experience.title}
              location={experience.location}
              tiktokVideos={experience.tiktokVideos || []}
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

            {/* Creators */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Creators</h2>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {experience.creator?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">@{experience.creator}</p>
                  <p className="text-sm text-muted-foreground">Creator</p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-medium">{experience.rating}</span>
                </div>
              </div>
            </div>

            {/* FAQ Section - at bottom */}
            <FAQSection faqs={experience.faqs || []} experienceId={experience.id} />

            <div className="h-8" />
          </div>
        </div>
      </MobileShell>
    );
  }

  // Desktop
  return (
    <div className="min-h-screen bg-background overflow-y-auto w-full">
        {/* Media Section - no rounded edges */}
        <div className="relative">
          {gallery.length > 1 ? (
            <div className="aspect-[3/1] overflow-hidden">
              <PhotoGallery images={gallery} title={experience.title} />
            </div>
          ) : experience.videoUrl ? (
            <div className="relative aspect-[3/1] overflow-hidden bg-muted">
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
            <div className="relative aspect-[3/1] overflow-hidden bg-muted">
              <img src={gallery[0]} alt={experience.title} className="w-full h-full object-cover" />
            </div>
          )}
          
          <button 
            onClick={handleGoBack}
            className="absolute top-4 left-4 p-2.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background transition-colors z-10"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          
          <ShareDrawer title={experience.title} url={shareUrl}>
            <button className="absolute top-4 right-16 p-2.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background transition-colors z-10">
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
          </ShareDrawer>

          <button
            onClick={handleLikeClick}
            className={cn(
              "absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md hover:bg-background transition-colors z-10",
              liked ? "bg-primary/20" : "bg-background/80"
            )}
          >
            <Heart className={cn("w-5 h-5", liked ? "fill-primary text-primary" : "text-foreground")} />
          </button>
          
          {socialProof.trending && (
            <Badge variant="secondary" className="absolute top-4 left-1/2 -translate-x-1/2 gap-1 text-xs bg-background/80 backdrop-blur-md text-primary border-0 z-10">
              <Flame className="w-3 h-3" />
              Trending
            </Badge>
          )}
        </div>

        {/* Desktop two-column layout */}
        <main className="max-w-6xl mx-auto px-6 py-6">
          <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8">
            <div>
              {/* Desktop Title */}
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="outline" className="border-border font-medium text-sm flex items-center gap-1.5 bg-card">
                    {categoryIcon && <img src={categoryIcon} alt="" className="w-5 h-5 object-contain" />}
                    {experience.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-medium">{experience.rating}</span>
                  </div>
                  <span className="text-muted-foreground text-sm">•</span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span><strong className="text-foreground">{socialProof.added}</strong> added this</span>
                  </div>
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">{experience.title}</h1>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="text-base">{experience.location}</span>
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
                  <CloudSun className="w-4 h-4 text-primary" />
                  <span className="font-medium">{(experience.weather || `Best: ${experience.bestTime}`).replace(/[^\w\s,°·\-–—.]/g, '').trim()}</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">About this experience</h2>
                <p className="text-muted-foreground leading-relaxed">{experience.description}</p>
              </div>

              <SocialVideoEmbed 
                experienceTitle={experience.title}
                location={experience.location}
                tiktokVideos={experience.tiktokVideos || []}
                className="mb-6"
              />

              {/* Highlights */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Highlights</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {experience.highlights?.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meeting Points */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Where to find it</h2>
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
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Creators */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Creators</h2>
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {experience.creator?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">@{experience.creator}</p>
                    <p className="text-sm text-muted-foreground">Creator</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-medium">{experience.rating}</span>
                  </div>
                </div>
              </div>

              {/* FAQ - at bottom */}
              <FAQSection faqs={experience.faqs || []} experienceId={experience.id} />
            </div>

            {/* Right sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-4 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
                {/* Add to Itinerary CTA */}
                <div className="rounded-2xl border border-border bg-card p-5">
                  <ItinerarySelector
                    experienceId={experience.id}
                    experienceData={{
                      id: experience.id, title: experience.title, creator: experience.creator,
                      videoThumbnail: experience.videoThumbnail, category: experience.category,
                      location: experience.location, price: experience.price || "",
                    }}
                    onAdd={() => {
                      setJustAdded(true);
                      setTimeout(() => setJustAdded(false), 2000);
                    }}
                  >
                    <Button 
                      size="lg"
                      className={cn(
                        "w-full h-13 rounded-xl font-semibold text-base bg-primary text-primary-foreground hover:bg-primary/90",
                        justAdded && "animate-pulse"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Add to Itinerary
                      </span>
                    </Button>
                  </ItinerarySelector>
                  
                  {/* Like button */}
                  <button
                    onClick={handleLikeClick}
                    className={cn(
                      "w-full mt-3 h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-2 border transition-all",
                      liked
                        ? "bg-primary/5 border-primary/20 text-primary"
                        : "bg-card border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Heart className={cn("w-4 h-4", liked && "fill-primary")} />
                    {liked ? "Liked" : "Like"}
                  </button>

                  <p className="text-center text-xs text-muted-foreground mt-2.5">
                    <span className="text-primary font-medium">{socialProof.added}</span> travelers have added this
                  </p>
                </div>

                {/* Average Market Prices */}
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <p className="text-sm font-semibold">Average Market Prices</p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground">{experience.price || "$15 - $75"}</span>
                    <span className="text-sm text-muted-foreground">per person</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Prices from local providers — for reference only
                  </p>
                </div>

                {/* In Your Itineraries */}
                {itineraries.filter(i => i.experiences.some(e => e.id === experience.id)).length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="text-sm font-semibold mb-3">In your itineraries</h3>
                    <div className="space-y-2">
                      {itineraries
                        .filter(i => i.experiences.some(e => e.id === experience.id))
                        .map(itinerary => (
                          <Link 
                            key={itinerary.id} 
                            to={`/itinerary/${itinerary.id}`}
                            className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{itinerary.name}</p>
                              <p className="text-xs text-muted-foreground">{itinerary.experiences.length} experiences</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </Link>
                        ))}
                    </div>
                  </div>
                )}

                {/* Live Planning */}
                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        <span className="text-primary">{socialProof.planning} people</span> planning now
                      </p>
                      <p className="text-xs text-muted-foreground">Join them and build your trip</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
    </div>
  );
}