import { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Box } from '@mui/material';

const validateEmail = (email: string) => {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
};

const EmailDialog = ({
  open,
  handleClose,
  handleEmailCapture
}: {
  open: boolean;
  handleClose: () => void;
  handleEmailCapture: (email: string, name: string) => any;
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Notify me</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To be notifed when the next chapter launches, please enter your email address here. We
            will drop you an email and let you know!
          </DialogContentText>
          <Box component="form" noValidate autoComplete="off">
            <TextField
              margin="dense"
              id="name"
              label="Name"
              type="text"
              fullWidth
              variant="standard"
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              autoFocus
              margin="dense"
              id="email"
              label="Email Address"
              type="email"
              fullWidth
              variant="standard"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button disabled={!validateEmail(email)} onClick={() => handleEmailCapture(email, name)}>
            Notify me
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EmailDialog;
