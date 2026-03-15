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

            {/* Things to do hierarchy */}
            <Route path="/things-to-do" element={<ThingsToDo />} />
            <Route path="/things-to-do/:destination/:area/:activityType" element={<ThingsToDo />} />
            <Route path="/things-to-do/:destination/:slug" element={<ExperienceDetail />} />
            <Route path="/things-to-do/:destination" element={<ThingsToDo />} />

            {/* Map */}
            <Route path="/explore/map" element={<Map />} />
            <Route path="/:destination/map" element={<Map />} />

            {/* Hosts */}
            <Route path="/hosts/:username" element={<HostProfile />} />
            <Route path="/hosts" element={<Hosts />} />

            {/* Itineraries */}
            <Route path="/itineraries/:slug" element={<PublicItinerary />} />
            <Route path="/itineraries" element={<Itineraries />} />
            <Route path="/itinerary" element={<Trip useActiveItinerary={true} />} />
            <Route path="/itinerary/:id" element={<Trip />} />

            {/* Collections */}
            <Route path="/collections/experiences/:slug" element={<ExperienceCollection />} />
            <Route path="/collections/itineraries/:slug" element={<Collection />} />
            <Route path="/collections/:slug" element={<Collection />} />

            {/* Travelers (noindex) */}
            <Route path="/travelers/:id" element={<Travellers />} />
            <Route path="/travellers" element={<Travellers />} />

            {/* Legacy experience URLs */}
            <Route path="/experiences/:slug" element={<ExperienceDetail />} />

            <Route path="/create-experience" element={<CreateExperience />} />
            <Route path="/monetise" element={<Monetise />} />
            <Route path="/map" element={<Map />} />
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

            {/* Destination hierarchy: /{destination} and /{destination}/{area} */}
            <Route path="/:destination/:area" element={<DestinationPage />} />
            <Route path="/:destination" element={<DestinationPage />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
