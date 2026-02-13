import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/router';

export default function EasterEventComingSoon() {
    const router = useRouter();

    return (
        <Box className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-400 to-green-600">
            <Typography variant="h3" className="font-extrabold text-white mb-4 text-center">
                Easter Event 2026
            </Typography>
            <Typography variant="body1" className="text-white/90 mb-8 text-center max-w-md">
                Coming soon! Join the hunt, solve puzzles, and uncover the mystery of the Golden Egg.
            </Typography>
            <Button
                variant="contained"
                onClick={() => router.push('/')}
                sx={{
                    backgroundColor: 'white !important',
                    color: '#2DB87A',
                    fontWeight: 'bold',
                    borderRadius: '16px',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                        backgroundColor: '#f0fdf4 !important'
                    }
                }}
            >
                Back to Home
            </Button>
        </Box>
    );
}
