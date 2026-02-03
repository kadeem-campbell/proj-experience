import { Card } from '@/components/ui/card';
import { Upload, AlertCircle } from 'lucide-react';

export const BulkUploader = () => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="text-center mb-6">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Bulk Upload</h3>
        </div>

        <div className="flex items-center justify-center gap-3 p-4 bg-muted/50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">
            Bulk upload feature is currently unavailable. Experiences are managed through the itineraries system.
          </p>
        </div>
      </Card>
    </div>
  );
};
