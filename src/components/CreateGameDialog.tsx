import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface CreateGameDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateGame: (gameData: GameCreationData) => Promise<void>;
  isLoading?: boolean;
}

export interface GameCreationData {
  name: string;
  description: string;
}

export default function CreateGameDialog({
  open,
  onClose,
  onCreateGame,
  isLoading = false,
}: CreateGameDialogProps) {
  const [formData, setFormData] = useState<GameCreationData>({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Game name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Game name must be at least 3 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Game name must be less than 50 characters';
    }

    if (formData.description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await onCreateGame(formData);
      // Reset form on success
      setFormData({ name: '', description: '' });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Failed to create game:', error);
      setErrors({ submit: 'Failed to create game. Please try again.' });
    }
  };

  const handleDialogClose = () => {
    if (!isLoading) {
      setFormData({ name: '', description: '' });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          background: 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)',
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 'bold',
          fontSize: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: '#FF2E5B',
        }}
      >
        <AddIcon /> Create New Game
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Typography variant="body2" className="text-gray-600 mb-6">
          Design your own walking adventure. Set waypoints, collect items, and challenge friends!
        </Typography>

        <TextField
          autoFocus
          margin="normal"
          label="Game Name"
          name="name"
          fullWidth
          value={formData.name}
          onChange={handleChange}
          disabled={isLoading}
          error={Boolean(errors.name)}
          helperText={errors.name || `${formData.name.length}/50`}
          placeholder="e.g., Downtown Treasure Hunt"
          inputProps={{
            maxLength: 50,
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              fontSize: '0.95rem',
            },
          }}
        />

        <TextField
          margin="normal"
          label="Description (Optional)"
          name="description"
          fullWidth
          multiline
          rows={4}
          value={formData.description}
          onChange={handleChange}
          disabled={isLoading}
          error={Boolean(errors.description)}
          helperText={
            errors.description || `${formData.description.length}/500`
          }
          placeholder="Describe your game: theme, difficulty, what players will collect..."
          inputProps={{
            maxLength: 500,
          }}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              fontSize: '0.95rem',
            },
          }}
        />

        {errors.submit && (
          <Box
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
            role="alert"
          >
            <Typography variant="body2" className="text-red-700">
              {errors.submit}
            </Typography>
          </Box>
        )}

        <Box className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <Typography variant="caption" className="text-blue-800 font-semibold">
            💡 Next Step
          </Typography>
          <Typography variant="caption" className="text-blue-700 block mt-1">
            After creating your game, you&apos;ll design the walking trail and set collection points.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleDialogClose}
          disabled={isLoading}
          variant="outlined"
          sx={{
            borderRadius: '12px',
            borderColor: '#ccc',
            color: '#666',
            fontWeight: '600',
            textTransform: 'none',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !formData.name.trim()}
          variant="contained"
          sx={{
            borderRadius: '12px',
            fontWeight: '600',
            textTransform: 'none',
            px: 3,
            backgroundColor: '#FF2E5B !important',
            '&.Mui-disabled': { backgroundColor: '#ccc !important' },
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {isLoading && <CircularProgress size={18} color="inherit" />}
          {isLoading ? 'Creating...' : 'Create Game'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
