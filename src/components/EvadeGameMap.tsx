import { useEffect, useRef } from 'react';
import L from 'leaflet';
import PlayerIcon from '@/assets/icons/fox.png';

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
  const zoomLevel = 19;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const customIcon = new L.Icon({
      iconUrl: PlayerIcon.src, // Use the imported PNG file
      iconSize: [38, 38], // Adjust size as needed
      iconAnchor: [19, 38], // Centers the icon correctly
      popupAnchor: [0, -38], // Adjusts the popup position if needed
    });

    mapRef.current = L.map(mapContainerRef.current, {
      center: [playerPosition.lat, playerPosition.lng],
      zoom: zoomLevel,
      maxZoom: 24, // Set your desired max zoom level here
    });

    L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      attribution: '© Google',
      maxZoom: 22
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
    mapRef.current.setView([playerPosition.lat, playerPosition.lng], zoomLevel);
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
