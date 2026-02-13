import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/router';
import PageHeader from '@/components/PageHeader';

const ERROR_MESSAGES: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration. Please try again later.',
    AccessDenied: 'Access was denied. You may not have permission to sign in.',
    Verification: 'The verification link has expired or has already been used.',
    Default: 'Something went wrong during sign in. Please try again.',
};

export default function AuthError() {
    const router = useRouter();
    const { error } = router.query;
    const errorKey = typeof error === 'string' ? error : 'Default';
    const message = ERROR_MESSAGES[errorKey] || ERROR_MESSAGES.Default;

    return (
        <div className="min-h-screen bg-twimp-bg">
            <PageHeader />
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: 3, pt: 8, gap: 3 }}>
                <Typography sx={{ fontSize: '3rem' }}>
                    😕
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', color: '#1f2937' }}>
                    Sign in failed
                </Typography>
                <Typography sx={{ color: '#6b7280', textAlign: 'center', maxWidth: 400 }}>
                    {message}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                        variant="outlined"
                        onClick={() => router.push('/')}
                        sx={{
                            borderRadius: '14px',
                            textTransform: 'none',
                            fontWeight: 600,
                            borderColor: '#e5e7eb',
                            color: '#6b7280',
                        }}
                    >
                        Go Home
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => router.push('/user/who')}
                        sx={{
                            borderRadius: '14px',
                            textTransform: 'none',
                            fontWeight: 700,
                            backgroundColor: '#FF2E5B !important',
                        }}
                    >
                        Try Again
                    </Button>
                </Box>
            </Box>
        </div>
    );
}
