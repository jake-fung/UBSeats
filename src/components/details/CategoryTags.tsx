import { CalendarFold, Coffee, LucideIcon, Presentation, VolumeX } from 'lucide-react';
import { CategoryType } from '@/supabase/schema/types';
import { cn } from '@/utils/cnUtils';

const ICON_MAP: Record<Exclude<CategoryType, 'library' | 'favourites' | 'open_buildings' | 'now_available_rooms'>, LucideIcon> = {
  quiet: VolumeX,
  bookable: CalendarFold,
  classroom: Presentation,
  cafe: Coffee,
};

const LABEL_MAP: Record<Exclude<CategoryType, 'library' | 'favourites' | 'open_buildings' | 'now_available_rooms'>, string> = {
  quiet: 'Quiet',
  bookable: 'Bookable',
  classroom: 'Classroom',
  cafe: 'Café',
};

interface CategoryIconProps {
  categoryId: string | undefined;
  className?: string;
}

const SingleCategoryTags = ({ categoryId, className }: CategoryIconProps) => {
  const Icon = ICON_MAP[categoryId as Exclude<CategoryType, 'library' | 'favourites' | 'open_buildings' | 'now_available_rooms'>];
  const Label = LABEL_MAP[categoryId as Exclude<CategoryType, 'library' | 'favourites' | 'open_buildings' | 'now_available_rooms'>];
  if (!Icon || !Label) return null;
  return (
    <span className="inline-flex items-center justify-between gap-1 rounded-full bg-primary/90 px-3 py-1 text-xs font-medium">
      <Icon className={cn('h-4 w-4 shrink-0 text-white', className)} />
      <span className="text-white">{Label}</span>
    </span>
  );
};

interface CategoryIconsProps {
  categoryIds: string[] | undefined;
  className?: string;
}

export const CategoryTags = ({ categoryIds, className }: CategoryIconsProps) => {
  if (!categoryIds?.length) return null;
  return (
    <>
      {categoryIds.map((id) => (
        <SingleCategoryTags key={id} categoryId={id} className={className} />
      ))}
    </>
  );
};
