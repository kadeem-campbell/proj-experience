import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Users, TrendingUp, Globe, Star, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Monetise() {
  const benefits = [
    {
      icon: DollarSign,
      title: "Earn Commission",
      description: "Get paid for every booking through your custom itinerary"
    },
    {
      icon: Users,
      title: "Build Your Community",
      description: "Create curated travel experiences for your followers"
    },
    {
      icon: TrendingUp,
      title: "Track Performance",
      description: "Monitor your earnings and booking analytics"
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Share your local knowledge with travelers worldwide"
    }
  ];

  const features = [
    "Custom itinerary builder",
    "Commission tracking dashboard",
    "Automated booking management", 
    "Marketing tools and analytics",
    "Payment processing",
    "24/7 customer support"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navigation />
      
      <div className="pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="secondary">
              Coming Soon
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-primary bg-clip-text text-transparent">
              Monetise Your Travel Knowledge
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Turn your local expertise into income by creating custom itineraries. 
              Earn commission from every experience booked through your recommendations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" disabled className="bg-muted text-muted-foreground cursor-not-allowed">
                Join Waitlist
              </Button>
              <Link to="/itinerary">
                <Button variant="outline" size="lg">
                  View Sample Itinerary
                </Button>
              </Link>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 text-center">
                <benefit.icon className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </Card>
            ))}
          </div>

          {/* How It Works */}
          <Card className="p-8 mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-foreground font-bold text-xl">1</span>
                </div>
                <h3 className="font-semibold mb-2">Create Your Itinerary</h3>
                <p className="text-muted-foreground">Build custom travel plans using our curated experiences</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-foreground font-bold text-xl">2</span>
                </div>
                <h3 className="font-semibold mb-2">Share & Promote</h3>
                <p className="text-muted-foreground">Share your itinerary with travelers and on social media</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-foreground font-bold text-xl">3</span>
                </div>
                <h3 className="font-semibold mb-2">Earn Commission</h3>
                <p className="text-muted-foreground">Get paid for every experience booked through your link</p>
              </div>
            </div>
          </Card>

          {/* Features List */}
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-6">What You'll Get</h2>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-8">
              <h3 className="text-xl font-semibold mb-4">Commission Structure</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Standard Experiences</span>
                  <span className="font-semibold">10-15%</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Premium Experiences</span>
                  <span className="font-semibold">15-20%</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Exclusive Experiences</span>
                  <span className="font-semibold">20-25%</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                * Commission rates may vary based on experience type and volume
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <Card className="p-8 text-center bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <Star className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of local experts already earning through our platform. 
              Be among the first to access our monetization tools when they launch.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" disabled className="bg-muted text-muted-foreground cursor-not-allowed">
                Coming Soon - Join Waitlist
              </Button>
              <Link to="/hosts">
                <Button variant="outline" size="lg">
                  Become a Host Instead
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}