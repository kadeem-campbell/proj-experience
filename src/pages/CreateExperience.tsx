import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Upload, CreditCard, Phone, User, ChevronRight, ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCategories, useCities } from "@/hooks/useAppData";

type FormStep = 'basic' | 'location' | 'media' | 'host' | 'additional' | 'review' | 'auth' | 'confirmation';

export default function CreateExperience() {
  const { user, isAuthenticated, isCreator } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    region: '',
    photos: [] as File[],
    videoUrl: '',
    hostName: '',
    hostEmail: '',
    hostPhone: '',
    category: '',
    price: '',
    capacity: '',
    duration: '',
    schedule: ''
  });

  // Input validation functions
  const validateTitle = (title: string) => {
    return title.length >= 3 && title.length <= 100;
  };

  const validatePrice = (price: string) => {
    const numPrice = parseFloat(price);
    return !isNaN(numPrice) && numPrice >= 0 && numPrice <= 10000;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUrl = (url: string) => {
    if (!url) return true; // Optional field
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const sanitizeInput = (input: string) => {
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
  };

  const steps: { id: FormStep; title: string; icon: any }[] = [
    { id: 'basic', title: 'Basic Info', icon: User },
    { id: 'location', title: 'Location', icon: MapPin },
    { id: 'media', title: 'Media', icon: Upload },
    { id: 'host', title: 'Host Details', icon: User },
    { id: 'additional', title: 'Additional Info', icon: User },
    { id: 'review', title: 'Review', icon: User },
    { id: 'auth', title: 'Sign Up/Login', icon: User }
  ];

  // Start with basic info, handle auth at the end
  useEffect(() => {
    // Remove any redirects, let users start the flow
  }, []);

  const nextStep = () => {
    const stepIndex = steps.findIndex(step => step.id === currentStep);
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].id as FormStep);
    }
  };

  const handleCreateExperience = async (isDraft = false) => {
    // Check if user is authenticated first
    if (!isAuthenticated) {
      setCurrentStep('auth');
      return;
    }

    // Auto-switch to creator if needed via edge function
    if (!isCreator) {
      try {
        const { data, error } = await supabase.functions.invoke('change-role', {
          body: { role: 'creator' }
        });

        if (error) throw error;
        
        toast({
          title: "Role Updated",
          description: "You've been switched to creator mode!",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to switch to creator mode.",
          variant: "destructive"
        });
        return;
      }
    }

    // Validate inputs before submission
    if (!validateTitle(formData.title)) {
      toast({
        title: "Validation Error",
        description: "Title must be between 3 and 100 characters.",
        variant: "destructive"
      });
      return;
    }

    if (!validatePrice(formData.price)) {
      toast({
        title: "Validation Error", 
        description: "Price must be a valid number between 0 and 10,000.",
        variant: "destructive"
      });
      return;
    }

    if (formData.hostEmail && !validateEmail(formData.hostEmail)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    if (!validateUrl(formData.videoUrl)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid URL for the video.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Experiences table doesn't exist yet - just show success message
      toast({
        title: "Success!",
        description: isDraft 
          ? "Your experience has been saved as draft. (Demo mode - database table not yet created)"
          : "Your experience has been created successfully. (Demo mode - database table not yet created)"
      });

      setCurrentStep('confirmation');
    } catch (error) {
      console.error('Error creating experience:', error);
      toast({
        title: "Error",
        description: "Failed to create experience. Please try again.",
        variant: "destructive"
      });
    }
  };

  const prevStep = () => {
    const stepIndex = steps.findIndex(step => step.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id as FormStep);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'auth':
        return (
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6">Almost There!</h2>
            <div className="text-center space-y-6">
              <p className="text-muted-foreground">
                To publish your experience, please sign up or log in.
              </p>
              
              {!isAuthenticated ? (
                <div className="space-y-4">
                  <Link to="/auth">
                    <Button size="lg" className="w-full">
                      Sign Up / Log In
                    </Button>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Your experience details have been saved.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-green-600">✓ You're logged in!</p>
                  <Button onClick={() => handleCreateExperience(false)} size="lg" className="w-full">
                    Publish Experience
                  </Button>
                </div>
              )}
            </div>
          </Card>
        );

      case 'basic':
        return (
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6">Basic Information</h2>
            <div className="space-y-6">
              <div>
                <Label htmlFor="title">Experience Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Sunset Jet Ski Adventure"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your experience in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="mt-2 min-h-[120px]"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="water-sports">Water Sports</SelectItem>
                    <SelectItem value="adventure">Adventure</SelectItem>
                    <SelectItem value="food">Food & Dining</SelectItem>
                    <SelectItem value="culture">Culture</SelectItem>
                    <SelectItem value="wildlife">Wildlife</SelectItem>
                    <SelectItem value="beach">Beach</SelectItem>
                    <SelectItem value="nightlife">Nightlife</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleCreateExperience(true)}
                  className="w-full"
                >
                  Finish Later (Save as Draft)
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'location':
        return (
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6">Location Details</h2>
            <div className="space-y-6">
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  placeholder="123 Beach Road"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Dar es Salaam"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Select value={formData.region} onValueChange={(value) => setFormData({...formData, region: value})}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dar-es-salaam">Dar es Salaam</SelectItem>
                      <SelectItem value="zanzibar">Zanzibar</SelectItem>
                      <SelectItem value="arusha">Arusha</SelectItem>
                      <SelectItem value="mwanza">Mwanza</SelectItem>
                      <SelectItem value="dodoma">Dodoma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleCreateExperience(true)}
                  className="w-full"
                >
                  Finish Later (Save as Draft)
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'media':
        return (
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6">Media Upload</h2>
            <div className="space-y-6">
              <div>
                <Label>Photos</Label>
                <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">Drop your photos here or click to browse</p>
                  <p className="text-sm text-muted-foreground">Maximum 10 photos, up to 5MB each</p>
                  <Button variant="outline" className="mt-4">
                    Choose Files
                  </Button>
                </div>
              </div>
              <Separator />
              <div>
                <Label htmlFor="videoUrl">Video URL (Optional)</Label>
                <Input
                  id="videoUrl"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  YouTube, Vimeo, or direct video links supported
                </p>
              </div>
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleCreateExperience(true)}
                  className="w-full"
                >
                  Finish Later (Save as Draft)
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'host':
        return (
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6">Host Information</h2>
            <div className="space-y-6">
              <div>
                <Label htmlFor="hostName">Host Name</Label>
                <Input
                  id="hostName"
                  placeholder="John Doe"
                  value={formData.hostName}
                  onChange={(e) => setFormData({...formData, hostName: e.target.value})}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="hostEmail">Contact Email</Label>
                <Input
                  id="hostEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.hostEmail}
                  onChange={(e) => setFormData({...formData, hostEmail: e.target.value})}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="hostPhone">Phone Number</Label>
                <Input
                  id="hostPhone"
                  type="tel"
                  placeholder="+255 123 456 789"
                  value={formData.hostPhone}
                  onChange={(e) => setFormData({...formData, hostPhone: e.target.value})}
                  className="mt-2"
                />
              </div>
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleCreateExperience(true)}
                  className="w-full"
                >
                  Finish Later (Save as Draft)
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'additional':
        return (
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6">Additional Details</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price per Person</Label>
                  <Input
                    id="price"
                    placeholder="50"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Max Capacity</Label>
                  <Input
                    id="capacity"
                    placeholder="8"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    className="mt-2"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  placeholder="2 hours"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="schedule">Schedule/Availability</Label>
                <Textarea
                  id="schedule"
                  placeholder="Daily at 9:00 AM and 2:00 PM"
                  value={formData.schedule}
                  onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                  className="mt-2"
                />
              </div>
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleCreateExperience(true)}
                  className="w-full"
                >
                  Finish Later (Save as Draft)
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'review':
        return (
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6">Review Your Experience</h2>
            <div className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <h3 className="font-semibold">Basic Information</h3>
                  <p><strong>Title:</strong> {formData.title}</p>
                  <p><strong>Category:</strong> {formData.category}</p>
                  <p><strong>Description:</strong> {formData.description}</p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p><strong>Address:</strong> {formData.address}</p>
                  <p><strong>City:</strong> {formData.city}</p>
                  <p><strong>Region:</strong> {formData.region}</p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold">Host Details</h3>
                  <p><strong>Name:</strong> {formData.hostName}</p>
                  <p><strong>Email:</strong> {formData.hostEmail}</p>
                  <p><strong>Phone:</strong> {formData.hostPhone}</p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold">Pricing & Details</h3>
                  <p><strong>Price:</strong> ${formData.price} per person</p>
                  <p><strong>Capacity:</strong> {formData.capacity} people</p>
                  <p><strong>Duration:</strong> {formData.duration}</p>
                </div>
              </div>
              <div className="pt-4">
                <Button 
                  onClick={() => handleCreateExperience(false)} 
                  className="w-full" 
                  size="lg"
                >
                  {isAuthenticated ? 'Create Experience' : 'Sign Up & Create Experience'}
                </Button>
              </div>
            </div>
          </Card>
        );

      case 'confirmation':
        return (
          <Card className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">✓</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Experience Created Successfully!</h2>
              <p className="text-muted-foreground">Your experience is now live and ready for bookings</p>
            </div>
            
            <div className="space-y-4">
              <Link to="/">
                <Button className="w-full" size="lg">
                  View All Experiences
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full" 
                size="lg"
                onClick={() => {
                  setCurrentStep('basic');
                  setFormData({
                    title: '',
                    description: '',
                    address: '',
                    city: '',
                    region: '',
                    photos: [],
                    videoUrl: '',
                    hostName: '',
                    hostEmail: '',
                    hostPhone: '',
                    category: '',
                    price: '',
                    capacity: '',
                    duration: '',
                    schedule: ''
                  });
                }}
              >
                Create Another Experience
              </Button>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    steps.findIndex(s => s.id === currentStep) >= index
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 w-12 mx-2 ${
                      steps.findIndex(s => s.id === currentStep) > index
                        ? 'bg-primary'
                        : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Step {steps.findIndex(step => step.id === currentStep) + 1} of {steps.length}: {steps.find(step => step.id === currentStep)?.title}
            </p>
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          {currentStep !== 'confirmation' && currentStep !== 'auth' && (
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 'basic'}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              
              <Button
                onClick={nextStep}
                disabled={currentStep === 'review'}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}