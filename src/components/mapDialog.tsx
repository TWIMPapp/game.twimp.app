import {
  AppBar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Toolbar
} from '@mui/material';
import MapTab from '@/pages/task/mapTab';
import CloseIcon from '@mui/icons-material/Close';

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
            className="cy-map-dialog-close"
            edge="start"
            sx={{ color: '#fff' }}
            onClick={handleClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <MapTab refreshData={true} />
    </Dialog>
  );
}
