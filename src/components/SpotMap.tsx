import React, { useEffect, useRef, useState } from "react";
import { StudySpot } from "@/utils/types";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface SpotMapProps {
  spots: StudySpot[];
  onSpotSelect: (spot: StudySpot) => void;
  selectedSpot?: StudySpot;
  className?: string;
}

const SpotMap: React.FC<SpotMapProps> = ({
  spots,
  onSpotSelect,
  selectedSpot,
  className,
}) => {
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
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-123.246, 49.2606], // UBC coordinates
      zoom: 14,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Set loaded state when map is ready
    map.current.on("load", () => {
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
      const isSelected = selectedSpot?.id === spot.id;

      // Create marker element
      const el = document.createElement("div");
      el.className = cn(
        "flex flex-col items-center cursor-pointer",
        isSelected ? "z-20" : "z-10"
      );

      const markerDiv = document.createElement("div");
      markerDiv.className = cn(
        "p-1 rounded-full transition-all duration-300",
        isSelected
          ? "bg-primary text-white scale-125"
          : "bg-white text-primary border border-primary hover:scale-110"
      );

      // Create svg icon
      const icon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      icon.setAttribute("width", "20");
      icon.setAttribute("height", "20");
      icon.setAttribute("viewBox", "0 0 24 24");
      icon.setAttribute("fill", "none");
      icon.setAttribute("stroke", "currentColor");
      icon.setAttribute("stroke-width", "2");
      icon.setAttribute("stroke-linecap", "round");
      icon.setAttribute("stroke-linejoin", "round");

      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path.setAttribute("d", "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z");
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      circle.setAttribute("cx", "12");
      circle.setAttribute("cy", "10");
      circle.setAttribute("r", "3");

      icon.appendChild(path);
      icon.appendChild(circle);
      markerDiv.appendChild(icon);
      el.appendChild(markerDiv);

      // Add name tooltip for selected marker
      if (isSelected) {
        const nameDiv = document.createElement("div");
        nameDiv.className =
          "mt-1 px-2 py-1 text-xs font-medium bg-white rounded-md shadow-md whitespace-nowrap";
        nameDiv.textContent = spot.name;
        el.appendChild(nameDiv);
      }

      // Create and add the marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([spot.location.lng, spot.location.lat])
        .addTo(map.current);

      // Add click handler
      marker.getElement().addEventListener("click", () => {
        onSpotSelect(spot);

        // Center and zoom to the selected spot
        map.current?.flyTo({
          center: [spot.location.lng, spot.location.lat],
          zoom: 16,
          essential: true,
        });
      });

      markers.current.push(marker);
    });

    // Fit map to bounds if we have spots
    if (spots.length > 0 && !selectedSpot) {
      const bounds = new mapboxgl.LngLatBounds();
      spots.forEach((spot) => {
        bounds.extend([spot.location.lng, spot.location.lat]);
      });

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
      });
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
    <div
      className={cn(
        "relative rounded-xl overflow-hidden bg-gray-100",
        className
      )}
    >
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-20">
          <div className="text-gray-500 animate-pulse">Loading map...</div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map Controls */}
      {mapLoaded && selectedSpot && (
        <button
          onClick={resetZoom}
          className="absolute top-4 left-4 flex items-center p-2 bg-white rounded-md shadow-md hover:bg-gray-100 transition-colors z-20"
        >
          <X className="h-4 w-4 mr-1" />
          <span>Reset view</span>
        </button>
      )}
    </div>
  );
};

export default SpotMap;
