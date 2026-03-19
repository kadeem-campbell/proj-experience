/**
 * Unified Admin Panel — central operating system for SWAM.
 * Replaces all legacy admin workflows with one integrated system.
 */
import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { AdminCarouselManager } from '@/components/AdminCarouselManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, Globe, Users, Layers, MapPin,
  Tag, Image, CheckCircle, Send, Link2, Upload, Code2,
  FileSpreadsheet, History, Settings, Route, Rss, Brain,
  Search, Plus, AlertTriangle, Database, ChevronLeft, ChevronRight,
  Menu, X, TrendingUp, SlidersHorizontal,
} from 'lucide-react';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { AdminProductsSection } from '@/components/admin/AdminProductsSection';
import { AdminLocationsSection } from '@/components/admin/AdminLocationsSection';
import { AdminHostsSection } from '@/components/admin/AdminHostsSection';
import { AdminCollectionsSection } from '@/components/admin/AdminCollectionsSection';
import { AdminItinerariesSection } from '@/components/admin/AdminItinerariesSection';
import { AdminTaxonomySection } from '@/components/admin/AdminTaxonomySection';
import { AdminMediaSection } from '@/components/admin/AdminMediaSection';
import { AdminValidationCenter, AdminSlugCenter } from '@/components/admin/AdminValidationCenter';
import { AdminBulkOps } from '@/components/admin/AdminBulkOps';
import { AdminJsonTools } from '@/components/admin/AdminJsonTools';
import { AdminLegacySection } from '@/components/admin/AdminLegacySection';
import { AdminRedirectsSection } from '@/components/admin/AdminRedirectsSection';
import { AdminQualitySection } from '@/components/admin/AdminQualitySection';
import { AdminQuestionsSection } from '@/components/admin/AdminQuestionsSection';
import { AdminNotificationsSection } from '@/components/admin/AdminNotificationsSection';
import { AdminGraphInspector } from '@/components/admin/AdminGraphInspector';
import { AdminGovernanceGates } from '@/components/admin/AdminGovernanceGates';
import { AdminFeedContracts } from '@/components/admin/AdminFeedContracts';
import { AdminSystemSection } from '@/components/admin/AdminSystemSection';
import { AdminPartnerExports } from '@/components/admin/AdminPartnerExports';
import { AdminSearchTrends } from '@/components/admin/AdminSearchTrends';
import { AdminReadinessScores } from '@/components/admin/AdminReadinessScores';
import { AdminIngestionCenter } from '@/components/admin/AdminIngestionCenter';
import { AdminWorldGraph } from '@/components/admin/AdminWorldGraph';

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'Main' },
  { id: 'products', label: 'Products', icon: Package, group: 'Content' },
  { id: 'locations', label: 'Locations', icon: Globe, group: 'Content' },
  { id: 'hosts', label: 'Hosts / Creators', icon: Users, group: 'Content' },
  { id: 'collections', label: 'Collections', icon: Layers, group: 'Content' },
  { id: 'carousels', label: 'Carousels', icon: SlidersHorizontal, group: 'Content' },
  { id: 'itineraries', label: 'Itineraries', icon: MapPin, group: 'Content' },
  { id: 'taxonomy', label: 'Taxonomy & Pricing', icon: Tag, group: 'Content' },
  { id: 'media', label: 'Media', icon: Image, group: 'Content' },
  { id: 'questions', label: 'Questions', icon: Send, group: 'Content' },
  { id: 'validation', label: 'Validation', icon: CheckCircle, group: 'Governance' },
  { id: 'quality', label: 'Quality Scores', icon: Brain, group: 'Governance' },
  { id: 'readiness', label: 'Readiness Dashboard', icon: TrendingUp, group: 'Governance' },
  { id: 'slugs', label: 'Slugs / Routes', icon: Link2, group: 'Governance' },
  { id: 'redirects', label: 'Redirects', icon: Route, group: 'Governance' },
  { id: 'graph', label: 'Graph Inspector', icon: Settings, group: 'Governance' },
  { id: 'governance', label: 'Deploy Gates', icon: AlertTriangle, group: 'Governance' },
  { id: 'feed_contracts', label: 'Feed Contracts', icon: Rss, group: 'Governance' },
  { id: 'notifications', label: 'Notifications', icon: Send, group: 'Governance' },
  { id: 'bulk', label: 'Bulk Operations', icon: Upload, group: 'Operations' },
  { id: 'json', label: 'JSON Tools', icon: Code2, group: 'Operations' },
  { id: 'ingestion', label: 'Ingestion Center', icon: FileSpreadsheet, group: 'Operations' },
  { id: 'partner_exports', label: 'Partner Exports', icon: Rss, group: 'Operations' },
  { id: 'search_trends', label: 'Search Trends', icon: Search, group: 'Operations' },
  { id: 'system', label: 'System Config', icon: Settings, group: 'System' },
  { id: 'world_graph', label: 'World Graph', icon: Globe, group: 'System' },
  { id: 'legacy', label: 'Legacy Data', icon: Database, group: 'System' },
];

