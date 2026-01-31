import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Globe,
  Play,
  Pause,
  Copy,
  MessageCircle,
  ChevronDown,
  Heart,
  Bookmark,
  Info,
  Calendar
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useItineraries } from "@/hooks/useItineraries";
import { publicItinerariesData } from "@/data/itinerariesData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Mock data - in real app this would come from API
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
    views: "5000",
    videoThumbnail: jetskiImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    category: "Water Sports",
    location: "Dar es Salaam",
    price: 49,
    currency: "USD",
    description: "Experience the thrill of high-speed jet skiing through crystal-clear waters. Perfect for adventure seekers looking for an adrenaline rush on the beautiful coastline. Our expert instructors will guide you through the best spots while ensuring your safety throughout the journey.",
    duration: "2 hours",
    groupSize: "4-8 people",
    rating: 4.8,
    totalReviews: 127,
    date: "Available daily",
    time: "Flexible timing",
    highlights: ["Crystal clear waters", "Professional guides", "Photo opportunities", "Beginner friendly"],
    gallery: [jetskiImage, beachImage, adventureImage, partyImage],
    languages: ["English", "Swahili", "French"],
    meetingPoints: [
      { name: "Coco Beach Marina", type: "Main Location" },
      { name: "Ocean Road Pier", type: "Alternative" },
      { name: "Slipway Waterfront", type: "Weekend only" }
    ],
    cancellationPolicy: "Free cancellation up to 24 hours before"
  },
  {
    id: "2",
    title: "Beach Party Extravaganza",
    creator: "BeachVibes",
    views: "12.5K",
    videoThumbnail: partyImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    category: "Party",
    location: "Zanzibar",
    price: 35,
    currency: "USD",
    description: "All-night beach party with world-class DJs and tropical vibes. Dance under the stars on pristine white sand beaches with the Indian Ocean as your backdrop.",
    duration: "5 hours",
    groupSize: "10-100 people",
    rating: 4.7,
    totalReviews: 89,
    date: "Every weekend",
    time: "8:00 PM - 1:00 AM",
    highlights: ["World-class DJs", "Beach setting", "Tropical cocktails", "Unforgettable atmosphere"],
    gallery: [partyImage, beachImage, foodImage, jetskiImage],
    languages: ["English", "Swahili"],
    meetingPoints: [
      { name: "Nungwi Beach Club", type: "Main Venue" },
      { name: "Kendwa Rocks", type: "Saturday nights" }
    ],
    cancellationPolicy: "Free cancellation up to 48 hours before"
  },
  {
    id: "3",
    title: "Safari Wildlife Experience",
    creator: "WildlifePro",
    views: "8.2K",
    videoThumbnail: wildlifeImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    category: "Wildlife",
    location: "Serengeti",
    price: 120,
    currency: "USD",
    description: "Guided safari through the Serengeti with expert rangers. Witness the incredible wildlife of East Africa including lions, elephants, and the great migration.",
    duration: "6 hours",
    groupSize: "2-6 people",
    rating: 4.9,
    totalReviews: 203,
    date: "Daily",
    time: "6:00 AM - 12:00 PM",
    highlights: ["Big Five sightings", "Expert guides", "Premium vehicles", "Sunrise views"],
    gallery: [wildlifeImage, adventureImage, beachImage, foodImage],
    languages: ["English", "Swahili", "German"],
    meetingPoints: [
      { name: "Seronera Airstrip", type: "Main pickup" },
      { name: "Arusha Town", type: "Hotel pickup" },
      { name: "Ngorongoro Gate", type: "Alternative" }
    ],
    cancellationPolicy: "Free cancellation up to 72 hours before"
  },
  {
    id: "4",
    title: "Local Food Tasting Tour",
    creator: "FoodieGuide",
    views: "6.7K",
    videoThumbnail: foodImage,
    category: "Food",
    location: "Stone Town",
    price: 25,
    currency: "USD",
    description: "Taste the best local dishes with a culinary expert. Explore the vibrant spice markets and hidden food gems of Stone Town.",
    duration: "3 hours",
    groupSize: "4-10 people",
    rating: 4.6,
    totalReviews: 54,
    date: "Mon-Fri",
    time: "1:00 PM - 4:00 PM",
    highlights: ["Authentic cuisine", "Spice markets", "Local secrets", "Cultural immersion"],
    gallery: [foodImage, partyImage, beachImage, wildlifeImage],
    languages: ["English", "Swahili", "Arabic"],
    meetingPoints: [
      { name: "Forodhani Gardens", type: "Main spot" },
      { name: "Darajani Market", type: "Alternative" }
    ],
    cancellationPolicy: "Free cancellation up to 24 hours before"
  },
  {
    id: "5",
    title: "Tropical Beach Paradise",
    creator: "BeachLover",
    views: "15.3K",
    videoThumbnail: beachImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    category: "Beach",
    location: "Kendwa",
    price: 40,
    currency: "USD",
    description: "Relax on pristine sands and swim in turquoise waters. Experience the ultimate tropical beach day with all amenities included.",
    duration: "4 hours",
    groupSize: "2-12 people",
    rating: 4.7,
    totalReviews: 178,
    date: "Daily",
    time: "10:00 AM - 2:00 PM",
    highlights: ["White sand beaches", "Crystal clear water", "Relaxation", "Snorkeling spots"],
    gallery: [beachImage, jetskiImage, partyImage, adventureImage],
    languages: ["English", "Swahili", "Italian"],
    meetingPoints: [
      { name: "Kendwa Rocks Beach", type: "Main beach" },
      { name: "Nungwi Beach", type: "Alternative" }
    ],
    cancellationPolicy: "Free cancellation up to 24 hours before"
  },
  {
    id: "6",
    title: "Mountain Climbing Adventure",
    creator: "AdventureSeeker",
    views: "4.1K",
    videoThumbnail: adventureImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    category: "Adventure",
    location: "Mount Kilimanjaro",
    price: 200,
    currency: "USD",
    description: "Challenge yourself with a guided climb and breathtaking views. Conquer the roof of Africa with experienced mountaineering guides.",
    duration: "8 hours",
    groupSize: "1-5 people",
    rating: 4.8,
    totalReviews: 92,
    date: "Weekends",
    time: "6:00 AM - 2:00 PM",
    highlights: ["Summit views", "Expert guides", "Achievement", "Stunning landscapes"],
    gallery: [adventureImage, wildlifeImage, beachImage, foodImage],
    languages: ["English", "Swahili"],
    meetingPoints: [
      { name: "Machame Gate", type: "Main route" },
      { name: "Marangu Gate", type: "Alternative route" },
      { name: "Moshi Town", type: "Hotel pickup" }
    ],
    cancellationPolicy: "Free cancellation up to 1 week before"
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
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

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
              views: "0",
              videoThumbnail: data.video_thumbnail || getDefaultImage(data.category),
              videoUrl: "",
              category: data.category,
              location: data.location,
              price: data.price,
              currency: data.currency || "USD",
              description: data.description,
              duration: `${data.duration_hours} hours`,
              groupSize: `1-${data.max_participants} people`,
              rating: 4.8,
              totalReviews: 0,
              date: "Available on request",
              time: "Flexible timing",
              includes: ["Professional guide", "Safety equipment", "Refreshments", "Insurance coverage"],
              highlights: ["Unique experience", "Expert guides", "Photo opportunities"],
              gallery: [data.video_thumbnail || getDefaultImage(data.category)],
              languages: ["English", "Swahili"],
              meetingPoint: data.location,
              cancellationPolicy: "Free cancellation up to 24 hours before"
            });
            return;
          }
        }
        
        // Check mock experiences first
        const mockExperience = mockExperiences.find(exp => exp.id === id);
        if (mockExperience) {
          setExperienceData(mockExperience);
          return;
        }
        
        // Check experiences from public itineraries
        for (const itinerary of publicItinerariesData) {
          const itineraryExp = itinerary.experiences.find(exp => exp.id === id);
          if (itineraryExp) {
            setExperienceData({
              id: itineraryExp.id,
              title: itineraryExp.title,
              creator: itineraryExp.creator,
              views: "0",
              videoThumbnail: itineraryExp.videoThumbnail || getDefaultImage(itineraryExp.category),
              videoUrl: "",
              category: itineraryExp.category,
              location: itineraryExp.location,
              price: parseInt(itineraryExp.price?.replace(/[^0-9]/g, '') || '0'),
              currency: "USD",
              description: `Experience the best of ${itineraryExp.location} with this amazing ${itineraryExp.category.toLowerCase()} experience. Join ${itineraryExp.creator} for an unforgettable adventure that showcases the local culture and hidden gems.`,
              duration: "3 hours",
              groupSize: "2-10 people",
              rating: 4.7,
              totalReviews: Math.floor(Math.random() * 100) + 20,
              date: "Available daily",
              time: "Flexible timing",
              includes: ["Professional guide", "Transportation", "Refreshments", "Insurance coverage"],
              highlights: ["Local expertise", "Authentic experience", "Photo opportunities", "Small groups"],
              gallery: [itineraryExp.videoThumbnail || getDefaultImage(itineraryExp.category)],
              languages: ["English", "Swahili"],
              meetingPoint: itineraryExp.location,
              cancellationPolicy: "Free cancellation up to 24 hours before"
            });
            return;
          }
        }
        
        // Check experiences from user's personal itineraries
        for (const userItinerary of itineraries) {
          const userExp = userItinerary.experiences.find(exp => exp.id === id);
          if (userExp) {
            setExperienceData({
              id: userExp.id,
              title: userExp.title,
              creator: userExp.creator,
              views: "0",
              videoThumbnail: userExp.videoThumbnail || getDefaultImage(userExp.category),
              videoUrl: "",
              category: userExp.category,
              location: userExp.location,
              price: parseInt(userExp.price?.replace(/[^0-9]/g, '') || '0'),
              currency: "USD",
              description: `Experience the best of ${userExp.location} with this amazing ${userExp.category?.toLowerCase() || 'local'} experience. Join ${userExp.creator} for an unforgettable adventure that showcases the local culture and hidden gems.`,
              duration: "3 hours",
              groupSize: "2-10 people",
              rating: 4.7,
              totalReviews: Math.floor(Math.random() * 100) + 20,
              date: "Available daily",
              time: "Flexible timing",
              includes: ["Professional guide", "Transportation", "Refreshments", "Insurance coverage"],
              highlights: ["Local expertise", "Authentic experience", "Photo opportunities", "Small groups"],
              gallery: [userExp.videoThumbnail || getDefaultImage(userExp.category)],
              languages: ["English", "Swahili"],
              meetingPoint: userExp.location,
              cancellationPolicy: "Free cancellation up to 24 hours before"
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

  // SEO: Update document meta tags
  useEffect(() => {
    if (experience) {
      document.title = `${experience.title} in ${experience.location} | Experience East Africa`;
      
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', 
        `${experience.title} - ${experience.description?.slice(0, 150)}... Starting from $${experience.price}. Book ${experience.category} experiences in ${experience.location}.`
      );

      const ogTags = [
        { property: 'og:title', content: experience.title },
        { property: 'og:description', content: experience.description?.slice(0, 200) },
        { property: 'og:image', content: experience.videoThumbnail },
        { property: 'og:type', content: 'product' },
        { property: 'og:url', content: window.location.href },
      ];

      ogTags.forEach(tag => {
        let metaTag = document.querySelector(`meta[property="${tag.property}"]`);
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.setAttribute('property', tag.property);
          document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', tag.content || '');
      });

      let scriptTag = document.querySelector('script[type="application/ld+json"]');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptTag);
      }
      
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "TouristAttraction",
        "name": experience.title,
        "description": experience.description,
        "image": experience.videoThumbnail,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": experience.location,
          "addressCountry": "TZ"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": experience.rating,
          "reviewCount": experience.totalReviews
        },
        "offers": {
          "@type": "Offer",
          "price": experience.price,
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        }
      };
      scriptTag.textContent = JSON.stringify(structuredData);
    }

    return () => {
      document.title = 'Experience East Africa';
    };
  }, [experience]);

  const handleToggleItinerary = () => {
    if (!experience) return;
    
    if (inItinerary) {
      removeExperience(experience.id);
      toast({ title: "Removed from itinerary", description: `${experience.title} has been removed` });
    } else {
      addExperience({
        id: experience.id,
        title: experience.title,
        creator: experience.creator,
        videoThumbnail: experience.videoThumbnail,
        category: experience.category,
        location: experience.location,
        price: experience.price.toString()
      });
      toast({ title: "Added to itinerary", description: `${experience.title} has been added to your trip` });
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: experience?.title,
          text: `Check out this experience: ${experience?.title}`,
          url: shareUrl,
        });
      } catch (err) {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied!", description: "Share this link with your friends." });
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied!", description: "Share this link with your friends." });
    }
  };

  const handleShareWhatsApp = () => {
    const shareUrl = window.location.href;
    const text = `Check out this experience: ${experience?.title}\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (loading) {
    return (
      <MainLayout showItineraryPanel={false}>
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground text-sm">Loading experience...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!experience) {
    return (
      <MainLayout showItineraryPanel={false}>
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center px-6">
            <h1 className="text-xl font-bold mb-3">Experience not found</h1>
            <Link to="/">
              <Button size="sm">Back to Discover</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const gallery = experience.gallery || [experience.videoThumbnail];

  return (
    <MainLayout showItineraryPanel={false}>
      {/* Full-screen immersive container */}
      <div className="relative min-h-screen bg-black">
        
        {/* Hero Media - Full viewport on mobile */}
        <div className="relative h-[85vh] md:h-[70vh] w-full overflow-hidden">
          {experience.videoUrl ? (
            <>
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
              {/* Video play/pause - tap anywhere */}
              <button 
                onClick={toggleVideo}
                className="absolute inset-0 w-full h-full z-10"
                aria-label={isPlaying ? "Pause video" : "Play video"}
              />
              {/* Play indicator on pause */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <img 
              src={gallery[selectedImage]} 
              alt={experience.title} 
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Gradient overlays for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />
          
          {/* Top Navigation - Floating */}
          <div className="absolute top-0 left-0 right-0 p-4 md:p-6 z-30">
            <div className="flex justify-between items-center">
              <Link 
                to="/" 
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-md border-border">
                    <DropdownMenuItem onClick={handleShare}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareWhatsApp}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Right Side Actions - TikTok style vertical */}
          <div className="absolute right-4 bottom-32 md:bottom-40 z-30 flex flex-col gap-5 items-center">
            {/* Add to itinerary */}
            <button 
              onClick={handleToggleItinerary}
              className="flex flex-col items-center gap-1"
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                inItinerary 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-black/40 backdrop-blur-md text-white hover:bg-black/60"
              )}>
                {inItinerary ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              </div>
              <span className="text-white text-[11px] font-medium drop-shadow-lg">
                {inItinerary ? "Added" : "Add"}
              </span>
            </button>

            {/* Like */}
            <button className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                <Heart className="w-6 h-6" />
              </div>
              <span className="text-white text-[11px] font-medium drop-shadow-lg">
                {experience.totalReviews}
              </span>
            </button>

            {/* Creator avatar */}
            <div className="flex flex-col items-center gap-1">
              <Avatar className="w-12 h-12 ring-2 ring-white">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                  {experience.creator?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-white text-[11px] font-medium drop-shadow-lg truncate max-w-[48px]">
                @{experience.creator?.slice(0, 6)}
              </span>
            </div>
          </div>
          
          {/* Bottom Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-20">
            <div className="max-w-2xl">
              {/* Category & Rating */}
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-primary/90 text-primary-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {experience.category}
                </Badge>
                <div className="flex items-center gap-1 text-white text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{experience.rating}</span>
                </div>
              </div>
              
              {/* Title */}
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 leading-tight">
                {experience.title}
              </h1>
              
              {/* Location & Quick Info */}
              <div className="flex flex-wrap items-center gap-3 text-white/90 text-sm mb-4">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {experience.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {experience.duration}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {experience.groupSize}
                </span>
              </div>

              {/* Price badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
                <span className="text-white/70 text-sm">From</span>
                <span className="text-white text-xl font-bold">${experience.price}</span>
                <span className="text-white/70 text-sm">/ person</span>
              </div>
            </div>
          </div>

          {/* Gallery dots - if multiple images and no video */}
          {!experience.videoUrl && gallery.length > 1 && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
              {gallery.map((_: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    selectedImage === index 
                      ? "bg-white w-6" 
                      : "bg-white/50 hover:bg-white/70"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Swipe up indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/60" />
        </div>

        {/* Details Section - Scrollable below hero */}
        <div className="relative bg-background rounded-t-3xl -mt-6 z-40">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-3 mb-6" />
          
          <div className="px-4 md:px-6 pb-32 max-w-4xl mx-auto">
            {/* Description */}
            <div className="mb-8">
              <p className="text-foreground/80 leading-relaxed">
                {experience.description}
              </p>
            </div>

            {/* Highlights */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Highlights</h3>
              <div className="grid grid-cols-2 gap-3">
                {(experience.highlights || []).map((item: string, index: number) => (
                  <div key={index} className="flex items-center gap-2.5 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Details Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <div className="bg-card rounded-2xl p-4 text-center">
                <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Duration</p>
                <p className="font-semibold text-sm">{experience.duration}</p>
              </div>
              <div className="bg-card rounded-2xl p-4 text-center">
                <Users className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Group Size</p>
                <p className="font-semibold text-sm">{experience.groupSize}</p>
              </div>
              <div className="bg-card rounded-2xl p-4 text-center">
                <Globe className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Languages</p>
                <p className="font-semibold text-sm">{experience.languages?.[0] || "English"}</p>
              </div>
              <div className="bg-card rounded-2xl p-4 text-center">
                <Calendar className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Availability</p>
                <p className="font-semibold text-sm">{experience.date?.split(' ')[0]}</p>
              </div>
            </div>

            {/* Meeting Points */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Where to go</h3>
              <div className="space-y-3">
                {(experience.meetingPoints || [{ name: experience.meetingPoint || experience.location, type: "Main Location" }]).map((point: { name: string; type: string }, index: number) => (
                  <div key={index} className="flex items-center gap-3 bg-card rounded-xl p-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{point.name}</p>
                      <p className="text-xs text-muted-foreground">{point.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Tip */}
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">
                    {(experience.category === "Water Sports" || experience.category === "Beach" || experience.category === "Party") 
                      ? "Great for walk-ins" 
                      : "Book ahead"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {(experience.category === "Water Sports" || experience.category === "Beach" || experience.category === "Party")
                      ? "This experience is often available on-demand. Head to the location and connect with vendors directly."
                      : "This experience typically requires advance booking. Contact vendors ahead of time to secure your spot."}
                  </p>
                </div>
              </div>
            </div>

            {/* Creator Card */}
            <div className="bg-card rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {experience.creator?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">@{experience.creator}</p>
                  <p className="text-sm text-muted-foreground">Experience Creator</p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{experience.rating}</span>
                  <span className="text-muted-foreground">({experience.totalReviews})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom CTA - Mobile optimized */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border p-4 md:p-5">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">From</p>
              <p className="text-2xl font-bold text-primary">${experience.price}</p>
            </div>
            <Button 
              onClick={handleToggleItinerary}
              size="lg"
              className={cn(
                "flex-1 max-w-xs rounded-full font-semibold h-12 text-base",
                inItinerary && "bg-primary/10 text-primary hover:bg-primary/20"
              )}
              variant={inItinerary ? "outline" : "default"}
            >
              {inItinerary ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  In Your Itinerary
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Add to Itinerary
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
