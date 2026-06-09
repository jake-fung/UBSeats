import { CalendarFold, Coffee, LucideIcon, VolumeX } from 'lucide-react';
import { CategoryType } from '@/supabase/schema/types';
import { cn } from '@/utils/cnUtils';

const ICON_MAP: Record<Exclude<CategoryType, 'library'>, LucideIcon> = {
  cafe: Coffee,
  quiet: VolumeX,
  bookable: CalendarFold,
};

const LABEL_MAP: Record<Exclude<CategoryType, 'library'>, string> = {
  cafe: 'Café',
  quiet: 'Silent Study',
  bookable: 'Bookable',
};

interface CategoryIconProps {
  categoryId: string | undefined;
  className?: string;
}

const SingleCategoryTags = ({ categoryId, className }: CategoryIconProps) => {
  const Icon = ICON_MAP[categoryId as Exclude<CategoryType, 'library'>];
  const Label = LABEL_MAP[categoryId as Exclude<CategoryType, 'library'>];
  if (!Icon || !Label) return null;
  return (
    <span className="inline-flex items-center justify-between gap-1 rounded-full bg-primary/90 px-3 py-1 text-xs font-medium">
      <Icon className={cn('h-4 w-4 flex-shrink-0 text-white', className)} />
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
