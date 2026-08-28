import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useBuildings } from '@/hooks/useBuildings';
import { useSearch } from '@/hooks/useSearch';
import type { Building, Filter } from '@/supabase/schema/types';

export const useMapState = () => {
  const [activeFilters, setActiveFilters] = useState<Filter>({});
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [isMenuOpened, setIsMenuOpened] = useState(false);
  const [loaderDismissed, setLoaderDismissed] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const { toast } = useToast();

  const search = useSearch({
    onQueryChange: () => {
      setSelectedBuilding(null);
      setIsMenuOpened(false);
    },
    onToggle: () => {
      setSelectedBuilding(null);
      setIsMenuOpened(false);
    },
    onSubmit: () => {
      if (buildings.length === 1) {
        setSelectedBuilding(buildings[0]);
        search.setShowSearch(false);
        setIsMenuOpened(true);
      }
    },
  });

  const {
    buildings,
    isLoading: isBuildingsLoading,
    error: buildingsError,
  } = useBuildings(activeFilters, search.searchQuery);

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
        duration: 2000,
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

  const appReady = !isBuildingsLoading && mapLoaded;

  useEffect(() => {
    if (!appReady) return;
    const timeout = setTimeout(() => setLoaderDismissed(true), 1000);
    return () => clearTimeout(timeout);
  }, [appReady]);

  return {
    activeFilters,
    selectedBuilding,
    isMenuOpened,
    setIsMenuOpened,
    showSearch: search.showSearch,
    searchQuery: search.searchQuery,
    loaderActive: !loaderDismissed,
    buildings,
    isBuildingsLoading,
    appReady,
    handleFilterChange,
    handleBuildingSelect,
    handleSearchChange: search.handleSearchChange,
    handleClearSearch: search.handleClearSearch,
    handleSearchSubmit: search.handleSearchSubmit,
    handleSearchIconClicked: search.handleSearchIconClicked,
    mapLoaded,
    setMapLoaded,
  };
};
