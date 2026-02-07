import { useState, useEffect } from "react";
import { Globe, Zap, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface RotatingStatModuleProps {
  collapsed?: boolean;
}

export const RotatingStatModule = ({ collapsed = false }: RotatingStatModuleProps) => {
  const [currentStat, setCurrentStat] = useState(0);
  const [planningNow, setPlanningNow] = useState(0);
  const [itinerariesCreated, setItinerariesCreated] = useState(0);

  // Initialize stats with realistic values
  useEffect(() => {
    const getTimeBasedPlanning = () => {
      const hour = new Date().getHours();
      if (hour >= 10 && hour <= 14) return Math.floor(Math.random() * 80) + 180;
      if (hour >= 18 && hour <= 22) return Math.floor(Math.random() * 100) + 200;
      if (hour >= 6 && hour < 10) return Math.floor(Math.random() * 60) + 120;
      if (hour > 14 && hour < 18) return Math.floor(Math.random() * 70) + 150;
      return Math.floor(Math.random() * 50) + 60;
    };

    setPlanningNow(getTimeBasedPlanning());

    const daysSinceLaunch = Math.floor((Date.now() - new Date('2026-02-01').getTime()) / (1000 * 60 * 60 * 24));
    const baseTrips = 1231 + (daysSinceLaunch * 15);
    setItinerariesCreated(baseTrips + Math.floor(Math.random() * 10));

    const statsInterval = setInterval(() => {
      setPlanningNow(prev => {
        const hour = new Date().getHours();
        const bias = (hour >= 8 && hour <= 21) ? 2 : -2;
        const delta = Math.floor(Math.random() * 31) - 15 + bias;
        return Math.max(50, Math.min(350, prev + delta));
      });

      setItinerariesCreated(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 4000);

    return () => clearInterval(statsInterval);
  }, []);

  // Rotate through stats every 3 seconds
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setCurrentStat(prev => (prev + 1) % 3);
    }, 3000);

    return () => clearInterval(rotationInterval);
  }, []);

  const stats = [
    {
      icon: Users,
      value: planningNow.toLocaleString(),
      label: "planning now",
      color: "text-success",
      pulse: true,
    },
    {
      icon: Globe,
      value: "5",
      label: "destinations",
      color: "text-muted-foreground",
      pulse: false,
    },
    {
      icon: Zap,
      value: itinerariesCreated.toLocaleString() + "+",
      label: "trips created",
      color: "text-activity",
      pulse: false,
    },
  ];

  const current = stats[currentStat];
  const Icon = current.icon;

  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-300",
      collapsed ? "justify-center" : ""
    )}>
      {current.pulse && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
        </span>
      )}
      {!current.pulse && (
        <Icon className={cn("w-4 h-4 shrink-0", current.color)} />
      )}
      {!collapsed && (
        <span className={cn("text-xs font-medium tabular-nums whitespace-nowrap", current.color)}>
          {current.value} <span className="text-muted-foreground">{current.label}</span>
        </span>
      )}
    </div>
  );
};
