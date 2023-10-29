import { useEffect, useState } from 'react';
import axios from 'axios';

import Loading from '../../../components/Loading';
import { QueryParams } from '../../../types/QueryParams';
import { Task } from '../../../types/Task';
import TaskList from '../../../components/TaskList';
import { Box } from '@mui/material';
import { APIService } from '@/services/API';
import { Endpoint } from '@/types/Endpoint.enum';

// ?user_id=3&trail_ref=DragonReturn_Brandon&task_sequence=700&path=0|5|29|55&lat=51.470675&lng=-2.5908689

export default function Journal() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);

  const API = new APIService(Endpoint.Journal);

  useEffect(() => {
    setLoaded(false);
    const fetchData = async () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;
      const data = await API.get<Task[]>(_params);
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
          <Box
            sx={{
              display: 'flex',
              width: '100vw',
              height: '100vh',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            Nothing to see here just yet 👀
          </Box>
        )
      ) : (
        <Loading />
      )}
    </>
  );
}
