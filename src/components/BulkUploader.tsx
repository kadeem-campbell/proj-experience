import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BulkUploadResult {
  success: boolean;
  message: string;
  data?: any;
}

export const BulkUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BulkUploadResult | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      // Read file content
      const fileContent = await file.text();
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 80) {
            clearInterval(progressInterval);
            return 80;
          }
          return prev + 10;
        });
      }, 200);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('bulk-upload', {
        body: {
          csvData: fileContent,
          fileName: file.name,
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      setResults({
        success: true,
        message: `Successfully processed ${data.successful_records} records`,
        data: data,
      });

      toast({
        title: "Upload completed",
        description: `Successfully uploaded ${data.successful_records} experiences`,
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      setResults({
        success: false,
        message: error.message || 'Upload failed',
      });

      toast({
        title: "Upload failed",
        description: error.message || "An error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `title,description,location,category,creator,price,currency,duration_hours,max_participants
"Jet Ski Adventure","Exciting water sports experience","Dar Es Salaam","Water Sports","JohnDoe",49,"USD",2,8
"Beach Party","Amazing beach party experience","Zanzibar","Party","BeachVibes",35,"USD",4,20
"Safari Tour","Wildlife viewing experience","Serengeti","Wildlife","WildlifePro",120,"USD",8,6`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'experiences_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="text-center mb-6">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Bulk Upload Experiences</h3>
          <p className="text-muted-foreground">
            Upload a CSV file to add multiple experiences at once
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center">
            <Button variant="outline" onClick={downloadTemplate}>
              <FileText className="w-4 h-4 mr-2" />
              Download CSV Template
            </Button>
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-6">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {file && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round(file.size / 1024)} KB)
                  </span>
                </div>
              </div>
            )}
          </div>

          {file && !uploading && (
            <Button onClick={handleUpload} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Upload CSV
            </Button>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">Uploading...</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {results && (
            <Card className="p-4">
              <div className="flex items-start gap-3">
                {results.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${results.success ? 'text-green-700' : 'text-red-700'}`}>
                    {results.success ? 'Upload Successful' : 'Upload Failed'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {results.message}
                  </p>
                  {results.data && results.data.errors?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Errors:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {results.data.errors.slice(0, 5).map((error: string, index: number) => (
                          <li key={index}>• {error}</li>
                        ))}
                        {results.data.errors.length > 5 && (
                          <li>• ... and {results.data.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
};