import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

interface WelcomeModalProps {
  open: boolean;
  onCreateNow: () => void;
  onBackHome: () => void;
}

export default function WelcomeModal({
  open,
  onCreateNow,
  onBackHome,
}: WelcomeModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onBackHome}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #FF2E5B 0%, #FF6B9D 100%)',
        },
      }}
    >
      <DialogContent
        sx={{
          textAlign: 'center',
          py: 4,
          px: 3,
        }}
      >
        <Box sx={{ mb: 3, fontSize: '3rem' }}>
          <EmojiEventsIcon sx={{ fontSize: '3rem', color: '#FFD700' }} />
        </Box>

        <DialogTitle
          sx={{
            fontSize: '1.8rem',
            fontWeight: 'bold',
            color: 'white',
            p: 0,
            mb: 2,
          }}
        >
          Hey! Welcome to Twimp.
        </DialogTitle>

        <Typography
          sx={{
            color: 'rgba(255, 255, 255, 0.95)',
            fontSize: '1rem',
            lineHeight: 1.6,
            mb: 4,
          }}
        >
          Now that you&apos;re signed up, you can create games that you can share with your friends.
          Whether it&apos;s a Treasure Hunt for the kids party, an Easter Egg hunt for the family or a
          romantic walk for a loved one, get creating!
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={onCreateNow}
            sx={{
              backgroundColor: '#fff !important',
              color: '#FF2E5B',
              fontWeight: 'bold',
              fontSize: '1rem',
              py: 1.5,
              borderRadius: '12px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#f0f0f0 !important',
              },
            }}
          >
            Create Now
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={onBackHome}
            sx={{
              borderColor: 'white',
              color: 'white',
              fontWeight: '600',
              fontSize: '1rem',
              py: 1.5,
              borderRadius: '12px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'white',
              },
            }}
          >
            Back Home
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
