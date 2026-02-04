import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Plus, MapPin, Sparkles } from "lucide-react";
import { useItineraries } from "@/hooks/useItineraries";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type OnboardingStep = "name" | "sidebar-animation" | "add-experiences" | "complete";

const ONBOARDING_KEY = "hasCompletedOnboarding";
const FIRST_EXPERIENCE_KEY = "hasAddedFirstExperience";

export const OnboardingFlow = ({ open, onOpenChange }: OnboardingFlowProps) => {
  const [step, setStep] = useState<OnboardingStep>("name");
  const [itineraryName, setItineraryName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { createItinerary } = useItineraries();

  // Reset when opened
  useEffect(() => {
    if (open) {
      setStep("name");
      setItineraryName("");
    }
  }, [open]);

  const handleCreateItinerary = async () => {
    if (!itineraryName.trim()) return;
    
    setIsLoading(true);
    try {
      await createItinerary(itineraryName.trim());
      setStep("sidebar-animation");
      
      // After animation, show the add experiences hint
      setTimeout(() => {
        setStep("add-experiences");
      }, 2000);
    } catch (error) {
      console.error("Error creating itinerary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onOpenChange(false);
  };

  return (
    <>
      {/* Step 1: Name your itinerary */}
      <Dialog open={open && step === "name"} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden border-border/50 shadow-2xl">
          <div className="p-6 pt-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            
            <DialogHeader className="text-center space-y-2 mb-6">
              <DialogTitle className="text-2xl font-bold">
                Name your itinerary
              </DialogTitle>
              <p className="text-muted-foreground text-sm">
                Give your adventure a memorable name
              </p>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                placeholder="e.g., Zanzibar Beach Week"
                value={itineraryName}
                onChange={(e) => setItineraryName(e.target.value)}
                className="h-12 rounded-xl text-base px-4"
                onKeyDown={(e) => e.key === "Enter" && handleCreateItinerary()}
                autoFocus
              />

              <Button
                className="w-full h-12 rounded-xl text-base font-medium gap-2"
                onClick={handleCreateItinerary}
                disabled={!itineraryName.trim() || isLoading}
              >
                Create Itinerary
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Step 2: Animated circle to sidebar */}
      <AnimatePresence>
        {open && step === "sidebar-animation" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            {/* Flying circle animation */}
            <motion.div
              initial={{ 
                x: 0, 
                y: 0, 
                scale: 1,
                opacity: 1 
              }}
              animate={{ 
                x: typeof window !== 'undefined' ? -window.innerWidth / 2 + 60 : -200,
                y: typeof window !== 'undefined' ? -window.innerHeight / 2 + 150 : -200,
                scale: 0.3,
                opacity: 0.8
              }}
              transition={{ 
                duration: 1.5, 
                ease: [0.32, 0.72, 0, 1]
              }}
              className="relative z-10"
            >
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <MapPin className="w-10 h-10 text-primary-foreground" />
              </div>
            </motion.div>

            {/* Text hint */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-1/3 text-center"
            >
              <p className="text-xl font-semibold text-foreground">
                Your itinerary is here! 👈
              </p>
              <p className="text-muted-foreground mt-1">
                Find all your itineraries in the sidebar
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Step 3: Add experiences hint */}
      <Dialog open={open && step === "add-experiences"} onOpenChange={(val) => {
        if (!val) handleComplete();
      }}>
        <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden border-border/50 shadow-2xl">
          <div className="p-6 pt-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success to-success/60 flex items-center justify-center">
                <Plus className="w-8 h-8 text-success-foreground" />
              </div>
            </div>
            
            <DialogHeader className="text-center space-y-2 mb-6">
              <DialogTitle className="text-2xl font-bold">
                Add experiences
              </DialogTitle>
              <p className="text-muted-foreground text-sm">
                Browse experiences and tap the <Plus className="w-4 h-4 inline-block mx-1" /> button to add them to your itinerary
              </p>
            </DialogHeader>

            <div className="bg-muted/50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Pro tip</p>
                  <p className="text-xs text-muted-foreground">
                    After adding experiences, you can create a trip schedule!
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="w-full h-12 rounded-xl text-base font-medium gap-2"
              onClick={handleComplete}
            >
              Start Exploring
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Hook to check if first experience was added and show trip creation hint
export const useFirstExperienceHint = () => {
  const [showTripHint, setShowTripHint] = useState(false);

  const checkAndShowHint = () => {
    const hasAddedFirst = localStorage.getItem(FIRST_EXPERIENCE_KEY);
    if (!hasAddedFirst) {
      localStorage.setItem(FIRST_EXPERIENCE_KEY, "true");
      setShowTripHint(true);
    }
  };

  const dismissHint = () => {
    setShowTripHint(false);
  };

  return { showTripHint, checkAndShowHint, dismissHint };
};

// Component to show after first experience is added
export const TripCreationHint = ({ 
  show, 
  onDismiss 
}: { 
  show: boolean; 
  onDismiss: () => void;
}) => {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-xl p-4 shadow-lg max-w-sm mx-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Experience added! 🎉</p>
          <p className="text-xs text-muted-foreground mt-1">
            Ready to turn this into a trip? Go to your itinerary and tap "Make it a Trip"
          </p>
          <Button 
            size="sm" 
            variant="ghost" 
            className="mt-2 h-7 text-xs"
            onClick={onDismiss}
          >
            Got it
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
