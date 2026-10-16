import { Building2, Car, HelpCircle, Laptop, Package, Plane, UserCheck, type LucideIcon } from 'lucide-react';
import type { RequestCategory } from '@/types';

export const CATEGORY_ICONS: Record<RequestCategory, LucideIcon> = {
  asset: Laptop,
  facility: Building2,
  supplies: Package,
  transport: Car,
  travel: Plane,
  visitor: UserCheck,
  other: HelpCircle,
};
