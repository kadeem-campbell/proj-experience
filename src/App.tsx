import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ExperienceDetail from "./pages/ExperienceDetail";
import CreateExperience from "./pages/CreateExperience";
import Creators from "./pages/Creators";
import Itinerary from "./pages/Itinerary";
import Monetise from "./pages/Monetise";
import Map from "./pages/Map";
import Travellers from "./pages/Travellers";
import About from "./pages/About";
import Auth from "./pages/Auth";
import AdminPanel from "./pages/AdminPanel";
import ManagementDashboard from "./pages/ManagementDashboard";
import Search from "./pages/Search";
import SocialFinder from "./pages/SocialFinder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/experience/:id" element={<ExperienceDetail />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/create-experience" element={<CreateExperience />} />
          <Route path="/itinerary" element={<Itinerary />} />
          <Route path="/itinerary/:id" element={<Itinerary />} />
          <Route path="/monetise" element={<Monetise />} />
          <Route path="/map" element={<Map />} />
          <Route path="/travellers" element={<Travellers />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/management" element={<ManagementDashboard />} />
          <Route path="/search" element={<Search />} />
          <Route path="/social-finder" element={<SocialFinder />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
