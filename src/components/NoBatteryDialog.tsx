import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

const NoBatteryDialog = ({ open }: { open: boolean }) => {
  return (
    <>
      <Dialog open={open}>
        <DialogTitle>{`Out of battery`}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`It looks like they've run out of battery. Using the clues you've found already, you might be able figure out where they are. Tap "I'm ready to move on" above to continue.`}
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NoBatteryDialog;
