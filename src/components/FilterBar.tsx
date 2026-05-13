import React, { useState } from 'react';
import { Book, Coffee, SlidersHorizontal, Trees, Users, VolumeX, X } from 'lucide-react';
import { CategoryType, Filter } from '@/utils/types';
import { cn } from '@/utils/cnUtils';
import { useCategories } from '@/hooks/useStudySpots';
import { Skeleton } from './ui/skeleton';

interface FilterBarProps {
  onFilterChange: (filter: Filter) => void;
  activeFilters: Filter;
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange, activeFilters }) => {
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const iconMap = {
    Book: Book,
    Coffee: Coffee,
    VolumeX: VolumeX,
    Trees: Trees,
    Users: Users,
  };

  const handleCategoryClick = (categoryId: CategoryType) => {
    const newFilter = { ...activeFilters };
    if (newFilter.category === categoryId) {
      delete newFilter.category;
    } else {
      newFilter.category = categoryId;
    }
    onFilterChange(newFilter);
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  // Check if any filters are active
  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="sticky top-20 z-40 w-full bg-white px-4 pb-2 pt-2 shadow-soft backdrop-blur-md">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between px-3 pb-4 pt-2">
          <h2 className="text-xl font-semibold text-gray-800">Filter Study Spots</h2>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center text-sm text-gray-500 transition-colors hover:text-gray-800"
            >
              <X className="mr-1 h-4 w-4" />
              Clear filters
            </button>
          )}
        </div>

        <div className="scrollbar-hide flex justify-center space-x-2 overflow-x-auto pb-2">
          {categoriesLoading ? (
            // Show skeletons while loading
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-24 rounded-lg" />
              ))}
            </>
          ) : (
            // Show categories when loaded
            categories?.map((category) => {
              const isActive = activeFilters.category === category.id;
              const IconComponent = iconMap[category.icon as keyof typeof iconMap];

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={cn(
                    'my-2 flex w-20 flex-shrink-0 flex-col items-center justify-center rounded-lg px-4 py-2 transition-all duration-200 ease-out hover:scale-105 md:w-36',
                    isActive ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  )}
                >
                  {IconComponent && (
                    <IconComponent className={cn('mb-1 h-5 w-5', isActive ? 'text-white' : 'text-gray-500')} />
                  )}
                  <span className="hidden whitespace-nowrap font-medium md:block">{category.name}</span>
                </button>
              );
            })
          )}

          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={cn(
              'my-2 flex w-20 flex-shrink-0 flex-col items-center justify-center rounded-lg px-4 py-2 transition-all duration-200 hover:scale-105 md:w-36',
              showMoreFilters ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            )}
          >
            <SlidersHorizontal className={cn('mb-1 h-5 w-5', showMoreFilters ? 'text-white' : 'text-gray-500')} />
            <span className="hidden text-sm font-medium md:block">More Filters</span>
          </button>
        </div>

        {showMoreFilters && (
          <div className="slide-up mt-4 rounded-lg bg-gray-50 p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* More filter options would go here */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-700">Noise Level</h3>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      className={cn(
                        'flex h-20 w-20 items-center justify-center rounded-full text-lg font-bold',
                        activeFilters.noise === level
                          ? 'bg-primary text-white'
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100',
                      )}
                      onClick={() => onFilterChange({ ...activeFilters, noise: level })}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-700">WiFi Strength</h3>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      className={cn(
                        'flex h-20 w-20 items-center justify-center rounded-full text-lg font-bold',
                        activeFilters.wifi === level
                          ? 'bg-primary text-white'
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100',
                      )}
                      onClick={() => onFilterChange({ ...activeFilters, wifi: level })}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-700">Seating Availability</h3>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      className={cn(
                        'flex h-20 w-20 items-center justify-center rounded-full text-lg font-bold',
                        activeFilters.seating === level
                          ? 'bg-primary text-white'
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100',
                      )}
                      onClick={() => onFilterChange({ ...activeFilters, seating: level })}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
