import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Search, Calendar, Music, Users, Camera, Globe, RefreshCw, Heart, MessageCircle, Share, ExternalLink, Play } from "lucide-react";
import { useLiveSocialFeed } from "@/hooks/useLiveSocialFeed";

const mockTravellers = [
  {
    id: 1,
    name: "Sarah Chen",
    age: 28,
    location: "Currently in Zanzibar",
    avatar: "/lovable-uploads/d7485755-5346-44f0-8232-f3c04eec2d86.png",
    travelStyle: "Solo Explorer",
    interests: ["Photography", "Local Food", "Adventure"],
    currentEvent: "Glastonbury Festival",
    bio: "Digital nomad exploring Tanzania, looking for hiking buddies!",
    joined: "2 days ago",
    badges: ["Verified", "Solo Expert", "Photo Pro"]
  },
  {
    id: 2,
    name: "Marcus Rivera",
    age: 32,
    location: "Arusha, Tanzania",
    avatar: "",
    travelStyle: "Group Traveller",
    interests: ["Wildlife", "Culture", "Nightlife"],
    currentEvent: "Serengeti Safari",
    bio: "Adventure photographer seeking travel companions for epic safaris!",
    joined: "1 week ago",
    badges: ["Wildlife Expert", "Group Leader"]
  },
  {
    id: 3,
    name: "Luna Rodriguez",
    age: 25,
    location: "Stone Town, Zanzibar",
    avatar: "",
    travelStyle: "Budget Backpacker",
    interests: ["Festivals", "Beach", "Music"],
    currentEvent: "Zanzibar Festival",
    bio: "Festival lover and beach enthusiast, always up for new adventures!",
    joined: "3 days ago",
    badges: ["Festival Guru", "Beach Explorer"]
  }
];

const upcomingEvents = [
  {
    id: 1,
    name: "Glastonbury Festival",
    location: "Somerset, UK",
    date: "Jun 26-30, 2024",
    attendees: 89,
    tags: ["Music", "Camping", "Culture"]
  },
  {
    id: 2,
    name: "Zanzibar Cultural Festival",
    location: "Stone Town, Zanzibar",
    date: "Jul 15-20, 2024",
    attendees: 45,
    tags: ["Culture", "Food", "Music"]
  },
  {
    id: 3,
    name: "Serengeti Photography Expedition",
    location: "Serengeti, Tanzania",
    date: "Aug 5-12, 2024",
    attendees: 23,
    tags: ["Wildlife", "Photography", "Adventure"]
  }
];

const liveUpdates = [
  {
    id: 1,
    user: "sarah_explorer",
    platform: "Instagram",
    content: "Just arrived at Glastonbury! The vibes are incredible 🎵 #Glastonbury2024",
    timestamp: "2 hours ago",
    location: "Glastonbury Festival"
  },
  {
    id: 2,
    user: "adventure_marcus",
    platform: "TikTok",
    content: "Spotted a pride of lions in Serengeti! 🦁 Best safari day ever",
    timestamp: "5 hours ago",
    location: "Serengeti National Park"
  },
  {
    id: 3,
    user: "luna_festivals",
    platform: "Instagram",
    content: "Sunset dhow cruise in Zanzibar 🌅 Who else is here?",
    timestamp: "1 day ago",
    location: "Stone Town, Zanzibar"
  }
];

