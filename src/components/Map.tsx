import { GoogleMap, LoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useEffect, useState } from 'react';
import MarkerIcon from '@/assets/icons/marker-icon.png';
import { Marker } from '@/typings/Task';
import { Colour } from '@/typings/Colour.enum';
import { TabBarHeight } from './TabBarHeight';
import Loading from './Loading';

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
  height: `calc(100vh - ${TabBarHeight}px)`
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

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error(error);
      }
    );
  }, []);

  useEffect(() => {
    const displayMarkers =
      taskMarkers?.map((marker) => ({
        ...marker,
        image_url: marker.image_url
          ? marker.image_url
          : marker.colour
          ? MarkerColourMap[marker.colour as Colour]
          : MarkerColourMap[Colour.Red]
      })) ?? [];

    navigator.geolocation.watchPosition(
      (position) => {
        const playerMarker: Marker = {
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude),
          title: 'You are here',
          subtitle: 'Run about and it will update',
          image_url: MarkerIcon.src
        };

        setMarkers([playerMarker, ...displayMarkers]);
        onPlayerMove(position);
      },
      (error) => {
        console.log(error);
      },
      {
        maximumAge: 10000,
        timeout: 5000,
        enableHighAccuracy: true
      }
    );
  }, [onPlayerMove, taskMarkers]);

  return (
    <>
      {center?.lat && center?.lng ? (
        <LoadScript
          googleMapsApiKey="AIzaSyC2KHxX2ZUVmEKyCvRrduQbPDwwDyWXy2Q"
          onLoad={() => {
            setIsGoogleMapsAPILoaded(true);
          }}
        >
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={20}
            options={{
              disableDefaultUI: true,
              styles: [{ featureType: 'poi.business', stylers: [{ visibility: 'off' }] }]
            }}
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
              >
                <div>
                  <h3 className="text-xl">{markerInfoBox.title}</h3>
                  <p className="text-gray-500 pt-2 block">{markerInfoBox.subtitle}</p>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        </LoadScript>
      ) : (
        <Loading />
      )}
    </>
  );
}
