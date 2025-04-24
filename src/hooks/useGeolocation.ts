import { useState, useEffect, useRef } from 'react';

export interface Position {
  lat: number;
  lng: number;
  accuracy?: number; // Optional since it only applies to GPS readings
}
export function useGeolocation() {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    console.log('Starting geolocation...');

    const startWatching = (options: PositionOptions) => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      console.log('Starting position watch with options:', options);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const now = Date.now();
          const timeSinceLastUpdate = now - lastUpdateRef.current;
          lastUpdateRef.current = now;

          console.log(`Position update received (${timeSinceLastUpdate}ms since last update):`, {
            coords: pos.coords,
            timestamp: new Date(pos.timestamp).toISOString()
          });

          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
          setError(null);
        },
        (error) => {
          console.error('Watch position error:', error);
          let errorMessage = 'Unable to get your location';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location services in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please check your GPS settings.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = 'An unknown error occurred while getting your location.';
          }

          setError(errorMessage);
        },
        options
      );
    };

    // First try to get the current position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('Successfully got initial position:', pos.coords);
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setError(null);
        setIsLoading(false);

        // Start watching with high accuracy
        startWatching({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      },
      (error) => {
        console.error('Initial position error:', error);
        let errorMessage = 'Unable to get your location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location services in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please check your GPS settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = 'An unknown error occurred while getting your location.';
        }

        setError(errorMessage);
        setIsLoading(false);

        // Try with lenient settings
        startWatching({
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 10000
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    // Set up a periodic check for stale updates
    const staleCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;

      if (timeSinceLastUpdate > 30000) { // 30 seconds
        console.log('No position updates received for 30 seconds, restarting watch...');
        if (watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
        startWatching({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 10000
        });
      }
    }, 10000); // Check every 10 seconds

    return () => {
      clearInterval(staleCheckInterval);
      if (watchIdRef.current) {
        console.log('Cleaning up geolocation watch...');
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { position, error, isLoading };
}
