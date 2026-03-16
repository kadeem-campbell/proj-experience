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
import { MapPin, Upload, CreditCard, Phone, User, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDestinations, useAreas, useActivityTypes, useThemes, useHosts } from "@/hooks/useProducts";
import { validateProduct, type PublishValidationResult } from "@/services/publishValidator";
import { cn } from "@/lib/utils";

type FormStep = 'basic' | 'location' | 'options' | 'host' | 'media' | 'review' | 'auth' | 'confirmation';

const toSlug = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

export default function CreateExperience() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: destinations = [] } = useDestinations();
  const { data: activityTypes = [] } = useActivityTypes();
  const { data: themes = [] } = useThemes();
  const { data: allHosts = [] } = useHosts();
  const [selectedDestId, setSelectedDestId] = useState('');
  const { data: areas = [] } = useAreas(selectedDestId || undefined);

  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [saving, setSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<PublishValidationResult | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    destinationId: '',
    areaId: '',
    activityTypeId: '',
    themeIds: [] as string[],
    tier: 'standard',
    formatType: 'shared',
    duration: '',
    bestTime: '',
    weather: '',
    coverImage: '',
    videoUrl: '',
    // Option
    optionName: 'Standard Experience',
    optionTier: 'standard',
    optionFormat: 'shared',
    optionDuration: '',
    optionGroupSize: '',
    // Price
    priceAmount: '',
    priceCurrency: 'USD',
    priceLabel: 'Adult',
    // Host
    hostId: '',
    // Highlights
    highlights: '',
  });

  const steps: { id: FormStep; title: string }[] = [
    { id: 'basic', title: 'Basic Info' },
    { id: 'location', title: 'Location' },
    { id: 'options', title: 'Options & Pricing' },
    { id: 'host', title: 'Host' },
    { id: 'media', title: 'Media' },
    { id: 'review', title: 'Review & Publish' },
  ];

  useEffect(() => {
    if (form.destinationId && form.destinationId !== selectedDestId) {
      setSelectedDestId(form.destinationId);
    }
  }, [form.destinationId]);

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const nextStep = () => {
    const idx = steps.findIndex(s => s.id === currentStep);
    if (idx < steps.length - 1) setCurrentStep(steps[idx + 1].id);
  };
  const prevStep = () => {
    const idx = steps.findIndex(s => s.id === currentStep);
    if (idx > 0) setCurrentStep(steps[idx - 1].id);
  };

  const handlePublish = async () => {
    if (!isAuthenticated) { setCurrentStep('auth'); return; }
    setSaving(true);

    try {
      const slug = toSlug(form.title);

      // 1. Create Product
      const { data: product, error: pErr } = await (supabase as any)
        .from("products")
        .insert({
          title: form.title,
          slug,
          description: form.description,
          destination_id: form.destinationId || null,
          area_id: form.areaId || null,
          activity_type_id: form.activityTypeId || null,
          tier: form.tier,
          format_type: form.formatType,
          duration: form.duration,
          best_time: form.bestTime,
          weather: form.weather,
          cover_image: form.coverImage,
          video_url: form.videoUrl,
          highlights: form.highlights ? form.highlights.split('\n').filter(Boolean) : [],
          is_active: true,
          is_indexable: false, // starts as noindex until validated
          publish_score: 0,
        })
        .select("id")
        .single();

      if (pErr) throw pErr;
      const productId = product.id;

      // 2. Create Option
      const { data: option, error: oErr } = await (supabase as any)
        .from("options")
        .insert({
          product_id: productId,
          name: form.optionName,
          slug: slug + '-standard',
          tier: form.optionTier,
          format_type: form.optionFormat,
          duration: form.optionDuration || form.duration,
          group_size: form.optionGroupSize,
        })
        .select("id")
        .single();

      if (oErr) throw oErr;

      // 3. Create PriceOption
      if (form.priceAmount) {
        await (supabase as any).from("price_options").insert({
          option_id: option.id,
          amount: parseFloat(form.priceAmount) || 0,
          currency: form.priceCurrency,
          label: form.priceLabel,
        });
      }

      // 4. Link Host
      if (form.hostId) {
        await (supabase as any).from("product_hosts").insert({
          product_id: productId,
          host_id: form.hostId,
          is_primary: true,
        });
      }

      // 5. Link Themes
      if (form.themeIds.length > 0) {
        await (supabase as any).from("product_themes").insert(
          form.themeIds.map(tid => ({ product_id: productId, theme_id: tid }))
        );
      }

      // 6. Register route in page_route_registry (no legacy write)
      const dest = destinations.find(d => d.id === form.destinationId);
      const destSlug = dest?.slug || 'explore';
      const canonicalUrl = `https://swam.app/things-to-do/${destSlug}/${slug}`;
      await (supabase as any).from("page_route_registry").upsert({
        page_type: 'product',
        entity_id: productId,
        entity_type: 'product',
        resolved_path: `/things-to-do/${destSlug}/${slug}`,
        canonical_url: canonicalUrl,
        route_priority: 1,
        indexability_state: 'draft_unpublished',
        status: 'active',
        generated_from_rule: 'auto_product',
      }, { onConflict: 'entity_type,entity_id' });

      // Update product with canonical_url
      await (supabase as any).from("products").update({
        canonical_url: canonicalUrl,
        indexability_state: 'draft_unpublished',
      }).eq('id', productId);

      toast({ title: "Experience Created", description: `"${form.title}" has been created. Run validation in Admin to publish.` });
      setCurrentStep('confirmation');
    } catch (err: any) {
      console.error("Create failed:", err);
      toast({ title: "Error", description: err.message || "Failed to create experience.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Basic Information</h2>
            <div>
              <Label>Title</Label>
              <Input placeholder="e.g., Sunset Jet Ski Adventure" value={form.title} onChange={e => set('title', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Describe this experience..." value={form.description} onChange={e => set('description', e.target.value)} className="mt-1 min-h-[100px]" />
            </div>
            <div>
              <Label>Activity Type</Label>
              <Select value={form.activityTypeId} onValueChange={v => set('activityTypeId', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select activity type" /></SelectTrigger>
                <SelectContent>
                  {activityTypes.map(at => (
                    <SelectItem key={at.id} value={at.id}>{at.emoji} {at.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Highlights (one per line)</Label>
              <Textarea placeholder="Crystal clear waters&#10;Professional guides&#10;Equipment included" value={form.highlights} onChange={e => set('highlights', e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duration</Label>
                <Input placeholder="2 hours" value={form.duration} onChange={e => set('duration', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Best Time</Label>
                <Input placeholder="Morning" value={form.bestTime} onChange={e => set('bestTime', e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Themes</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {themes.map(t => (
                  <Badge key={t.id} variant={form.themeIds.includes(t.id) ? "default" : "outline"} className="cursor-pointer"
                    onClick={() => set('themeIds', form.themeIds.includes(t.id) ? form.themeIds.filter(id => id !== t.id) : [...form.themeIds, t.id])}>
                    {t.emoji} {t.name}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        );

      case 'location':
        return (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Location</h2>
            <div>
              <Label>Destination</Label>
              <Select value={form.destinationId} onValueChange={v => { set('destinationId', v); set('areaId', ''); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select destination" /></SelectTrigger>
                <SelectContent>
                  {destinations.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.flag_emoji} {d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {areas.length > 0 && (
              <div>
                <Label>Area</Label>
                <Select value={form.areaId} onValueChange={v => set('areaId', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select area (optional)" /></SelectTrigger>
                  <SelectContent>
                    {areas.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </Card>
        );

      case 'options':
        return (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Options & Pricing</h2>
            <div>
              <Label>Option Name</Label>
              <Input value={form.optionName} onChange={e => set('optionName', e.target.value)} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tier</Label>
                <Select value={form.optionTier} onValueChange={v => set('optionTier', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['basic','standard','premium','luxury'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Format</Label>
                <Select value={form.optionFormat} onValueChange={v => set('optionFormat', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['private','shared','group','self-guided','hosted'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Group Size</Label>
                <Input placeholder="Up to 8" value={form.optionGroupSize} onChange={e => set('optionGroupSize', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Option Duration</Label>
                <Input placeholder="2 hours" value={form.optionDuration} onChange={e => set('optionDuration', e.target.value)} className="mt-1" />
              </div>
            </div>
            <Separator />
            <h3 className="font-semibold">Pricing</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Amount</Label>
                <Input type="number" placeholder="50" value={form.priceAmount} onChange={e => set('priceAmount', e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={form.priceCurrency} onValueChange={v => set('priceCurrency', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="TZS">TZS</SelectItem>
                    <SelectItem value="KES">KES</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Label</Label>
                <Input value={form.priceLabel} onChange={e => set('priceLabel', e.target.value)} className="mt-1" />
              </div>
            </div>
          </Card>
        );

      case 'host':
        return (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Host</h2>
            <div>
              <Label>Select Host</Label>
              <Select value={form.hostId} onValueChange={v => set('hostId', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select host" /></SelectTrigger>
                <SelectContent>
                  {allHosts.map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.display_name || h.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        );

      case 'media':
        return (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Media</h2>
            <div>
              <Label>Cover Image URL</Label>
              <Input placeholder="https://..." value={form.coverImage} onChange={e => set('coverImage', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Video URL (optional)</Label>
              <Input placeholder="https://youtube.com/..." value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} className="mt-1" />
            </div>
          </Card>
        );

      case 'review':
        return (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Review & Publish</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Title:</strong> {form.title}</p>
              <p><strong>Destination:</strong> {destinations.find(d => d.id === form.destinationId)?.name || 'None'}</p>
              <p><strong>Activity:</strong> {activityTypes.find(a => a.id === form.activityTypeId)?.name || 'None'}</p>
              <p><strong>Option:</strong> {form.optionName} ({form.optionTier} / {form.optionFormat})</p>
              <p><strong>Price:</strong> {form.priceAmount ? `${form.priceCurrency} ${form.priceAmount}` : 'Not set'}</p>
              <p><strong>Host:</strong> {allHosts.find(h => h.id === form.hostId)?.display_name || 'None'}</p>
            </div>
          </Card>
        );

      case 'auth':
        return (
          <Card className="p-6 text-center space-y-4">
            <h2 className="text-xl font-bold">Sign In to Publish</h2>
            <Link to="/auth"><Button size="lg" className="w-full">Sign Up / Log In</Button></Link>
          </Card>
        );

      case 'confirmation':
        return (
          <Card className="p-6 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 mx-auto text-primary" />
            <h2 className="text-xl font-bold">Experience Created!</h2>
            <p className="text-muted-foreground">Your experience has been created with normalized product, option, and pricing data.</p>
            <Button onClick={() => navigate('/admin')}>Go to Admin</Button>
          </Card>
        );
    }
  };

  const stepIdx = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Create New Experience</h1>

        {/* Step indicator */}
        {currentStep !== 'confirmation' && currentStep !== 'auth' && (
          <div className="flex gap-1 mb-6">
            {steps.filter(s => s.id !== 'auth').map((s, i) => (
              <div key={s.id} className={cn("h-1 flex-1 rounded-full", i <= stepIdx ? "bg-primary" : "bg-muted")} />
            ))}
          </div>
        )}

        {renderStep()}

        {/* Navigation */}
        {!['confirmation', 'auth'].includes(currentStep) && (
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={prevStep} disabled={stepIdx === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {currentStep === 'review' ? (
              <Button onClick={handlePublish} disabled={saving || !form.title}>
                {saving ? 'Creating...' : 'Create Experience'}
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
