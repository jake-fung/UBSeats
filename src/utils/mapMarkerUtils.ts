import mapboxgl from 'mapbox-gl';
import { Building } from '@/supabase/schema/types';
import { cn } from '@/utils/cnUtils';

export function createBuildingMarkerElement(
  building: Building,
  isSelected: boolean,
  buildingCount: number,
): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex flex-col items-center cursor-pointer z-5';

  const pill = document.createElement('div');
  pill.className =
    'relative text-black font-bold bg-white/90 py-0.5 px-2 rounded-md shadow-lg border-2 border-primary pr-6';
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

export function clearMarkers(markers: mapboxgl.Marker[]): mapboxgl.Marker[] {
  markers.forEach((marker) => marker.remove());
  return [];
}
