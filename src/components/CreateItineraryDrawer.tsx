import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MapPin, EyeOff, Eye, Users, Loader2 } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useItineraries } from "@/hooks/useItineraries";
import { useDestinations } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

interface CreateItineraryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after successful creation with the new itinerary */
  onCreated?: (itinerary: { id: string; name: string }) => void;
}

export const CreateItineraryDrawer = ({ open, onOpenChange, onCreated }: CreateItineraryDrawerProps) => {
  const navigate = useNavigate();
  const { createItinerary } = useItineraries();
  const { data: destinations = [] } = useDestinations();

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newVisibility, setNewVisibility] = useState<"private" | "public">("private");
  const [newPeople, setNewPeople] = useState("2");
  const [newCity, setNewCity] = useState("");
  const [creating, setCreating] = useState(false);

  const resetForm = () => {
    setNewName("");
    setNewDescription("");
    setNewVisibility("private");
    setNewPeople("2");
    setNewCity("");
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const created = await createItinerary(newName.trim());
    setCreating(false);
    onOpenChange(false);
    const name = newName.trim();
    resetForm();
    if (onCreated) {
      onCreated({ id: created.id, name });
    } else {
      navigate(`/itineraries/${created.id}`);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DrawerContent className="overflow-hidden max-h-[85vh]">
        <div className="overflow-y-auto px-5 pt-4 pb-[env(safe-area-inset-bottom,20px)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => onOpenChange(false)} className="text-sm text-muted-foreground font-medium">Cancel</button>
            <h3 className="text-base font-bold text-foreground">New Itinerary</h3>
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className={cn(
                "text-sm font-semibold",
                newName.trim() && !creating ? "text-primary" : "text-muted-foreground/40"
              )}
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>

          {/* Form fields */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border mb-4">
            <div className="px-4 py-3.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Itinerary Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Zanzibar Weekend"
                className="w-full bg-transparent border-0 outline-none text-base font-medium text-foreground placeholder:text-muted-foreground/50"
                style={{ fontSize: '16px' }}
                onFocus={(e) => { setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); }}
              />
            </div>
            <div className="px-4 py-3.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Location</label>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <select
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground appearance-none cursor-pointer"
                  style={{ fontSize: '16px' }}
                >
                  <option value="">Select a destination</option>
                  {destinations.map(dest => (
                    <option key={dest.id} value={dest.name}>{dest.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-4 py-3.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Description</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What's this trip about?"
                className="w-full bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/50 resize-none"
                rows={2}
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Visibility & People */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border mb-4">
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {newVisibility === "private" ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-primary" />}
                <span className="text-sm font-medium text-foreground">Visibility</span>
              </div>
              <div className="flex items-center bg-muted rounded-full p-0.5">
                <button
                  onClick={() => setNewVisibility("private")}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    newVisibility === "private" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  Private
                </button>
                <button
                  onClick={() => setNewVisibility("public")}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    newVisibility === "public" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  Public
                </button>
              </div>
            </div>
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Travellers</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNewPeople(String(Math.max(1, parseInt(newPeople) - 1)))}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground font-medium active:scale-90 transition-transform"
                >
                  −
                </button>
                <span className="text-sm font-semibold w-6 text-center">{newPeople}</span>
                <button
                  onClick={() => setNewPeople(String(Math.min(50, parseInt(newPeople) + 1)))}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground font-medium active:scale-90 transition-transform"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <Button
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
            className="w-full h-13 rounded-2xl font-semibold text-base"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Itinerary
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
