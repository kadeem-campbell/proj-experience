import { Button } from "@/components/ui/button";

const categories = [
  "All Experiences",
  "Party", 
  "Beach",
  "Food",
  "Wildlife", 
  "Water Sports",
  "Adventure",
  "Culture",
  "Nightlife"
];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "secondary"}
          onClick={() => onCategoryChange(category)}
          className={`whitespace-nowrap px-6 py-2 rounded-full transition-all duration-200 ${
            selectedCategory === category
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          }`}
        >
          {category}
        </Button>
      ))}
    </div>
  );
};