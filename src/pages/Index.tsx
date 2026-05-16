import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import SpotMap from '@/components/SpotMap';
import { useBuildings } from '@/hooks/useStudySpots';
import { Building, Filter } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/utils/cnUtils';
import { BuildingDetail } from '@/components/BuildingDetail';

const Index = () => {
  const [activeFilters, setActiveFilters] = useState<Filter>({});
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [isMenuOpened, setIsMenuOpened] = useState(false);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const { toast } = useToast();

  const { buildings, isLoading: isBuildingsLoading, error: buildingsError } = useBuildings(activeFilters);

  useEffect(() => {
    if (buildingsError) {
      toast({
        title: 'Error loading buildings',
        description: 'Could not load buildings data. Please try again later.',
        variant: 'destructive',
      });
    }
  }, [buildingsError, toast]);

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
  };

  const handleBuildingSelect = (building: Building) => {
    setSelectedBuilding(building);
    setIsMenuOpened(true);
  };

  const handleSearchChange = (query: string) => {
    if (!query) {
      setActiveFilters({ ...activeFilters, search: undefined });
      return;
    }

    setActiveFilters({ ...activeFilters, search: query });
  };

  const handleSearchSubmit = () => {
    if (buildings.length === 1) {
      setSelectedBuilding(buildings[0]);
      setIsMenuOpened(true);
    }
  };

  const handleIsMenuOpened = (isMenuOpened: boolean) => {
    setIsMenuOpened(isMenuOpened);
  };

  const handleFilterIconClicked = () => {
    setShowFilterBar(!showFilterBar);
  };

  return (
    <div className="overflow-y-hidden">
      <div
        id="loader_container"
        className={cn(
          'fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-white transition-opacity duration-1000',
          isBuildingsLoading ? 'opacity-100' : 'opacity-0',
        )}
        onTransitionEnd={() => {
          if (!isBuildingsLoading) {
            document.getElementById('loader_container')?.classList.add('hidden');
          }
        }}
      >
        <div className="loader"></div>
      </div>
      {!isBuildingsLoading && (
        <>
          <Header
            onSearchChange={handleSearchChange}
            onSearchSubmit={handleSearchSubmit}
            onFilterIconClicked={handleFilterIconClicked}
            customWrapperCss={isMenuOpened ? 'w-[40vw]' : ''}
          />
          {showFilterBar && <FilterBar onFilterChange={handleFilterChange} activeFilters={activeFilters} />}
          <main>
            <section id="map">
              <SpotMap
                buildings={buildings}
                onBuildingSelect={handleBuildingSelect}
                selectedBuilding={selectedBuilding}
                isMenuOpened={isMenuOpened}
              />
            </section>
          </main>
          <BuildingDetail
            building={selectedBuilding}
            isMenuOpened={isMenuOpened}
            setIsMenuOpened={handleIsMenuOpened}
          />

          <footer
            className={cn(
              'fixed bottom-0 w-full justify-center text-center transition-all duration-300 ease-in-out',
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
