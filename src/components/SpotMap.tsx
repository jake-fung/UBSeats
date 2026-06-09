import React, { useEffect, useRef } from 'react';
import { Building } from '@/supabase/schema/types';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { clearMarkers, createBuildingMarkerElement } from '@/utils/mapMarkerUtils';
import { getScreenHeight, getScreenWidth } from '@/utils/screenSizeUtils';

const FIT_BOUNDS_PADDING = { top: 150, bottom: 100, left: 200, right: 200 } as const;
const MOBILE_FIT_BOUNDS_PADDING = { top: 170, bottom: 100, left: 50, right: 50 } as const;
const FIT_BOUNDS_MAX_ZOOM = 16;
const BUILDING_DETAIL_PITCH = 60;
const BUILDING_DETAIL_ZOOM = 18;
const SIDEBAR_PADDING_RIGHT = getScreenWidth() / 2;
const SIDEBAR_PADDING_BOTTOM = getScreenHeight() / 2;

interface SpotMapProps {
  buildings: Building[];
  onBuildingSelect: (building: Building) => void;
  selectedBuilding?: Building;
  isMenuOpened: boolean;
  mapLoaded: boolean;
  setMapLoaded: (loaded: boolean) => void;
  isMobile: boolean;
}

const SpotMap: React.FC<SpotMapProps> = ({
  buildings,
  onBuildingSelect,
  selectedBuilding,
  isMenuOpened,
  mapLoaded,
  setMapLoaded,
  isMobile,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: import.meta.env.VITE_MAPBOX_STYLE_URL,
    });

    map.current.on('load', () => setMapLoaded(true));

    return () => {
      markers.current = clearMarkers(markers.current);
      map.current?.remove();
    };
  }, [setMapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    markers.current = clearMarkers(markers.current);

    const validBuildings = buildings.filter((b) => isFinite(b.lng) && isFinite(b.lat));

    validBuildings.forEach((building) => {
      const isSelected = selectedBuilding?.uuid === building.uuid;
      const el = createBuildingMarkerElement(building, isSelected, validBuildings.length);

      const marker = new mapboxgl.Marker(el).setLngLat([building.lng, building.lat]).addTo(map.current!);

      marker.getElement().addEventListener('click', () => onBuildingSelect(building));

      markers.current.push(marker);
    });

    if (validBuildings.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validBuildings.forEach((b) => bounds.extend([b.lng, b.lat]));
      map.current.fitBounds(bounds, {
        padding: isMobile ? MOBILE_FIT_BOUNDS_PADDING : FIT_BOUNDS_PADDING,
        maxZoom: FIT_BOUNDS_MAX_ZOOM,
      });
    }

    return () => {
      markers.current = clearMarkers(markers.current);
    };
  }, [buildings, selectedBuilding, mapLoaded, onBuildingSelect, setMapLoaded, isMobile]);

  useEffect(() => {
    if (!mapLoaded || !map.current || !selectedBuilding) return;
    if (!isFinite(selectedBuilding.lng) || !isFinite(selectedBuilding.lat)) return;

    if (isMenuOpened) {
      map.current.flyTo({
        center: [selectedBuilding.lng, selectedBuilding.lat],
        zoom: BUILDING_DETAIL_ZOOM,
        pitch: BUILDING_DETAIL_PITCH,
        essential: true,
        padding: !isMobile ? { right: SIDEBAR_PADDING_RIGHT } : { bottom: SIDEBAR_PADDING_BOTTOM },
      });
    } else {
      map.current.flyTo({
        center: [selectedBuilding.lng, selectedBuilding.lat],
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        essential: true,
        duration: 300,
      });
    }
  }, [isMenuOpened, mapLoaded, selectedBuilding, isMobile]);

  return (
    <div className="z-0 h-[calc(100vh+36px)] w-screen">
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
};

export default SpotMap;
