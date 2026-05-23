import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import SpotMap from '@/components/SpotMap';
import { BuildingDetail } from '@/components/BuildingDetail';

import { useMapState } from '@/hooks/useMapState';
import { cn } from '@/utils/cnUtils';

const Index = () => {
  const {
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
    mapLoaded,
    setMapLoaded,
  } = useMapState();

  console.log(buildings);

  const building = selectedBuilding ?? undefined;

  return (
    <div className="overflow-y-hidden">
      {loaderActive && (
        <div
          id="loader_container"
          className={cn(
            'fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-white transition-opacity duration-1000',
            isBuildingsLoading ? 'opacity-100' : 'pointer-events-none opacity-0',
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
            <FilterBar
              onFilterChange={handleFilterChange}
              activeFilters={activeFilters}
              customWrapperCss={isMenuOpened ? 'w-[40vw]' : ''}
              isOpen={showFilterBar}
            />
          </header>

          <main>
            <section id="map">
              <SpotMap
                buildings={buildings}
                onBuildingSelect={handleBuildingSelect}
                selectedBuilding={building}
                isMenuOpened={isMenuOpened}
                showFilterBar={showFilterBar}
                mapLoaded={mapLoaded}
                setMapLoaded={setMapLoaded}
              />
            </section>
          </main>
          <BuildingDetail
            building={building}
            isOpen={isMenuOpened}
            onClose={() => setIsMenuOpened(false)}
            onToggle={() => setIsMenuOpened((prev) => !prev)}
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
