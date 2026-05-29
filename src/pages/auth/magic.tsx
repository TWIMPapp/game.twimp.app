import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';

// Landing page for the emailed magic link. Exchanges the one-time token for a
// NextAuth session (via the 'magic-link' Credentials provider), then sends the
// player home.
export default function MagicLink() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const token = router.query.token;
    if (!token || typeof token !== 'string') {
      setError(true);
      return;
    }

    signIn('magic-link', { token, redirect: false })
      .then((res) => {
        if (res?.ok && !res.error) {
          router.replace('/');
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, [router.isReady, router.query.token, router]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        gap: 2,
        p: 3,
        textAlign: 'center',
      }}
    >
      {error ? (
        <>
          <Typography variant="h6">This sign-in link is invalid or has expired</Typography>
          <Typography variant="body2" color="text.secondary">
            Sign-in links last 15 minutes and can only be used once. Please request a new one.
          </Typography>
          <Button variant="contained" onClick={() => router.replace('/user/who')}>
            Back to sign in
          </Button>
        </>
      ) : (
        <>
          <CircularProgress sx={{ color: '#FF2E5B' }} />
          <Typography variant="body1">Signing you in…</Typography>
        </>
      )}
    </Box>
  );
}
