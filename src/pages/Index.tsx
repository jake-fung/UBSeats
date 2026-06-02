import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import SpotMap from '@/components/SpotMap';
import { BuildingDetail } from '@/components/BuildingDetail';
import { BottomSheet } from '@/components/BottomSheet';

import { useMapState } from '@/hooks/useMapState';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/utils/cnUtils';

const Index = () => {
  const {
    activeFilters,
    selectedBuilding,
    isMenuOpened,
    setIsMenuOpened,
    showFilterBar,
    showSearch,
    loaderActive,
    buildings,
    isBuildingsLoading,
    handleFilterChange,
    handleBuildingSelect,
    handleSearchChange,
    handleSearchSubmit,
    handleSearchIconClicked,
    handleFilterIconClicked,
    handleTransitionEnd,
    mapLoaded,
    setMapLoaded,
  } = useMapState();

  const isMobile = useIsMobile();

  console.log(buildings);

  const building = selectedBuilding ?? undefined;
  const desktopShift = !isMobile && isMenuOpened;
  const mobileMenuOpened = isMobile && isMenuOpened;

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
              onSearchIconClicked={handleSearchIconClicked}
              onFilterIconClicked={handleFilterIconClicked}
              isMobile={isMobile}
              desktopShift={desktopShift}
              showSearch={showSearch}
              customWrapperCss={desktopShift ? 'md:left-[5vw] md:w-[201px]' : ''}
            />
            <FilterBar
              onFilterChange={handleFilterChange}
              activeFilters={activeFilters}
              mobileCustomWrapperCss={mobileMenuOpened || showSearch ? 'opacity-0 pointer-events-none' : ''}
              desktopCustomWrapperCss={desktopShift ? 'left-[5vw] w-[0px]' : ''}
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
                isMobile={isMobile}
              />
            </section>
          </main>

          {isMobile ? (
            <BottomSheet building={building} isOpen={isMenuOpened} onClose={() => setIsMenuOpened(false)} />
          ) : (
            <BuildingDetail
              building={building}
              isOpen={isMenuOpened}
              onClose={() => setIsMenuOpened(false)}
              onToggle={() => setIsMenuOpened((prev) => !prev)}
            />
          )}

          <footer
            className={cn(
              'fixed bottom-0 w-full justify-center text-center transition-all',
              desktopShift && 'left-[10vw] w-[30vw]',
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
