import React from 'react';
import {
  Book,
  Building2,
  CalendarFold,
  CheckCircle,
  Coffee,
  Heart,
  Monitor,
  Presentation,
  VolumeX,
} from 'lucide-react';
import { CategoryType, Filter } from '@/supabase/schema';
import { cn } from '@/utils/cnUtils';
import { isNowOnlyCategory, useCategories } from '@/hooks/useBuildings';
import { useSelectedDate } from '@/hooks/useSelectedDate';
import { Skeleton } from './ui/skeleton';
import { Chip } from './ui/chip';

const ICON_MAP = {
  Book,
  Building2,
  Coffee,
  VolumeX,
  CalendarFold,
  Presentation,
  CheckCircle,
  Heart,
  Monitor,
} as const;

const SKELETON_COUNT = 4;

interface FilterBarProps {
  onFilterChange: (filter: Filter) => void;
  activeFilters: Filter;
  /** Faded out behind an open panel or the search drawer: also taken out of the Tab order. */
  isHidden?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange, activeFilters, isHidden = false }) => {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { isToday } = useSelectedDate();
  const visibleCategories = isToday ? categories : categories?.filter((category) => !isNowOnlyCategory(category.id));

  const handleCategoryClick = (categoryId: CategoryType) => {
    const category = activeFilters.category === categoryId ? undefined : categoryId;
    onFilterChange({ ...activeFilters, category });
  };

  return (
    <div
      inert={isHidden}
      className={cn(
        'pointer-events-auto fixed top-21.25 z-10 w-full opacity-100 transition-all duration-300 ease-in-out',
        isHidden && 'pointer-events-none opacity-0',
      )}
    >
      <div className="no-scrollbar flex items-center gap-2 overflow-x-scroll px-6 py-2 md:px-[10vw]">
        {categoriesLoading ? (
          <>
            {Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
            ))}
          </>
        ) : (
          visibleCategories?.map((category) => {
            const isActive = activeFilters.category === category.id;
            const IconComponent = ICON_MAP[category.icon as keyof typeof ICON_MAP] || Book;

            return (
              <Chip
                key={category.id}
                tone="filled"
                pressed={isActive}
                icon={IconComponent}
                onClick={() => handleCategoryClick(category.id)}
              >
                <span className="whitespace-nowrap">{category.name}</span>
              </Chip>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FilterBar;