const AdminPanel = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case 'overview': return <AdminOverview onNavigate={setActiveSection} />;
      case 'products': return <AdminProductsSection />;
      case 'locations': return <AdminLocationsSection />;
      case 'hosts': return <AdminHostsSection />;
      case 'collections': return <AdminCollectionsSection />;
      case 'carousels': return <AdminCarouselManager />;
      case 'itineraries': return <AdminItinerariesSection />;
      case 'taxonomy': return <AdminTaxonomySection />;
      case 'media': return <AdminMediaSection />;
      case 'questions': return <AdminQuestionsSection />;
      case 'validation': return <AdminValidationCenter />;
      case 'quality': return <AdminQualitySection />;
      case 'readiness': return <AdminReadinessScores />;
      case 'slugs': return <AdminSlugCenter />;
      case 'redirects': return <AdminRedirectsSection />;
      case 'graph': return <AdminGraphInspector />;
      case 'notifications': return <AdminNotificationsSection />;
      case 'governance': return <AdminGovernanceGates />;
      case 'feed_contracts': return <AdminFeedContracts />;
      case 'bulk': return <AdminBulkOps />;
      case 'json': return <AdminJsonTools />;
      case 'ingestion': return <AdminIngestionCenter />;
      case 'partner_exports': return <AdminPartnerExports />;
      case 'search_trends': return <AdminSearchTrends />;
      case 'system': return <AdminSystemSection />;
      case 'world_graph': return <AdminWorldGraph />;
      case 'legacy': return <AdminLegacySection />;
      default: return <AdminOverview onNavigate={setActiveSection} />;
    }
  };

  const groups = SECTIONS.reduce((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {} as Record<string, typeof SECTIONS>);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Database className="w-4 h-4 text-primary" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="font-bold text-sm">SWAM Admin</h1>
              <p className="text-[10px] text-muted-foreground">Operating System</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-2">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="mb-2">
            {!sidebarCollapsed && (
              <p className="px-4 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{group}</p>
            )}
            {items.map(section => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => { setActiveSection(section.id); setMobileSidebar(false); }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium border-r-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>{section.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Collapse toggle (desktop) */}
      <div className="p-2 border-t border-border/50 hidden md:block">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Top command bar */}
      <div className="fixed top-16 left-0 right-0 z-30 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-2">
        <div className="flex items-center gap-2 max-w-full">
          {/* Mobile menu toggle */}
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setMobileSidebar(!mobileSidebar)}>
            <Menu className="w-4 h-4" />
          </Button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">Admin</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">{SECTIONS.find(s => s.id === activeSection)?.label}</span>
          </div>

          {/* Quick actions */}
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 hidden sm:flex" onClick={() => setActiveSection('validation')}>
              <AlertTriangle className="w-3 h-3" /> Validation
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 hidden sm:flex" onClick={() => setActiveSection('bulk')}>
              <Upload className="w-3 h-3" /> Import
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 hidden sm:flex" onClick={() => setActiveSection('json')}>
              <Code2 className="w-3 h-3" /> JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="pt-[104px] flex min-h-screen">
        {/* Mobile sidebar overlay */}
        {mobileSidebar && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebar(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-background border-r shadow-xl">
              <div className="flex justify-end p-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileSidebar(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Desktop sidebar */}
        <aside className={cn(
          'hidden md:block border-r border-border/50 bg-muted/20 shrink-0 sticky top-[104px] h-[calc(100vh-104px)]',
          sidebarCollapsed ? 'w-14' : 'w-56'
        )}>
          <SidebarContent />
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 min-w-0 max-w-full overflow-x-hidden">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
