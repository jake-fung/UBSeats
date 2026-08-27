import mapboxgl from 'mapbox-gl';
import { Building } from '@/supabase/schema/types';
import { cn } from '@/utils/cnUtils';

export function createBuildingMarkerElement(building: Building, isSelected: boolean): HTMLDivElement {
  const wrapper = document.createElement('div');
  // `marker-wrapper` / `is-selected` are hooks for the label visibility rules in index.css.
  wrapper.className = cn('marker-wrapper flex flex-col items-center cursor-pointer z-5', isSelected && 'is-selected');

  const pill = document.createElement('div');
  pill.className =
    'relative text-black font-bold bg-white/90 py-0.5 px-2 rounded-md shadow-lg border-2 border-primary pr-6';
  pill.textContent = building.code;

  const countBadge = document.createElement('div');
  countBadge.className =
    'absolute top-0 right-0 text-xs font-medium text-white bg-primary rounded-r-sm w-5 h-full flex items-center justify-center';
  const venueRoomsCount = building.venues.reduce((n, v) => n + v.rooms.length, 0);
  countBadge.textContent = (building.rooms.length + venueRoomsCount).toString();

  pill.appendChild(countBadge);
  wrapper.appendChild(pill);

  const label = document.createElement('div');
  label.className =
    'marker-label absolute left-1/2 top-full -translate-x-1/2 mt-1 text-md font-medium text-white whitespace-nowrap pointer-events-none';
  label.textContent = building.name;
  wrapper.appendChild(label);

  return wrapper;
}

export function clearMarkers(markers: mapboxgl.Marker[]): mapboxgl.Marker[] {
  markers.forEach((marker) => marker.remove());
  return [];
}
