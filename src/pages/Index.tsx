import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import SpotMap from '@/components/SpotMap';
import { SidePanel } from '@/components/SidePanel';
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
    showSearch,
    searchQuery,
    loaderActive,
    buildings,
    isBuildingsLoading,
    handleFilterChange,
    handleBuildingSelect,
    handleSearchChange,
    handleClearSearch,
    handleSearchSubmit,
    handleSearchIconClicked,
    handleTransitionEnd,
    mapLoaded,
    setMapLoaded,
  } = useMapState();

  const isMobile = useIsMobile();

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
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onSearchSubmit={handleSearchSubmit}
              onSearchIconClicked={handleSearchIconClicked}
              onClearSearch={handleClearSearch}
              isMobile={isMobile}
              isMenuOpened={isMenuOpened}
              desktopShift={desktopShift}
              showSearch={showSearch}
              customWrapperCss={desktopShift ? 'left-[5vw] w-[201px]' : mobileMenuOpened ? 'w-[180px]' : ''}
            />
            <FilterBar
              onFilterChange={handleFilterChange}
              activeFilters={activeFilters}
              customWrapperCss={mobileMenuOpened || isMenuOpened || showSearch ? 'opacity-0 pointer-events-none' : ''}
            />
          </header>

          <main className="h-screen overflow-hidden">
            <SpotMap
              buildings={buildings}
              onBuildingSelect={handleBuildingSelect}
              selectedBuilding={building}
              isMenuOpened={isMenuOpened}
              mapLoaded={mapLoaded}
              setMapLoaded={setMapLoaded}
              isMobile={isMobile}
            />
          </main>

          {isMobile ? (
            <BottomSheet building={building} isOpen={isMenuOpened} onClose={() => setIsMenuOpened(false)} />
          ) : (
            <SidePanel
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
