import { useCallback, useEffect, useRef, useState } from 'react';

export interface UserPosition {
  lng: number;
  lat: number;
  /** Radius in metres of the 68% confidence circle. */
  accuracy: number;
}

const WATCH_OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 };

const errorMessage = (error: GeolocationPositionError) =>
  error.code === error.PERMISSION_DENIED ? 'Location access denied' : "Couldn't get your location";

export const useUserLocation = (onError: (message: string) => void) => {
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
  const [enabled, setEnabled] = useState(false);
  const [position, setPosition] = useState<UserPosition | null>(null);
  const watchId = useRef<number | null>(null);
  const hasFix = useRef(false);

  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const disable = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setEnabled(false);
    setPosition(null);
  }, []);

  const enable = useCallback(() => {
    if (!supported || watchId.current !== null) return;
    hasFix.current = false;
    setEnabled(true);
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        hasFix.current = true;
        setPosition({ lng: coords.longitude, lat: coords.latitude, accuracy: coords.accuracy });
      },
      (error) => {
        // Once we have a dot, a transient timeout/unavailable just leaves the last fix showing.
        if (error.code !== error.PERMISSION_DENIED && hasFix.current) return;
        disable();
        onErrorRef.current(errorMessage(error));
      },
      WATCH_OPTIONS,
    );
  }, [supported, disable]);

  const toggle = useCallback(() => (watchId.current === null ? enable() : disable()), [enable, disable]);

  useEffect(
    () => () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    },
    [],
  );

  return { supported, enabled, position, toggle, disable };
};
