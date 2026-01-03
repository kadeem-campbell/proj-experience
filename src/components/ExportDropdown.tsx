import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Heart, Download, Eye, DollarSign } from "lucide-react";
import { useLikedExperiences } from "@/hooks/useLikedExperiences";
import { Link } from "react-router-dom";

export const ExportDropdown = () => {
  const { exportLikedExperiences, count } = useLikedExperiences();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="text-foreground hover:text-primary flex items-center gap-2 relative">
          <Heart className="w-4 h-4" />
          <span className="hidden sm:inline">Itinerary</span>
          {count > 0 && (
            <Badge variant="default" className="bg-red-500 hover:bg-red-600 text-white min-w-[20px] h-5 text-xs px-1">
              {count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <Link to="/itinerary">
          <DropdownMenuItem>
            <Eye className="w-4 h-4 mr-2" />
            View Itinerary
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
          <DollarSign className="w-4 h-4 mr-2" />
          Monetise (Coming Soon)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => exportLikedExperiences('xlsx')}>
          <Download className="w-4 h-4 mr-2" />
          Export as XLSX
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportLikedExperiences('txt')}>
          <Download className="w-4 h-4 mr-2" />
          Export as TXT
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportLikedExperiences('docx')}>
          <Download className="w-4 h-4 mr-2" />
          Export as DOCX
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};