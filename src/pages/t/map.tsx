import Loading from '@/components/Loading';
import { QueryParams } from '@/types/queryParams';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { useEffect, useState } from 'react';

// ?user_id=115&trail_ref=Bristol-AnniesMurder&task_sequence=700&path=0|1&lat=51.470675&lng=-2.5908689&theme=family

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

    fetchData();
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
