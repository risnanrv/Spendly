import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  HeartPulse,
  GraduationCap,
  Plane,
  CreditCard,
  Grid,
  Briefcase,
  Home,
  Shirt,
  Gift,
  Dumbbell,
  Coffee,
  Book,
  Gamepad2,
  Laptop,
  PawPrint,
  Wrench,
  Music,
  Tv,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  size?: number;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'utensils': Utensils,
  'car': Car,
  'shopping-bag': ShoppingBag,
  'receipt': Receipt,
  'film': Film,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'plane': Plane,
  'credit-card': CreditCard,
  'grid': Grid,
  'briefcase': Briefcase,
  'home': Home,
  'shirt': Shirt,
  'gift': Gift,
  'dumbbell': Dumbbell,
  'coffee': Coffee,
  'book': Book,
  'gamepad-2': Gamepad2,
  'laptop': Laptop,
  'paw-print': PawPrint,
  'wrench': Wrench,
  'music': Music,
  'tv': Tv,
  'sparkles': Sparkles,
};

export function CategoryIcon({ name, size = 16, className }: CategoryIconProps) {
  const IconComponent = iconMap[name] || HelpCircle;
  return <IconComponent size={size} className={className} />;
}
