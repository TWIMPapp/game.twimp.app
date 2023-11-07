import Loading from '../../../components/Loading';
import { QueryParams } from '../../../types/QueryParams';
import { GoogleMap, LoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useEffect, useState } from 'react';
import MarkerIcon from '../../../assets/icons/marker-icon.png';
import { APIService } from '@/services/API';
import { Endpoint } from '@/types/Endpoint.enum';
import { Card, CardContent } from '@mui/material';
import { MapTask, Marker, TaskUnion } from '@/types/Task';
import { Colour } from '@/types/Colour.enum';
import { TaskHandlerService } from '@/services/TaskHandler';

const MarkerColourMap: Record<Colour, string> = {
  [Colour.Green]: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
  [Colour.Red]: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  [Colour.Yellow]: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  [Colour.Blue]: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  [Colour.Purple]: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
  [Colour.Pink]: 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png',
  [Colour.Orange]: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png'
};

interface AwtyResponse {
  ok: boolean;
  message: string;
  distance?: number;
  direction?: string;
  task?: TaskUnion;
}

const postData = async (
  position: GeolocationPosition,
  params: QueryParams
): Promise<AwtyResponse> => {
  const body = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    user_id: params.user_id,
    trail_ref: params.trail_ref
  };

  return await new APIService(Endpoint.Awty).post<AwtyResponse>(body, {
    user_id: params.user_id,
    trail_ref: params.trail_ref
  });
};

const containerStyle = {
  width: '100vw',
  height: '100vh'
};

export default function Map() {
  const [center, setCenter] = useState({ lat: 0, lng: 0 });
  const [isGoogleMapsAPILoaded, setIsGoogleMapsAPILoaded] = useState(false);
  const [task, setTask] = useState<MapTask>();
  const [awtyResponse, setAwtyResponse] = useState<AwtyResponse>();
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [markerInfoBox, setMarkerInfoBox] = useState<Marker>();

  const getLocationSendData = async (params: QueryParams) => {
    let canRun = true;

    const taskMarkers =
      task?.markers.map((marker) => ({
        ...marker,
        image_url:
          marker.image_url ?? marker.colour
            ? MarkerColourMap[marker.colour as Colour]
            : MarkerColourMap[Colour.Red]
      })) ?? [];

    navigator.geolocation.watchPosition(
      async (position) => {
        const playerMarker: Marker = {
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude),
          title: 'You are here',
          subtitle: 'Run about and it will update',
          image_url: MarkerIcon.src
        };

        setMarkers([playerMarker, ...taskMarkers]);

        if (canRun) {
          canRun = false;
          const data = await postData(position, params as QueryParams);
          if (data) {
            if (data.task) {
              new TaskHandlerService().goToTaskComponent(data.task, params);
            } else {
              setTimeout(() => {
                setAwtyResponse(data);
                canRun = true;
              }, 5000);
            }
          }
        }
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
  };

  useEffect(() => {
    const fetchData = () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;

      if (_params?.task) {
        const mapTask = new TaskHandlerService().getTaskFromParams<MapTask>();
        if (mapTask) {
          setTask(mapTask);
        }

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

        getLocationSendData(_params);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      {center?.lat && center?.lng ? (
        <LoadScript
          googleMapsApiKey="AIzaSyC2KHxX2ZUVmEKyCvRrduQbPDwwDyWXy2Q"
          onLoad={() => {
            setIsGoogleMapsAPILoaded(true);
          }}
        >
          {task?.content ? (
            <Card
              className="animate__animated animate__bounce border-colour-pink border-dashed border-2"
              sx={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '16px',
                zIndex: 999
              }}
            >
              <CardContent className="text-center">
                <h2 className="text-2xl">{task?.content}</h2>
                <p className="text-gray-500 pt-2 block">{awtyResponse?.message ?? ''}</p>
              </CardContent>
            </Card>
          ) : null}
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={20}
            options={{ disableDefaultUI: true }}
          >
            {isGoogleMapsAPILoaded &&
              markers.map((marker: Marker, index: number) => {
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
