import React from 'react';
import { Book, CalendarFold, Clock, Coffee, Heart, Presentation, VolumeX } from 'lucide-react';
import { CategoryType, Filter } from '@/supabase/schema/types';
import { cn } from '@/utils/cnUtils';
import { useCategories } from '@/hooks/useBuildings';
import { Skeleton } from './ui/skeleton';

const ICON_MAP = {
  Book,
  Coffee,
  VolumeX,
  CalendarFold,
  Presentation,
  Clock,
  Heart,
} as const;

const SKELETON_COUNT = 4;

interface FilterBarProps {
  onFilterChange: (filter: Filter) => void;
  activeFilters: Filter;
  customWrapperCss?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  onFilterChange,
  activeFilters,
  customWrapperCss: mobileCustomWrapperCss,
}) => {
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const handleCategoryClick = (categoryId: CategoryType) => {
    const category = activeFilters.category === categoryId ? undefined : categoryId;
    onFilterChange({ ...activeFilters, category });
  };

  return (
    <div
      className={cn(
        'pointer-events-auto fixed top-[85px] z-10 w-full opacity-100 transition-all duration-300 ease-in-out',
        mobileCustomWrapperCss,
      )}
    >
      <div className="no-scrollbar flex items-center gap-2 overflow-x-scroll px-6 py-2 md:px-[10vw]">
        {categoriesLoading ? (
          <>
            {Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <Skeleton key={i} className="h-8 w-20 flex-shrink-0 rounded-full" />
            ))}
          </>
        ) : (
          categories?.map((category) => {
            const isActive = activeFilters.category === category.id;
            const IconComponent = ICON_MAP[category.icon as keyof typeof ICON_MAP] || Book;

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={cn(
                  'flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium shadow-sm transition-all duration-200 ease-out active:scale-95',
                  isActive ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100',
                )}
              >
                <IconComponent className={cn('h-3.5 w-3.5', isActive ? 'text-white' : 'text-gray-500')} />
                <span className="whitespace-nowrap">{category.name}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FilterBar;
