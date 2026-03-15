import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ScrollToTop } from "@/components/ScrollToTop";
import Search from "./pages/Search";
import ExperienceDetail from "./pages/ExperienceDetail";
import CreateExperience from "./pages/CreateExperience";
import Hosts from "./pages/Hosts";

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
import ThingsToDo from "./pages/ThingsToDo";
import Trip from "./pages/Trip";
import Profile from "./pages/Profile";
import MyItineraries from "./pages/MyItineraries";
import Liked from "./pages/Liked";
import Collection from "./pages/Collection";
import ExperienceCollection from "./pages/ExperienceCollection";
import NotFound from "./pages/NotFound";
import HostProfile from "./pages/HostProfile";
import DestinationPage from "./pages/DestinationPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Search />} />

          {/* ======= THINGS TO DO ======= */}
          <Route path="/things-to-do" element={<ThingsToDo />} />
          <Route path="/things-to-do/:destination" element={<ThingsToDo />} />
          <Route path="/things-to-do/:destination/:area" element={<ThingsToDo />} />
          <Route path="/things-to-do/:destination/:area/:slug" element={<ExperienceDetail />} />
          <Route path="/things-to-do/:destination/:slug" element={<ExperienceDetail />} />

          {/* ======= DESTINATIONS ======= */}
          <Route path="/destination/:destination" element={<DestinationPage />} />
          <Route path="/destination/:destination/:area" element={<DestinationPage />} />

          {/* Well-known destination short URLs */}
          <Route path="/zanzibar" element={<DestinationPage />} />
          <Route path="/zanzibar/:area" element={<DestinationPage />} />
          <Route path="/dar-es-salaam" element={<DestinationPage />} />
          <Route path="/dar-es-salaam/:area" element={<DestinationPage />} />
          <Route path="/nairobi" element={<DestinationPage />} />
          <Route path="/mombasa" element={<DestinationPage />} />
          <Route path="/arusha" element={<DestinationPage />} />
          <Route path="/cape-town" element={<DestinationPage />} />
          <Route path="/lagos" element={<DestinationPage />} />
          <Route path="/kigali" element={<DestinationPage />} />
          <Route path="/kampala" element={<DestinationPage />} />
          <Route path="/accra" element={<DestinationPage />} />
          <Route path="/cairo" element={<DestinationPage />} />
          <Route path="/stone-town" element={<DestinationPage />} />
          <Route path="/diani" element={<DestinationPage />} />

          {/* ======= MAP ======= */}
          <Route path="/explore/map" element={<Map />} />
          <Route path="/:destination/map" element={<Map />} />

          {/* ======= HOSTS ======= */}
          <Route path="/hosts/:username" element={<HostProfile />} />
          <Route path="/hosts" element={<Hosts />} />

          {/* ======= ITINERARIES ======= */}
          <Route path="/itineraries/:slug" element={<PublicItinerary />} />
          <Route path="/itineraries" element={<Itineraries />} />
          <Route path="/itinerary" element={<Trip useActiveItinerary={true} />} />
          <Route path="/itinerary/:id" element={<Trip />} />

          {/* ======= COLLECTIONS ======= */}
          <Route path="/collections/:slug" element={<Collection />} />
          <Route path="/experience-collections/:slug" element={<ExperienceCollection />} />
          <Route path="/itinerary-collections/:slug" element={<Collection />} />

          {/* ======= OTHER ======= */}
          <Route path="/create-experience" element={<CreateExperience />} />
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
          <Route path="/trip/:id" element={<Trip />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-itineraries" element={<MyItineraries />} />
          <Route path="/liked" element={<Liked />} />
          <Route path="/saved" element={<Liked />} />

          {/* CATCH-ALL */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
