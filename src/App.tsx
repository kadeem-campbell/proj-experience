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
import Creators from "./pages/Creators";
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
import Experiences from "./pages/Experiences";
import Trip from "./pages/Trip";
import Profile from "./pages/Profile";
import MyItineraries from "./pages/MyItineraries";
import Liked from "./pages/Liked";
import Collection from "./pages/Collection";
import ExperienceCollection from "./pages/ExperienceCollection";
import NotFound from "./pages/NotFound";
import HostProfile from "./pages/HostProfile";
import ThingsToDo from "./pages/ThingsToDo";
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

          {/* ======= NEW ENTITY ROUTES ======= */}
          {/* Things to do hub */}
          <Route path="/things-to-do" element={<ThingsToDo />} />
          <Route path="/things-to-do/:destination" element={<ThingsToDo />} />
          <Route path="/things-to-do/:destination/:area" element={<ThingsToDo />} />
          <Route path="/things-to-do/:destination/:area/:slug" element={<ExperienceDetail />} />

          {/* Destination pages */}
          <Route path="/zanzibar" element={<DestinationPage />} />
          <Route path="/dar-es-salaam" element={<DestinationPage />} />
          <Route path="/nairobi" element={<DestinationPage />} />
          {/* Dynamic destination catch (after explicit ones) */}

          {/* Destination + area */}
          <Route path="/zanzibar/:area" element={<DestinationPage />} />
          <Route path="/dar-es-salaam/:area" element={<DestinationPage />} />

          {/* Destination map */}
          <Route path="/explore/map" element={<Map />} />

          {/* ======= LEGACY ROUTES (preserved) ======= */}
          {/* Single experience - slug-based */}
          <Route path="/experiences/:slug" element={<ExperienceDetail />} />
          {/* Location-prefixed slug support */}
          <Route path="/experiences/:location/:legacySlug" element={<ExperienceDetail />} />
          {/* Legacy URL support */}
          <Route path="/experience/:location/:legacySlug" element={<ExperienceDetail />} />
          <Route path="/experience/:id" element={<ExperienceDetail />} />
          {/* Host/Creator profiles */}
          <Route path="/hosts/:username" element={<HostProfile />} />
          <Route path="/creators/:username" element={<HostProfile />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/hosts" element={<Hosts />} />
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
          {/* Single itinerary - slug-based */}
          <Route path="/itineraries/:slug" element={<PublicItinerary />} />
          {/* Legacy */}
          <Route path="/public-itinerary/:id" element={<PublicItinerary />} />
          <Route path="/itineraries" element={<Itineraries />} />
          {/* Collection pages */}
          <Route path="/itinerary-collections/:slug" element={<Collection />} />
          {/* Legacy collection support */}
          <Route path="/collections/:slug" element={<Collection />} />
          {/* Experience collection pages */}
          <Route path="/experience-collections/:slug" element={<ExperienceCollection />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/trip/:id" element={<Trip />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-itineraries" element={<MyItineraries />} />
          <Route path="/liked" element={<Liked />} />
          <Route path="/saved" element={<Liked />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
