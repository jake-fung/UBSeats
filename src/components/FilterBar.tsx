import React from 'react';
import { Book, CalendarFold, Coffee, VolumeX, X } from 'lucide-react';
import { CategoryType, Filter } from '@/supabase/schema/types';
import { cn } from '@/utils/cnUtils';
import { useCategories } from '@/hooks/useBuildings';
import { Skeleton } from './ui/skeleton';

const ICON_MAP = {
  Book,
  Coffee,
  VolumeX,
  CalendarFold,
} as const;

const SKELETON_COUNT = 6;

interface FilterBarProps {
  onFilterChange: (filter: Filter) => void;
  activeFilters: Filter;
  customWrapperCss?: string;
  isOpen?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange, activeFilters, customWrapperCss, isOpen = true }) => {
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const handleCategoryClick = (categoryId: CategoryType) => {
    const category = activeFilters.category === categoryId ? undefined : categoryId;
    onFilterChange({ ...activeFilters, category });
  };

  return (
    <div
      className={cn(
        'fixed left-[10vw] top-12 h-auto w-[80vw] rounded-b-[30px] bg-white px-4 pb-2 pt-2 shadow-soft backdrop-blur-md transition-all',
        customWrapperCss,
      )}
    >
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="mx-auto">
            <div className="flex items-center justify-between px-3 pt-12">
              <h2 className="text-xl font-semibold text-gray-800">Apply Filters</h2>

              {Object.keys(activeFilters).length > 0 && (
                <button
                  onClick={() => onFilterChange({})}
                  className="flex items-center text-sm text-gray-500 transition-colors hover:text-gray-800"
                >
                  <X className="mr-1 h-4 w-4" />
                  Clear filters
                </button>
              )}
            </div>

            <div className="scrollbar-hide flex justify-center space-x-2 overflow-x-auto pb-2">
              {categoriesLoading ? (
                <>
                  {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                    <Skeleton key={i} className="h-16 w-32 rounded-lg" />
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
                        'my-2 flex w-40 flex-shrink-0 flex-col items-center justify-center rounded-lg px-4 py-2 transition-all duration-200 ease-out hover:scale-105',
                        isActive ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                      )}
                    >
                      <IconComponent className={cn('mb-1 h-6 w-6', isActive ? 'text-white' : 'text-gray-500')} />
                      <span className="hidden whitespace-nowrap font-medium md:block">{category.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
