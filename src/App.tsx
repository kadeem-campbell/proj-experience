import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ScrollToTop } from "@/components/ScrollToTop";
import { RedirectHandler } from "@/components/RedirectHandler";
import Search from "./pages/Search";
import ExperienceDetail from "./pages/ExperienceDetail";
import CreateExperience from "./pages/CreateExperience";
import Hosts from "./pages/Hosts";
import Monetise from "./pages/Monetise";
import Map from "./pages/Map";
import About from "./pages/About";
import Auth from "./pages/Auth";
import AdminPanel from "./pages/AdminPanel";
import ManagementDashboard from "./pages/ManagementDashboard";
import PublicItinerary from "./pages/PublicItinerary";
import Itineraries from "./pages/Itineraries";
import ThingsToDo from "./pages/ThingsToDo";
import Trip from "./pages/Trip";
import Profile from "./pages/Profile";
import MyItineraries from "./pages/MyItineraries";
import Liked from "./pages/Liked";
import Collection from "./pages/Collection";
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
          <RedirectHandler />
          <Routes>
            {/* ═══════════════════════════════════════════════════
                PUBLIC ROUTE ARCHITECTURE — FINAL LAUNCH SET
                One canonical family per object type. No legacy.
            ═══════════════════════════════════════════════════ */}

            {/* Home */}
            <Route path="/" element={<Search />} />

            {/* Things to do — canonical product/activity routes */}
            <Route path="/things-to-do" element={<ThingsToDo />} />
            <Route path="/things-to-do/:destination/:area/:slug" element={<ExperienceDetail />} />
            <Route path="/things-to-do/:destination/:slug" element={<ExperienceDetail />} />
            <Route path="/things-to-do/:destination" element={<ThingsToDo />} />

            {/* Map — single canonical pattern */}
            <Route path="/:destination/map" element={<Map />} />

            {/* Hosts — single canonical family */}
            <Route path="/hosts/:username" element={<HostProfile />} />
            <Route path="/hosts" element={<Hosts />} />

            {/* Itineraries — single canonical family (public + private) */}
            <Route path="/itineraries/:slug" element={<PublicItinerary />} />

            {/* Collections — single canonical family (subtype in data, not path) */}
            <Route path="/collections/:slug" element={<Collection />} />

            {/* About */}
            <Route path="/about" element={<About />} />

            {/* ═══════════════════════════════════════════════════
                INTERNAL / AUTHENTICATED — noindex, disallowed in robots
            ═══════════════════════════════════════════════════ */}
            <Route path="/my-trips/:id" element={<Trip />} />
            <Route path="/my-trips" element={<Trip useActiveItinerary={true} />} />
            <Route path="/create-experience" element={<CreateExperience />} />
            <Route path="/monetise" element={<Monetise />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/management" element={<ManagementDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-itineraries" element={<MyItineraries />} />
            <Route path="/liked" element={<Liked />} />
            <Route path="/search" element={<Search />} />

            {/* Destination hierarchy — public */}
            <Route path="/:destination/:area" element={<DestinationPage />} />
            <Route path="/:destination" element={<DestinationPage />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
