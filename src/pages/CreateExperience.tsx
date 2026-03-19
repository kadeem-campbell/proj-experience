import { useState, useEffect, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, CreditCard, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, AlertTriangle, Info, Plus, Trash2, Link2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDestinations, useAreas, useActivityTypes, useThemes, useHosts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

type FormStep = 'basic' | 'location' | 'options' | 'host' | 'media' | 'review' | 'auth' | 'confirmation';

const toSlug = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

interface ValidationIssue {
  field: string;
  message: string;
  severity: 'blocker' | 'warning' | 'info';
  step: FormStep;
}

interface OptionRow {
  name: string;
  optionType: string;
  durationMinutes: string;
  capacityMin: string;
  capacityMax: string;
  prices: PriceRow[];
}

interface PriceRow {
  pricingCategory: string;
  pricingUnit: string;
  currencyCode: string;
  amount: string;
}

const defaultOption = (): OptionRow => ({
  name: 'Standard Experience',
  optionType: 'standard',
  durationMinutes: '',
  capacityMin: '',
  capacityMax: '',
  prices: [defaultPrice()],
});

const defaultPrice = (): PriceRow => ({
  pricingCategory: 'adult',
  pricingUnit: 'per_person',
  currencyCode: 'USD',
  amount: '',
});

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
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);

  // Linking state
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedItineraryIds, setSelectedItineraryIds] = useState<string[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    destinationId: '',
    areaId: '',
    activityTypeId: '',
    themeIds: [] as string[],
    coverImage: '',
    videoUrl: '',
    highlights: '',
    seoTitle: '',
    seoDescription: '',
    averagePricePerPerson: '',
  });

  // Related products state
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedRelatedProductIds, setSelectedRelatedProductIds] = useState<string[]>([]);

  const [options, setOptions] = useState<OptionRow[]>([defaultOption()]);

  const [hostId, setHostId] = useState('');

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

  // Fetch itineraries, collections & existing products for linking
  useEffect(() => {
    (async () => {
      const [{ data: itin }, { data: coll }, { data: prods }] = await Promise.all([
        supabase.from("public_itineraries").select("id, name, slug").eq("is_active", true).order("name"),
        supabase.from("collections").select("id, name, slug").eq("is_active", true).order("name"),
        (supabase as any).from("products").select("id, title, slug").order("title").limit(500),
      ]);
      setItineraries(itin || []);
      setCollections(coll || []);
      setAllProducts(prods || []);
    })();
  }, []);

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  // Live validation
  const issues = useMemo((): ValidationIssue[] => {
    const r: ValidationIssue[] = [];
    if (!form.title.trim()) r.push({ field: 'title', message: 'Title is required', severity: 'blocker', step: 'basic' });
    else if (form.title.trim().length < 5) r.push({ field: 'title', message: 'Title should be at least 5 characters', severity: 'warning', step: 'basic' });
    if (!form.description.trim()) r.push({ field: 'description', message: 'Description is required for publishing', severity: 'blocker', step: 'basic' });
    else if (form.description.trim().length < 30) r.push({ field: 'description', message: 'Description should be at least 30 characters for quality', severity: 'warning', step: 'basic' });
    if (!form.activityTypeId) r.push({ field: 'activityTypeId', message: 'Activity type helps categorisation', severity: 'warning', step: 'basic' });
    if (!form.destinationId) r.push({ field: 'destinationId', message: 'Destination is required', severity: 'blocker', step: 'location' });
    if (options.length === 0) r.push({ field: 'options', message: 'At least one option is required', severity: 'blocker', step: 'options' });
    options.forEach((o, i) => {
      if (!o.name.trim()) r.push({ field: `option-${i}-name`, message: `Option ${i + 1} needs a name`, severity: 'blocker', step: 'options' });
      if (o.prices.length === 0) r.push({ field: `option-${i}-prices`, message: `Option ${i + 1} needs at least one price`, severity: 'warning', step: 'options' });
      o.prices.forEach((p, j) => {
        if (!p.amount || parseFloat(p.amount) <= 0) r.push({ field: `option-${i}-price-${j}`, message: `Option ${i + 1} price ${j + 1} needs a valid amount`, severity: 'warning', step: 'options' });
      });
    });
    if (!form.coverImage.trim()) r.push({ field: 'coverImage', message: 'Cover image improves discoverability', severity: 'warning', step: 'media' });
    if (!hostId) r.push({ field: 'hostId', message: 'Assigning a host improves trust', severity: 'info', step: 'host' });
    return r;
  }, [form, options, hostId]);

  const blockers = issues.filter(i => i.severity === 'blocker');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');
  const canCreate = blockers.length === 0;

  const stepIssues = (step: FormStep) => issues.filter(i => i.step === step);

  const nextStep = () => {
    const idx = steps.findIndex(s => s.id === currentStep);
    if (idx < steps.length - 1) setCurrentStep(steps[idx + 1].id);
  };
  const prevStep = () => {
    const idx = steps.findIndex(s => s.id === currentStep);
    if (idx > 0) setCurrentStep(steps[idx - 1].id);
  };

  const updateOption = (idx: number, field: keyof OptionRow, value: any) => {
    setOptions(prev => prev.map((o, i) => i === idx ? { ...o, [field]: value } : o));
  };
  const addOption = () => setOptions(prev => [...prev, defaultOption()]);
  const removeOption = (idx: number) => setOptions(prev => prev.filter((_, i) => i !== idx));
  const addPrice = (optIdx: number) => {
    setOptions(prev => prev.map((o, i) => i === optIdx ? { ...o, prices: [...o.prices, defaultPrice()] } : o));
  };
  const removePrice = (optIdx: number, priceIdx: number) => {
    setOptions(prev => prev.map((o, i) => i === optIdx ? { ...o, prices: o.prices.filter((_, j) => j !== priceIdx) } : o));
  };
  const updatePrice = (optIdx: number, priceIdx: number, field: keyof PriceRow, value: string) => {
    setOptions(prev => prev.map((o, i) => i === optIdx ? {
      ...o,
      prices: o.prices.map((p, j) => j === priceIdx ? { ...p, [field]: value } : p),
    } : o));
  };

  const handlePublish = async () => {
    if (!isAuthenticated) { setCurrentStep('auth'); return; }
    if (!canCreate) {
      toast({ title: "Cannot create", description: `${blockers.length} blocker(s) must be resolved first.`, variant: "destructive" });
      return;
    }
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
          primary_area_id: form.areaId || null,
          activity_type_id: form.activityTypeId || null,
          cover_image: form.coverImage || '',
          video_url: form.videoUrl || '',
          highlights: form.highlights ? form.highlights.split('\n').filter(Boolean) : [],
          seo_title: form.seoTitle || form.title,
          seo_description: form.seoDescription || form.description?.slice(0, 160) || '',
          average_price_per_person: form.averagePricePerPerson ? parseFloat(form.averagePricePerPerson) : null,
          publish_score: 0,
          publish_state: 'published',
          visibility_output_state: 'public',
        })
        .select("id")
        .single();

      if (pErr) throw pErr;
      const productId = product.id;
      setCreatedProductId(productId);

      // 2. Create Options + PriceOptions
      for (const opt of options) {
        const optSlug = slug + '-' + toSlug(opt.name);
        const { data: createdOpt, error: oErr } = await (supabase as any)
          .from("options")
          .insert({
            product_id: productId,
            name: opt.name,
            slug: optSlug,
            option_type: opt.optionType,
            duration_minutes: opt.durationMinutes ? parseInt(opt.durationMinutes) : null,
            capacity_min: opt.capacityMin ? parseInt(opt.capacityMin) : null,
            capacity_max: opt.capacityMax ? parseInt(opt.capacityMax) : null,
          })
          .select("id")
          .single();

        if (oErr) throw oErr;

        // Insert prices for this option
        const validPrices = opt.prices.filter(p => p.amount && parseFloat(p.amount) > 0);
        if (validPrices.length > 0) {
          const { error: prErr } = await (supabase as any).from("price_options").insert(
            validPrices.map(p => ({
              option_id: createdOpt.id,
              pricing_category: p.pricingCategory,
              pricing_unit: p.pricingUnit,
              currency_code: p.currencyCode,
              amount: parseFloat(p.amount),
            }))
          );
          if (prErr) console.error("Price insert error:", prErr);
        }
      }

      // 3. Link Host
      if (hostId) {
        await (supabase as any).from("product_hosts").insert({
          product_id: productId,
          host_id: hostId,
          is_primary: true,
        });
      }

      // 4. Link Themes
      if (form.themeIds.length > 0) {
        await (supabase as any).from("product_themes").insert(
          form.themeIds.map(tid => ({ product_id: productId, theme_id: tid }))
        );
      }

      // 5. Register route
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

      await (supabase as any).from("products").update({
        canonical_url: canonicalUrl,
        indexability_state: 'draft_unpublished',
      }).eq('id', productId);

      // 6. Link to itineraries (add product slug to experiences JSONB array)
      for (const itinId of selectedItineraryIds) {
        const { data: itin } = await (supabase as any).from("public_itineraries").select("experiences").eq("id", itinId).single();
        const existing = Array.isArray(itin?.experiences) ? itin.experiences : [];
        existing.push({ title: form.title, slug, type: 'product', product_id: productId });
        await (supabase as any).from("public_itineraries").update({ experiences: existing }).eq("id", itinId);
      }

      // 7. Link to collections
      for (const collId of selectedCollectionIds) {
        await (supabase as any).from("collection_items").insert({
          collection_id: collId,
          item_id: productId,
          item_type: 'product',
          position: 999,
        });
      }

      // 8. Link related products
      if (selectedRelatedProductIds.length > 0) {
        await (supabase as any).from("product_relationships").insert(
          selectedRelatedProductIds.map(relId => ({
            source_product_id: productId,
            target_product_id: relId,
            relationship_type: 'related',
            score: 1.0,
          }))
        );
      }

      toast({ title: "Product Created!", description: `"${form.title}" created with ${options.length} option(s). Run validation in Admin to publish.` });
      setCurrentStep('confirmation');
    } catch (err: any) {
      console.error("Create failed:", err);
      toast({ title: "Error", description: err.message || "Failed to create product.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const IssuesBanner = ({ step }: { step: FormStep }) => {
    const si = stepIssues(step);
    if (si.length === 0) return null;
    return (
      <div className="space-y-1.5 mb-4">
        {si.map((issue, i) => (
          <div key={i} className={cn("flex items-start gap-2 text-xs rounded-md px-3 py-2",
            issue.severity === 'blocker' ? "bg-destructive/10 text-destructive" :
            issue.severity === 'warning' ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" :
            "bg-muted text-muted-foreground"
          )}>
            {issue.severity === 'blocker' ? <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> :
             issue.severity === 'warning' ? <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> :
             <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
            <span>{issue.message}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Basic Information</h2>
            <IssuesBanner step="basic" />
            <div>
              <Label>Title *</Label>
              <Input placeholder="e.g., Sunset Jet Ski Adventure" value={form.title} onChange={e => set('title', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea placeholder="Describe this experience..." value={form.description} onChange={e => set('description', e.target.value)} className="mt-1 min-h-[100px]" />
              <p className="text-xs text-muted-foreground mt-1">{form.description.length}/30 min characters</p>
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
            <div>
              <Label>Themes</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {themes.map(t => (
                  <Badge key={t.id} variant={form.themeIds.includes(t.id) ? "default" : "outline"} className="cursor-pointer"
                    onClick={() => set('themeIds', form.themeIds.includes(t.id) ? form.themeIds.filter((id: string) => id !== t.id) : [...form.themeIds, t.id])}>
                    {t.emoji} {t.name}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />
            <h3 className="font-semibold text-sm">SEO</h3>
            <div>
              <Label>SEO Title <span className="text-xs text-muted-foreground">(max 60 chars)</span></Label>
              <Input placeholder={form.title || "Auto-generated from title"} value={form.seoTitle} onChange={e => set('seoTitle', e.target.value)} className="mt-1" maxLength={60} />
              <p className="text-xs text-muted-foreground mt-1">{form.seoTitle.length}/60</p>
            </div>
            <div>
              <Label>SEO Description <span className="text-xs text-muted-foreground">(max 160 chars)</span></Label>
              <Textarea placeholder="Auto-generated from description" value={form.seoDescription} onChange={e => set('seoDescription', e.target.value)} className="mt-1" rows={2} />
              <p className="text-xs text-muted-foreground mt-1">{form.seoDescription.length}/160</p>
            </div>
          </Card>
        );

      case 'location': {
        const destName = destinations.find(d => d.id === form.destinationId)?.name;
        const areaName = areas.find((a: any) => a.id === form.areaId)?.name;
        return (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Location</h2>
            <IssuesBanner step="location" />

            {/* Location summary badge */}
            {(destName || areaName) && (
              <div className="flex items-center gap-2 text-sm bg-muted rounded-md px-3 py-2">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium">{[destName, areaName].filter(Boolean).join(' → ')}</span>
              </div>
            )}

            <div>
              <Label>Destination *</Label>
              <Select value={form.destinationId} onValueChange={v => { set('destinationId', v); set('areaId', ''); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select destination" /></SelectTrigger>
                <SelectContent>
                  {destinations.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
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
                    {areas.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </Card>
        );
      }

      case 'options':
        return (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Options & Pricing</h2>
              <Button size="sm" variant="outline" onClick={addOption}><Plus className="w-3.5 h-3.5 mr-1" /> Add Option</Button>
            </div>
            <p className="text-xs text-muted-foreground">Each option is a bookable variant (e.g. Private Ride, Group Tour). Pricing uses the world-model pricing_category + pricing_unit system for scalable multi-currency support.</p>
            <IssuesBanner step="options" />

            {options.map((opt, oi) => (
              <div key={oi} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Option {oi + 1}</h3>
                  {options.length > 1 && (
                    <Button size="sm" variant="ghost" onClick={() => removeOption(oi)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input value={opt.name} onChange={e => updateOption(oi, 'name', e.target.value)} className="mt-1" placeholder="Standard Experience" />
                  </div>
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select value={opt.optionType} onValueChange={v => updateOption(oi, 'optionType', v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['standard', 'private', 'group', 'self_guided', 'vip'].map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Duration (mins)</Label>
                    <Input type="number" placeholder="120" value={opt.durationMinutes} onChange={e => updateOption(oi, 'durationMinutes', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Min capacity</Label>
                    <Input type="number" placeholder="1" value={opt.capacityMin} onChange={e => updateOption(oi, 'capacityMin', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Max capacity</Label>
                    <Input type="number" placeholder="8" value={opt.capacityMax} onChange={e => updateOption(oi, 'capacityMax', e.target.value)} className="mt-1" />
                  </div>
                </div>

                <Separator />
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pricing</h4>
                  <Button size="sm" variant="ghost" onClick={() => addPrice(oi)}><Plus className="w-3 h-3 mr-1" /> Add tier</Button>
                </div>
                {opt.prices.map((price, pi) => (
                  <div key={pi} className="grid grid-cols-5 gap-2 items-end">
                    <div>
                      <Label className="text-xs">Category</Label>
                      <Select value={price.pricingCategory} onValueChange={v => updatePrice(oi, pi, 'pricingCategory', v)}>
                        <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['adult', 'child', 'infant', 'resident', 'student', 'senior', 'group'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Unit</Label>
                      <Select value={price.pricingUnit} onValueChange={v => updatePrice(oi, pi, 'pricingUnit', v)}>
                        <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['per_person', 'per_group', 'per_hour', 'flat_rate'].map(u => <SelectItem key={u} value={u}>{u.replace('_', ' ')}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Currency</Label>
                      <Select value={price.currencyCode} onValueChange={v => updatePrice(oi, pi, 'currencyCode', v)}>
                        <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['USD', 'EUR', 'GBP', 'TZS', 'KES', 'GHS', 'NGN', 'ZAR', 'RWF', 'UGX', 'EGP', 'SAR', 'AED', 'BZD', 'JMD'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Amount</Label>
                      <Input type="number" placeholder="50" value={price.amount} onChange={e => updatePrice(oi, pi, 'amount', e.target.value)} className="mt-1 text-xs" />
                    </div>
                    <div>
                      {opt.prices.length > 1 && (
                        <Button size="sm" variant="ghost" onClick={() => removePrice(oi, pi)}><Trash2 className="w-3 h-3" /></Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <Separator />
            <h3 className="font-semibold text-sm">Average Price Per Person</h3>
            <p className="text-xs text-muted-foreground">Set the indicative price per person for display. This is managed separately from option-level pricing and used for cards/search.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Amount (USD)</Label>
                <Input type="number" placeholder="e.g. 45" value={form.averagePricePerPerson} onChange={e => set('averagePricePerPerson', e.target.value)} className="mt-1" />
              </div>
            </div>

            <Separator />
            <h3 className="font-semibold text-sm">Related Products</h3>
            <p className="text-xs text-muted-foreground">Link multiple related products for cross-selling ("often paired with"). Select as many as needed.</p>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {allProducts.filter(p => p.id !== createdProductId).map(p => (
                <Badge key={p.id} variant={selectedRelatedProductIds.includes(p.id) ? "default" : "outline"} className="cursor-pointer text-xs"
                  onClick={() => setSelectedRelatedProductIds(prev => prev.includes(p.id) ? prev.filter((id: string) => id !== p.id) : [...prev, p.id])}>
                  {p.title}
                </Badge>
              ))}
              {allProducts.length === 0 && <p className="text-xs text-muted-foreground">No existing products found.</p>}
            </div>
          </Card>
        );

      case 'host':
        return (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Host</h2>
            <IssuesBanner step="host" />
            <div>
              <Label>Select Host</Label>
              <Select value={hostId} onValueChange={v => setHostId(v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select host (optional)" /></SelectTrigger>
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
            <IssuesBanner step="media" />
            <div>
              <Label>Cover Image URL</Label>
              <Input placeholder="https://..." value={form.coverImage} onChange={e => set('coverImage', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Video URL (optional)</Label>
              <Input placeholder="https://youtube.com/..." value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} className="mt-1" />
            </div>

            <Separator />
            <h3 className="font-semibold flex items-center gap-2"><Link2 className="w-4 h-4" /> Link to Itineraries & Collections</h3>
            <p className="text-xs text-muted-foreground">Add this product to existing itineraries and collections at creation time.</p>

            <div>
              <Label className="text-xs">Itineraries</Label>
              <div className="flex flex-wrap gap-1.5 mt-1 max-h-32 overflow-y-auto">
                {itineraries.map(it => (
                  <Badge key={it.id} variant={selectedItineraryIds.includes(it.id) ? "default" : "outline"} className="cursor-pointer text-xs"
                    onClick={() => setSelectedItineraryIds(prev => prev.includes(it.id) ? prev.filter(id => id !== it.id) : [...prev, it.id])}>
                    {it.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Collections</Label>
              <div className="flex flex-wrap gap-1.5 mt-1 max-h-32 overflow-y-auto">
                {collections.map(c => (
                  <Badge key={c.id} variant={selectedCollectionIds.includes(c.id) ? "default" : "outline"} className="cursor-pointer text-xs"
                    onClick={() => setSelectedCollectionIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}>
                    {c.name}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        );

      case 'review':
        return (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Review & Create</h2>

            {/* Readiness summary */}
            <div className={cn("rounded-lg p-4 space-y-2", canCreate ? "bg-primary/5 border border-primary/20" : "bg-destructive/5 border border-destructive/20")}>
              <div className="flex items-center gap-2">
                {canCreate ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <AlertCircle className="w-5 h-5 text-destructive" />}
                <span className="font-semibold">{canCreate ? 'Ready to create' : `${blockers.length} blocker(s) must be fixed`}</span>
              </div>
              {blockers.map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-destructive">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{b.message}</span>
                  <Button size="sm" variant="ghost" className="text-xs h-5 px-1.5" onClick={() => setCurrentStep(b.step)}>Fix →</Button>
                </div>
              ))}
              {warnings.map((w, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{w.message}</span>
                </div>
              ))}
              {infos.map((inf, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="w-3 h-3 shrink-0" />
                  <span>{inf.message}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <p><strong>Title:</strong> {form.title || <span className="text-destructive">Missing</span>}</p>
              <p><strong>Slug:</strong> {form.title ? toSlug(form.title) : '—'}</p>
              <p><strong>Destination:</strong> {destinations.find(d => d.id === form.destinationId)?.name || <span className="text-destructive">Not set</span>}</p>
              <p><strong>Activity:</strong> {activityTypes.find(a => a.id === form.activityTypeId)?.name || 'Not set'}</p>
              <p><strong>Options:</strong> {options.length} variant(s)</p>
              {options.map((o, i) => (
                <div key={i} className="ml-4 text-xs text-muted-foreground">
                  • {o.name} ({o.optionType}) — {o.prices.filter(p => p.amount).map(p => `${p.currencyCode} ${p.amount} (${p.pricingCategory})`).join(', ') || 'No price'}
                </div>
              ))}
              <p><strong>Host:</strong> {allHosts.find(h => h.id === hostId)?.display_name || 'None'}</p>
              {selectedItineraryIds.length > 0 && <p><strong>Itineraries:</strong> {selectedItineraryIds.length} linked</p>}
              {selectedCollectionIds.length > 0 && <p><strong>Collections:</strong> {selectedCollectionIds.length} linked</p>}
            </div>
          </Card>
        );

      case 'auth':
        return (
          <Card className="p-6 text-center space-y-4">
            <h2 className="text-xl font-bold">Sign In to Create</h2>
            <Link to="/auth"><Button size="lg" className="w-full">Sign Up / Log In</Button></Link>
          </Card>
        );

      case 'confirmation':
        return (
          <Card className="p-6 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 mx-auto text-primary" />
            <h2 className="text-xl font-bold">Product Created!</h2>
            <p className="text-muted-foreground text-sm">Created with {options.length} option(s) and pricing tiers in the world model. Run validation in Admin to publish.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/admin')}>Go to Admin</Button>
              <Button variant="outline" onClick={() => {
                setForm({ title: '', description: '', destinationId: '', areaId: '', activityTypeId: '', themeIds: [], coverImage: '', videoUrl: '', highlights: '', seoTitle: '', seoDescription: '', averagePricePerPerson: '' });
                setOptions([defaultOption()]);
                setHostId('');
                setSelectedItineraryIds([]);
                setSelectedCollectionIds([]);
                setCreatedProductId(null);
                setCurrentStep('basic');
              }}>Create Another</Button>
            </div>
          </Card>
        );
    }
  };

  const stepIdx = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Create New Product</h1>

        {/* Step indicator */}
        {currentStep !== 'confirmation' && currentStep !== 'auth' && (
          <div className="flex gap-1 mb-2">
            {steps.map((s, i) => {
              const si = stepIssues(s.id);
              const hasBlockers = si.some(x => x.severity === 'blocker');
              return (
                <div key={s.id} className="flex-1 space-y-1">
                  <div className={cn("h-1.5 rounded-full transition-colors",
                    i <= stepIdx ? (hasBlockers ? "bg-destructive" : "bg-primary") : "bg-muted"
                  )} />
                  <button onClick={() => setCurrentStep(s.id)} className="text-[10px] text-muted-foreground hover:text-foreground w-full text-center">
                    {s.title}
                    {hasBlockers && <AlertCircle className="w-2.5 h-2.5 text-destructive inline ml-0.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4">{renderStep()}</div>

        {/* Navigation */}
        {!['confirmation', 'auth'].includes(currentStep) && (
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={prevStep} disabled={stepIdx === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {currentStep === 'review' ? (
              <Button onClick={handlePublish} disabled={saving || !canCreate}>
                {saving ? 'Creating...' : canCreate ? 'Create Product' : `Fix ${blockers.length} blocker(s)`}
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
