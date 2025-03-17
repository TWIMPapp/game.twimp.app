import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';
import { Position } from '@/hooks/useGeolocation';
import { SearchCircle } from './EvadeGame';

interface MapComponentProps {
  playerPosition: Position;
  searchCircles: SearchCircle[];
}

export default function EvadeGameMap({ playerPosition, searchCircles }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circlesRef = useRef<L.Circle[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const customIcon = new L.Icon({
      iconUrl:
        'data:image/svg+xml,' +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-fox"><path d="M19 12c.6 0 1.1.2 1.4.6L22 11l-3-3l-1-8l-3 6l-3-3l-3 3l-3-6l-1 8l-3 3l1.6 1.6c.3-.4.8-.6 1.4-.6c.9 0 1.7.5 2 1.2c.3-.7 1.1-1.2 2-1.2s1.7.5 2 1.2c.3-.7 1.1-1.2 2-1.2s1.7.5 2 1.2c.3-.7 1.1-1.2 2-1.2Z"/><path d="M19 12V19A2 2 0 0 1 17 21H7A2 2 0 0 1 5 19V12"/></svg>'
        ),
      iconSize: [38, 38]
    });

    mapRef.current = L.map(mapContainerRef.current).setView(
      [playerPosition.lat, playerPosition.lng],
      18
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapRef.current);

    const marker = L.marker([playerPosition.lat, playerPosition.lng], { icon: customIcon }).addTo(
      mapRef.current
    );
    markersRef.current = [marker];

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update player position
  useEffect(() => {
    if (!mapRef.current || !markersRef.current[0]) return;

    const marker = markersRef.current[0];
    marker.setLatLng([playerPosition.lat, playerPosition.lng]);
    mapRef.current.setView([playerPosition.lat, playerPosition.lng], mapRef.current.getZoom());
  }, [playerPosition]);

  // Update search circles
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old circles
    circlesRef.current.forEach((circle) => circle.remove());
    circlesRef.current = [];

    // Add new circles
    searchCircles.forEach((circle) => {
      const leafletCircle = L.circle([circle.position.lat, circle.position.lng], {
        radius: circle.radius,
        color: 'blue',
        fillColor: 'blue',
        fillOpacity: 0.2
      }).addTo(mapRef.current!);

      circlesRef.current.push(leafletCircle);
    });
  }, [searchCircles]);

  return <div ref={mapContainerRef} className="absolute inset-0" />;
}
