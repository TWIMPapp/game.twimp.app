import { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { ErrorBus, ErrorEvent } from '@/services/ErrorBus';

// Global error toast. Mounted once at the top of the app; listens on the
// ErrorBus for messages emitted by APIService or anywhere else that wants to
// flag a non-fatal problem to the player. Auto-dismisses after 6s, single
// message at a time (newer messages replace any showing one).
export default function ErrorSnackbar() {
  const [event, setEvent] = useState<ErrorEvent | null>(null);

  useEffect(() => ErrorBus.subscribe(setEvent), []);

  const handleClose = (_e?: unknown, reason?: string) => {
    if (reason === 'clickaway') return;
    setEvent(null);
  };

  return (
    <Snackbar
      open={!!event}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity={event?.severity ?? 'error'}
        variant="filled"
        onClose={handleClose}
        sx={{ width: '100%' }}
      >
        {event?.message}
      </Alert>
    </Snackbar>
  );
}
