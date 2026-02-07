import { cn } from "@/lib/utils";

export type FilterOption = "experiences" | "itineraries";

interface ContentFilterToggleProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  className?: string;
}

export const ContentFilterToggle = ({
  activeFilter,
  onFilterChange,
  className
}: ContentFilterToggleProps) => {
  const options: { value: FilterOption; label: string }[] = [
    { value: "experiences", label: "Experiences" },
    { value: "itineraries", label: "Itineraries" },
  ];

  return (
    <div className={cn(
      "inline-flex items-center bg-muted/50 rounded-lg p-1",
      className
    )}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onFilterChange(option.value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
            activeFilter === option.value
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
