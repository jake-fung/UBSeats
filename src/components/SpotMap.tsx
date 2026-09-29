import React, { useEffect, useMemo, useRef } from 'react';
import { Building } from '@/supabase/schema';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  accuracyRadiusPx,
  clearMarkers,
  createBuildingMarkerElement,
  createUserLocationMarkerElement,
} from '@/utils/mapMarkerUtils';
import { getScreenHeight, getScreenWidth } from '@/utils/screenSizeUtils';
import type { UserPosition } from '@/hooks/useUserLocation';

const FIT_BOUNDS_PADDING = { top: 200, bottom: 150, left: 200, right: 200 } as const;
const MOBILE_FIT_BOUNDS_PADDING = { top: 170, bottom: 100, left: 50, right: 50 } as const;
const FIT_BOUNDS_MAX_ZOOM = 16;
const LABEL_MIN_ZOOM = 16;
const BUILDING_DETAIL_PITCH = 60;
const BUILDING_DETAIL_ZOOM = 18;
const USER_LOCATION_ZOOM = 17;
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
  userPosition: UserPosition | null;
  onUserOutOfBounds: () => void;
}

const SpotMap: React.FC<SpotMapProps> = ({
  buildings,
  onBuildingSelect,
  selectedBuilding,
  isMenuOpened,
  mapLoaded,
  setMapLoaded,
  isMobile,
  userPosition,
  onUserOutOfBounds,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const userRing = useRef<HTMLDivElement | null>(null);
  // True until the first fix after the toggle turns on; that fix alone moves the camera.
  const awaitingFirstFix = useRef(true);

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: import.meta.env.VITE_MAPBOX_STYLE_URL,
      // Bottom-left belongs to the control row; the wordmark joins the attribution on the right.
      logoPosition: 'bottom-right',
    });

    map.current.on('load', () => setMapLoaded(true));

    return () => {
      markers.current = clearMarkers(markers.current);
      map.current?.remove();
    };
  }, [setMapLoaded]);

  const validBuildings = useMemo(() => buildings.filter((b) => isFinite(b.lng) && isFinite(b.lat)), [buildings]);

  const buildingsKey = validBuildings.map((b) => b.uuid).join('|');

  const validBuildingsRef = useRef(validBuildings);
  useEffect(() => {
    validBuildingsRef.current = validBuildings;
  }, [validBuildings]);

  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    markers.current = clearMarkers(markers.current);

    validBuildings.forEach((building) => {
      const isSelected = selectedBuilding?.uuid === building.uuid;
      const el = createBuildingMarkerElement(building, isSelected);

      const marker = new mapboxgl.Marker(el).setLngLat([building.lng, building.lat]).addTo(map.current!);

      marker.getElement().addEventListener('click', () => onBuildingSelect(building));

      markers.current.push(marker);
    });

    return () => {
      markers.current = clearMarkers(markers.current);
    };
  }, [validBuildings, selectedBuilding, mapLoaded, onBuildingSelect]);

  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    const mapInstance = map.current;
    const container = mapInstance.getContainer();
    let labelsVisible: boolean | null = null;

    const syncLabelVisibility = () => {
      const next = mapInstance.getZoom() >= LABEL_MIN_ZOOM;
      if (next === labelsVisible) return;
      labelsVisible = next;
      container.classList.toggle('labels-visible', next);
    };

    syncLabelVisibility();
    mapInstance.on('zoom', syncLabelVisibility);

    return () => {
      mapInstance.off('zoom', syncLabelVisibility);
    };
  }, [mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    const toFit = validBuildingsRef.current;
    if (toFit.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    toFit.forEach((b) => bounds.extend([b.lng, b.lat]));
    map.current.fitBounds(bounds, {
      padding: isMobile ? MOBILE_FIT_BOUNDS_PADDING : FIT_BOUNDS_PADDING,
      maxZoom: FIT_BOUNDS_MAX_ZOOM,
    });
    map.current.setMaxBounds([
      [bounds.getWest() - 0.04, bounds.getSouth() - 0.04],
      [bounds.getEast() + 0.04, bounds.getNorth() + 0.04],
    ] as [mapboxgl.LngLatLike, mapboxgl.LngLatLike]);
  }, [buildingsKey, mapLoaded, isMobile]);

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

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapLoaded || !mapInstance) return;

    if (!userPosition) {
      userMarker.current?.remove();
      userMarker.current = null;
      userRing.current = null;
      awaitingFirstFix.current = true;
      return;
    }

    const lngLat: [number, number] = [userPosition.lng, userPosition.lat];

    if (awaitingFirstFix.current) {
      awaitingFirstFix.current = false;
      const bounds = mapInstance.getMaxBounds();
      if (bounds && !bounds.contains(lngLat)) {
        onUserOutOfBounds();
        return;
      }
      mapInstance.flyTo({ center: lngLat, zoom: USER_LOCATION_ZOOM, essential: true });
    }

    if (userMarker.current) {
      userMarker.current.setLngLat(lngLat);
    } else {
      const { element, ring } = createUserLocationMarkerElement();
      userRing.current = ring;
      // Map-aligned so the accuracy ring lies flat under the building-detail pitch.
      userMarker.current = new mapboxgl.Marker({ element, pitchAlignment: 'map', rotationAlignment: 'map' })
        .setLngLat(lngLat)
        .addTo(mapInstance);
    }
  }, [mapLoaded, userPosition, onUserOutOfBounds]);

  useEffect(() => {
    const mapInstance = map.current;
    const ring = userRing.current;
    if (!mapLoaded || !mapInstance || !userPosition || !ring) return;

    const syncRingSize = () => {
      const diameter = 2 * accuracyRadiusPx(userPosition.accuracy, userPosition.lat, mapInstance.getZoom());
      ring.style.width = `${diameter}px`;
      ring.style.height = `${diameter}px`;
    };

    syncRingSize();
    mapInstance.on('zoom', syncRingSize);

    return () => {
      mapInstance.off('zoom', syncRingSize);
    };
  }, [mapLoaded, userPosition]);

  return (
    <div className="z-0 h-[calc(100vh+36px)] w-screen">
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
};

export default SpotMap;
