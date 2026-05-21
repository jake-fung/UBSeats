import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useBuildings } from '@/hooks/useBuildings';
import type { Building, Filter } from '@/supabase/schema/types';

export const useMapState = () => {
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

  return {
    activeFilters,
    selectedBuilding,
    isMenuOpened,
    setIsMenuOpened,
    showFilterBar,
    loaderActive,
    buildings,
    isBuildingsLoading,
    handleFilterChange,
    handleBuildingSelect,
    handleSearchChange,
    handleSearchSubmit,
    handleFilterIconClicked,
    handleTransitionEnd,
  };
};
