import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import SpotMap from '@/components/SpotMap';
import { SidePanel } from '@/components/SidePanel';
import { BottomSheet } from '@/components/BottomSheet';

import { useMapState } from '@/hooks/useMapState';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/utils/cnUtils';
import Utilities from '@/components/About';
import Favourites from '@/components/Favourites';
import DatePicker from '@/components/DatePicker';
import LocateButton from '@/components/LocateButton';

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
    appReady,
    handleFilterChange,
    handleBuildingSelect,
    handleSearchChange,
    handleClearSearch,
    handleSearchSubmit,
    handleSearchIconClicked,
    mapLoaded,
    setMapLoaded,
    userLocation,
    handleUserOutOfBounds,
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
            'fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-1000',
            appReady ? 'pointer-events-none opacity-0' : 'opacity-100',
          )}
        >
          <div className="loader"></div>
        </div>
      )}
      {!isBuildingsLoading && (
        <>
          <div className="fixed z-10">
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
              customWrapperCss={
                desktopShift ? 'left-[5vw] w-[201px]' : mobileMenuOpened ? 'w-[180px]' : 'md:left-[10vw] md:w-[80vw]'
              }
            />
            <FilterBar
              onFilterChange={handleFilterChange}
              activeFilters={activeFilters}
              customWrapperCss={mobileMenuOpened || isMenuOpened || showSearch ? 'opacity-0 pointer-events-none' : ''}
            />
          </div>

          <main className="h-dvh overflow-hidden">
            <SpotMap
              buildings={buildings}
              onBuildingSelect={handleBuildingSelect}
              selectedBuilding={building}
              isMenuOpened={isMenuOpened}
              mapLoaded={mapLoaded}
              setMapLoaded={setMapLoaded}
              isMobile={isMobile}
              userPosition={userLocation.position}
              onUserOutOfBounds={handleUserOutOfBounds}
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

          {/* wrap-reverse: on narrow phones the overflow line stacks above, never below the screen edge. */}
          <div className="fixed bottom-6 left-6 z-10 flex max-w-[calc(100vw-3rem)] flex-wrap-reverse items-center gap-4">
            <Utilities />
            <Favourites onFilterChange={handleFilterChange} activeFilters={activeFilters} />
            {userLocation.supported && <LocateButton enabled={userLocation.enabled} onToggle={userLocation.toggle} />}
            <DatePicker />
          </div>
        </>
      )}
    </div>
  );
};

export default Index;
