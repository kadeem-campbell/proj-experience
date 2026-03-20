import { Sunrise, Sun, Sunset, Moon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const iconComponents = {
  sunrise: Sunrise,
  sun: Sun,
  sunset: Sunset,
  moon: Moon,
  flexible: Clock,
  mixed: Clock,
} as const;

interface TimingIconProps {
  icon: string;
  className?: string;
}

export const TimingIcon = ({ icon, className }: TimingIconProps) => {
  const Icon = iconComponents[icon as keyof typeof iconComponents] || Sun;
  return <Icon className={cn("w-4 h-4", className)} />;
};
