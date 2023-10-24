import Loading from '@/components/Loading';
import { QueryParams } from '@/types/queryParams';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import axios from 'axios';
import { useEffect, useState } from 'react';

// ?user_id=115&trail_ref=Bristol-AnniesMurder&task_sequence=700&path=0|1&lat=51.470675&lng=-2.5908689&theme=family

const baseUrl =
  'https://script.google.com/macros/s/AKfycbx2Hnd9zQqpuO8dyP4ZouhmbpvO1S1cvO47tfhaXHRBCs_KxZHfkQGsFYdzJkFeWgiAJA/exec?q=trails/next';

// interface NextResponse {
//   correct: boolean;
//   message: string;
// }

// interface NextData {
//   question: string;
//   hint?: string;
//   answers: string[];
// }

const postData = async (position: any, params: QueryParams): Promise<any> => {
  const response = await axios
    .post(
      `${baseUrl}/question`,
      { position, ...params },
      {
        headers: {
          'Content-Type': 'text/plain'
        }
      }
    )
    .catch((error) => {
      console.error(error);
    });

  return response?.data?.body;
};

const containerStyle = {
  width: '100vw',
  height: '100vh'
};

function Map() {
  const [params, setParams] = useState<QueryParams>();
  const [center, setCenter] = useState({ lat: 0, lng: 0 });

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
    };

    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log('#######', position);
          setCenter({
            lat: Number(position.coords.latitude),
            lng: Number(position.coords.longitude)
          });
          const data = await postData(position, params as QueryParams);
          if (data) {
            console.log('#######', data);
          }
        },
        (error) => {
          console.log('#######', error);
        },
        {
          maximumAge: 30000,
          timeout: 5000
          // enableHighAccuracy: true
        }
      );
    }, 10000);

    fetchData();
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {center?.lat && center?.lat ? (
        <LoadScript googleMapsApiKey="AIzaSyC2KHxX2ZUVmEKyCvRrduQbPDwwDyWXy2Q">
          <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={20} />
        </LoadScript>
      ) : (
        <Loading />
      )}
    </>
  );
}

export default Map;
