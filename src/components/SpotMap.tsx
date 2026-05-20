import React, { useEffect, useRef, useState } from 'react';
import { Building } from '@/supabase/schema/types';
import { cn } from '@/utils/cnUtils';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const FIT_BOUNDS_PADDING = { top: 150, bottom: 100, left: 200, right: 200 } as const;
const FIT_BOUNDS_MAX_ZOOM = 16;
const BUILDING_DETAIL_PITCH = 60;
const BUILDING_DETAIL_ZOOM = 18;
const SIDEBAR_PADDING_RIGHT = 700;

function createBuildingMarkerElement(
  building: Building,
  isSelected: boolean,
  buildingCount: number,
): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex flex-col items-center cursor-pointer z-5';

  const pill = document.createElement('div');
  pill.className =
    'relative text-black font-bold bg-white/90 py-1/2 px-2 rounded-md shadow-lg border-2 border-primary pr-6';
  pill.textContent = building.code;

  const countBadge = document.createElement('div');
  countBadge.className =
    'absolute top-0 right-0 text-xs font-medium text-white bg-primary rounded-r-sm w-5 h-full flex items-center justify-center';
  countBadge.textContent = building.rooms.length.toString();

  pill.appendChild(countBadge);
  wrapper.appendChild(pill);

  const label = document.createElement('div');
  label.className = cn(
    'absolute top-full left-1/2 -translate-x-1/2 mt-1 text-md font-medium text-white whitespace-nowrap pointer-events-none',
    buildingCount > 10 && !isSelected && 'hidden',
  );
  label.textContent = building.name;
  wrapper.appendChild(label);

  if (buildingCount > 10 && !isSelected) {
    wrapper.addEventListener('mouseenter', () => label.classList.remove('hidden'));
    wrapper.addEventListener('mouseleave', () => label.classList.add('hidden'));
  }

  return wrapper;
}

function clearMarkers(markersRef: React.MutableRefObject<mapboxgl.Marker[]>) {
  markersRef.current.forEach((marker) => marker.remove());
  markersRef.current = [];
}

interface SpotMapProps {
  buildings: Building[];
  onBuildingSelect: (building: Building) => void;
  selectedBuilding?: Building;
  isMenuOpened: boolean;
}

const SpotMap: React.FC<SpotMapProps> = ({
  buildings,
  onBuildingSelect,
  selectedBuilding,
  isMenuOpened,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: import.meta.env.VITE_MAPBOX_STYLE_URL,
    });

    map.current.on('load', () => setMapLoaded(true));

    return () => {
      clearMarkers(markers);
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    clearMarkers(markers);

    buildings.forEach((building) => {
      const isSelected = selectedBuilding?.uuid === building.uuid;
      const el = createBuildingMarkerElement(building, isSelected, buildings.length);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([building.lng, building.lat])
        .addTo(map.current!);

      marker.getElement().addEventListener('click', () => onBuildingSelect(building));

      markers.current.push(marker);
    });

    if (buildings.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      buildings.forEach((b) => bounds.extend([b.lng, b.lat]));
      map.current.fitBounds(bounds, {
        padding: FIT_BOUNDS_PADDING,
        maxZoom: FIT_BOUNDS_MAX_ZOOM,
      });
    }

    return () => clearMarkers(markers);
  }, [buildings, selectedBuilding, mapLoaded, onBuildingSelect]);

  useEffect(() => {
    if (!mapLoaded || !map.current || !selectedBuilding) return;

    if (isMenuOpened) {
      map.current.flyTo({
        center: [selectedBuilding.lng, selectedBuilding.lat],
        zoom: BUILDING_DETAIL_ZOOM,
        pitch: BUILDING_DETAIL_PITCH,
        essential: true,
        padding: { right: SIDEBAR_PADDING_RIGHT },
      });
    } else {
      map.current.flyTo({
        center: [selectedBuilding.lng, selectedBuilding.lat],
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        essential: true,
        duration: 300,
      });
    }
  }, [isMenuOpened, mapLoaded, selectedBuilding]);

  return (
    <div className="z-0 h-screen w-screen overflow-hidden">
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
};

export default SpotMap;
