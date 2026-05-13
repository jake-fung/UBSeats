import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import SpotDetail from '@/components/SpotDetail';
import SpotMap from '@/components/SpotMap';
import { useBuildings, useStudySpots } from '@/hooks/useStudySpots';
import { Filter, StudySpot } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeFilters, setActiveFilters] = useState<Filter>({});
  const [selectedSpot, setSelectedSpot] = useState<StudySpot | null>(null);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const { toast } = useToast();

  const { spots: filteredSpots, isLoading, error } = useStudySpots(activeFilters);

  const { buildings, isLoading: buildingsLoading, error: buildingsError } = useBuildings();

  useEffect(() => {
    if (buildingsError) {
      toast({
        title: 'Error loading buildings',
        description: 'Could not load buildings data. Please try again later.',
        variant: 'destructive',
      });
    }
  }, [buildingsError, toast]);

  console.log(buildings);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading study spots',
        description: 'Could not load study spots data. Please try again later.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

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
    <div className="max-h-screen overflow-y-hidden bg-gray-50">
      {/* {isLoading && (
        <div className="flex h-screen flex-col items-center justify-center py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600">Loading study spots...</p>
        </div>
      )}
      {!isLoading && ( */}
      <>
        <Header onSearchChange={handleSearchChange} onFilterIconClicked={handleFilterIconClicked} />
        {showFilterBar && <FilterBar onFilterChange={handleFilterChange} activeFilters={activeFilters} />}
        <main>
          {/* {filteredSpots.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-6 text-2xl font-bold text-gray-900">Featured Study Spot</h2>
                <SpotCard spot={filteredSpots[0]} onClick={() => handleSpotSelect(filteredSpots[0])} featured={true} />
              </section>
            )} */}

          <section id="map">
            <SpotMap
              spots={filteredSpots}
              onSpotSelect={handleSpotSelect}
              selectedSpot={selectedSpot || undefined}
              className="h-screen w-screen"
            />
          </section>
          {/* 
            <section id="spots" className="mb-12">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">All Study Spots</h2>

              {filteredSpots.length === 0 ? (
                <div className="rounded-lg bg-gray-50 py-12 text-center">
                  <Search className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-xl font-medium text-gray-700">No study spots found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search criteria</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredSpots.map((spot) => (
                    <SpotCard key={spot.id} spot={spot} onClick={() => handleSpotSelect(spot)} />
                  ))}
                </div>
              )}
            </section> */}
        </main>

        <footer className="fixed bottom-0 w-full text-center text-white">
          <div className="text-sm text-gray-400">&copy; {new Date().getFullYear()} UBSeats. All rights reserved.</div>
        </footer>
      </>
      {/* )} */}
      {selectedSpot && <SpotDetail spot={selectedSpot} onClose={handleCloseDetail} />}
    </div>
  );
};

export default Index;
