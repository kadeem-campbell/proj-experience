import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bug, 
  Download, 
  Eye, 
  FileText, 
  Code, 
  Clock,
  CheckCircle,
  XCircle,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DebugData {
  jobId: string;
  platform: string;
  url: string;
  timestamp: Date;
  rawHtml: string;
  parsedMetadata: any;
  enrichmentSteps: any;
  apiCalls: Array<{
    endpoint: string;
    status: number;
    duration: number;
  }>;
}

interface DebugPanelProps {
  debugData: DebugData | null;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export const DebugPanel = ({ 
  debugData, 
  isVisible, 
  onToggleVisibility 
}: DebugPanelProps) => {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { toast } = useToast();

  const handleDownloadDebugData = () => {
    if (!debugData) return;

    const dataToDownload = {
      ...debugData,
      timestamp: debugData.timestamp.toISOString()
    };

    const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-data-${debugData.jobId}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Debug data downloaded",
      description: `Downloaded debug data for job ${debugData.jobId}`,
    });
  };

  const formatDuration = (ms: number): string => {
    return `${ms}ms`;
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleString();
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          onClick={onToggleVisibility}
          variant="outline"
          className="bg-card/90 backdrop-blur-sm border-border/50"
        >
          <Bug className="w-4 h-4 mr-2" />
          Debug Panel
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 w-96 h-[600px] bg-card/95 backdrop-blur-lg border border-border/50 rounded-xl shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <Bug className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Debug Panel</h3>
              <p className="text-xs text-muted-foreground">
                {debugData ? `Job ${debugData.jobId}` : 'No active job'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {debugData && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadDebugData}
                className="h-8 w-8 p-0"
              >
                <Download className="w-3 h-3" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggleVisibility}
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {debugData ? (
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 p-1 m-2">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="raw" className="text-xs">Raw Data</TabsTrigger>
              <TabsTrigger value="parsed" className="text-xs">Parsed</TabsTrigger>
              <TabsTrigger value="api" className="text-xs">API Calls</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <TabsContent value="overview" className="mt-0 space-y-4">
                <Card className="p-3 bg-muted/30">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Job ID:</span>
                      <span className="font-mono">{debugData.jobId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform:</span>
                      <Badge variant="secondary" className="text-xs">
                        {debugData.platform.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Started:</span>
                      <span className="text-xs">{formatTimestamp(debugData.timestamp)}</span>
                    </div>
                  </div>
                </Card>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Processing Steps</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Page scraping completed</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Metadata parsing successful</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>NLP enrichment completed</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Experience matching finished</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Enrichment Results</h4>
                  <div className="text-xs space-y-1">
                    {debugData.enrichmentSteps.nlpAnalysis && (
                      <div>
                        <span className="text-muted-foreground">Topics: </span>
                        <span>{debugData.enrichmentSteps.nlpAnalysis.join(', ')}</span>
                      </div>
                    )}
                    {debugData.enrichmentSteps.creatorClassification && (
                      <div>
                        <span className="text-muted-foreground">Creator Niche: </span>
                        <span>{debugData.enrichmentSteps.creatorClassification}</span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="raw" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="font-medium text-sm">Raw HTML</span>
                  </div>
                  <div className="bg-muted/50 p-3 rounded text-xs font-mono overflow-auto max-h-60">
                    <pre className="whitespace-pre-wrap break-all">
                      {debugData.rawHtml}
                    </pre>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span className="font-medium text-sm">Source URL</span>
                  </div>
                  <div className="bg-muted/50 p-3 rounded text-xs font-mono">
                    {debugData.url}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="parsed" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    <span className="font-medium text-sm">Parsed Metadata</span>
                  </div>
                  <div className="bg-muted/50 p-3 rounded text-xs font-mono overflow-auto max-h-80">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(debugData.parsedMetadata, null, 2)}
                    </pre>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="api" className="mt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium text-sm">API Call Log</span>
                  </div>
                  <div className="space-y-2">
                    {debugData.apiCalls.map((call, index) => (
                      <div key={index} className="bg-muted/30 p-3 rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-mono">{call.endpoint}</span>
                          <div className="flex items-center gap-2">
                            {call.status === 200 ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-500" />
                            )}
                            <Badge 
                              variant={call.status === 200 ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {call.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Duration: {formatDuration(call.duration)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center space-y-2">
              <Bug className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No debug data available
              </p>
              <p className="text-xs text-muted-foreground">
                Run a social media extraction to see debug information
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};