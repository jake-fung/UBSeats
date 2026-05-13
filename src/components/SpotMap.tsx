import React, { useEffect, useRef, useState } from 'react';
import { StudySpot } from '@/utils/types';
import { X } from 'lucide-react';
import { cn } from '@/utils/cnUtils';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { isSpotOpenNow } from '@/utils/timeUtils';

interface SpotMapProps {
  spots: StudySpot[];
  onSpotSelect: (spot: StudySpot) => void;
  selectedSpot?: StudySpot;
  className?: string;
}

const SpotMap: React.FC<SpotMapProps> = ({ spots, onSpotSelect, selectedSpot, className }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

    // Initialize the map centered on UBC campus
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: import.meta.env.VITE_MAPBOX_STYLE_URL,
    });

    // Set loaded state when map is ready
    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      // Clean up markers and map on unmount
      markers.current.forEach((marker) => marker.remove());
      map.current?.remove();
    };
  }, []);

  // Add markers for study spots when map is loaded
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add markers for each spot
    spots.forEach((spot) => {
      const isOpen = isSpotOpenNow(spot);

      const el = document.createElement('div');
      el.className = 'flex flex-col items-center cursor-pointer z-10';

      const markerDiv = document.createElement('div');
      markerDiv.className = cn(
        'h-3 w-3 rounded-full shadow-[0px_0px_4px_2px_rgba(107,114,128,0.7)]',
        isOpen ? 'bg-green-500' : 'bg-gray-500',
      );

      el.appendChild(markerDiv);

      // Create and add the marker
      const marker = new mapboxgl.Marker(el).setLngLat([spot.location.lng, spot.location.lat]).addTo(map.current);

      // Add click handler
      marker.getElement().addEventListener('click', () => {
        onSpotSelect(spot);

        // Center and zoom to the selected spot
        map.current?.flyTo({
          center: [spot.location.lng, spot.location.lat],
          zoom: 18,
          essential: true,
        });
      });

      const nameDiv = document.createElement('div');
      nameDiv.className = 'mt-1 text-md font-medium text-white whitespace-nowrap';
      nameDiv.textContent = spot.name;
      el.appendChild(nameDiv);

      markers.current.push(marker);
    });

    // Fit map to bounds if we have spots
    if (spots.length > 0 && !selectedSpot) {
      const bounds = new mapboxgl.LngLatBounds();
      // spots.forEach((spot) => {
      //   bounds.extend([spot.location.lng, spot.location.lat]);
      // });

      // map.current.fitBounds(bounds, {
      //   padding: 50,
      //   maxZoom: 15,
      // });
    }
  }, [spots, selectedSpot, mapLoaded, onSpotSelect]);

  const resetZoom = () => {
    if (!map.current) return;

    const bounds = new mapboxgl.LngLatBounds();
    spots.forEach((spot) => {
      bounds.extend([spot.location.lng, spot.location.lat]);
    });

    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
    });
  };

  return (
    <div className={cn('relative overflow-hidden bg-gray-100', className)}>
      {!mapLoaded && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-200">
          <div className="animate-pulse text-gray-500">Loading map...</div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainer} className="h-full w-full" />

      {/* Map Controls */}
      {mapLoaded && selectedSpot && (
        <button
          onClick={resetZoom}
          className="absolute left-4 top-4 z-20 flex items-center rounded-md bg-white p-2 shadow-md transition-colors hover:bg-gray-100"
        >
          <X className="mr-1 h-4 w-4" />
          <span>Reset view</span>
        </button>
      )}
    </div>
  );
};

export default SpotMap;
