import { BookOpen, Coffee, type LucideIcon } from 'lucide-react';
import { VenueKind } from '@/supabase/schema/types';

/** Kept in step with the category icons in CategoryTags.tsx. */
export const VENUE_ICONS: Record<VenueKind, LucideIcon> = {
  library: BookOpen,
  cafe: Coffee,
};
