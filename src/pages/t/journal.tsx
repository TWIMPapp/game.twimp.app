import { useEffect, useState } from 'react';
import axios from 'axios';

import Loading from '@/components/Loading';
import { QueryParams } from '@/types/queryParams';
import { Task } from '@/types/Task';
import TaskList from '@/components/TaskList';

// ?user_id=3&trail_ref=DragonReturn_Brandon&task_sequence=700&path=0|5|29|55&lat=51.470675&lng=-2.5908689

const baseUrl =
  'https://script.google.com/macros/s/AKfycbzbTsAS3gNbiFsIX-uZZMNeJcrCJ6LwviXLElR-rkdItfxrN2Kq6p6Wh4aZ7kLKyu40CQ/exec?q=trails';

const stringifyQueryParams = (params: QueryParams): string => {
  return `&${Object.keys(params)
    .map((key) => `${key}=${(params as any)[key]}`)
    .join('&')}`;
};

const getData = async (params: QueryParams): Promise<Task[]> => {
  const response = await axios
    .get(`${baseUrl}/journal${stringifyQueryParams(params)}`)
    .catch((error) => {
      console.error(error);
    });
  return response?.data?.body;
};

export default function Journal() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    setLoaded(false);
    const fetchData = async () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;
      const data = await getData(_params);
      console.log(data);
      if (data) {
        setTasks(data);
        setLoaded(true);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      {loaded ? (
        tasks?.length > 0 ? (
          <TaskList tasks={tasks} />
        ) : (
          <div>Nothing to see here just yet 👀</div>
        )
      ) : (
        <Loading />
      )}
    </>
  );
}
