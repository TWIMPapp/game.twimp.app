import Loading from '../../../components/Loading';
import { QueryParams } from '../../../types/QueryParams';
import { GoogleMap, LoadScript, MarkerF } from '@react-google-maps/api';
import { useEffect, useState } from 'react';
import MarkerIcon from '../../../assets/icons/marker-icon.png';
import { APIService } from '@/services/API';
import { Endpoint } from '@/types/Endpoint.enum';

interface NextResponse {
  correct: boolean;
  message: string;
}

interface NextData {
  question: string;
  hint?: string;
  answers: string[];
}

const postData = async (position: GeolocationPosition, params: QueryParams): Promise<any> => {
  const body = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    user_id: params?.user_id,
    trail_ref: params?.trail_ref
  };

  return await new APIService(Endpoint.NEXT).post<NextResponse>(body, params);
};

const containerStyle = {
  width: '100vw',
  height: '100vh'
};

export default function Map() {
  const [params, setParams] = useState<QueryParams>();
  const [center, setCenter] = useState({ lat: 0, lng: 0 });
  const [markerCenter, setMarkerCenter] = useState({ lat: 0, lng: 0 });
  const [isGoogleMapsAPILoaded, setIsGoogleMapsAPILoaded] = useState(false);

  const getLocationSendData = async () => {
    let canRun = true;

    navigator.geolocation.watchPosition(
      async (position) => {
        setMarkerCenter({
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude)
        });

        if (canRun) {
          canRun = false;
          const data = await postData(position, params as QueryParams);
          if (data) {
            setTimeout(() => {
              canRun = true;
            }, 5000);
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
    const fetchData = async () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;
      setParams(_params);

      if (params?.lat && params?.lng) {
        setCenter({ lat: Number(params.lat), lng: Number(params.lng) });
      } else {
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
      }

      getLocationSendData();
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={20}
            options={{ disableDefaultUI: true }}
          >
            {isGoogleMapsAPILoaded && (
              <MarkerF
                position={markerCenter}
                icon={{ url: MarkerIcon.src, scaledSize: new google.maps.Size(48, 48) }}
              />
            )}
          </GoogleMap>
        </LoadScript>
      ) : (
        <Loading />
      )}
    </>
  );
}
