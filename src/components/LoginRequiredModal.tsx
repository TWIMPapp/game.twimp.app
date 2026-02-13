import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '@/contexts/AuthContext';

interface LoginRequiredMessageProps {
  open: boolean;
  onClose: () => void;
  action: 'save' | 'share' | 'publish' | 'create';
}

export default function LoginRequiredModal({
  open,
  onClose,
  action,
}: LoginRequiredMessageProps) {
  const { signIn } = useAuth();

  const actionText = {
    save: 'save your game',
    share: 'share your game with others',
    publish: 'publish your game',
    create: 'create your own game',
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn('google');
      onClose();
    } catch (error) {
      console.error('Google sign in failed:', error);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      await (signIn as any)('facebook');
      onClose();
    } catch (error) {
      console.error('Facebook sign in failed:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box className="flex items-center gap-2">
          <LockIcon sx={{ color: '#FF2E5B' }} />
          <span>Create an Account to {actionText[action]}</span>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" className="text-gray-600 mb-6">
          Sign in with your Google or Facebook account to create and share your own games with the
          Twimp community.
        </Typography>

        <Box className="flex flex-col gap-4 mb-6">
          <Button
            fullWidth
            variant="contained"
            onClick={handleGoogleSignIn}
            sx={{
              backgroundColor: 'white !important',
              color: '#1f2937',
              border: '1px solid #e5e7eb',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              py: 1.5,
              '&:hover': { backgroundColor: '#f3f4f6 !important' },
            }}
          >
            Continue with Google
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleFacebookSignIn}
            sx={{
              backgroundColor: '#1877F2 !important',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              py: 1.5,
              '&:hover': { backgroundColor: '#0a66c2 !important' },
            }}
          >
            Continue with Facebook
          </Button>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography variant="caption" className="text-gray-500">
          We only use your email to keep your account secure. We never share or sell your data.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ color: '#757575' }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
