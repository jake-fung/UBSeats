import React, { useEffect, useRef, useState } from 'react';
import { StudySpot, Building } from '@/utils/types';
import { X } from 'lucide-react';
import { cn } from '@/utils/cnUtils';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { isSpotOpenNow } from '@/utils/timeUtils';

interface SpotMapProps {
  buildings: Building[];
  onBuildingSelect: (building: Building) => void;
  selectedBuilding?: Building;
  isMenuOpened: boolean;
}

const SpotMap: React.FC<SpotMapProps> = ({ buildings, onBuildingSelect, selectedBuilding, isMenuOpened }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: import.meta.env.VITE_MAPBOX_STYLE_URL,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      markers.current.forEach((marker) => marker.remove());
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    buildings.forEach((building) => {
      const isSelected = selectedBuilding?.uuid === building.uuid;
      const el = document.createElement('div');
      el.className = 'flex flex-col items-center cursor-pointer z-5';

      const markerDiv = document.createElement('div');
      markerDiv.className = 'text-black font-bold bg-white/90 py-1/2 px-2 rounded-md shadow-lg border-2 border-primary';
      markerDiv.textContent = building.code;
      el.appendChild(markerDiv);

      const marker = new mapboxgl.Marker(el).setLngLat([building.lng, building.lat]).addTo(map.current);

      marker.getElement().addEventListener('click', () => {
        onBuildingSelect?.(building);
      });

      const nameDiv = document.createElement('div');
      nameDiv.id = 'marker-name-label';
      nameDiv.className = cn(
        'absolute top-full left-1/2 -translate-x-1/2 mt-1 text-md font-medium text-white whitespace-nowrap pointer-events-none',
        buildings.length > 10 && !isSelected && 'hidden',
      );
      nameDiv.textContent = building.name;
      el.appendChild(nameDiv);

      marker.getElement().addEventListener('mouseenter', () => {
        if (isSelected || buildings.length <= 10) return;
        nameDiv.classList.remove('hidden');
      });

      marker.getElement().addEventListener('mouseleave', () => {
        if (isSelected || buildings.length <= 10) return;
        nameDiv.classList.add('hidden');
      });

      markers.current.push(marker);
    });

    if (buildings.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      buildings.forEach((building) => {
        bounds.extend([building.lng, building.lat]);
      });
      map.current?.fitBounds(bounds, {
        padding: {
          top: 150,
          bottom: 100,
          left: 200,
          right: 200,
        },
        maxZoom: 18,
      });
    }

    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
    };
  }, [buildings, selectedBuilding, mapLoaded, onBuildingSelect]);

  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    if (selectedBuilding) {
      if (!isMenuOpened) {
        map.current?.flyTo({
          center: [selectedBuilding.lng, selectedBuilding.lat],
          padding: { top: 0, bottom: 0, left: 0, right: 0 },
          essential: true,
          duration: 300,
        });
      } else {
        map.current?.flyTo({
          center: [selectedBuilding.lng, selectedBuilding.lat],
          zoom: 18,
          pitch: 60,
          essential: true,
          padding: {
            right: 700,
          },
        });
      }
    }
  }, [isMenuOpened, mapLoaded, selectedBuilding]);

  return (
    <div className={cn('relative h-screen w-screen overflow-hidden bg-gray-100')}>
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
};

export default SpotMap;
