import {
  AppBar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Toolbar
} from '@mui/material';
import InventoryTab from '@/pages/task/inventoryTab';
import CloseIcon from '@mui/icons-material/Close';

export default function InventoryDialog({
  open,
  handleClose
}: {
  open: boolean;
  handleClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={handleClose} fullScreen>
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton edge="start" sx={{ color: '#fff' }} onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <InventoryTab setItems={[]} refreshData={true} />
    </Dialog>
  );
}
