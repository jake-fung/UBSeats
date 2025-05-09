import React, { useState } from "react";
import {
  Book,
  Coffee,
  SlidersHorizontal,
  Trees,
  Users,
  VolumeX,
  X,
} from "lucide-react";
import { CategoryType, Filter } from "@/utils/types";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/useStudySpots";
import { Skeleton } from "./ui/skeleton";

interface FilterBarProps {
  onFilterChange: (filter: Filter) => void;
  activeFilters: Filter;
}

const FilterBar: React.FC<FilterBarProps> = ({
  onFilterChange,
  activeFilters,
}) => {
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
    <div className="bg-white backdrop-blur-md shadow-soft sticky top-20 z-40 w-full pt-2 pb-2 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between pb-4 pt-2 px-3">
          <h2 className="text-xl font-semibold text-gray-800">
            Filter Study Spots
          </h2>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </button>
          )}
        </div>

        <div className="flex overflow-x-auto pb-2 justify-center scrollbar-hide space-x-2">
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
              const IconComponent =
                iconMap[category.icon as keyof typeof iconMap];

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={cn(
                    "flex-shrink-0 flex flex-col items-center justify-center rounded-lg my-2 py-2 px-4 hover:scale-105 transition-all duration-200 ease-out w-20 md:w-36",
                    isActive
                      ? "bg-primary text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {IconComponent && (
                    <IconComponent
                      className={cn(
                        "h-5 w-5 mb-1",
                        isActive ? "text-white" : "text-gray-500"
                      )}
                    />
                  )}
                  <span className=" font-medium whitespace-nowrap hidden md:block">
                    {category.name}
                  </span>
                </button>
              );
            })
          )}

          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={cn(
              "flex-shrink-0 flex flex-col items-center justify-center rounded-lg my-2 py-2 px-4 hover:scale-105 transition-all duration-200 w-20 md:w-36",
              showMoreFilters
                ? "bg-primary text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <SlidersHorizontal
              className={cn(
                "h-5 w-5 mb-1",
                showMoreFilters ? "text-white" : "text-gray-500"
              )}
            />
            <span className="text-sm font-medium hidden md:block">
              More Filters
            </span>
          </button>
        </div>

        {showMoreFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg slide-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* More filter options would go here */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-700">
                  Noise Level
                </h3>
                <div className="flex space-x-2 justify-center">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      className={cn(
                        "h-20 w-20 rounded-full flex items-center justify-center text-lg font-bold",
                        activeFilters.noise === level
                          ? "bg-primary text-white"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                      )}
                      onClick={() =>
                        onFilterChange({ ...activeFilters, noise: level })
                      }
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-700">
                  WiFi Strength
                </h3>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      className={cn(
                        "h-20 w-20 rounded-full flex items-center justify-center text-lg font-bold",
                        activeFilters.wifi === level
                          ? "bg-primary text-white"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                      )}
                      onClick={() =>
                        onFilterChange({ ...activeFilters, wifi: level })
                      }
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-700">
                  Seating Availability
                </h3>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      className={cn(
                        "h-20 w-20 rounded-full flex items-center justify-center text-lg font-bold",
                        activeFilters.seating === level
                          ? "bg-primary text-white"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                      )}
                      onClick={() =>
                        onFilterChange({ ...activeFilters, seating: level })
                      }
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
