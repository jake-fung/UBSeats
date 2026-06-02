import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useBuildings } from '@/hooks/useBuildings';
import { useSearch } from '@/hooks/useSearch';
import type { Building, Filter } from '@/supabase/schema/types';

export const useMapState = () => {
  const [activeFilters, setActiveFilters] = useState<Filter>({});
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [isMenuOpened, setIsMenuOpened] = useState(false);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [loaderActive, setLoaderActive] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  const { toast } = useToast();

  const search = useSearch({
    onQueryChange: () => {
      setSelectedBuilding(null);
      setIsMenuOpened(false);
    },
    onToggle: (isOpen) => {
      setShowFilterBar(isOpen);
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

  // Sync loader visibility when isBuildingsLoading changes to true
  useEffect(() => {
    if (isBuildingsLoading || !mapLoaded) {
      setLoaderActive(true);
    }
  }, [isBuildingsLoading, mapLoaded]);

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
  };

  const handleBuildingSelect = (building: Building) => {
    setSelectedBuilding(building);
    setIsMenuOpened(true);
    setShowFilterBar(false);
  };

  const handleFilterIconClicked = () => {
    setShowFilterBar((prev) => !prev);
    setSelectedBuilding(null);
    setIsMenuOpened(false);
  };

  const handleTransitionEnd = () => {
    if (!isBuildingsLoading && mapLoaded) {
      setLoaderActive(false);
    }
  };

  return {
    activeFilters,
    selectedBuilding,
    isMenuOpened,
    setIsMenuOpened,
    showFilterBar,
    showSearch: search.showSearch,
    searchQuery: search.searchQuery,
    loaderActive,
    buildings,
    isBuildingsLoading,
    handleFilterChange,
    handleBuildingSelect,
    handleSearchChange: search.handleSearchChange,
    handleClearSearch: search.handleClearSearch,
    handleSearchSubmit: search.handleSearchSubmit,
    handleSearchIconClicked: search.handleSearchIconClicked,
    handleFilterIconClicked,
    handleTransitionEnd,
    mapLoaded,
    setMapLoaded,
  };
};
