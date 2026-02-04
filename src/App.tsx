import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import Search from "./pages/Search";
import ExperienceDetail from "./pages/ExperienceDetail";
import CreateExperience from "./pages/CreateExperience";
import Creators from "./pages/Creators";

import Monetise from "./pages/Monetise";
import Map from "./pages/Map";
import Travellers from "./pages/Travellers";
import About from "./pages/About";
import Auth from "./pages/Auth";
import AdminPanel from "./pages/AdminPanel";
import ManagementDashboard from "./pages/ManagementDashboard";
import SocialFinder from "./pages/SocialFinder";
import PublicItinerary from "./pages/PublicItinerary";
import Itineraries from "./pages/Itineraries";
import Experiences from "./pages/Experiences";
import Trip from "./pages/Trip";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/experience/:id" element={<ExperienceDetail />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/create-experience" element={<CreateExperience />} />
          <Route path="/itinerary" element={<Trip useActiveItinerary={true} />} />
          <Route path="/itinerary/:id" element={<Trip />} />
          <Route path="/monetise" element={<Monetise />} />
          <Route path="/map" element={<Map />} />
          <Route path="/travellers" element={<Travellers />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/management" element={<ManagementDashboard />} />
          <Route path="/search" element={<Search />} />
          <Route path="/discover" element={<Search />} />
          <Route path="/social-finder" element={<SocialFinder />} />
          <Route path="/public-itinerary/:id" element={<PublicItinerary />} />
          <Route path="/itineraries" element={<Itineraries />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/trip/:id" element={<Trip />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
