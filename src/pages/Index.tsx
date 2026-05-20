import { useEffect, useState } from 'react';

import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import SpotMap from '@/components/SpotMap';
import { BuildingDetail } from '@/components/BuildingDetail';

import { useBuildings } from '@/hooks/useBuildings';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/utils/cnUtils';

import type { Building, Filter } from '@/supabase/schema/types';

const Index = () => {
  const [activeFilters, setActiveFilters] = useState<Filter>({});
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [isMenuOpened, setIsMenuOpened] = useState(false);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [loaderActive, setLoaderActive] = useState(true);

  const { toast } = useToast();
  const { buildings, isLoading: isBuildingsLoading, error: buildingsError } = useBuildings(activeFilters);

  // Sync loader visibility when isBuildingsLoading changes to true
  useEffect(() => {
    if (isBuildingsLoading) {
      setLoaderActive(true);
    }
  }, [isBuildingsLoading]);

  // Handle toast notifications for building loading errors
  useEffect(() => {
    if (buildingsError) {
      toast({
        title: 'Error loading buildings',
        description: 'Could not load buildings data. Please try again later.',
        variant: 'destructive',
      });
    }
  }, [buildingsError, toast]);

  // Notify the user if no buildings match the active filters
  useEffect(() => {
    if (!isBuildingsLoading && !buildingsError && buildings.length === 0) {
      toast({
        title: 'No buildings found',
        description: 'Could not find any buildings. Please adjust your filters.',
        variant: 'default',
      });
    }
  }, [buildings.length, isBuildingsLoading, buildingsError, toast]);

  const handleFilterChange = (filters: Filter) => {
    setActiveFilters(filters);
    setSelectedBuilding(null);
    setIsMenuOpened(false);
  };

  const handleBuildingSelect = (building: Building) => {
    setSelectedBuilding(building);
    setIsMenuOpened(true);
  };

  const handleSearchChange = (query: string) => {
    setSelectedBuilding(null);
    setIsMenuOpened(false);
    setActiveFilters((prev) => ({
      ...prev,
      search: query || undefined,
    }));
  };

  const handleSearchSubmit = () => {
    if (buildings.length === 1) {
      setSelectedBuilding(buildings[0]);
      setIsMenuOpened(true);
    }
  };

  const handleFilterIconClicked = () => {
    setShowFilterBar((prev) => !prev);
    setIsMenuOpened(false);
  };

  const handleTransitionEnd = () => {
    if (!isBuildingsLoading) {
      setLoaderActive(false);
    }
  };

  return (
    <div className="overflow-y-hidden">
      {loaderActive && (
        <div
          id="loader_container"
          className={cn(
            'fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-white transition-opacity duration-1000',
            isBuildingsLoading ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
          onTransitionEnd={handleTransitionEnd}
        >
          <div className="loader"></div>
        </div>
      )}
      {!isBuildingsLoading && (
        <>
          <header className="fixed z-10">
            <Header
              onSearchChange={handleSearchChange}
              onSearchSubmit={handleSearchSubmit}
              onFilterIconClicked={handleFilterIconClicked}
              customWrapperCss={isMenuOpened ? 'w-[40vw]' : ''}
            />
            {showFilterBar && (
              <FilterBar
                onFilterChange={handleFilterChange}
                activeFilters={activeFilters}
                customWrapperCss={isMenuOpened ? 'w-[40vw]' : ''}
              />
            )}
          </header>

          <main>
            <section id="map">
              <SpotMap
                buildings={buildings}
                onBuildingSelect={handleBuildingSelect}
                selectedBuilding={selectedBuilding || undefined}
                isMenuOpened={isMenuOpened}
              />
            </section>
          </main>
          <BuildingDetail
            building={selectedBuilding || undefined}
            isMenuOpened={isMenuOpened}
            setIsMenuOpened={setIsMenuOpened}
          />

          <footer
            className={cn(
              'fixed bottom-0 w-full justify-center text-center transition-all',
              isMenuOpened && 'left-[10vw] w-[40vw]',
            )}
          >
            <div className="text-sm text-gray-400">&copy; {new Date().getFullYear()} UBSeats. All rights reserved.</div>
          </footer>
        </>
      )}
    </div>
  );
};

export default Index;

