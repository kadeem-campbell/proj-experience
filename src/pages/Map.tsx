import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Filter, TrendingUp, Users, Calendar, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type Experience = {
  id: string;
  title: string;
  location: string;
  category: string;
  price: number;
  creator: string;
  description: string;
  duration_hours: number;
  max_participants: number;
};

// Tanzania coordinates for default locations
const locationCoords: Record<string, [number, number]> = {
  'Stone Town, Zanzibar': [39.2026, -6.1659],
  'Zanzibar': [39.2026, -6.1659],
  'Serengeti National Park': [34.8333, -2.3333],
  'Dar es Salaam': [39.2083, -6.7924],
  'Arusha': [36.6827, -3.3869],
  'Mwanza': [32.9000, -2.5164],
  'Dodoma': [35.7394, -6.1630],
  'Ngorongoro Crater': [35.5, -3.2],
  'Mount Kilimanjaro': [37.3556, -3.0674],
  // US locations for demo data
  'Miami Beach, FL': [-80.1300, 25.7907],
  'New Orleans, LA': [-90.0715, 29.9511],
  'Everglades, FL': [-80.9284, 25.2866],
  'Malibu, CA': [-118.7798, 34.0259],
  'Rocky Mountains, CO': [-105.7821, 39.5501],
  'Key West, FL': [-81.8001, 24.5557]
};

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDemoMap, setShowDemoMap] = useState(false);

  const categories = [
    { id: 'all', name: 'All Experiences' },
    { id: 'water-sports', name: 'Water Sports' },
    { id: 'adventure', name: 'Adventure' },
    { id: 'food', name: 'Food & Dining' },
    { id: 'culture', name: 'Culture' },
    { id: 'wildlife', name: 'Wildlife' },
    { id: 'beach', name: 'Beach' },
    { id: 'nightlife', name: 'Nightlife' },
    { id: 'party', name: 'Party' }
  ];

  const heatMapData = [
    { area: 'Zanzibar', intensity: 92, experiences: 89 },
    { area: 'Dar es Salaam', intensity: 85, experiences: 142 },
    { area: 'Serengeti', intensity: 78, experiences: 67 },
    { area: 'Arusha', intensity: 65, experiences: 34 },
    { area: 'Mwanza', intensity: 45, experiences: 23 }
  ];

  useEffect(() => {
    fetchExperiences();
    // Initialize map with public token for better display
    mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
    
    if (mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [35.0, -6.0], // Center on Tanzania
        zoom: 6,
        pitch: 45,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        addMapboxMarkers();
      });
    }
  }, []);

  const fetchExperiences = async () => {
    try {
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;
      setExperiences(data || []);
    } catch (error) {
      console.error('Error fetching experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = (accessToken?: string) => {
    if (!mapContainer.current) return;

    if (accessToken) {
      mapboxgl.accessToken = accessToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [35.0, -6.0], // Center on Tanzania
        zoom: 6,
        pitch: 45,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        addMapboxMarkers();
      });
    }
  };

  const addMapboxMarkers = () => {
    if (!map.current) return;

    const filteredExperiences = selectedCategory === 'all' 
      ? experiences 
      : experiences.filter(exp => exp.category.toLowerCase() === selectedCategory);

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    filteredExperiences.forEach((experience) => {
      const coords = locationCoords[experience.location] || [39.2026, -6.1659]; // Default to Zanzibar

      // Create custom marker element securely
      const markerEl = document.createElement('div');
      markerEl.className = 'experience-marker';
      
      const markerContainer = document.createElement('div');
      markerContainer.className = 'w-8 h-8 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform';
      
      const priceSpan = document.createElement('span');
      priceSpan.className = 'text-white text-xs font-bold';
      priceSpan.textContent = `$${Math.round(Math.max(0, Number(experience.price) || 0))}`;
      
      markerContainer.appendChild(priceSpan);
      markerEl.appendChild(markerContainer);

      markerEl.addEventListener('click', () => {
        setSelectedExperience(experience);
        map.current?.flyTo({
          center: coords,
          zoom: 12,
          essential: true
        });
      });

      new mapboxgl.Marker(markerEl)
        .setLngLat(coords)
        .addTo(map.current!);
    });
  };

  const addDemoMarkers = () => {
    if (!mapContainer.current) return;

    const filteredExperiences = selectedCategory === 'all' 
      ? experiences 
      : experiences.filter(exp => exp.category.toLowerCase() === selectedCategory);

    // Clear existing demo markers
    const existingMarkers = mapContainer.current.querySelectorAll('.demo-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Create a visual grid layout for experiences
    const containerRect = mapContainer.current.getBoundingClientRect();
    const cols = Math.ceil(Math.sqrt(filteredExperiences.length));
    const rows = Math.ceil(filteredExperiences.length / cols);
    
    filteredExperiences.forEach((experience, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const x = (containerRect.width / (cols + 1)) * (col + 1);
      const y = (containerRect.height / (rows + 1)) * (row + 1);

      const markerEl = document.createElement('div');
      markerEl.className = 'demo-marker absolute z-10 cursor-pointer hover:scale-110 transition-transform';
      markerEl.style.left = `${x - 20}px`;
      markerEl.style.top = `${y - 20}px`;
      
      const demoMarkerContainer = document.createElement('div');
      demoMarkerContainer.className = 'w-10 h-10 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center';
      
      const demoPriceSpan = document.createElement('span');
      demoPriceSpan.className = 'text-white text-xs font-bold';
      demoPriceSpan.textContent = `$${Math.round(Math.max(0, Number(experience.price) || 0))}`;
      
      demoMarkerContainer.appendChild(demoPriceSpan);
      markerEl.appendChild(demoMarkerContainer);

      markerEl.addEventListener('click', () => {
        setSelectedExperience(experience);
      });

      mapContainer.current?.appendChild(markerEl);
    });
  };

  useEffect(() => {
    if (showDemoMap && experiences.length > 0) {
      addDemoMarkers();
    } else if (map.current && experiences.length > 0) {
      addMapboxMarkers();
    }
  }, [selectedCategory, experiences, showDemoMap]);

  const filteredExperiences = experiences.filter(exp => {
    const matchesCategory = selectedCategory === 'all' || exp.category.toLowerCase() === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <MainLayout showItineraryPanel={false}>
      <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 gradient-primary bg-clip-text text-transparent">
              Experience Map
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Explore experiences around the world. Click on markers to see details.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 text-center">
              <MapPin className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-xl font-bold">{experiences.length}</div>
              <div className="text-sm text-muted-foreground">Total Experiences</div>
            </Card>
            <Card className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-xl font-bold">5</div>
              <div className="text-sm text-muted-foreground">Active Regions</div>
            </Card>
            <Card className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-xl font-bold">1.2k</div>
              <div className="text-sm text-muted-foreground">Active Travelers</div>
            </Card>
            <Card className="p-4 text-center">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-xl font-bold">89%</div>
              <div className="text-sm text-muted-foreground">Booking Rate</div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Interactive Map */}
            <div className="lg:col-span-3">
              <Card className="p-0 overflow-hidden">
                <div 
                  ref={mapContainer} 
                  className="h-[600px] w-full relative"
                />
                
                {/* Selected Experience Popup */}
                {selectedExperience && (
                  <div className="absolute top-4 left-4 right-4 z-10">
                    <Card className="p-4 animate-fade-in">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{selectedExperience.title}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {selectedExperience.location}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedExperience(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm mb-3">{selectedExperience.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{selectedExperience.category}</Badge>
                          <span className="text-lg font-bold text-primary">
                            ${selectedExperience.price}
                          </span>
                        </div>
                        <Link to={`/experience/${selectedExperience.id}`}>
                          <Button size="sm">View Details</Button>
                        </Link>
                      </div>
                    </Card>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Search */}
              <Card className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search experiences..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </Card>

              {/* Category Filter */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4" />
                  <h3 className="font-semibold">Categories</h3>
                </div>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const count = category.id === 'all' 
                      ? experiences.length 
                      : experiences.filter(exp => exp.category.toLowerCase() === category.id).length;
                    
                    return (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "ghost"}
                        className="w-full justify-between text-sm"
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <span>{category.name}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </Button>
                    );
                  })}
                </div>
              </Card>

              {/* Heat Map Data */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Regional Activity</h3>
                <div className="space-y-3">
                  {heatMapData.map((region, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{region.area}</span>
                        <span className="text-xs text-muted-foreground">
                          {region.experiences} experiences
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${region.intensity}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent Experiences */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Experiences</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredExperiences.slice(0, 8).map((experience) => (
                    <div 
                      key={experience.id} 
                      className="p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedExperience(experience);
                        if (map.current) {
                          const coords = locationCoords[experience.location] || [39.2026, -6.1659];
                          map.current.flyTo({
                            center: coords,
                            zoom: 12,
                            essential: true
                          });
                        }
                      }}
                    >
                      <div className="font-medium text-sm mb-1">
                        {experience.title}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {experience.location}
                      </div>
                      <div className="text-xs text-primary font-medium mt-1">
                        ${experience.price}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
        </div>
      </div>
    </MainLayout>
  );
}