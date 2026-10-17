import { useEffect, useState } from 'react';

import Loading from './Loading';
import { TaskUnion } from '../typings/Task';
import TaskList from './TaskList';
import { AppBar, Box, Dialog, IconButton, Toolbar } from '@mui/material';
import { APIService } from '@/services/API';
import { Endpoint } from '@/typings/Endpoint.enum';
import { BatchStore, withTimeout } from '@/services/BatchStore';
import { LocalJournal } from '@/services/LocalJournal';
import JournalList from '@/components/JournalList';
import { TaskHandlerService } from '@/services/TaskHandler';
import QueryParams from '@/typings/QueryParams';
import CloseIcon from '@mui/icons-material/Close';

export function JournalContent() {
  // Seed synchronously from the local journal so the first paint already has
  // content (no spinner frame when the game page opens).
  const initialLocal = () => {
    if (typeof window === 'undefined') return [];
    const p = Object.fromEntries(new URLSearchParams(window.location.search)) as unknown as QueryParams;
    return LocalJournal.read(p) as unknown as TaskUnion[];
  };
  const [tasks, setTasks] = useState<TaskUnion[]>(initialLocal);
  const [loaded, setLoaded] = useState<boolean>(() => initialLocal().length > 0);
  const [failed, setFailed] = useState<boolean>(false);

  useEffect(() => {
    const _params = Object.fromEntries(
      new URLSearchParams(window.location.search)
    ) as unknown as QueryParams;

    // 1. Local journal: instant, only cards the player has actually seen.
    const local = LocalJournal.read(_params);
    if (local.length > 0) {
      setTasks(local as unknown as TaskUnion[]);
      setLoaded(true);
      // Entries recorded without a stop name (older builds / lost metadata):
      // backfill once from /journal by position (or id). Quiet on failure.
      if (local.some(e => !e.step_name)) {
        withTimeout(new APIService(Endpoint.Journal).get<any[]>(_params)).then(data => {
          if (!Array.isArray(data)) return;
          const merged = LocalJournal.backfill(_params, data);
          setTasks(merged as unknown as TaskUnion[]);
        });
      }
      return;
    }

    // 2. Nothing local. On the very first card there is nothing to show yet —
    //    don't ask the server.
    const current: any = BatchStore.current(_params) || new TaskHandlerService().getTaskFromSession();
    const onFirstTask = !current || current.position === 0 || current.id === -1 || String(current.id) === '0';
    if (onFirstTask) {
      setLoaded(true);
      return;
    }

    // 3. New device / cleared data mid-game: fetch from the server (8s cap),
    //    drop anything the player hasn't reached, seed the local journal.
    withTimeout(new APIService(Endpoint.Journal).get<TaskUnion[]>(_params)).then(data => {
      if (Array.isArray(data)) {
        const ahead = BatchStore.aheadIds(_params);
        const seen = data.filter(t => !ahead.has(String((t as any).id)));
        seen.forEach(t => LocalJournal.add(_params, t));
        setTasks(LocalJournal.read(_params) as unknown as TaskUnion[]);
      } else {
        setFailed(true);
      }
      setLoaded(true);
    });
  }, []);

  if (!loaded) return <Loading />;
  if (failed)
    return (
      <Box sx={{ display: 'flex', minHeight: '50vh', justifyContent: 'center', alignItems: 'center', p: 4, textAlign: 'center' }}>
        Couldn&apos;t load the journal. Check your connection and try again.
      </Box>
    );
  return tasks?.length > 0 ? (
    <JournalList entries={tasks as any} />
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
