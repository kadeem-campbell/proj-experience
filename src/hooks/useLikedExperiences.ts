import { useState, useEffect } from 'react';

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

export interface LikedExperience {
  id: string;
  title: string;
  creator: string;
  videoThumbnail: string;
  category: string;
  location: string;
  price: string;
  likedAt: string;
  // Planning fields
  notes?: string;
  scheduledTime?: string;
  estimatedDuration?: number; // in minutes
  timeSlot?: TimeSlot; // Suggested time of day for auto-scheduling
}

const STORAGE_KEY = 'likedExperiences';

export const useLikedExperiences = () => {
  const [likedExperiences, setLikedExperiences] = useState<LikedExperience[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setLikedExperiences(JSON.parse(stored));
    }

    // Listen for storage changes to update count in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setLikedExperiences(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events for same-tab updates
    const handleCustomEvent = (e: CustomEvent) => {
      setLikedExperiences(e.detail);
    };

    window.addEventListener('likedExperiencesChanged', handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('likedExperiencesChanged', handleCustomEvent as EventListener);
    };
  }, []);

  const toggleLike = (experience: Omit<LikedExperience, 'likedAt'>) => {
    const isLiked = likedExperiences.some(exp => exp.id === experience.id);
    
    let newLikedExperiences: LikedExperience[];
    
    if (isLiked) {
      newLikedExperiences = likedExperiences.filter(exp => exp.id !== experience.id);
    } else {
      const likedExperience: LikedExperience = {
        ...experience,
        likedAt: new Date().toISOString()
      };
      newLikedExperiences = [...likedExperiences, likedExperience];
    }
    
    setLikedExperiences(newLikedExperiences);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLikedExperiences));
    
    // Dispatch custom event for same-tab real-time updates
    window.dispatchEvent(new CustomEvent('likedExperiencesChanged', { detail: newLikedExperiences }));
    
    return !isLiked;
  };

  const isLiked = (experienceId: string) => {
    return likedExperiences.some(exp => exp.id === experienceId);
  };

  const exportLikedExperiences = (format: 'csv' | 'txt' | 'docx') => {
    const dateStr = new Date().toISOString().split('T')[0];
    
    if (format === 'csv') {
      // Use safe CSV export instead of xlsx library (which has vulnerabilities)
      const headers = ['Title', 'Creator', 'Location', 'Price', 'Category', 'Liked At'];
      const escapeCSV = (value: string) => {
        // Escape quotes and wrap in quotes if contains comma, newline, or quotes
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };
      const rows = likedExperiences.map(exp => [
        escapeCSV(exp.title),
        escapeCSV(exp.creator),
        escapeCSV(exp.location),
        escapeCSV(exp.price),
        escapeCSV(exp.category),
        escapeCSV(new Date(exp.likedAt).toLocaleDateString())
      ].join(','));
      
      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `liked-experiences-${dateStr}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'txt') {
      const txtContent = likedExperiences.map(exp => 
        `${exp.title}\nCreator: ${exp.creator}\nLocation: ${exp.location}\nPrice: ${exp.price}\nCategory: ${exp.category}\nLiked on: ${new Date(exp.likedAt).toLocaleDateString()}\n\n`
      ).join('---\n\n');
      
      const blob = new Blob([txtContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `liked-experiences-${dateStr}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'docx') {
      import('docx').then(({ Document, Paragraph, TextRun, Packer }) => {
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              new Paragraph({
                children: [new TextRun({ text: "My Liked Experiences", bold: true, size: 32 })]
              }),
              ...likedExperiences.flatMap(exp => [
                new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }),
                new Paragraph({
                  children: [new TextRun({ text: exp.title, bold: true, size: 24 })]
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Creator: ${exp.creator}` })]
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Location: ${exp.location}` })]
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Price: ${exp.price}` })]
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Category: ${exp.category}` })]
                }),
                new Paragraph({
                  children: [new TextRun({ text: `Liked on: ${new Date(exp.likedAt).toLocaleDateString()}` })]
                })
              ])
            ]
          }]
        });

        Packer.toBlob(doc).then(blob => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `liked-experiences-${dateStr}.docx`;
          link.click();
          URL.revokeObjectURL(url);
        });
      });
    }
  };

  return {
    likedExperiences,
    toggleLike,
    isLiked,
    exportLikedExperiences,
    count: likedExperiences.length
  };
};