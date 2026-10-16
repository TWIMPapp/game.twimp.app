import { useEffect, useState } from 'react';

import Loading from './Loading';
import { TaskUnion } from '../typings/Task';
import TaskList from './TaskList';
import { AppBar, Box, Dialog, IconButton, Toolbar } from '@mui/material';
import { APIService } from '@/services/API';
import { Endpoint } from '@/typings/Endpoint.enum';
import QueryParams from '@/typings/QueryParams';
import CloseIcon from '@mui/icons-material/Close';

export function JournalContent() {
  const [tasks, setTasks] = useState<TaskUnion[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    setLoaded(false);
    const fetchData = async () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;
      const data = await new APIService(Endpoint.Journal).get<TaskUnion[]>(_params);

      if (data) {
        setTasks(data);
        setLoaded(true);
      }
    };

    fetchData();
  }, []);

  if (!loaded) return <Loading />;
  return tasks?.length > 0 ? (
    <TaskList tasks={tasks} />
  ) : (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        minHeight: '50vh',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      Nothing to see here just yet 👀
    </Box>
  );
}

export default function JournalDialog({
  open,
  handleClose
}: {
  open: boolean;
  handleClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={handleClose} fullScreen>
      <AppBar sx={{ position: 'relative', paddingTop: '30px' }}>
        <Toolbar>
          <IconButton
            className="cy-journal-dialog-close"
            edge="start"
            sx={{ color: '#fff' }}
            onClick={handleClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <JournalContent />
    </Dialog>
  );
}
