import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import SpotDetail from '@/components/SpotDetail';
import SpotMap from '@/components/SpotMap';
import { useBuildings, useStudySpots } from '@/hooks/useStudySpots';
import { Filter, StudySpot } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/utils/cnUtils';

const Index = () => {
  const [activeFilters, setActiveFilters] = useState<Filter>({});
  const [selectedSpot, setSelectedSpot] = useState<StudySpot | null>(null);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const { toast } = useToast();

  const { buildings, isLoading: isBuildingsLoading, error: buildingsError } = useBuildings(activeFilters);

  console.log('buildings', buildings);

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

  const handleSpotSelect = (spot: StudySpot) => {
    setSelectedSpot(spot);
  };

  const handleCloseDetail = () => {
    setSelectedSpot(null);
  };

  const handleSearchChange = (query: string) => {
    if (!query) {
      setActiveFilters({ ...activeFilters, search: undefined });
      return;
    }

    setActiveFilters({ ...activeFilters, search: query });
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
          <Header onSearchChange={handleSearchChange} onFilterIconClicked={handleFilterIconClicked} />
          {showFilterBar && <FilterBar onFilterChange={handleFilterChange} activeFilters={activeFilters} />}
          <main>
            <section id="map">
              <SpotMap
                buildings={buildings}
                onSpotSelect={handleSpotSelect}
                selectedSpot={selectedSpot || undefined}
                className="h-screen w-screen"
              />
            </section>
          </main>
          {selectedSpot && <SpotDetail spot={selectedSpot} onClose={handleCloseDetail} />}

          <footer className="fixed bottom-0 w-full text-center">
            <div className="text-sm text-gray-400">&copy; {new Date().getFullYear()} UBSeats. All rights reserved.</div>
          </footer>
        </>
      )}
    </div>
  );
};

export default Index;
