/**
 * Legacy section — view old experiences/categories/cities/creators,
 * with migration path to new normalized model.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { AdminEntityTable } from './AdminEntityTable';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export const AdminLegacySection = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: experiences = [] } = useQuery({
    queryKey: ['admin-legacy-experiences'],
    queryFn: async () => { const { data } = await supabase.from('experiences').select('*').order('created_at', { ascending: false }); return data || []; },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-legacy-categories'],
    queryFn: async () => { const { data } = await supabase.from('categories').select('*').order('display_order'); return data || []; },
  });

  const { data: cities = [] } = useQuery({
    queryKey: ['admin-legacy-cities'],
    queryFn: async () => { const { data } = await (supabase as any).from('cities').select('*').order('name'); return data || []; },
  });

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Legacy Data</h2>
      <p className="text-sm text-muted-foreground mb-4">View and manage old data model records pending migration</p>

      <Card className="p-4 mb-4 border-amber-500/30 bg-amber-500/5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <p className="text-sm text-amber-700 font-medium">Legacy data should be migrated to the normalized model</p>
        </div>
        <p className="text-xs text-amber-600 mt-1">
          Experiences → Products · Categories → Activity Types · Cities → Destinations · Creators → Hosts
        </p>
      </Card>

      <Tabs defaultValue="experiences">
        <TabsList className="mb-4">
          <TabsTrigger value="experiences">Experiences ({experiences.length})</TabsTrigger>
          <TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger>
          <TabsTrigger value="cities">Cities ({cities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="experiences">
          <AdminEntityTable
            items={experiences}
            entityName="Experience"
            columns={[
              { key: 'title', label: 'Title', width: 'flex-[2]', render: (e: any) => <span className="font-medium">{e.title}</span> },
              { key: 'category', label: 'Category', width: 'w-[120px]', render: (e: any) => <Badge variant="outline" className="text-[10px]">{e.category}</Badge> },
              { key: 'location', label: 'Location', width: 'flex-1', render: (e: any) => <span className="text-xs text-muted-foreground">{e.location}</span> },
              { key: 'is_active', label: 'Status', width: 'w-[80px]', render: (e: any) => <Badge variant={e.is_active ? 'default' : 'secondary'} className="text-[10px]">{e.is_active ? 'Active' : 'Off'}</Badge> },
            ]}
          />
        </TabsContent>

        <TabsContent value="categories">
          <AdminEntityTable
            items={categories}
            entityName="Category"
            columns={[
              { key: 'name', label: 'Name', width: 'flex-[2]', render: (c: any) => <span>{c.emoji} <span className="font-medium">{c.name}</span></span> },
              { key: 'display_order', label: 'Order', width: 'w-[60px]' },
            ]}
          />
        </TabsContent>

        <TabsContent value="cities">
          <AdminEntityTable
            items={cities}
            entityName="City"
            columns={[
              { key: 'name', label: 'Name', width: 'flex-[2]', render: (c: any) => <span className="font-medium">{c.flag_emoji} {c.name}</span> },
              { key: 'country', label: 'Country', width: 'flex-1' },
              { key: 'airport_code', label: 'Airport', width: 'w-[80px]' },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
