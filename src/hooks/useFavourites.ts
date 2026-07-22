import { useSyncExternalStore } from 'react';
import { getSnapshot, isFavourite, subscribe, toggle } from '@/stores/favouritesStore';

/**
 * Reactive access to device-local room favourites. `favourites` re-renders
 * consumers whenever any room is toggled (in this tab or another).
 */
export const useFavourites = () => {
  const favourites = useSyncExternalStore(subscribe, getSnapshot);
  return { favourites, isFavourite, toggle };
};
