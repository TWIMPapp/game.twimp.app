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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '@/contexts/AuthContext';
import { rememberPendingClaim, setPendingConsent } from '@/services/ClaimSessions';

interface LoginRequiredMessageProps {
  open: boolean;
  onClose: () => void;
  action: 'save' | 'share' | 'publish' | 'create' | 'signin' | 'finished';
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
  // Marketing opt-in: MUST default to unticked (UK GDPR / PECR).
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const consentAt = () => (action === 'finished' && marketingOptIn ? new Date().toISOString() : null);

  const handleEmailLink = async () => {
    setSending(true);
    setEmailError(null);
    const at = consentAt();
    setPendingConsent(at);
    const result = await requestMagicLink(email.trim(), rememberPendingClaim(), at);
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
    // PLACEHOLDER copy — Nadia to finalise.
    finished: 'Enjoyed it? Keep your adventure',
  };

  const actionDescription = {
    save: 'To ensure your progress is saved, sign in with Google or Facebook.',
    share: 'Sign in with your Google or Facebook account to create and share your own games with the Twimp community.',
    publish: 'Sign in with your Google or Facebook account to create and share your own games with the Twimp community.',
    create: 'Sign in with your Google or Facebook account to create and share your own games with the Twimp community.',
    signin: 'Sign in to save your progress across devices and access all features.',
    // PLACEHOLDER copy — Nadia to finalise.
    finished: 'Sign in to save this adventure to your account and play more Twimp trails.',
  };

  const handleGoogleSignIn = async () => {
    try {
      setPendingConsent(consentAt());
      await signIn('google');
      onClose();
    } catch (error) {
      console.error('Google sign in failed:', error);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setPendingConsent(consentAt());
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
          <span>{action === 'save' || action === 'signin' || action === 'finished' ? actionText[action] : `Create an Account to ${actionText[action]}`}</span>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" className="text-gray-600" sx={{ mb: 3 }}>
          {actionDescription[action]}
        </Typography>

        {action === 'finished' && (
          <FormControlLabel
            sx={{ mb: 2, alignItems: 'flex-start' }}
            control={
              <Checkbox
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                sx={{ pt: 0 }}
                inputProps={{ 'aria-label': 'Tell me about new Twimp trails' }}
              />
            }
            // PLACEHOLDER copy — Nadia to finalise.
            label={<Typography variant="body2">Tell me about new Twimp trails</Typography>}
          />
        )}

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
