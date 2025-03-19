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

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    console.log('Starting geolocation...');

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

        // Only start watching after we have an initial position
        console.log('Starting position watch...');
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            console.log('Position update received:', pos.coords);
            setPosition({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            });
            setError(null);
          },
          (error) => {
            console.error('Watch position error:', error);
            // Try to restart the watch with more lenient settings
            if (watchIdRef.current) {
              navigator.geolocation.clearWatch(watchIdRef.current);
            }
            console.log('Retrying watch with lenient settings...');
            watchIdRef.current = navigator.geolocation.watchPosition(
              (pos) => {
                console.log('Position update received (lenient):', pos.coords);
                setPosition({
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                  accuracy: pos.coords.accuracy
                });
                setError(null);
              },
              (error) => {
                console.error('Watch position error (lenient):', error);
              },
              {
                enableHighAccuracy: false,
                timeout: 30000,
                maximumAge: 30000
              }
            );
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 10000
          }
        );
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
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => {
      if (watchIdRef.current) {
        console.log('Cleaning up geolocation watch...');
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { position, error, isLoading };
}
