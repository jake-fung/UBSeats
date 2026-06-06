import { CalendarFold, Coffee, LucideIcon, VolumeX } from 'lucide-react';
import { CategoryType } from '@/supabase/schema/types';
import { cn } from '@/utils/cnUtils';

const ICON_MAP: Record<Exclude<CategoryType, 'library'>, LucideIcon> = {
  cafe: Coffee,
  quiet: VolumeX,
  bookable: CalendarFold,
};

interface CategoryIconProps {
  categoryId: string | undefined;
  className?: string;
}

const SingleCategoryIcon = ({ categoryId, className }: CategoryIconProps) => {
  const Icon = ICON_MAP[categoryId as Exclude<CategoryType, 'library'>];
  if (!Icon) return null;
  return <Icon className={cn('h-4 w-4 flex-shrink-0 text-primary', className)} />;
};

interface CategoryIconsProps {
  categoryIds: string[] | undefined;
  className?: string;
}

export const CategoryIcon = ({ categoryIds, className }: CategoryIconsProps) => {
  if (!categoryIds?.length) return null;
  return (
    <>
      {categoryIds.map((id) => (
        <SingleCategoryIcon key={id} categoryId={id} className={className} />
      ))}
    </>
  );
};
