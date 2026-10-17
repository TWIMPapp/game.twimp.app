import { useEffect, useState } from 'react';

import Loading from './Loading';
import { TaskUnion } from '../typings/Task';
import TaskList from './TaskList';
import { AppBar, Box, Dialog, IconButton, Toolbar } from '@mui/material';
import { APIService } from '@/services/API';
import { Endpoint } from '@/typings/Endpoint.enum';
import { BatchStore, withTimeout } from '@/services/BatchStore';
import QueryParams from '@/typings/QueryParams';
import CloseIcon from '@mui/icons-material/Close';

export function JournalContent() {
  const [tasks, setTasks] = useState<TaskUnion[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [failed, setFailed] = useState<boolean>(false);

  useEffect(() => {
    setLoaded(false);
    const fetchData = async () => {
      const _params = Object.fromEntries(
        new URLSearchParams(window.location.search)
      ) as unknown as QueryParams;
      const data = await withTimeout(new APIService(Endpoint.Journal).get<TaskUnion[]>(_params));

      if (Array.isArray(data)) {
        // Batch-next: the server has already advanced to the end of the
        // current batch, so hide cards the player hasn't swiped to yet.
        const ahead = BatchStore.aheadIds(_params);
        setTasks(data.filter(t => !ahead.has(String((t as any).id))));
      } else {
        setFailed(true);
      }
      setLoaded(true);
    };

    fetchData();
  }, []);

  if (!loaded) return <Loading />;
  if (failed)
    return (
      <Box sx={{ display: 'flex', minHeight: '50vh', justifyContent: 'center', alignItems: 'center', p: 4, textAlign: 'center' }}>
        Couldn&apos;t load the journal. Check your connection and try again.
      </Box>
    );
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
