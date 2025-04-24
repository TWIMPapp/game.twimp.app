import { GoogleMap, LoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useEffect, useState, useRef, useCallback } from 'react';
import MarkerIcon from '@/assets/icons/marker-icon.png';
import { Marker } from '@/typings/Task';
import { Colour } from '@/typings/Colour.enum';
import Loading from './Loading';
import { Box, IconButton } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';

const MarkerColourMap: Record<Colour, string> = {
  [Colour.Green]: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
  [Colour.Red]: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  [Colour.Yellow]: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  [Colour.Blue]: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  [Colour.Purple]: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
  [Colour.Pink]: 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png',
  [Colour.Orange]: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png'
};

const containerStyle = {
  width: '100vw',
  height: `100vh`,
  position: 'relative' as 'relative'
};

export default function MapComponent({
  taskMarkers,
  onPlayerMove
}: {
  taskMarkers: Marker[];
  onPlayerMove: (position: GeolocationPosition) => void;
}) {
  const [center, setCenter] = useState({ lat: 0, lng: 0 });
  const [isGoogleMapsAPILoaded, setIsGoogleMapsAPILoaded] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [markerInfoBox, setMarkerInfoBox] = useState<Marker>();
  const [heading, setHeading] = useState<number>(0);
  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (center.lat !== 0 && center.lng !== 0) {
      map.panTo(center);
    }
  }, [center]);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const initialCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCenter(initialCenter);
        if (mapRef.current) {
          mapRef.current.panTo(initialCenter);
        }
      },
      (error) => {
        console.error("Error getting initial position:", error);
      }
    );
  }, []);

  useEffect(() => {
    const displayMarkers =
      taskMarkers?.map((marker) => ({
        ...marker,
        image_url: marker?.image_url
          ? marker.image_url
          : marker?.colour
          ? MarkerColourMap[marker.colour as Colour]
          : MarkerColourMap[Colour.Red]
      })) ?? [];

    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const playerMarker: Marker = {
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude),
          title: 'You are here',
          subtitle: 'Run about and it will update',
          image_url: MarkerIcon.src
        };

        setMarkers([playerMarker, ...displayMarkers]);

        if (center.lat === 0 && center.lng === 0 && mapRef.current) {
           const currentPos = { lat: position.coords.latitude, lng: position.coords.longitude };
           setCenter(currentPos);
           mapRef.current.panTo(currentPos);
        }

        if (!throttleTimeout) {
            onPlayerMove(position);
            throttleTimeout = setTimeout(() => {
              throttleTimeout = null;
            }, 2000);
          }
      },
      (error) => {
        console.log("Geolocation watch error:", error);
      },
      {
        maximumAge: 1000,
        timeout: 5000,
        enableHighAccuracy: true
      }
    );

    const handleOrientation = (event: Event) => {
      const orientationEvent = event as DeviceOrientationEvent;
      if (orientationEvent.absolute && orientationEvent.alpha !== null) {
        setHeading(orientationEvent.alpha);
      }
    };

    window.addEventListener('deviceorientationabsolute', handleOrientation, true);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [taskMarkers, onPlayerMove, center.lat, center.lng]);

  const handleMyLocationClick = () => {
    if (mapRef.current && markers.length > 0) {
      const playerLocation = { lat: markers[0].lat, lng: markers[0].lng };
      mapRef.current.panTo(playerLocation);
      mapRef.current.setZoom(18);
    }
  };

  return (
    <>
      {isGoogleMapsAPILoaded || center?.lat !== 0 ? (
         <Box sx={containerStyle}>
          <LoadScript
            googleMapsApiKey="AIzaSyCPlJtyG0WSQJbM48Nbi980bzBixe2hbYQ"
            onLoad={() => setIsGoogleMapsAPILoaded(true)}
          >
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              zoom={18}
              options={{
                disableDefaultUI: false,
                zoomControl: false,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                clickableIcons: false,
                styles: [{ featureType: 'poi.business', stylers: [{ visibility: 'off' }] }],
                mapTypeId: 'hybrid',
                heading: heading
              }}
              onLoad={onLoad}
              onUnmount={onUnmount}
            >
              {isGoogleMapsAPILoaded &&
                markers?.map((marker: Marker, index: number) => {
                  return (
                    <MarkerF
                      key={index}
                      position={{ lat: marker.lat, lng: marker.lng }}
                      icon={{
                        url: marker.image_url as string,
                        scaledSize: new google.maps.Size(48, 48)
                      }}
                      onClick={() => setMarkerInfoBox(marker)}
                    />
                  );
                })}
              {markerInfoBox && (
                <InfoWindowF
                  position={{ lat: markerInfoBox.lat, lng: markerInfoBox.lng }}
                  options={{ pixelOffset: new google.maps.Size(0, -48) }}
                  onCloseClick={() => setMarkerInfoBox(undefined)}
                >
                  <div>
                    <h3 className="text-xl">{markerInfoBox.title}</h3>
                    <p className="text-gray-500 pt-2 block">{markerInfoBox.subtitle}</p>
                  </div>
                </InfoWindowF>
              )}
            </GoogleMap>
          </LoadScript>
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
        </Box>
      ) : (
        <Loading />
      )}
    </>
  );
}
