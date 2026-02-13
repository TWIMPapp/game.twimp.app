import { useRouter } from 'next/router';
import { Box, Paper, IconButton } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import AddCircleIcon from '@mui/icons-material/AddCircle';

interface BottomNavProps {
    onCreateClick?: () => void;
}

export default function BottomNav({ onCreateClick }: BottomNavProps) {
    const router = useRouter();
    const isHome = router.pathname === '/';
    const isAccount = router.pathname === '/user/who';

    return (
        <Box sx={{
            position: 'fixed', bottom: 16, left: 16, right: 16,
            zIndex: 1000,
        }}>
            <Paper sx={{
                borderRadius: '28px', overflow: 'visible',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                p: 1,
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', py: 0.5 }}>
                    <IconButton
                        onClick={() => router.push('/')}
                        sx={{
                            color: isHome ? '#FF2E5B' : '#9CA3AF',
                            '&:hover': { bgcolor: isHome ? '#FFF0F3' : '#F3F4F6' },
                        }}
                    >
                        <HomeRoundedIcon sx={{ fontSize: 28 }} />
                    </IconButton>

                    <Box
                        onClick={onCreateClick}
                        sx={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #FF2E5B 0%, #FF6C88 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 6px 20px rgba(255, 46, 91, 0.4)',
                            transform: 'translateY(-12px)',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-14px)' },
                        }}
                    >
                        <AddCircleIcon sx={{ color: 'white', fontSize: 30 }} />
                    </Box>

                    <IconButton
                        onClick={() => router.push('/user/who')}
                        sx={{
                            color: isAccount ? '#FF2E5B' : '#9CA3AF',
                            '&:hover': { bgcolor: isAccount ? '#FFF0F3' : '#F3F4F6' },
                        }}
                    >
                        <PersonRoundedIcon sx={{ fontSize: 28 }} />
                    </IconButton>
                </Box>
            </Paper>
        </Box>
    );
}
