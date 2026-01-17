import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Briefcase, Plane, Heart, Users, Globe, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <MainLayout showItineraryPanel={false}>
      <div className="p-6 max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 gradient-primary bg-clip-text text-transparent">
              About Our Journey
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Born from a backpacking adventure across Africa, we're revolutionizing how travelers discover authentic experiences.
            </p>
          </div>

          {/* Founder Story */}
          <Card className="p-8 mb-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold mb-4">The Story Behind the Platform</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Hi, I'm Kadeem, and this platform was born from personal frustration during my first backpacking adventure across Africa. 
                    In 2019, I found myself in Tanzania for 6 months, completely mesmerized by the country's beauty, culture, and incredible people.
                  </p>
                  <p>
                    But there was one major problem: <strong className="text-foreground">finding authentic, local experiences was nearly impossible</strong>. 
                    Traditional booking platforms were dominated by expensive, commercialized tours that missed the real essence of traveling. 
                    The best experiences I had were discovered by pure chance - through conversations with locals, hidden gems shared by fellow travelers, 
                    or stumbling upon events that weren't advertised anywhere online.
                  </p>
                  <p>
                    After spending years in the tech industry working with innovative companies, I realized we could solve this problem. 
                    Travelers shouldn't have to rely on luck to find amazing experiences. Local creators and hosts shouldn't struggle to reach 
                    adventurous travelers looking for authentic connections.
                  </p>
                  <p className="text-foreground font-medium">
                    That's why we built this platform - to bridge the gap between curious travelers and passionate local creators, 
                    making authentic travel experiences accessible to everyone.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">K</span>
                  </div>
                  <h3 className="font-semibold text-lg">Kadeem</h3>
                  <p className="text-sm text-muted-foreground">Founder & CEO</p>
                  <div className="flex justify-center mt-2">
                    <Badge variant="secondary" className="text-xs">Tech Industry Veteran</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Connect with me:</h4>
                  <a 
                    href="https://linkedin.com/in/kadeem-" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    LinkedIn Profile
                  </a>
                </div>
              </div>
            </div>
          </Card>

          {/* Journey Timeline */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">The Journey</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Tech Industry Experience</h3>
                  <p className="text-muted-foreground">
                    Years of working in the technology sector, understanding how digital platforms can solve real-world problems 
                    and connect communities globally.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Plane className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">First Backpacking Adventure - Tanzania</h3>
                  <p className="text-muted-foreground">
                    6 months exploring Tanzania, discovering the challenge of finding authentic local experiences. 
                    The best memories came from unexpected encounters and local recommendations, not tourist guides.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">The Problem Becomes Clear</h3>
                  <p className="text-muted-foreground">
                    Realizing that incredible experiences exist everywhere, but travelers and local creators struggle to find each other. 
                    Traditional platforms focus on mass tourism, missing the magic of authentic connections.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Building the Solution</h3>
                  <p className="text-muted-foreground">
                    Combining tech expertise with travel passion to create a platform where authentic experiences are discoverable, 
                    local creators are empowered, and travelers can connect with real culture.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Heart className="w-6 h-6 text-primary" />
                Our Mission
              </h3>
              <p className="text-muted-foreground">
                To make authentic travel experiences accessible to everyone by connecting adventurous travelers 
                with passionate local creators who know the real stories behind each destination.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Our Vision
              </h3>
              <p className="text-muted-foreground">
                A world where every traveler can discover hidden gems and authentic experiences, 
                while local creators are empowered to share their passion and culture with the global community.
              </p>
            </Card>
          </div>

          {/* Values */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6">What We Stand For</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Authentic Experiences</h3>
                <p className="text-sm text-muted-foreground">
                  Real connections with local culture, not commercialized tourist traps.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Community First</h3>
                <p className="text-sm text-muted-foreground">
                  Supporting local creators and building genuine connections between travelers.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Accessible Adventure</h3>
                <p className="text-sm text-muted-foreground">
                  Making amazing experiences discoverable and accessible to all travelers.
                </p>
              </div>
            </div>
          </Card>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <h2 className="text-2xl font-bold mb-4">Ready to Join Our Community?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Whether you're a traveler seeking authentic experiences or a local creator ready to share your passion, 
              we'd love to have you as part of our growing community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <Button size="lg">Explore Experiences</Button>
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
  );
}