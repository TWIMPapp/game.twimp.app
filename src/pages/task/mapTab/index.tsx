import MapComponent from '@/components/Map';
import { APIService } from '@/services/API';
import { Endpoint } from '@/typings/Endpoint.enum';
import QueryParams from '@/typings/QueryParams';
import { Marker } from '@/typings/Task';
import { useEffect, useState } from 'react';

interface MapResponse {
  ok: boolean;
  markers: Marker[];
}

const getMarkers = (params: QueryParams): Promise<MapResponse> => {
  return new APIService(Endpoint.Map).get<MapResponse>({
    user_id: params?.user_id ?? '',
    trail_ref: params?.trail_ref ?? ''
  });
};

const MapTab = ({ refreshData }: { refreshData: boolean }) => {
  const [params, setParams] = useState<QueryParams>();
  const [markers, setMarkers] = useState<Marker[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;

      if (_params?.user_id && _params?.trail_ref) {
        setParams(_params);
        const data = await getMarkers(_params);

        console.log('########## data', data);
        if (data) {
          setMarkers(data.markers);
        }
      }
    };

    fetchData();
  }, [refreshData]);

  return <MapComponent taskMarkers={markers} onPlayerMove={() => null} />;
};

export default MapTab;
