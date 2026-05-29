import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  TextField,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '@/contexts/AuthContext';

interface LoginRequiredMessageProps {
  open: boolean;
  onClose: () => void;
  action: 'save' | 'share' | 'publish' | 'create' | 'signin';
}

export default function LoginRequiredModal({
  open,
  onClose,
  action,
}: LoginRequiredMessageProps) {
  const { signIn, requestMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleEmailLink = async () => {
    setSending(true);
    setEmailError(null);
    const result = await requestMagicLink(email.trim());
    setSending(false);
    if (result.ok) {
      setSent(true);
    } else {
      setEmailError(result.message || 'Could not send the link. Please try again.');
    }
  };

  const actionText = {
    save: 'Save Your Progress',
    share: 'share your game with others',
    publish: 'publish your game',
    create: 'create your own game',
    signin: 'Sign In / Create Account',
  };

  const actionDescription = {
    save: 'To ensure your progress is saved, sign in with Google or Facebook.',
    share: 'Sign in with your Google or Facebook account to create and share your own games with the Twimp community.',
    publish: 'Sign in with your Google or Facebook account to create and share your own games with the Twimp community.',
    create: 'Sign in with your Google or Facebook account to create and share your own games with the Twimp community.',
    signin: 'Sign in to save your progress across devices and access all features.',
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
      await signIn('facebook');
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
          <span>{action === 'save' || action === 'signin' ? actionText[action] : `Create an Account to ${actionText[action]}`}</span>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" className="text-gray-600" sx={{ mb: 3 }}>
          {actionDescription[action]}
        </Typography>

        <Box className="flex flex-col gap-4 mb-6">
          <Button
            fullWidth
            variant="contained"
            onClick={handleGoogleSignIn}
            sx={{
              backgroundColor: '#ea4335 !important',
              color: 'white',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              py: 1.5,
              '&:hover': { backgroundColor: '#d33426 !important' },
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

        <Divider sx={{ my: 3 }}>or</Divider>

        {sent ? (
          <Box className="mb-6 text-center">
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Check your email
            </Typography>
            <Typography variant="caption" className="text-gray-500">
              We&apos;ve sent a sign-in link to {email.trim()}. It expires in 15 minutes.
            </Typography>
          </Box>
        ) : (
          <Box className="flex flex-col gap-2 mb-6">
            <TextField
              type="email"
              label="Email"
              size="small"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sending}
            />
            <Button
              fullWidth
              variant="outlined"
              onClick={handleEmailLink}
              disabled={sending || !email.trim()}
              sx={{ textTransform: 'none', fontWeight: 600, py: 1.25 }}
            >
              {sending ? 'Sending…' : 'Email me a sign-in link'}
            </Button>
            {emailError && (
              <Typography variant="caption" color="error">
                {emailError}
              </Typography>
            )}
          </Box>
        )}

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
