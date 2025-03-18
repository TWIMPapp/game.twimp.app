import { useEffect, useRef } from 'react';
import L from 'leaflet';
import PlayerIcon from '@/assets/icons/fox.png';
import TreasureIcon from '@/assets/icons/treasure.png';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';
import { Position } from '@/hooks/useGeolocation';

interface MapComponentProps {
  playerPosition: Position;
  treasurePosition: Position | null;
}

export default function HuntGameMap({ playerPosition, treasurePosition }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const zoomLevel = 20;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const playerIcon = new L.Icon({
      iconUrl: PlayerIcon.src,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });

    const treasureIcon = new L.Icon({
      iconUrl: TreasureIcon.src,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });

    mapRef.current = L.map(mapContainerRef.current, {
      center: [playerPosition.lat, playerPosition.lng],
      zoom: zoomLevel,
      maxZoom: 24,
    });

    L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      attribution: '© Google',
      maxZoom: 22
    }).addTo(mapRef.current);

    const playerMarker = L.marker([playerPosition.lat, playerPosition.lng], {
      icon: playerIcon,
      zIndexOffset: 1000
    }).addTo(mapRef.current);
    markersRef.current = [playerMarker];

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
    const newLatLng = L.latLng(playerPosition.lat, playerPosition.lng);
    marker.setLatLng(newLatLng);
  }, [playerPosition]);

  // Update treasure position
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old treasure marker if it exists
    if (markersRef.current[1]) {
      markersRef.current[1].remove();
      markersRef.current = [markersRef.current[0]];
    }

    // Add new treasure marker if treasure position exists
    if (treasurePosition) {
      const treasureIcon = new L.Icon({
        iconUrl: TreasureIcon.src,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
      });

      const treasureMarker = L.marker([treasurePosition.lat, treasurePosition.lng], {
        icon: treasureIcon,
        zIndexOffset: 0
      }).addTo(mapRef.current);

      markersRef.current.push(treasureMarker);
    }
  }, [treasurePosition]);

  return <div ref={mapContainerRef} className="absolute inset-0" />;
}
