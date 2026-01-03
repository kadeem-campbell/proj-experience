import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Star, Users, TrendingUp, UserPlus } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const Creators = () => {
  const { isAuthenticated, isCreator, userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Become a <span className="gradient-primary bg-clip-text text-transparent">Creator</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Share your amazing experiences with travelers around the world. 
              Earn money doing what you love.
            </p>
            
            {/* Action Buttons */}
            {/* Action Button */}
            <Link to="/create-experience">
              <Button size="lg" className="text-lg px-8 py-3">
                <Plus className="w-5 h-5 mr-2" />
                Create an Experience
              </Button>
            </Link>
            {!isAuthenticated && (
              <p className="text-sm text-muted-foreground mt-2">
                You'll be asked to sign up during the creation process
              </p>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 text-center border-0 bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">500+</h3>
              <p className="text-muted-foreground">Active Creators</p>
            </Card>
            
            <Card className="p-6 text-center border-0 bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">10K+</h3>
              <p className="text-muted-foreground">Happy Travelers</p>
            </Card>
            
            <Card className="p-6 text-center border-0 bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">$2M+</h3>
              <p className="text-muted-foreground">Creator Earnings</p>
            </Card>
          </div>

          {/* Benefits Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Why Create with SWAM?</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Flexible Earnings</h3>
                    <p className="text-muted-foreground">Set your own prices and availability. Earn up to 80% of booking fees.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Global Reach</h3>
                    <p className="text-muted-foreground">Connect with travelers from around the world through our platform.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Easy Management</h3>
                    <p className="text-muted-foreground">Simple tools to manage bookings, payments, and customer communication.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Marketing Support</h3>
                    <p className="text-muted-foreground">We help promote your experiences to the right audience.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Start?</h3>
              <p className="text-muted-foreground mb-6">
                Join hundreds of creators who are sharing their passion and earning money with SWAM.
              </p>
              
              <Link to="/create-experience">
                <Button size="lg" className="w-full">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your Experience Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Creators;