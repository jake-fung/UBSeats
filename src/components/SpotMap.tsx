import React, { useEffect, useRef, useState } from 'react';
import { StudySpot, Building } from '@/utils/types';
import { X } from 'lucide-react';
import { cn } from '@/utils/cnUtils';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { isSpotOpenNow } from '@/utils/timeUtils';

interface SpotMapProps {
  buildings: Building[];
  onSpotSelect: (spot: StudySpot) => void;
  selectedSpot?: StudySpot;
  className?: string;
}

const SpotMap: React.FC<SpotMapProps> = ({ buildings, onSpotSelect, selectedSpot, className }) => {
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
      const el = document.createElement('div');
      el.className = 'flex flex-col items-center cursor-pointer z-5';

      const markerDiv = document.createElement('div');
      markerDiv.className = 'h-4 w-4 rounded-full bg-primary shadow-[0px_0px_4px_2px_rgba(107,114,128,0.7)]';

      el.appendChild(markerDiv);

      const marker = new mapboxgl.Marker(el).setLngLat([building.lng, building.lat]).addTo(map.current);

      marker.getElement().addEventListener('click', () => {
        map.current?.flyTo({
          center: [building.lng, building.lat],
          zoom: 18,
          essential: true,
        });
      });

      marker.getElement().addEventListener('mouseenter', () => {
        const nameDiv = document.createElement('div');
        nameDiv.id = 'marker-name-label';
        nameDiv.className =
          'absolute top-full left-1/2 -translate-x-1/2 mt-1 text-md font-medium text-white whitespace-nowrap pointer-events-none';
        nameDiv.textContent = building.name;
        el.appendChild(nameDiv);
      });

      marker.getElement().addEventListener('mouseleave', () => {
        const label = el.querySelector('#marker-name-label');
        if (label) el.removeChild(label);
      });

      markers.current.push(marker);
    });

    if (buildings.length > 0 && !selectedSpot) {
      const bounds = new mapboxgl.LngLatBounds();
      buildings.forEach((building) => {
        bounds.extend([building.lng, building.lat]);
      });
    }
  }, [buildings, selectedSpot, mapLoaded, onSpotSelect]);

  return (
    <div className={cn('relative overflow-hidden bg-gray-100', className)}>
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
};

export default SpotMap;
