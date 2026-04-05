import { Box, Typography } from '@mui/material';
import PageHeader from '@/components/PageHeader';

const FONT = "'Poppins', sans-serif";

export default function DeleteData() {
    return (
        <Box className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-12">
            <PageHeader compact />

            <Box sx={{ maxWidth: 640, mx: 'auto', px: 3, py: 4 }}>
                <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: '1.5rem', mb: 3 }}>
                    Delete Your Data
                </Typography>

                <Typography sx={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.7, mb: 2 }}>
                    If you would like us to delete all data associated with your account, please email
                    us at <strong>hello@twimp.app</strong> with the subject line <strong>&quot;Delete my data&quot;</strong>.
                </Typography>

                <Typography sx={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.7, mb: 2 }}>
                    Please send the request from the email address you used to sign in. We will delete
                    your account and all associated game data within 7 days and confirm once complete.
                </Typography>

                <Typography sx={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.7 }}>
                    If you played without signing in, your data is stored only on your device and can
                    be removed by clearing your browser data for game.twimp.app.
                </Typography>
            </Box>
        </Box>
    );
}
