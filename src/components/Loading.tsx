import { Box, CircularProgress } from '@mui/material';
import logoImg from '@/assets/images/logo.png';

const Loading = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress size={48} thickness={4} sx={{ color: '#FF2E5B' }} />
        <Box sx={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src={logoImg.src} alt="" style={{ height: 24 }} />
        </Box>
      </Box>
    </Box>
  );
};

export default Loading;
