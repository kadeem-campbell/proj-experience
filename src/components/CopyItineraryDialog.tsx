import { useState } from "react";
import { Copy, Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useItineraries, Itinerary } from "@/hooks/useItineraries";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PublicItineraryData {
  id: string;
  name: string;
  experiences: any[];
}

interface CopyItineraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceItinerary: PublicItineraryData;
  onCopyComplete?: () => void;
}

export const CopyItineraryDialog = ({
  open,
  onOpenChange,
  sourceItinerary,
  onCopyComplete
}: CopyItineraryDialogProps) => {
  const { itineraries, createItinerary, addExperience, setActiveItinerary, addExperienceToItinerary } = useItineraries();
  
  const [copyMode, setCopyMode] = useState<"new" | "existing">("new");
  const [newName, setNewName] = useState(sourceItinerary.name);
  const [selectedItineraryId, setSelectedItineraryId] = useState<string>("");

  const handleCopy = () => {
    if (copyMode === "new") {
      // Create new itinerary with the custom name
      const newItinerary = createItinerary(newName || sourceItinerary.name);
      setActiveItinerary(newItinerary.id);
      
      // Add all experiences
      sourceItinerary.experiences.forEach(exp => {
        addExperience({
          id: exp.id,
          title: exp.title,
          creator: exp.creator,
          videoThumbnail: exp.videoThumbnail,
          category: exp.category,
          location: exp.location,
          price: exp.price
        });
      });
    } else if (copyMode === "existing" && selectedItineraryId) {
      // Add to existing itinerary
      sourceItinerary.experiences.forEach(exp => {
        addExperienceToItinerary(selectedItineraryId, {
          id: exp.id,
          title: exp.title,
          creator: exp.creator,
          videoThumbnail: exp.videoThumbnail,
          category: exp.category,
          location: exp.location,
          price: exp.price
        });
      });
    }

    onOpenChange(false);
    onCopyComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Copy Itinerary
          </DialogTitle>
          <DialogDescription>
            Add "{sourceItinerary.name}" to your collection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup value={copyMode} onValueChange={(v) => setCopyMode(v as "new" | "existing")}>
            {/* Create New Option */}
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="new" id="new" className="mt-1" />
              <div className="flex-1 space-y-2">
                <Label htmlFor="new" className="flex items-center gap-2 cursor-pointer">
                  <Plus className="w-4 h-4" />
                  Create new itinerary
                </Label>
                {copyMode === "new" && (
                  <Input
                    placeholder="Enter itinerary name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            </div>

            {/* Add to Existing Option */}
            {itineraries.length > 0 && (
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="existing" id="existing" className="mt-1" />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="existing" className="flex items-center gap-2 cursor-pointer">
                    <FolderOpen className="w-4 h-4" />
                    Add to existing itinerary
                  </Label>
                  {copyMode === "existing" && (
                    <ScrollArea className="h-32 border rounded-md mt-2">
                      <div className="p-2 space-y-1">
                        {itineraries.map((it) => (
                          <button
                            key={it.id}
                            onClick={() => setSelectedItineraryId(it.id)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              selectedItineraryId === it.id
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                          >
                            {it.name}
                            <span className="text-xs opacity-70 ml-2">
                              ({it.experiences.length} experiences)
                            </span>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            )}
          </RadioGroup>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCopy}
            disabled={copyMode === "existing" && !selectedItineraryId}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};