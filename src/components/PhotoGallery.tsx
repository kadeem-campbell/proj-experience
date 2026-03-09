import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PhotoGalleryProps {
  images: string[];
  title: string;
  className?: string;
}

export const PhotoGallery = ({ images, title, className }: PhotoGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!images || images.length === 0) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Single image - just show it
  if (images.length === 1) {
    return (
      <div className={cn("relative aspect-[16/10] overflow-hidden", className)}>
        <img 
          src={images[0]} 
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Scrollable gallery */}
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
        onScroll={(e) => {
          const el = e.currentTarget;
          const index = Math.round(el.scrollLeft / el.clientWidth);
          setSelectedIndex(index);
        }}
      >
        {images.map((img, index) => (
          <div 
            key={index}
            className="flex-shrink-0 w-full aspect-[16/10] snap-center rounded-xl overflow-hidden"
          >
            <img 
              src={img} 
              alt={`${title} - Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Navigation arrows - desktop only */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => handleScroll('left')}
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur items-center justify-center shadow-lg hover:bg-background transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur items-center justify-center shadow-lg hover:bg-background transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1 rounded-full bg-black/30 backdrop-blur">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                scrollRef.current?.scrollTo({
                  left: index * scrollRef.current.clientWidth,
                  behavior: 'smooth'
                });
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                selectedIndex === index ? "bg-white w-5" : "bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};
