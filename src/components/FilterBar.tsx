import React from 'react';
import { Book, CalendarFold, Coffee, VolumeX } from 'lucide-react';
import { CategoryType, Filter } from '@/supabase/schema/types';
import { cn } from '@/utils/cnUtils';
import { useCategories } from '@/hooks/useBuildings';
import { Skeleton } from './ui/skeleton';
import { useIsMobile } from '@/hooks/useIsMobile';

const ICON_MAP = {
  Book,
  Coffee,
  VolumeX,
  CalendarFold,
} as const;

const SKELETON_COUNT = 4;

interface FilterBarProps {
  onFilterChange: (filter: Filter) => void;
  activeFilters: Filter;
  mobileCustomWrapperCss?: string;
  desktopCustomWrapperCss?: string;
  isOpen?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  onFilterChange,
  activeFilters,
  mobileCustomWrapperCss,
  desktopCustomWrapperCss,
  isOpen = true,
}) => {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const isMobile = useIsMobile();

  const handleCategoryClick = (categoryId: CategoryType) => {
    const category = activeFilters.category === categoryId ? undefined : categoryId;
    onFilterChange({ ...activeFilters, category });
  };

  if (isMobile) {
    return (
      <div
        className={cn(
          'pointer-events-auto fixed top-[80px] z-10 w-full opacity-100 transition-all duration-300 ease-in-out',
          mobileCustomWrapperCss,
        )}
      >
        <div className="no-scrollbar flex items-center gap-2 overflow-x-scroll px-6 py-2">
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
  }

  return (
    <div
      className={cn(
        'fixed left-[10vw] top-12 h-auto w-[80vw] rounded-b-[30px] bg-white px-4 pb-2 pt-2 shadow-soft backdrop-blur-md transition-all duration-300',
        desktopCustomWrapperCss,
      )}
    >
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="scrollbar-hide flex justify-center space-x-2 overflow-x-auto pb-2 pt-12">
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
  );
};

export default FilterBar;
