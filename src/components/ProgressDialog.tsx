import { Button, DialogActions } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

const ProgressDialog = ({
  open,
  handleClose
}: {
  open: boolean;
  handleClose: (isRestarting: boolean) => void;
}) => {
  return (
    <>
      <Dialog open={open}>
        <DialogTitle>{`Wait! Do you want to continue?`}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`You've played this trail before. Do you want to continue where you left off?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="primary" onClick={() => handleClose(false)}>
            Continue
          </Button>
          <Button color="error" onClick={() => handleClose(true)}>
            Restart
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProgressDialog;
