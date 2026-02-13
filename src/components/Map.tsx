import { GoogleMap, LoadScript, MarkerF, InfoWindowF, OverlayViewF, CircleF } from '@react-google-maps/api';
import { useEffect, useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import MarkerIcon from '@/assets/icons/marker-icon.png';
import { Marker } from '@/typings/Task';
import { Colour } from '@/typings/Colour.enum';
import Loading from './Loading';
import { Box, IconButton, Typography } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';

// Expose map control methods via ref
export interface MapRef {
  panTo: (location: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  panAndZoom: (location: { lat: number; lng: number }, zoom: number) => void;
}

export interface MapProps {
  taskMarkers?: Marker[];
  userLocation?: { lat: number; lng: number } | null;
  testMode?: boolean;
  zoom?: number;
  onPlayerMove?: (lat: number, lng: number) => void;
  designerMode?: boolean;
  onLongPress?: (lat: number, lng: number) => void;
  spawnRadius?: { center: { lat: number; lng: number }; radiusMeters: number };
  startingPointLocation?: { lat: number; lng: number } | null;
}

// --- User Location Blue Dot Component (Google Maps style) ---
const UserLocationDot = () => {
  return (
    <div
      style={{
        position: 'absolute',
        width: '14px',
        height: '14px',
        marginLeft: '-7px',
        marginTop: '-7px',
        borderRadius: '50%',
        backgroundColor: '#4285F4',
        border: '2px solid white',
        boxShadow: '0 0 0 1px rgba(66, 133, 244, 0.3), 0 1px 4px rgba(0, 0, 0, 0.2)',
        pointerEvents: 'none',
      }}
    />
  );
};



const MarkerColourMap: Record<Colour, string> = {
  [Colour.Green]: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
  [Colour.Red]: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  [Colour.Yellow]: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  [Colour.Blue]: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  [Colour.Purple]: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
  [Colour.Pink]: 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png',
  [Colour.Orange]: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png'
};

const colorToHex: Record<string, string> = {
  'blue': '#3B82F6',
  'orange': '#F97316',
  'green': '#22C55E',
  'red': '#EF4444',
  'gold': '#FFD700',
  'yellow': '#EAB308',
  'purple': '#A855F7',
  'pink': '#EC4899'
};

// Returns the correct SVG egg icon from public folder
const getColoredEggIcon = (color: string): string => {
  const c = color.toLowerCase();
  if (c === 'blue') return '/icons/egg-blue.svg';
  if (c === 'orange') return '/icons/egg-orange.svg';
  if (c === 'green') return '/icons/egg-green.svg';
  if (c === 'red') return '/icons/egg-red.svg';
  if (c === 'gold' || c === 'yellow') return '/icons/egg-gold.svg';
  if (c === 'pink') return '/icons/egg-red.svg'; // fallback to red for pink
  return '/icons/egg-blue.svg'; // default
};

// Convert an emoji character to a data-URL SVG for use as a map marker icon
const emojiToIconUrl = (emoji: string, size = 48): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${Math.round(size * 0.75)}">${emoji}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const containerStyle = {
  width: '100vw',
  height: `100vh`,
  position: 'relative' as 'relative'
};

export interface SpawnRadius {
  center: { lat: number, lng: number };
  radiusMeters: number;
}

export interface ExclusionZone {
  center: { lat: number; lng: number };
  radiusMeters: number;
}

const MapComponent = forwardRef<MapRef, {
  taskMarkers: Marker[];
  userLocation: { lat: number, lng: number } | null;
  testMode?: boolean;
  onPlayerMove: (lat: number, lng: number) => void;
  zoom?: number;
  spawnRadius?: SpawnRadius;
  // Trail designer props
  onLongPress?: (lat: number, lng: number) => void;
  exclusionZones?: ExclusionZone[];
  designerMode?: boolean;
  // For sequential trails: only show distance indicator for this marker index
  // If undefined, shows indicators for all markers (backwards compatible)
  targetMarkerIndex?: number;
  spawnRadiusColor?: string;
  startingPointLocation?: { lat: number; lng: number } | null;
}>(function MapComponent({
  taskMarkers,
  userLocation,
  testMode = false,
  onPlayerMove,
  zoom = 20,
  spawnRadius,
  onLongPress,
  exclusionZones = [],
  designerMode = false,
  targetMarkerIndex,
  spawnRadiusColor = '#ffffff',
  startingPointLocation = null
}, ref) {
  const [center, setCenter] = useState({ lat: 0, lng: 0 });
  const [isGoogleMapsAPILoaded, setIsGoogleMapsAPILoaded] = useState(false);
  const [markerInfoBox, setMarkerInfoBox] = useState<Marker>();
  const [viewportBounds, setViewportBounds] = useState<google.maps.LatLngBounds | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Long-press detection for trail designer
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const LONG_PRESS_MS = 500;
  const MOVE_THRESHOLD = 10; // pixels

  // Expose map control methods via ref for tutorial
  useImperativeHandle(ref, () => ({
    panTo: (location: { lat: number; lng: number }) => {
      if (mapRef.current) {
        mapRef.current.panTo(location);
      }
    },
    setZoom: (zoomLevel: number) => {
      if (mapRef.current) {
        mapRef.current.setZoom(zoomLevel);
      }
    },
    panAndZoom: (location: { lat: number; lng: number }, zoomLevel: number) => {
      if (mapRef.current) {
        mapRef.current.panTo(location);
        mapRef.current.setZoom(zoomLevel);
      }
    }
  }), []);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (userLocation) {
      map.panTo(userLocation);
    } else if (center.lat !== 0 && center.lng !== 0) {
      map.panTo(center);
    }
    setViewportBounds(map.getBounds() || null);
  }, [center, userLocation]);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  useEffect(() => {
    // Initial center
    if (userLocation && center.lat === 0) {
      setCenter(userLocation);
    } else if (taskMarkers && taskMarkers.length > 0 && center.lat === 0) {
      setCenter({ lat: taskMarkers[0].lat, lng: taskMarkers[0].lng });
    }
  }, [taskMarkers, userLocation]);



  const handleMyLocationClick = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(zoom);
    }
  };

  // Long-press handlers for trail designer
  const handleMapTouchStart = useCallback((e: React.TouchEvent) => {
    if (!designerMode || !onLongPress) return;

    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };

    longPressTimer.current = setTimeout(() => {
      if (mapRef.current && touchStartPos.current) {
        // Get lat/lng from the center of the map (where finger is)
        const mapCenter = mapRef.current.getCenter();
        if (mapCenter) {
          // Calculate offset from center based on touch position
          const mapDiv = mapRef.current.getDiv();
          const rect = mapDiv.getBoundingClientRect();
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const touchX = touchStartPos.current.x - rect.left;
          const touchY = touchStartPos.current.y - rect.top;

          // Get current zoom and calculate meters per pixel
          const zoom = mapRef.current.getZoom() || 18;
          const metersPerPixel = 156543.03392 * Math.cos(mapCenter.lat() * Math.PI / 180) / Math.pow(2, zoom);

          // Calculate lat/lng offset
          const latOffset = -(touchY - centerY) * metersPerPixel / 111320;
          const lngOffset = (touchX - centerX) * metersPerPixel / (111320 * Math.cos(mapCenter.lat() * Math.PI / 180));

          const lat = mapCenter.lat() + latOffset;
          const lng = mapCenter.lng() + lngOffset;

          onLongPress(lat, lng);
        }
      }
    }, LONG_PRESS_MS);
  }, [designerMode, onLongPress]);

  const handleMapTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current || !longPressTimer.current) return;

    const dx = e.touches[0].clientX - touchStartPos.current.x;
    const dy = e.touches[0].clientY - touchStartPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > MOVE_THRESHOLD) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleMapTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStartPos.current = null;
  }, []);

  const displayMarkers =
    taskMarkers?.map((marker) => ({
      ...marker,
      image_url: marker?.emoji
        ? emojiToIconUrl(marker.emoji)
        : marker?.image_url
          ? marker.image_url
          : marker.title?.toLowerCase().includes('egg')
            ? getColoredEggIcon(marker.colour || 'blue')
            : marker?.colour
              ? MarkerColourMap[marker.colour as Colour]
              : MarkerColourMap[Colour.Red]
    })) ?? [];

  const playerMarker: Marker | null = userLocation ? {
    lat: userLocation.lat,
    lng: userLocation.lng,
    title: 'You are here',
    subtitle: testMode ? 'Drag me to test!' : 'Run about and it will update',
    image_url: MarkerIcon.src
  } : null;

  return (
    <>
      {isGoogleMapsAPILoaded || center?.lat !== 0 ? (
        <Box
          sx={containerStyle}
          onTouchStart={handleMapTouchStart}
          onTouchMove={handleMapTouchMove}
          onTouchEnd={handleMapTouchEnd}
        >
          <LoadScript
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
            onLoad={() => setIsGoogleMapsAPILoaded(true)}
          >
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              zoom={zoom}
              options={{
                disableDefaultUI: false,
                zoomControl: false,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                clickableIcons: false,
                rotateControl: false,
                styles: [{ featureType: 'poi.business', stylers: [{ visibility: 'off' }] }],
                mapTypeId: 'hybrid',
                gestureHandling: 'greedy'
              }}
              onLoad={onLoad}
              onUnmount={onUnmount}
              onRightClick={(e) => {
                if (designerMode && onLongPress && e.latLng) {
                  e.domEvent.preventDefault();
                  onLongPress(e.latLng.lat(), e.latLng.lng());
                }
              }}
              onBoundsChanged={() => {
                if (mapRef.current) {
                  setViewportBounds(mapRef.current.getBounds() || null);
                }
              }}
            >
              {isGoogleMapsAPILoaded &&
                displayMarkers.map((marker: Marker, index: number) => {
                  // Use larger size for colored eggs
                  const isColoredEgg = marker.title?.toLowerCase().includes('egg') && marker.colour;
                  const iconSize = isColoredEgg ? 64 : 48;

                  return (
                    <MarkerF
                      key={`marker-${index}-${marker.lat.toFixed(6)}-${marker.lng.toFixed(6)}-${marker.colour || 'default'}`}
                      position={{ lat: marker.lat, lng: marker.lng }}
                      icon={{
                        url: marker.image_url as string,
                        scaledSize: new google.maps.Size(iconSize, iconSize),
                      }}
                      zIndex={1}
                      onClick={designerMode ? undefined : () => setMarkerInfoBox(marker)}
                    />
                  );
                })}

              {/* Always show blue dot for user location */}
              {isGoogleMapsAPILoaded && userLocation && (
                <OverlayViewF
                  position={{ lat: userLocation.lat, lng: userLocation.lng }}
                  mapPaneName="overlayMouseTarget"
                >
                  <UserLocationDot />
                </OverlayViewF>
              )}



              {/* Show starting point as Twimp marker when set */}
              {isGoogleMapsAPILoaded && startingPointLocation && (
                <MarkerF
                  position={{ lat: startingPointLocation.lat, lng: startingPointLocation.lng }}
                  icon={{
                    url: MarkerIcon.src,
                    scaledSize: new google.maps.Size(64, 64),
                  }}
                  zIndex={5}
                  title="Starting Point"
                />
              )}

              {/* Spawn Radius Circle */}
              {isGoogleMapsAPILoaded && spawnRadius && spawnRadius.center && (
                <CircleF
                  center={spawnRadius.center}
                  radius={spawnRadius.radiusMeters}
                  options={{
                    fillColor: spawnRadiusColor,
                    fillOpacity: 0.1,
                    strokeColor: spawnRadiusColor,
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    clickable: false,
                    zIndex: 0
                  }}
                />
              )}

              {/* Exclusion Zones for Trail Designer */}
              {isGoogleMapsAPILoaded && exclusionZones.map((zone, idx) => (
                <CircleF
                  key={`exclusion-${idx}`}
                  center={zone.center}
                  radius={zone.radiusMeters}
                  options={{
                    fillColor: '#ef4444',
                    fillOpacity: 0.25,
                    strokeColor: '#ef4444',
                    strokeOpacity: 0.8,
                    strokeWeight: 3,
                    clickable: false,
                    zIndex: 1
                  }}
                />
              ))}

              {markerInfoBox && (
                <InfoWindowF
                  position={{ lat: markerInfoBox.lat, lng: markerInfoBox.lng }}
                  options={{ pixelOffset: new google.maps.Size(0, -48) }}
                  onCloseClick={() => setMarkerInfoBox(undefined)}
                >
                  <div style={{ color: 'black' }}>
                    <h3 className="text-xl font-bold">{markerInfoBox.title}</h3>
                    <p className="text-gray-500 pt-2 block">{markerInfoBox.subtitle}</p>
                  </div>
                </InfoWindowF>
              )}
            </GoogleMap>
          </LoadScript>

          {/* Off-screen Indicators - hidden in designer mode */}
          {!designerMode && viewportBounds && userLocation && taskMarkers.map((marker, idx) => {
            // If targetMarkerIndex is specified, only show indicator for that marker
            if (targetMarkerIndex !== undefined && idx !== targetMarkerIndex) return null;

            const pos = new google.maps.LatLng(marker.lat, marker.lng);
            if (viewportBounds.contains(pos)) return null;

            // Calculate distance and bearing from player
            const dist = Math.sqrt(Math.pow(marker.lat - userLocation.lat, 2) + Math.pow(marker.lng - userLocation.lng, 2)) * 111320; // rough meters
            const angle = Math.atan2(marker.lng - userLocation.lng, marker.lat - userLocation.lat) * (180 / Math.PI);

            // Correct angle for rotate
            const rotation = angle;

            return (
              <Box
                key={`ind-${idx}-${marker.lat.toFixed(6)}-${marker.lng.toFixed(6)}-${marker.colour || 'default'}`}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '100vw',
                  height: '100vh',
                  pointerEvents: 'none',
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  zIndex: 5
                }}
              >
                <Box sx={{
                  position: 'absolute',
                  top: 'calc(50% - min(35vh, 35vw))',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Box sx={{
                    width: 0,
                    height: 0,
                    borderLeft: '10px solid transparent',
                    borderRight: '10px solid transparent',
                    borderBottom: `14px solid ${marker.colour ? colorToHex[marker.colour.toLowerCase()] || '#FF2E5B' : '#FF2E5B'}`,
                  }} />
                  <Box sx={{
                    backgroundColor: marker.colour ? colorToHex[marker.colour.toLowerCase()] || '#FF2E5B' : '#FF2E5B',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                    border: '2px solid white',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {dist > 1000 ? `${(dist / 1000).toFixed(1)}km` : `${Math.round(dist)}m`}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
          <IconButton
            onClick={handleMyLocationClick}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              backgroundColor: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)'
              },
              zIndex: 10
            }}
            aria-label="center map on my location"
          >
            <MyLocationIcon />
          </IconButton>
        </Box >
      ) : (
        <Loading />
      )
      }
    </>
  );
});

export default MapComponent;