export default function Travellers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTravelStyle, setSelectedTravelStyle] = useState("all");
  const [activeTab, setActiveTab] = useState("find-travellers");
  const { posts, isLoading, error, lastUpdated, refreshFeed } = useLiveSocialFeed();

  const filteredTravellers = mockTravellers.filter(traveller => {
    const matchesSearch = !searchQuery || 
      traveller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      traveller.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      traveller.interests.some(interest => interest.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStyle = selectedTravelStyle === "all" || 
      traveller.travelStyle.toLowerCase().includes(selectedTravelStyle.toLowerCase());
    
    return matchesSearch && matchesStyle;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navigation />
      
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 gradient-primary bg-clip-text text-transparent">
              Connect with Travellers
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Find like-minded solo travellers and groups. See who's at festivals and events with live social media updates.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="find-travellers">Find Travellers</TabsTrigger>
              <TabsTrigger value="events">Events & Festivals</TabsTrigger>
              <TabsTrigger value="live-updates">Live Updates</TabsTrigger>
            </TabsList>

            <TabsContent value="find-travellers" className="space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, location, or interests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {["all", "solo", "group", "budget"].map((style) => (
                    <Button
                      key={style}
                      variant={selectedTravelStyle === style ? "default" : "outline"}
                      onClick={() => setSelectedTravelStyle(style)}
                      className="capitalize"
                    >
                      {style === "all" ? "All Styles" : style} Traveller
                    </Button>
                  ))}
                </div>
              </div>

              {/* Travellers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTravellers.map((traveller) => (
                  <Card key={traveller.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={traveller.avatar} />
                        <AvatarFallback>{traveller.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{traveller.name}, {traveller.age}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {traveller.location}
                        </p>
                        <div className="flex gap-1 mt-2">
                          {traveller.badges.map((badge, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{badge}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{traveller.bio}</p>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Travel Style: {traveller.travelStyle}</p>
                      <div className="flex flex-wrap gap-1">
                        {traveller.interests.map((interest, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{interest}</Badge>
                        ))}
                      </div>
                    </div>

                    {traveller.currentEvent && (
                      <div className="bg-primary/10 rounded-lg p-3 mb-4">
                        <p className="text-sm font-medium text-primary">Currently at: {traveller.currentEvent}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button className="flex-1">Connect</Button>
                      <Button variant="outline" size="icon">
                        <Camera className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <Card key={event.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-2">{event.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {event.date}
                        </p>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.attendees}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {event.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                    
                    <Button className="w-full">See Who's Going</Button>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="live-updates" className="space-y-6">
              {/* Header with refresh */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Live Festival Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time posts from Instagram, TikTok, and Twitter
                    {lastUpdated && (
                      <span className="ml-2">• Last updated: {lastUpdated.toLocaleTimeString()}</span>
                    )}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshFeed}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Error state */}
              {error && (
                <Card className="p-4 bg-destructive/10 border-destructive/20">
                  <p className="text-sm text-destructive">Error loading feed: {error}</p>
                </Card>
              )}

              {/* Loading state */}
              {isLoading && posts.length === 0 && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
                          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Posts feed */}
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card 
                    key={post.id} 
                    className="p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    onClick={() => post.originalUrl && window.open(post.originalUrl, '_blank')}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="text-xs">
                          {post.platform === 'instagram' && '📸'}
                          {post.platform === 'tiktok' && '🎵'}
                          {post.platform === 'twitter' && '🐦'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-medium">@{post.user}</span>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              post.platform === 'instagram' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' :
                              post.platform === 'tiktok' ? 'bg-black text-white dark:bg-white dark:text-black' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}
                          >
                            {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{post.timestamp}</span>
                          {post.originalUrl && (
                            <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors ml-auto" />
                          )}
                        </div>
                        
                        <p className="text-sm mb-3 leading-relaxed">{post.content}</p>
                        
                        {post.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                            <Globe className="w-3 h-3" />
                            {post.location}
                          </p>
                        )}

                        {/* Hashtags */}
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {post.hashtags.slice(0, 3).map((hashtag, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                              >
                                {hashtag}
                              </span>
                            ))}
                            {post.hashtags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{post.hashtags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Media indicator */}
                        {post.media && (
                          <div className="flex items-center gap-1 mb-3">
                            {post.media.type === 'video' ? (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Play className="w-3 h-3" />
                                <span>Video Content</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Camera className="w-3 h-3" />
                                <span>Photo Content</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Engagement metrics */}
                        {post.engagement && (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {post.engagement.likes && (
                              <div className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {post.engagement.likes.toLocaleString()}
                              </div>
                            )}
                            {post.engagement.comments && (
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                {post.engagement.comments.toLocaleString()}
                              </div>
                            )}
                            {post.engagement.shares && (
                              <div className="flex items-center gap-1">
                                <Share className="w-3 h-3" />
                                {post.engagement.shares.toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              {/* Footer */}
              {posts.length > 0 && (
                <div className="text-center pt-6">
                  <p className="text-muted-foreground mb-4">
                    Showing {posts.length} recent posts • Updates every 2 minutes
                  </p>
                  <Button variant="outline" onClick={refreshFeed} disabled={isLoading}>
                    {isLoading ? 'Refreshing...' : 'Refresh Feed'}
                  </Button>
                </div>
              )}

              {posts.length === 0 && !isLoading && !error && (
                <div className="text-center py-12">
                  <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No posts found. Try refreshing the feed.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}