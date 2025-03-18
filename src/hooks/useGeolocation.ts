import { useState, useEffect } from 'react';

export interface Position {
  lat: number;
  lng: number;
}
export function useGeolocation() {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    // First try to get the current position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('Got initial position:', pos.coords);
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setError(null);
        setIsLoading(false);
      },
      (error) => {
        console.error('Initial geolocation error:', error);
        // If we get a timeout or permission denied, use default position
        if (error.code === 3 || error.code === 1) {
          console.log('Using default position due to geolocation error');
          setError(null);
        } else {
          setError(error.message);
        }
        setIsLoading(false);
      },
      {
        enableHighAccuracy: false, // Try without high accuracy first
        timeout: 30000, // 30 seconds timeout
        maximumAge: 60000 // Allow positions up to 1 minute old
      }
    );

    // Then start watching for position updates
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        console.log('Got position update:', pos.coords);
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setError(null);
      },
      (error) => {
        console.error('Watch position error:', error);
        // Don't set error state for watch position errors to avoid UI flicker
      },
      {
        enableHighAccuracy: false, // Try without high accuracy first
        timeout: 30000, // 30 seconds timeout
        maximumAge: 60000 // Allow positions up to 1 minute old
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { position, error, isLoading };
}
