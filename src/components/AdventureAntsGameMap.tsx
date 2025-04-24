import { useEffect, useRef } from 'react';
import L from 'leaflet';
import PlayerIcon from '@/assets/icons/fox.png';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';
import { Position } from '@/hooks/useGeolocation';

interface MapComponentProps {
  playerPosition: Position;
  colonyPosition: Position;
  obstacles: Position[];
  isDebugMode: boolean;
}

export default function AdventureAntsGameMap({ playerPosition, colonyPosition, obstacles, isDebugMode }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const colonyMarkerRef = useRef<L.Circle | null>(null);
  const obstacleMarkersRef = useRef<L.Circle[]>([]);
  const zoomLevel = 20;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const playerIcon = new L.Icon({
      iconUrl: PlayerIcon.src,
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

    // Create player marker at initialization
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

  // Update colony marker
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing colony marker if it exists
    if (colonyMarkerRef.current) {
      colonyMarkerRef.current.remove();
    }

    // Create new colony marker
    colonyMarkerRef.current = L.circle([colonyPosition.lat, colonyPosition.lng], {
      color: 'green',
      fillColor: '#0f0',
      fillOpacity: 0.5,
      radius: 10
    }).addTo(mapRef.current);

    return () => {
      if (colonyMarkerRef.current) {
        colonyMarkerRef.current.remove();
        colonyMarkerRef.current = null;
      }
    };
  }, [colonyPosition]);

  // Update obstacle markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing obstacle markers
    obstacleMarkersRef.current.forEach(marker => marker.remove());
    obstacleMarkersRef.current = [];

    // Create new obstacle markers
    obstacles.forEach(obstacle => {
      const marker = L.circle([obstacle.lat, obstacle.lng], {
        color: 'red',
        fillColor: '#f00',
        fillOpacity: 0.5,
        radius: 5
      }).addTo(mapRef.current!);
      obstacleMarkersRef.current.push(marker);
    });

    return () => {
      obstacleMarkersRef.current.forEach(marker => marker.remove());
      obstacleMarkersRef.current = [];
    };
  }, [obstacles]);

  return <div ref={mapContainerRef} className="absolute inset-0" />;
}