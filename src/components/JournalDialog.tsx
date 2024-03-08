import { useEffect, useState } from 'react';

import Loading from './Loading';
import { TaskUnion } from '../typings/Task';
import TaskList from './TaskList';
import { AppBar, Box, Dialog, IconButton, Toolbar } from '@mui/material';
import { APIService } from '@/services/API';
import { Endpoint } from '@/typings/Endpoint.enum';
import QueryParams from '@/typings/QueryParams';
import CloseIcon from '@mui/icons-material/Close';

export default function JournalDialog({
  open,
  handleClose
}: {
  open: boolean;
  handleClose: () => void;
}) {
  const [tasks, setTasks] = useState<TaskUnion[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);

  const JournalAPI = new APIService(Endpoint.Journal);

  useEffect(() => {
    setLoaded(false);
    const fetchData = async () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;
      const data = await JournalAPI.get<TaskUnion[]>(_params);

      if (data) {
        setTasks(data);
        setLoaded(true);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Dialog open={open} onClose={handleClose} fullScreen>
      <AppBar sx={{ position: 'relative', paddingTop: '20px' }}>
        <Toolbar>
          <IconButton edge="start" sx={{ color: '#fff' }} onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      {loaded ? (
        tasks?.length > 0 ? (
          <TaskList tasks={tasks} />
        ) : (
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              height: '100%',
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
    </Dialog>
  );
}
